"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// ── Mocks (must come before importing the router) ─────────────────────
// Rate limiter: passthrough middleware so tests aren't coupled to redis state.
vitest_1.vi.mock('../middleware/rateLimit.middleware', () => ({
    createRateLimiter: () => (_req, _res, next) => next(),
}));
// optionalAuthenticate: controlled per-test via the global below.
let injectedUser = null;
vitest_1.vi.mock('../middleware/auth.middleware', () => ({
    optionalAuthenticate: (req, _res, next) => {
        if (injectedUser)
            req.user = injectedUser;
        next();
    },
}));
// Gated resource service: each function is a vi.fn we can stub per test.
const mockCaptureEmailAndIssueToken = vitest_1.vi.fn();
const mockIssueTokenForUser = vitest_1.vi.fn();
const mockGetResourceBySlug = vitest_1.vi.fn();
const mockRecordDownload = vitest_1.vi.fn();
const mockValidateToken = vitest_1.vi.fn();
vitest_1.vi.mock('../services/gated-resource.service', () => ({
    captureEmailAndIssueToken: (...args) => mockCaptureEmailAndIssueToken(...args),
    issueTokenForUser: (...args) => mockIssueTokenForUser(...args),
    getResourceBySlug: (...args) => mockGetResourceBySlug(...args),
    recordDownload: (...args) => mockRecordDownload(...args),
    validateToken: (...args) => mockValidateToken(...args),
    extractRequestContext: () => ({
        ip: '127.0.0.1',
        userAgent: 'test',
        referer: null,
    }),
}));
// Delivery service: same pattern.
const mockDeliverFormat = vitest_1.vi.fn();
vitest_1.vi.mock('../services/resource-delivery.service', () => ({
    deliverFormat: (...args) => mockDeliverFormat(...args),
}));
// Side-effect services on the download path. Mocked to no-op so the
// post-response fire-and-forget calls don't try to hit a real DB.
const mockCheckTriggers = vitest_1.vi.fn().mockResolvedValue([]);
const mockRecalculateScore = vitest_1.vi.fn().mockResolvedValue({ score: 0, status: 'new' });
vitest_1.vi.mock('../services/crm-trigger.service', () => ({
    checkTriggers: (...args) => mockCheckTriggers(...args),
}));
vitest_1.vi.mock('../services/lead-scoring.service', () => ({
    recalculateScore: (...args) => mockRecalculateScore(...args),
}));
// Email service is invoked from sendDeliveryEmail; mock the only method we call.
vitest_1.vi.mock('../services/email.service', () => ({
    emailService: {
        sendGatedResourceDeliveryEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
}));
// Now import the router and types AFTER the mocks are wired.
const index_js_1 = require("../routes/resources/index.js");
const gated_resource_types_js_1 = require("../types/gated-resource.types.js");
// ── App factory ───────────────────────────────────────────────────────
function buildApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use('/api/resources', index_js_1.resourcesRouter);
    return app;
}
const SLUG = 'website-health-checklist';
function makeResource(over = {}) {
    return {
        id: 'res-id',
        slug: SLUG,
        title: 'The Website Health Checklist',
        subtitle: null,
        hook: 'hook',
        category: 'guides',
        audience: null,
        description: 'desc',
        preview_md: 'preview',
        source_md_path: 'resources/website-health-checklist/source.md',
        formats: ['md', 'pdf'],
        content_hash: 'a'.repeat(64),
        page_count: 6,
        published: true,
        download_count: 0,
        created_at: '2026-05-12T00:00:00Z',
        updated_at: '2026-05-12T00:00:00Z',
        ...over,
    };
}
(0, vitest_1.beforeEach)(() => {
    injectedUser = null;
    vitest_1.vi.clearAllMocks();
    // Every mocked service function defaults to a resolved Promise so the
    // route's fire-and-forget `.catch()` calls don't blow up on undefined.
    mockRecordDownload.mockResolvedValue(undefined);
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
});
// ── POST /api/resources/:slug/request ────────────────────────────────
(0, vitest_1.describe)('POST /api/resources/:slug/request', () => {
    (0, vitest_1.it)('captures an anonymous email and returns a token + formats', async () => {
        mockGetResourceBySlug.mockResolvedValue(makeResource());
        mockCaptureEmailAndIssueToken.mockResolvedValue({
            token: 'tok-abc',
            lead: { id: 'lead-1' },
            isNewLead: true,
        });
        const res = await (0, supertest_1.default)(buildApp())
            .post(`/api/resources/${SLUG}/request`)
            .send({ email: 'foo@example.com', consentNewsletter: true });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toMatchObject({
            token: 'tok-abc',
            formats: ['md', 'pdf'],
            slug: SLUG,
            loggedIn: false,
        });
        (0, vitest_1.expect)(mockCaptureEmailAndIssueToken).toHaveBeenCalledTimes(1);
        const call = mockCaptureEmailAndIssueToken.mock.calls[0][0];
        (0, vitest_1.expect)(call.email).toBe('foo@example.com');
        (0, vitest_1.expect)(call.consentNewsletter).toBe(true);
    });
    (0, vitest_1.it)('skips lead capture for a logged-in user and returns loggedIn:true', async () => {
        injectedUser = { id: 'user-1', email: 'u@example.com', role: 'user' };
        mockGetResourceBySlug.mockResolvedValue(makeResource());
        mockIssueTokenForUser.mockResolvedValue('tok-user');
        const res = await (0, supertest_1.default)(buildApp())
            .post(`/api/resources/${SLUG}/request`)
            .send({ email: 'u@example.com' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toMatchObject({ token: 'tok-user', loggedIn: true });
        (0, vitest_1.expect)(mockIssueTokenForUser).toHaveBeenCalledWith('res-id', 'user-1');
        (0, vitest_1.expect)(mockCaptureEmailAndIssueToken).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('silently succeeds when the honeypot field is set, without capturing', async () => {
        const res = await (0, supertest_1.default)(buildApp())
            .post(`/api/resources/${SLUG}/request`)
            .send({ email: 'foo@example.com', website: 'https://spam.example' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toEqual({ ok: true });
        (0, vitest_1.expect)(mockGetResourceBySlug).not.toHaveBeenCalled();
        (0, vitest_1.expect)(mockCaptureEmailAndIssueToken).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('rejects disposable email domains with a friendly 400', async () => {
        const res = await (0, supertest_1.default)(buildApp())
            .post(`/api/resources/${SLUG}/request`)
            .send({ email: 'throwaway@mailinator.com' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.code).toBe('DISPOSABLE_EMAIL');
        (0, vitest_1.expect)(mockCaptureEmailAndIssueToken).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('rejects malformed emails with 400', async () => {
        const res = await (0, supertest_1.default)(buildApp())
            .post(`/api/resources/${SLUG}/request`)
            .send({ email: 'not-an-email' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.code).toBe('INVALID_REQUEST');
    });
    (0, vitest_1.it)('returns 404 when the resource does not exist', async () => {
        mockGetResourceBySlug.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(buildApp())
            .post(`/api/resources/${SLUG}/request`)
            .send({ email: 'foo@example.com' });
        (0, vitest_1.expect)(res.status).toBe(404);
    });
    (0, vitest_1.it)('returns 404 when the resource is unpublished', async () => {
        mockGetResourceBySlug.mockResolvedValue(makeResource({ published: false }));
        const res = await (0, supertest_1.default)(buildApp())
            .post(`/api/resources/${SLUG}/request`)
            .send({ email: 'foo@example.com' });
        (0, vitest_1.expect)(res.status).toBe(404);
    });
});
// ── GET /api/resources/:slug/download/:format ────────────────────────
(0, vitest_1.describe)('GET /api/resources/:slug/download/:format', () => {
    (0, vitest_1.it)('streams the file and records the download for a valid token', async () => {
        const resource = makeResource();
        mockValidateToken.mockResolvedValue({
            token: { token: 'tok', lead_id: 'lead-1', user_id: null },
            resource,
        });
        mockDeliverFormat.mockResolvedValue({
            path: `${process.cwd()}/src/data/${resource.source_md_path}`,
            mimeType: 'text/markdown; charset=utf-8',
            filename: `${SLUG}.md`,
        });
        const res = await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/md?token=tok`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.headers['content-type']).toContain('text/markdown');
        (0, vitest_1.expect)(res.headers['content-disposition']).toContain(`filename="${SLUG}.md"`);
        // recordDownload runs async; give the microtask queue a tick to flush.
        await new Promise((r) => setImmediate(r));
        (0, vitest_1.expect)(mockRecordDownload).toHaveBeenCalledTimes(1);
        const dl = mockRecordDownload.mock.calls[0][0];
        (0, vitest_1.expect)(dl.resourceId).toBe('res-id');
        (0, vitest_1.expect)(dl.leadId).toBe('lead-1');
        (0, vitest_1.expect)(dl.userId).toBeNull();
        (0, vitest_1.expect)(dl.token).toBe('tok');
    });
    (0, vitest_1.it)('allows a logged-in user without a token', async () => {
        injectedUser = { id: 'user-1', email: 'u@example.com', role: 'user' };
        const resource = makeResource();
        mockGetResourceBySlug.mockResolvedValue(resource);
        mockDeliverFormat.mockResolvedValue({
            path: `${process.cwd()}/src/data/${resource.source_md_path}`,
            mimeType: 'text/markdown; charset=utf-8',
            filename: `${SLUG}.md`,
        });
        const res = await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/md`);
        (0, vitest_1.expect)(res.status).toBe(200);
        await new Promise((r) => setImmediate(r));
        (0, vitest_1.expect)(mockRecordDownload).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockRecordDownload.mock.calls[0][0].userId).toBe('user-1');
        (0, vitest_1.expect)(mockRecordDownload.mock.calls[0][0].token).toBeNull();
    });
    (0, vitest_1.it)('returns 401 when neither token nor session is provided', async () => {
        const res = await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/md`);
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(res.body.code).toBe('AUTH_REQUIRED');
    });
    (0, vitest_1.it)('returns 401 for an invalid or expired token', async () => {
        mockValidateToken.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/md?token=bad`);
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(res.body.code).toBe('TOKEN_INVALID');
    });
    (0, vitest_1.it)('returns 400 for an unknown format string', async () => {
        const res = await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/rtf?token=tok`);
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.code).toBe('UNSUPPORTED_FORMAT');
    });
    (0, vitest_1.it)('returns 400 when the format is not in the resource formats array', async () => {
        const resource = makeResource({ formats: ['md'] });
        mockValidateToken.mockResolvedValue({
            token: { token: 'tok', lead_id: 'lead-1', user_id: null },
            resource,
        });
        const res = await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/pdf?token=tok`);
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.code).toBe('UNSUPPORTED_FORMAT');
        (0, vitest_1.expect)(mockDeliverFormat).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 503 with a "preparing" affordance when typeset is disabled', async () => {
        const resource = makeResource();
        mockValidateToken.mockResolvedValue({
            token: { token: 'tok', lead_id: 'lead-1', user_id: null },
            resource,
        });
        mockDeliverFormat.mockRejectedValue(new gated_resource_types_js_1.TypesetNotConfiguredError());
        const res = await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/pdf?token=tok`);
        (0, vitest_1.expect)(res.status).toBe(503);
        (0, vitest_1.expect)(res.body).toMatchObject({
            status: 'preparing',
            code: 'TYPESET_DISABLED',
            emailWhenReady: true,
        });
    });
    (0, vitest_1.it)('fires checkTriggers and recalculateScore for a logged-in download', async () => {
        injectedUser = { id: 'user-1', email: 'u@example.com', role: 'user' };
        const resource = makeResource();
        mockGetResourceBySlug.mockResolvedValue(resource);
        mockDeliverFormat.mockResolvedValue({
            path: `${process.cwd()}/src/data/${resource.source_md_path}`,
            mimeType: 'text/markdown; charset=utf-8',
            filename: `${SLUG}.md`,
        });
        await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/md`);
        // Both side-effects fire from inside .then() on recordDownload, which
        // resolves on the next microtask. Give it a couple of ticks to flush.
        await new Promise((r) => setImmediate(r));
        await new Promise((r) => setImmediate(r));
        (0, vitest_1.expect)(mockCheckTriggers).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockCheckTriggers).toHaveBeenCalledWith('user-1', 'gated_resource_downloaded', vitest_1.expect.objectContaining({
            resource_slug: SLUG,
            format: 'md',
            category: 'guides',
        }));
        (0, vitest_1.expect)(mockRecalculateScore).toHaveBeenCalledWith('user-1');
    });
    (0, vitest_1.it)('does NOT fire checkTriggers for an anonymous (token-only) download', async () => {
        const resource = makeResource();
        mockValidateToken.mockResolvedValue({
            token: { token: 'tok', lead_id: 'lead-1', user_id: null },
            resource,
        });
        mockDeliverFormat.mockResolvedValue({
            path: `${process.cwd()}/src/data/${resource.source_md_path}`,
            mimeType: 'text/markdown; charset=utf-8',
            filename: `${SLUG}.md`,
        });
        await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/md?token=tok`);
        await new Promise((r) => setImmediate(r));
        await new Promise((r) => setImmediate(r));
        (0, vitest_1.expect)(mockCheckTriggers).not.toHaveBeenCalled();
        (0, vitest_1.expect)(mockRecalculateScore).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 400 when deliverFormat throws UnsupportedFormatError', async () => {
        const resource = makeResource();
        mockValidateToken.mockResolvedValue({
            token: { token: 'tok', lead_id: 'lead-1', user_id: null },
            resource,
        });
        mockDeliverFormat.mockRejectedValue(new gated_resource_types_js_1.UnsupportedFormatError('pdf'));
        const res = await (0, supertest_1.default)(buildApp()).get(`/api/resources/${SLUG}/download/pdf?token=tok`);
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.code).toBe('UNSUPPORTED_FORMAT');
    });
});
//# sourceMappingURL=resources.api.test.js.map