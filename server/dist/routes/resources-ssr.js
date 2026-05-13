"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourcesSsrRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const rateLimit_middleware_js_1 = require("../middleware/rateLimit.middleware.js");
const ssr_shared_service_js_1 = require("../services/ssr-shared.service.js");
const gated_resource_service_js_1 = require("../services/gated-resource.service.js");
const resources_ssr_service_js_1 = require("../services/resources-ssr.service.js");
const disposable_email_domains_js_1 = require("../constants/disposable-email-domains.js");
const index_js_1 = require("./resources/index.js");
const router = (0, express_1.Router)();
// Mirror the JSON API: 5 form submissions per IP per hour.
const formRateLimiter = (0, rateLimit_middleware_js_1.createRateLimiter)({
    windowMs: 60 * 60 * 1000,
    maxAttempts: 5,
    blockDurationMs: 60 * 60 * 1000,
});
// ── GET /resources ─────────────────────────────────────────────────
router.get('/', async (_req, res) => {
    try {
        const resources = await (0, gated_resource_service_js_1.listPublishedResources)();
        const html = (0, resources_ssr_service_js_1.renderResourcesList)(resources);
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
        res.send(html);
    }
    catch (err) {
        console.error('Resources list SSR failed:', err);
        res.status(500).send('Internal server error');
    }
});
// ── GET /resources/:slug ───────────────────────────────────────────
router.get('/:slug', auth_middleware_js_1.optionalAuthenticate, async (req, res) => {
    try {
        const resource = await (0, gated_resource_service_js_1.getResourceBySlug)(req.params.slug);
        if (!resource || !resource.published) {
            (0, ssr_shared_service_js_1.setSsrHeaders)(res);
            res.status(404).send((0, resources_ssr_service_js_1.renderResourceNotFound)());
            return;
        }
        const html = (0, resources_ssr_service_js_1.renderResourceDetail)({
            resource,
            loggedIn: Boolean(req.user),
        });
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.set('Cache-Control', req.user
            ? 'private, no-cache'
            : 'public, max-age=300, stale-while-revalidate=60');
        res.send(html);
    }
    catch (err) {
        console.error('Resource detail SSR failed:', err);
        res.status(500).send('Internal server error');
    }
});
// ── POST /resources/:slug/request (form handler) ───────────────────
const formSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email()
        .max(255)
        .transform((v) => v.toLowerCase().trim()),
    consentNewsletter: zod_1.z
        .union([zod_1.z.literal('true'), zod_1.z.literal('on'), zod_1.z.boolean()])
        .optional()
        .transform((v) => v === true || v === 'true' || v === 'on'),
    website: zod_1.z.string().max(500).optional(),
});
router.post('/:slug/request', formRateLimiter, auth_middleware_js_1.optionalAuthenticate, async (req, res) => {
    const resource = await (0, gated_resource_service_js_1.getResourceBySlug)(req.params.slug);
    if (!resource || !resource.published) {
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.status(404).send((0, resources_ssr_service_js_1.renderResourceNotFound)());
        return;
    }
    const parsed = formSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.status(400).send((0, resources_ssr_service_js_1.renderFormError)({
            resource,
            errorMessage: 'Please check your email and try again.',
        }));
        return;
    }
    const body = parsed.data;
    // Honeypot: silently 303 back to the detail page with no action.
    if (body.website && body.website.trim().length > 0) {
        res.redirect(303, `/resources/${resource.slug}`);
        return;
    }
    if ((0, disposable_email_domains_js_1.isDisposableEmail)(body.email)) {
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.status(400).send((0, resources_ssr_service_js_1.renderFormError)({
            resource,
            errorMessage: 'Please use a permanent email address.',
        }));
        return;
    }
    try {
        let token;
        let deliveryEmail;
        if (req.user) {
            token = await (0, gated_resource_service_js_1.issueTokenForUser)(resource.id, req.user.id);
            deliveryEmail = req.user.email;
        }
        else {
            const result = await (0, gated_resource_service_js_1.captureEmailAndIssueToken)({
                resource,
                email: body.email,
                consentNewsletter: body.consentNewsletter,
                request: (0, gated_resource_service_js_1.extractRequestContext)(req),
            });
            token = result.token;
            deliveryEmail = body.email;
        }
        (0, index_js_1.sendDeliveryEmail)({
            email: deliveryEmail,
            resource,
            token,
            userId: req.user?.id,
        });
        res.redirect(303, `/resources/${resource.slug}/thanks?token=${encodeURIComponent(token)}`);
    }
    catch (err) {
        console.error('Resource form handler failed:', err);
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.status(500).send((0, resources_ssr_service_js_1.renderFormError)({
            resource,
            errorMessage: 'Something went wrong on our end.',
        }));
    }
});
// ── GET /resources/:slug/thanks ────────────────────────────────────
router.get('/:slug/thanks', auth_middleware_js_1.optionalAuthenticate, async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    const resource = await (0, gated_resource_service_js_1.getResourceBySlug)(req.params.slug);
    if (!resource || !resource.published) {
        (0, ssr_shared_service_js_1.setSsrHeaders)(res);
        res.status(404).send((0, resources_ssr_service_js_1.renderResourceNotFound)());
        return;
    }
    // Two acceptable paths to land on this page:
    //   1) A query-string token that validates against this resource
    //   2) A logged-in user (their session is the token)
    let validToken = null;
    if (token) {
        const validated = await (0, gated_resource_service_js_1.validateToken)(token, resource.slug);
        if (validated)
            validToken = token;
    }
    else if (req.user) {
        validToken = await (0, gated_resource_service_js_1.issueTokenForUser)(resource.id, req.user.id);
    }
    if (!validToken) {
        // Send them back to the detail page rather than expose the thanks
        // shell without a working token.
        res.redirect(303, `/resources/${resource.slug}`);
        return;
    }
    (0, ssr_shared_service_js_1.setSsrHeaders)(res);
    res.set('Cache-Control', 'private, no-store');
    res.send((0, resources_ssr_service_js_1.renderResourceThanks)({ resource, token: validToken }));
});
exports.resourcesSsrRouter = router;
//# sourceMappingURL=resources-ssr.js.map