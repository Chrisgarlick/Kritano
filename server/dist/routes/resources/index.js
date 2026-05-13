"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourcesRouter = void 0;
exports.sendDeliveryEmail = sendDeliveryEmail;
const express_1 = require("express");
const zod_1 = require("zod");
const rateLimit_middleware_js_1 = require("../../middleware/rateLimit.middleware.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const gated_resource_service_js_1 = require("../../services/gated-resource.service.js");
const resource_delivery_service_js_1 = require("../../services/resource-delivery.service.js");
const gated_resource_types_js_1 = require("../../types/gated-resource.types.js");
const disposable_email_domains_js_1 = require("../../constants/disposable-email-domains.js");
const email_service_js_1 = require("../../services/email.service.js");
const crm_trigger_service_js_1 = require("../../services/crm-trigger.service.js");
const lead_scoring_service_js_1 = require("../../services/lead-scoring.service.js");
const router = (0, express_1.Router)();
// 5 lead-capture submissions per IP per hour. Same window as password reset.
const requestRateLimiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
    windowMs: 60 * 60 * 1000,
    maxAttempts: 5,
    blockDurationMs: 60 * 60 * 1000,
});
// ── POST /api/resources/:slug/request ───────────────────────────────
const requestBodySchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Invalid email address')
        .max(255)
        .transform((v) => v.toLowerCase().trim()),
    consentNewsletter: zod_1.z.boolean().optional().default(false),
    // Honeypot: real users never fill this. Bots fill every field they see.
    website: zod_1.z.string().max(500).optional(),
    utmSource: zod_1.z.string().max(200).optional(),
    utmMedium: zod_1.z.string().max(200).optional(),
    utmCampaign: zod_1.z.string().max(200).optional(),
});
router.post('/:slug/request', requestRateLimiter, auth_middleware_js_1.optionalAuthenticate, async (req, res) => {
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
    if ((0, disposable_email_domains_js_1.isDisposableEmail)(body.email)) {
        res.status(400).json({
            error: 'Please use a permanent email address.',
            code: 'DISPOSABLE_EMAIL',
        });
        return;
    }
    const resource = await (0, gated_resource_service_js_1.getResourceBySlug)(req.params.slug);
    if (!resource || !resource.published) {
        res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
        return;
    }
    const ctx = (0, gated_resource_service_js_1.extractRequestContext)(req);
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
            const token = await (0, gated_resource_service_js_1.issueTokenForUser)(resource.id, req.user.id);
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
        const { token, lead, isNewLead } = await (0, gated_resource_service_js_1.captureEmailAndIssueToken)({
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
    }
    catch (err) {
        console.error('Gated resource request failed:', err);
        res
            .status(500)
            .json({ error: 'Could not process request', code: 'INTERNAL_ERROR' });
    }
});
// ── GET /api/resources/:slug/download/:format ───────────────────────
function isResourceFormat(value) {
    return gated_resource_types_js_1.ALL_FORMATS.includes(value);
}
router.get('/:slug/download/:format', auth_middleware_js_1.optionalAuthenticate, async (req, res) => {
    const { slug, format } = req.params;
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!isResourceFormat(format)) {
        res
            .status(400)
            .json({ error: 'Unsupported format', code: 'UNSUPPORTED_FORMAT' });
        return;
    }
    // Resolve the resource — either via the token (anonymous path) or by
    // slug (logged-in user path).
    let resourceId;
    let leadId = null;
    let userId = null;
    let resolvedResource;
    if (token) {
        const validated = await (0, gated_resource_service_js_1.validateToken)(token, slug);
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
    }
    else if (req.user) {
        const resource = await (0, gated_resource_service_js_1.getResourceBySlug)(slug);
        if (!resource || !resource.published) {
            res
                .status(404)
                .json({ error: 'Resource not found', code: 'NOT_FOUND' });
            return;
        }
        resolvedResource = resource;
        resourceId = resource.id;
        userId = req.user.id;
    }
    else {
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
        const delivered = await (0, resource_delivery_service_js_1.deliverFormat)(resolvedResource, format);
        res.setHeader('Content-Type', delivered.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${delivered.filename}"`);
        res.setHeader('Cache-Control', 'private, max-age=86400');
        res.sendFile(delivered.path, (err) => {
            if (err)
                console.error('sendFile error:', err);
        });
        // Record the download asynchronously. A failure here must not break
        // the download for the user.
        (0, gated_resource_service_js_1.recordDownload)({
            resourceId,
            format,
            userId,
            leadId,
            token,
            request: (0, gated_resource_service_js_1.extractRequestContext)(req),
        })
            .then(() => {
            // Fire CRM trigger + recalc lead score for logged-in users only.
            // Anonymous leads have no user_id yet; their engagement starts
            // counting once they register and the lead row is linked
            // (see milestone 7).
            if (userId) {
                (0, crm_trigger_service_js_1.checkTriggers)(userId, 'gated_resource_downloaded', {
                    resource_slug: resolvedResource.slug,
                    resource_title: resolvedResource.title,
                    category: resolvedResource.category,
                    format,
                }).catch((err) => console.error('CRM trigger failed for gated download:', err));
                (0, lead_scoring_service_js_1.recalculateScore)(userId).catch((err) => console.error('Lead-score recalc failed after gated download:', err));
            }
        })
            .catch((logErr) => console.error('Failed to record gated resource download:', logErr));
    }
    catch (err) {
        if (err instanceof gated_resource_types_js_1.TypesetNotConfiguredError) {
            res.status(503).json({
                status: 'preparing',
                message: 'This format is being prepared. We will email you the moment it is ready.',
                code: 'TYPESET_DISABLED',
                emailWhenReady: true,
            });
            return;
        }
        if (err instanceof gated_resource_types_js_1.UnsupportedFormatError) {
            res
                .status(400)
                .json({ error: 'Unsupported format', code: 'UNSUPPORTED_FORMAT' });
            return;
        }
        if (err instanceof gated_resource_types_js_1.TypesetRenderError) {
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
});
// ── Email delivery helper ────────────────────────────────────────────
/**
 * Fire-and-forget delivery email. Failures are logged but never block the
 * download path: the user already has the token and the on-page download
 * works without the email landing.
 */
function sendDeliveryEmail(input) {
    const { email, resource, token, userId } = input;
    email_service_js_1.emailService
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
exports.resourcesRouter = router;
//# sourceMappingURL=index.js.map