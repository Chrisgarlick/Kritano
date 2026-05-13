/**
 * Gated Resources API routes.
 *
 *   POST /api/resources/:slug/request
 *     Anonymous email capture or logged-in user. Returns a download token
 *     scoped to the resource. Honeypot + rate-limited + disposable-email
 *     blocked. The download links are also emailed to the user (TODO: wire
 *     in milestone 6).
 *
 *   GET /api/resources/:slug/download/:format
 *     Streams the requested format. Accepts either a session cookie or
 *     `?token=...`. Records the download in `gated_resource_downloads`.
 *     Returns 503 for typeset-backed formats while typeset is disabled.
 *
 * See /docs/gated-resources.md for the feature plan.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { optionalAuthenticate } from '../../middleware/auth.middleware.js';
import {
  captureEmailAndIssueToken,
  extractRequestContext,
  getResourceBySlug,
  issueTokenForUser,
  recordDownload,
  validateToken,
} from '../../services/gated-resource.service.js';
import { deliverFormat } from '../../services/resource-delivery.service.js';
import {
  ALL_FORMATS,
  TypesetNotConfiguredError,
  TypesetRenderError,
  UnsupportedFormatError,
} from '../../types/gated-resource.types.js';
import type { ResourceFormat } from '../../types/gated-resource.types.js';
import { isDisposableEmail } from '../../constants/disposable-email-domains.js';
import { emailService } from '../../services/email.service.js';
import { checkTriggers } from '../../services/crm-trigger.service.js';
import { recalculateScore } from '../../services/lead-scoring.service.js';

const router = Router();

// 5 lead-capture submissions per IP per hour. Same window as password reset.
const requestRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 60 * 60 * 1000,
});

// ── POST /api/resources/:slug/request ───────────────────────────────

const requestBodySchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  consentNewsletter: z.boolean().optional().default(false),
  // Honeypot: real users never fill this. Bots fill every field they see.
  website: z.string().max(500).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
});

router.post(
  '/:slug/request',
  requestRateLimiter,
  optionalAuthenticate,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = requestBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        code: 'INVALID_REQUEST',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    const body = parsed.data;

    // Honeypot tripped: silently succeed without doing anything. We do not
    // want to give scrapers a signal that the honeypot exists.
    if (body.website && body.website.trim().length > 0) {
      res.status(200).json({ ok: true });
      return;
    }

    if (isDisposableEmail(body.email)) {
      res.status(400).json({
        error: 'Please use a permanent email address.',
        code: 'DISPOSABLE_EMAIL',
      });
      return;
    }

    const resource = await getResourceBySlug(req.params.slug);
    if (!resource || !resource.published) {
      res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
      return;
    }

    const ctx = extractRequestContext(req);
    // Merge UTMs from body (form fields) over the query-string version.
    const enrichedCtx = {
      ...ctx,
      utmSource: body.utmSource ?? ctx.utmSource,
      utmMedium: body.utmMedium ?? ctx.utmMedium,
      utmCampaign: body.utmCampaign ?? ctx.utmCampaign,
    };

    try {
      if (req.user) {
        // Logged-in users skip the lead-capture row entirely.
        const token = await issueTokenForUser(resource.id, req.user.id);
        sendDeliveryEmail({
          email: req.user.email,
          resource,
          token,
          userId: req.user.id,
        });
        res.status(200).json({
          token,
          formats: resource.formats,
          slug: resource.slug,
          loggedIn: true,
        });
        return;
      }

      const { token, lead, isNewLead } = await captureEmailAndIssueToken({
        resource,
        email: body.email,
        consentNewsletter: body.consentNewsletter,
        request: enrichedCtx,
      });
      void lead;
      void isNewLead;

      sendDeliveryEmail({ email: body.email, resource, token });

      res.status(200).json({
        token,
        formats: resource.formats,
        slug: resource.slug,
        loggedIn: false,
      });
    } catch (err) {
      console.error('Gated resource request failed:', err);
      res
        .status(500)
        .json({ error: 'Could not process request', code: 'INTERNAL_ERROR' });
    }
  }
);

// ── GET /api/resources/:slug/download/:format ───────────────────────

function isResourceFormat(value: string): value is ResourceFormat {
  return (ALL_FORMATS as readonly string[]).includes(value);
}

router.get(
  '/:slug/download/:format',
  optionalAuthenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { slug, format } = req.params;
    const token =
      typeof req.query.token === 'string' ? req.query.token : null;

    if (!isResourceFormat(format)) {
      res
        .status(400)
        .json({ error: 'Unsupported format', code: 'UNSUPPORTED_FORMAT' });
      return;
    }

    // Resolve the resource — either via the token (anonymous path) or by
    // slug (logged-in user path).
    let resourceId: string;
    let leadId: string | null = null;
    let userId: string | null = null;
    let resolvedResource;

    if (token) {
      const validated = await validateToken(token, slug);
      if (!validated) {
        res.status(401).json({
          error: 'This download link is invalid or has expired.',
          code: 'TOKEN_INVALID',
        });
        return;
      }
      resolvedResource = validated.resource;
      resourceId = validated.resource.id;
      leadId = validated.token.lead_id;
      userId = validated.token.user_id;
    } else if (req.user) {
      const resource = await getResourceBySlug(slug);
      if (!resource || !resource.published) {
        res
          .status(404)
          .json({ error: 'Resource not found', code: 'NOT_FOUND' });
        return;
      }
      resolvedResource = resource;
      resourceId = resource.id;
      userId = req.user.id;
    } else {
      res.status(401).json({
        error: 'Authentication required to download this resource.',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!resolvedResource.formats.includes(format)) {
      res
        .status(400)
        .json({ error: 'Format not available', code: 'UNSUPPORTED_FORMAT' });
      return;
    }

    try {
      const delivered = await deliverFormat(resolvedResource, format);
      res.setHeader('Content-Type', delivered.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${delivered.filename}"`
      );
      res.setHeader('Cache-Control', 'private, max-age=86400');
      res.sendFile(delivered.path, (err) => {
        if (err) console.error('sendFile error:', err);
      });

      // Record the download asynchronously. A failure here must not break
      // the download for the user.
      recordDownload({
        resourceId,
        format,
        userId,
        leadId,
        token,
        request: extractRequestContext(req),
      })
        .then(() => {
          // Fire CRM trigger + recalc lead score for logged-in users only.
          // Anonymous leads have no user_id yet; their engagement starts
          // counting once they register and the lead row is linked
          // (see milestone 7).
          if (userId) {
            checkTriggers(userId, 'gated_resource_downloaded', {
              resource_slug: resolvedResource.slug,
              resource_title: resolvedResource.title,
              category: resolvedResource.category,
              format,
            }).catch((err) =>
              console.error('CRM trigger failed for gated download:', err)
            );
            recalculateScore(userId).catch((err) =>
              console.error('Lead-score recalc failed after gated download:', err)
            );
          }
        })
        .catch((logErr) =>
          console.error('Failed to record gated resource download:', logErr)
        );
    } catch (err) {
      if (err instanceof TypesetNotConfiguredError) {
        res.status(503).json({
          status: 'preparing',
          message:
            'This format is being prepared. We will email you the moment it is ready.',
          code: 'TYPESET_DISABLED',
          emailWhenReady: true,
        });
        return;
      }
      if (err instanceof UnsupportedFormatError) {
        res
          .status(400)
          .json({ error: 'Unsupported format', code: 'UNSUPPORTED_FORMAT' });
        return;
      }
      if (err instanceof TypesetRenderError) {
        console.error('Typeset render failed:', err);
        res
          .status(502)
          .json({ error: 'Render service failed', code: 'RENDER_FAILED' });
        return;
      }
      console.error('Resource download failed:', err);
      res
        .status(500)
        .json({ error: 'Could not deliver resource', code: 'INTERNAL_ERROR' });
    }
  }
);

// ── Email delivery helper ────────────────────────────────────────────

/**
 * Fire-and-forget delivery email. Failures are logged but never block the
 * download path: the user already has the token and the on-page download
 * works without the email landing.
 */
export function sendDeliveryEmail(input: {
  email: string;
  resource: { slug: string; title: string; formats: string[] };
  token: string;
  userId?: string;
}): void {
  const { email, resource, token, userId } = input;
  emailService
    .sendGatedResourceDeliveryEmail({
      email,
      resourceSlug: resource.slug,
      resourceTitle: resource.title,
      token,
      formats: resource.formats,
      typesetEnabled: process.env.TYPESET_ENABLED === 'true',
      userId,
    })
    .catch((err) => {
      console.error('Gated resource delivery email failed:', err);
    });
}

export const resourcesRouter = router;
