/**
 * Gated Resources SSR Routes.
 *
 *   GET  /resources                       — list page
 *   GET  /resources/:slug                 — detail page (form or direct links)
 *   POST /resources/:slug/request         — form handler → 303 → thanks
 *   GET  /resources/:slug/thanks?token=…  — success page with download buttons
 *
 * The JSON API endpoints (POST /api/resources/:slug/request and
 * GET /api/resources/:slug/download/:format) live in routes/resources/index.ts.
 *
 * See /docs/gated-resources.md for the feature plan.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';
import { setSsrHeaders } from '../services/ssr-shared.service.js';
import {
  captureEmailAndIssueToken,
  extractRequestContext,
  getResourceBySlug,
  issueTokenForUser,
  listPublishedResources,
  validateToken,
} from '../services/gated-resource.service.js';
import {
  renderFormError,
  renderResourceDetail,
  renderResourceNotFound,
  renderResourceThanks,
  renderResourcesList,
} from '../services/resources-ssr.service.js';
import { isDisposableEmail } from '../constants/disposable-email-domains.js';
import { sendDeliveryEmail } from './resources/index.js';

const router = Router();

// Mirror the JSON API: 5 form submissions per IP per hour.
const formRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 60 * 60 * 1000,
});

// ── GET /resources ─────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const resources = await listPublishedResources();
    const html = renderResourcesList(resources);
    setSsrHeaders(res);
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.send(html);
  } catch (err) {
    console.error('Resources list SSR failed:', err);
    res.status(500).send('Internal server error');
  }
});

// ── GET /resources/:slug ───────────────────────────────────────────

router.get(
  '/:slug',
  optionalAuthenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const resource = await getResourceBySlug(req.params.slug);
      if (!resource || !resource.published) {
        setSsrHeaders(res);
        res.status(404).send(renderResourceNotFound());
        return;
      }

      const html = renderResourceDetail({
        resource,
        loggedIn: Boolean(req.user),
      });
      setSsrHeaders(res);
      res.set(
        'Cache-Control',
        req.user
          ? 'private, no-cache'
          : 'public, max-age=300, stale-while-revalidate=60'
      );
      res.send(html);
    } catch (err) {
      console.error('Resource detail SSR failed:', err);
      res.status(500).send('Internal server error');
    }
  }
);

// ── POST /resources/:slug/request (form handler) ───────────────────

const formSchema = z.object({
  email: z
    .string()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  consentNewsletter: z
    .union([z.literal('true'), z.literal('on'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true' || v === 'on'),
  website: z.string().max(500).optional(),
});

router.post(
  '/:slug/request',
  formRateLimiter,
  optionalAuthenticate,
  async (req: Request, res: Response): Promise<void> => {
    const resource = await getResourceBySlug(req.params.slug);
    if (!resource || !resource.published) {
      setSsrHeaders(res);
      res.status(404).send(renderResourceNotFound());
      return;
    }

    const parsed = formSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      setSsrHeaders(res);
      res.status(400).send(
        renderFormError({
          resource,
          errorMessage: 'Please check your email and try again.',
        })
      );
      return;
    }
    const body = parsed.data;

    // Honeypot: silently 303 back to the detail page with no action.
    if (body.website && body.website.trim().length > 0) {
      res.redirect(303, `/resources/${resource.slug}`);
      return;
    }

    if (isDisposableEmail(body.email)) {
      setSsrHeaders(res);
      res.status(400).send(
        renderFormError({
          resource,
          errorMessage: 'Please use a permanent email address.',
        })
      );
      return;
    }

    try {
      let token: string;
      let deliveryEmail: string;
      if (req.user) {
        token = await issueTokenForUser(resource.id, req.user.id);
        deliveryEmail = req.user.email;
      } else {
        const result = await captureEmailAndIssueToken({
          resource,
          email: body.email,
          consentNewsletter: body.consentNewsletter,
          request: extractRequestContext(req),
        });
        token = result.token;
        deliveryEmail = body.email;
      }

      sendDeliveryEmail({
        email: deliveryEmail,
        resource,
        token,
        userId: req.user?.id,
      });

      res.redirect(
        303,
        `/resources/${resource.slug}/thanks?token=${encodeURIComponent(token)}`
      );
    } catch (err) {
      console.error('Resource form handler failed:', err);
      setSsrHeaders(res);
      res.status(500).send(
        renderFormError({
          resource,
          errorMessage: 'Something went wrong on our end.',
        })
      );
    }
  }
);

// ── GET /resources/:slug/thanks ────────────────────────────────────

router.get(
  '/:slug/thanks',
  optionalAuthenticate,
  async (req: Request, res: Response): Promise<void> => {
    const token =
      typeof req.query.token === 'string' ? req.query.token : null;
    const resource = await getResourceBySlug(req.params.slug);

    if (!resource || !resource.published) {
      setSsrHeaders(res);
      res.status(404).send(renderResourceNotFound());
      return;
    }

    // Two acceptable paths to land on this page:
    //   1) A query-string token that validates against this resource
    //   2) A logged-in user (their session is the token)
    let validToken: string | null = null;
    if (token) {
      const validated = await validateToken(token, resource.slug);
      if (validated) validToken = token;
    } else if (req.user) {
      validToken = await issueTokenForUser(resource.id, req.user.id);
    }

    if (!validToken) {
      // Send them back to the detail page rather than expose the thanks
      // shell without a working token.
      res.redirect(303, `/resources/${resource.slug}`);
      return;
    }

    setSsrHeaders(res);
    res.set('Cache-Control', 'private, no-store');
    res.send(renderResourceThanks({ resource, token: validToken }));
  }
);

export const resourcesSsrRouter = router;
