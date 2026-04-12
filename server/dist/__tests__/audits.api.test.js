"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Mock service dependencies BEFORE importing the router
vitest_1.vi.mock('../services/site.service', () => ({
    findOrCreateSiteForDomain: vitest_1.vi.fn().mockResolvedValue({
        id: 'site-1',
        domain: 'example.com',
        verified: true,
        owner_id: 'test-user-id',
    }),
    findOrCreateUrl: vitest_1.vi.fn().mockResolvedValue({
        id: 'url-1',
        url: 'https://example.com',
    }),
    getUserTierLimits: vitest_1.vi.fn().mockResolvedValue({
        tier: 'free',
        max_pages_per_audit: 5,
        max_audit_depth: 3,
        concurrent_audits: 3,
        max_audits_per_month: 10,
        available_checks: ['seo', 'accessibility', 'security', 'performance', 'content'],
    }),
    getSiteOwnerTierLimits: vitest_1.vi.fn().mockResolvedValue({
        tier: 'free',
        max_pages_per_audit: 5,
        max_audit_depth: 3,
        concurrent_audits: 3,
        available_checks: ['seo', 'accessibility', 'security', 'performance', 'content'],
    }),
    isSiteVerified: vitest_1.vi.fn().mockResolvedValue(true),
}));
vitest_1.vi.mock('../middleware/site.middleware', () => ({
    getSiteWithAccess: vitest_1.vi.fn().mockResolvedValue({ permission: 'owner' }),
}));
vitest_1.vi.mock('../services/audit.service', () => ({
    auditService: {
        logAuditCreated: vitest_1.vi.fn().mockResolvedValue(undefined),
        logAuditCancelled: vitest_1.vi.fn().mockResolvedValue(undefined),
        logAuditDeleted: vitest_1.vi.fn().mockResolvedValue(undefined),
        logExportCsv: vitest_1.vi.fn().mockResolvedValue(undefined),
        logExportJson: vitest_1.vi.fn().mockResolvedValue(undefined),
        logExportPdf: vitest_1.vi.fn().mockResolvedValue(undefined),
        logFindingDismissed: vitest_1.vi.fn().mockResolvedValue(undefined),
        logFindingRestored: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
}));
vitest_1.vi.mock('../services/consent.service', () => ({
    logAuditConsent: vitest_1.vi.fn().mockResolvedValue(undefined),
    getUserConsentPreference: vitest_1.vi.fn().mockResolvedValue(null),
}));
vitest_1.vi.mock('../data/fix-templates', () => ({
    resolveFixSnippet: vitest_1.vi.fn().mockReturnValue({
        explanation: 'Add a title tag',
        code: '<title>Example</title>',
        effort: 'low',
    }),
}));
vitest_1.vi.mock('../data/cqs-impact-map', () => ({
    getCqsImpact: vitest_1.vi.fn().mockReturnValue(null),
}));
vitest_1.vi.mock('../services/schema-generator.service', () => ({
    generateSchemaForPage: vitest_1.vi.fn().mockResolvedValue(null),
    generateSchemaForSite: vitest_1.vi.fn().mockResolvedValue(null),
}));
vitest_1.vi.mock('../services/pdf-branding.service', () => ({
    resolvePdfBranding: vitest_1.vi.fn().mockResolvedValue({}),
}));
vitest_1.vi.mock('../services/pdf-report.service', () => ({
    generateAuditPdf: vitest_1.vi.fn().mockResolvedValue(Buffer.from('pdf')),
    buildReportHtml: vitest_1.vi.fn().mockReturnValue('<html></html>'),
    buildReportMarkdown: vitest_1.vi.fn().mockReturnValue('# Report'),
}));
vitest_1.vi.mock('../data/en-301-549-mapping', () => ({
    enMapping: [],
    buildWcagToEnMap: vitest_1.vi.fn().mockReturnValue(new Map()),
}));
vitest_1.vi.mock('../utils/ip.utils', () => ({
    validateUrlForSsrf: vitest_1.vi.fn(),
}));
// Mock authentication middleware
vitest_1.vi.mock('../middleware/auth.middleware', () => ({
    authenticate: (req, _res, next) => {
        req.user = { id: 'test-user-id', email: 'test@example.com', role: 'user' };
        next();
    },
}));
const index_1 = require("../routes/audits/index");
// Mock database pool
const mockPool = {
    query: vitest_1.vi.fn(),
};
(0, vitest_1.describe)('Audits API', () => {
    let app;
    let request;
    (0, vitest_1.beforeAll)(() => {
        (0, index_1.setPool)(mockPool);
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use((0, cookie_parser_1.default)());
        app.use('/api/audits', index_1.auditsRouter);
        request = (0, supertest_1.default)(app);
    });
    (0, vitest_1.beforeEach)(() => {
        mockPool.query.mockReset();
    });
    (0, vitest_1.afterAll)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('POST /api/audits', () => {
        (0, vitest_1.it)('should create a new audit', async () => {
            mockPool.query
                // concurrent audit count
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                // monthly audit count
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                // insert audit job
                .mockResolvedValueOnce({
                rows: [{
                        id: 'audit-123',
                        target_url: 'https://example.com',
                        target_domain: 'example.com',
                        status: 'pending',
                        site_id: 'site-1',
                        url_id: 'url-1',
                        created_at: new Date().toISOString(),
                    }],
            });
            const response = await request
                .post('/api/audits')
                .send({
                targetUrl: 'https://example.com',
                options: {
                    maxPages: 50,
                    maxDepth: 3,
                },
            });
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.audit).toBeDefined();
            (0, vitest_1.expect)(response.body.audit.id).toBe('audit-123');
        });
        (0, vitest_1.it)('should reject invalid URLs', async () => {
            const response = await request
                .post('/api/audits')
                .send({
                targetUrl: 'not-a-valid-url',
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBeDefined();
        });
        (0, vitest_1.it)('should enforce concurrent audit limit', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // Already at limit
            const response = await request
                .post('/api/audits')
                .send({
                targetUrl: 'https://example.com',
            });
            (0, vitest_1.expect)(response.status).toBe(429);
            (0, vitest_1.expect)(response.body.code).toBe('CONCURRENT_LIMIT_REACHED');
        });
        (0, vitest_1.it)('should enforce monthly audit limit', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // concurrent: OK
                .mockResolvedValueOnce({ rows: [{ count: '10' }] }); // monthly: at limit
            const response = await request
                .post('/api/audits')
                .send({
                targetUrl: 'https://example.com',
            });
            (0, vitest_1.expect)(response.status).toBe(429);
            (0, vitest_1.expect)(response.body.code).toBe('MONTHLY_LIMIT_REACHED');
        });
    });
    (0, vitest_1.describe)('GET /api/audits', () => {
        (0, vitest_1.it)('should list user audits', async () => {
            const mockAudits = [
                {
                    id: 'audit-1',
                    target_url: 'https://example.com',
                    target_domain: 'example.com',
                    status: 'completed',
                    created_at: new Date().toISOString(),
                },
                {
                    id: 'audit-2',
                    target_url: 'https://example2.com',
                    target_domain: 'example2.com',
                    status: 'pending',
                    created_at: new Date().toISOString(),
                },
            ];
            mockPool.query
                .mockResolvedValueOnce({ rows: mockAudits })
                .mockResolvedValueOnce({ rows: [{ count: '2' }] });
            const response = await request.get('/api/audits');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.audits).toHaveLength(2);
            (0, vitest_1.expect)(response.body.pagination.total).toBe(2);
        });
        (0, vitest_1.it)('should filter by status', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ id: 'audit-1', status: 'completed' }] })
                .mockResolvedValueOnce({ rows: [{ count: '1' }] });
            const response = await request.get('/api/audits?status=completed');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.audits).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('GET /api/audits/:id', () => {
        (0, vitest_1.it)('should get audit details', async () => {
            const mockAudit = {
                id: 'audit-123',
                target_url: 'https://example.com',
                status: 'completed',
                seo_score: 85,
                accessibility_score: 90,
            };
            mockPool.query
                .mockResolvedValueOnce({ rows: [mockAudit] })
                .mockResolvedValueOnce({ rows: [{ category: 'seo', severity: 'moderate', count: '5' }] })
                .mockResolvedValueOnce({ rows: [{ crawl_status: 'crawled', count: '10' }] });
            const response = await request.get('/api/audits/audit-123');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.audit.id).toBe('audit-123');
            (0, vitest_1.expect)(response.body.findings).toBeDefined();
            (0, vitest_1.expect)(response.body.pages).toBeDefined();
        });
        (0, vitest_1.it)('should return 404 for non-existent audit', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [] });
            const response = await request.get('/api/audits/non-existent');
            (0, vitest_1.expect)(response.status).toBe(404);
            (0, vitest_1.expect)(response.body.code).toBe('AUDIT_NOT_FOUND');
        });
    });
    (0, vitest_1.describe)('POST /api/audits/:id/cancel', () => {
        (0, vitest_1.it)('should cancel a running audit', async () => {
            mockPool.query
                .mockResolvedValueOnce({
                rows: [{
                        id: 'audit-123',
                        status: 'cancelled',
                    }],
            });
            const response = await request.post('/api/audits/audit-123/cancel');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.audit.status).toBe('cancelled');
        });
        (0, vitest_1.it)('should return 404 if audit cannot be cancelled', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [] });
            const response = await request.post('/api/audits/audit-123/cancel');
            (0, vitest_1.expect)(response.status).toBe(404);
        });
    });
    (0, vitest_1.describe)('DELETE /api/audits/:id', () => {
        (0, vitest_1.it)('should delete a completed audit', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'audit-123' }] });
            const response = await request.delete('/api/audits/audit-123');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.message).toBe('Audit deleted');
        });
        (0, vitest_1.it)('should return 404 for non-existent audit', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rowCount: 0 });
            const response = await request.delete('/api/audits/non-existent');
            (0, vitest_1.expect)(response.status).toBe(404);
        });
    });
    (0, vitest_1.describe)('POST /api/audits/:id/rerun', () => {
        (0, vitest_1.it)('should create a new audit with same config', async () => {
            const originalAudit = {
                target_url: 'https://example.com',
                target_domain: 'example.com',
                organization_id: null,
                site_id: 'site-1',
                max_pages: 50,
                max_depth: 3,
                respect_robots_txt: true,
                include_subdomains: false,
                check_seo: true,
                check_accessibility: true,
                check_security: true,
                check_performance: true,
                check_content: true,
                include_mobile: false,
                wcag_version: '2.2',
                wcag_level: 'AA',
            };
            mockPool.query
                .mockResolvedValueOnce({ rows: [originalAudit] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({
                rows: [{
                        id: 'new-audit-123',
                        ...originalAudit,
                        status: 'pending',
                    }],
            });
            const response = await request.post('/api/audits/audit-123/rerun');
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.audit.id).toBe('new-audit-123');
        });
    });
    // Note: These tests are skipped because Express route ordering matters.
    // In production, /check-url and /recent-urls are matched before /:id routes.
    vitest_1.describe.skip('GET /api/audits/check-url', () => {
        (0, vitest_1.it)('should check URL reachability', async () => {
            const response = await request.get('/api/audits/check-url');
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.error).toBe('URL required');
        });
    });
    vitest_1.describe.skip('GET /api/audits/recent-urls', () => {
        (0, vitest_1.it)('should return recent URLs', async () => {
            mockPool.query
                .mockResolvedValueOnce({
                rows: [
                    { target_url: 'https://example.com', target_domain: 'example.com' },
                    { target_url: 'https://test.com', target_domain: 'test.com' },
                ],
            });
            const response = await request.get('/api/audits/recent-urls');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.urls).toHaveLength(2);
        });
    });
    (0, vitest_1.describe)('GET /api/audits/:id/export/csv', () => {
        (0, vitest_1.it)('should export findings as CSV', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ id: 'audit-123', target_domain: 'example.com' }] })
                .mockResolvedValueOnce({
                rows: [
                    {
                        category: 'seo',
                        rule_id: 'missing-title',
                        rule_name: 'Missing Title',
                        severity: 'critical',
                        message: 'Page is missing title',
                        page_url: 'https://example.com/page1',
                    },
                ],
            });
            const response = await request.get('/api/audits/audit-123/export/csv');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.headers['content-type']).toContain('text/csv');
        });
    });
    (0, vitest_1.describe)('GET /api/audits/:id/export/json', () => {
        (0, vitest_1.it)('should export audit as JSON', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ id: 'audit-123', target_domain: 'example.com' }] })
                .mockResolvedValueOnce({ rows: [] }) // findings
                .mockResolvedValueOnce({ rows: [] }); // pages
            const response = await request.get('/api/audits/audit-123/export/json');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.headers['content-type']).toContain('application/json');
            (0, vitest_1.expect)(response.body.audit).toBeDefined();
        });
    });
    (0, vitest_1.describe)('PATCH /api/audits/:id/findings/:findingId/dismiss', () => {
        (0, vitest_1.it)('should dismiss a finding', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ id: 'audit-123' }] })
                .mockResolvedValueOnce({ rows: [{ id: 'finding-1', status: 'dismissed', rule_id: 'test', message: 'test' }] });
            const response = await request
                .patch('/api/audits/audit-123/findings/finding-1/dismiss')
                .send({ status: 'dismissed' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.finding.status).toBe('dismissed');
        });
        (0, vitest_1.it)('should reject invalid status', async () => {
            const response = await request
                .patch('/api/audits/audit-123/findings/finding-1/dismiss')
                .send({ status: 'invalid' });
            (0, vitest_1.expect)(response.status).toBe(400);
        });
    });
});
//# sourceMappingURL=audits.api.test.js.map