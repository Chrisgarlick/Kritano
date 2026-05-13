"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const gated_resource_service_js_1 = require("../services/gated-resource.service.js");
function makeMockPool() {
    const client = {
        query: vitest_1.vi.fn(),
        release: vitest_1.vi.fn(),
    };
    const pool = {
        query: vitest_1.vi.fn(),
        connect: vitest_1.vi.fn().mockResolvedValue(client),
        client,
    };
    return pool;
}
let mockPool;
const ORIGINAL_ENV = { ...process.env };
(0, vitest_1.beforeEach)(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.IP_HASH_PEPPER = 'test-pepper';
    mockPool = makeMockPool();
    (0, gated_resource_service_js_1.setPool)(mockPool);
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
    process.env = ORIGINAL_ENV;
});
function makeResource(over = {}) {
    return {
        id: '11111111-1111-1111-1111-111111111111',
        slug: 'website-health-checklist',
        title: 'The Website Health Checklist',
        subtitle: null,
        hook: 'hook',
        category: 'guides',
        audience: null,
        description: 'desc',
        preview_md: 'preview',
        source_md_path: 'resources/website-health-checklist/source.md',
        formats: ['md', 'pdf', 'html'],
        content_hash: 'a'.repeat(64),
        page_count: 6,
        published: true,
        download_count: 0,
        focus_keyword: null,
        secondary_keywords: [],
        seo_title: null,
        seo_description: null,
        tags: [],
        created_at: '2026-05-12T00:00:00Z',
        updated_at: '2026-05-12T00:00:00Z',
        ...over,
    };
}
// ── hashIp ────────────────────────────────────────────────────────────
(0, vitest_1.describe)('hashIp', () => {
    (0, vitest_1.it)('returns null for null/empty input', () => {
        (0, vitest_1.expect)(gated_resource_service_js_1.__internal.hashIp(null)).toBeNull();
        (0, vitest_1.expect)(gated_resource_service_js_1.__internal.hashIp(undefined)).toBeNull();
        (0, vitest_1.expect)(gated_resource_service_js_1.__internal.hashIp('')).toBeNull();
    });
    (0, vitest_1.it)('returns a 64-char hex hash for a non-empty IP', () => {
        const h = gated_resource_service_js_1.__internal.hashIp('203.0.113.42');
        (0, vitest_1.expect)(h).toMatch(/^[a-f0-9]{64}$/);
    });
    (0, vitest_1.it)('is deterministic for the same IP + pepper', () => {
        const a = gated_resource_service_js_1.__internal.hashIp('203.0.113.42');
        const b = gated_resource_service_js_1.__internal.hashIp('203.0.113.42');
        (0, vitest_1.expect)(a).toBe(b);
    });
    (0, vitest_1.it)('changes when the pepper changes', () => {
        const a = gated_resource_service_js_1.__internal.hashIp('203.0.113.42');
        process.env.IP_HASH_PEPPER = 'different-pepper';
        const b = gated_resource_service_js_1.__internal.hashIp('203.0.113.42');
        (0, vitest_1.expect)(a).not.toBe(b);
    });
});
// ── normaliseEmail ────────────────────────────────────────────────────
(0, vitest_1.describe)('normaliseEmail', () => {
    (0, vitest_1.it)('lowercases and trims', () => {
        (0, vitest_1.expect)(gated_resource_service_js_1.__internal.normaliseEmail('  Foo@Bar.com  ')).toBe('foo@bar.com');
    });
});
// ── listPublishedResources ────────────────────────────────────────────
(0, vitest_1.describe)('listPublishedResources', () => {
    (0, vitest_1.it)('queries only published rows, no category filter', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });
        await (0, gated_resource_service_js_1.listPublishedResources)();
        const [sql, values] = mockPool.query.mock.calls[0];
        (0, vitest_1.expect)(sql).toContain('published = true');
        (0, vitest_1.expect)(sql).not.toContain('category =');
        (0, vitest_1.expect)(values).toEqual([]);
    });
    (0, vitest_1.it)('adds a category filter when provided', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });
        await (0, gated_resource_service_js_1.listPublishedResources)({ category: 'seo' });
        const [sql, values] = mockPool.query.mock.calls[0];
        (0, vitest_1.expect)(sql).toContain('category = $1');
        (0, vitest_1.expect)(values).toEqual(['seo']);
    });
});
// ── getResourceBySlug ─────────────────────────────────────────────────
(0, vitest_1.describe)('getResourceBySlug', () => {
    (0, vitest_1.it)('returns the row when found', async () => {
        const r = makeResource();
        mockPool.query.mockResolvedValue({ rows: [r] });
        const found = await (0, gated_resource_service_js_1.getResourceBySlug)('website-health-checklist');
        (0, vitest_1.expect)(found).toEqual(r);
    });
    (0, vitest_1.it)('returns null when not found', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });
        const found = await (0, gated_resource_service_js_1.getResourceBySlug)('nope');
        (0, vitest_1.expect)(found).toBeNull();
    });
});
// ── captureEmailAndIssueToken ─────────────────────────────────────────
(0, vitest_1.describe)('captureEmailAndIssueToken', () => {
    function setUpHappyPath(opts) {
        mockPool.client.query
            // BEGIN
            .mockResolvedValueOnce({ rows: [] })
            // upsert lead
            .mockResolvedValueOnce({
            rows: [
                {
                    id: 'lead-id',
                    resource_id: 'res-id',
                    email: 'Foo@Bar.com',
                    email_normalised: 'foo@bar.com',
                    consent_newsletter: false,
                    referer: null,
                    utm_source: null,
                    utm_medium: null,
                    utm_campaign: null,
                    ip_hash: 'iphash',
                    user_agent: null,
                    user_id: null,
                    created_at: '2026-05-12T00:00:00Z',
                    _was_inserted: opts.wasInserted,
                },
            ],
        })
            // insert token
            .mockResolvedValueOnce({ rows: [] })
            // COMMIT
            .mockResolvedValueOnce({ rows: [] });
    }
    (0, vitest_1.it)('inserts a new lead, issues a token, returns isNewLead=true', async () => {
        setUpHappyPath({ wasInserted: true });
        const resource = makeResource();
        const ctx = { ip: '1.2.3.4', userAgent: 'UA' };
        const result = await (0, gated_resource_service_js_1.captureEmailAndIssueToken)({
            resource,
            email: '  Foo@Bar.com  ',
            consentNewsletter: false,
            request: ctx,
        });
        (0, vitest_1.expect)(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
        (0, vitest_1.expect)(result.isNewLead).toBe(true);
        (0, vitest_1.expect)(result.lead.email_normalised).toBe('foo@bar.com');
        (0, vitest_1.expect)('_was_inserted' in result.lead).toBe(false);
        // BEGIN, upsert, insert token, COMMIT
        (0, vitest_1.expect)(mockPool.client.query).toHaveBeenCalledTimes(4);
        (0, vitest_1.expect)(mockPool.client.query.mock.calls[0][0]).toBe('BEGIN');
        (0, vitest_1.expect)(mockPool.client.query.mock.calls[3][0]).toBe('COMMIT');
        (0, vitest_1.expect)(mockPool.client.release).toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns isNewLead=false on a returning email', async () => {
        setUpHappyPath({ wasInserted: false });
        const result = await (0, gated_resource_service_js_1.captureEmailAndIssueToken)({
            resource: makeResource(),
            email: 'foo@bar.com',
            consentNewsletter: false,
            request: {},
        });
        (0, vitest_1.expect)(result.isNewLead).toBe(false);
    });
    (0, vitest_1.it)('rolls back on a transaction failure and releases the client', async () => {
        mockPool.client.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockRejectedValueOnce(new Error('boom')) // upsert fails
            .mockResolvedValueOnce({ rows: [] }); // ROLLBACK
        await (0, vitest_1.expect)((0, gated_resource_service_js_1.captureEmailAndIssueToken)({
            resource: makeResource(),
            email: 'foo@bar.com',
            consentNewsletter: false,
            request: {},
        })).rejects.toThrow('boom');
        const calls = mockPool.client.query.mock.calls.map((c) => c[0]);
        (0, vitest_1.expect)(calls[0]).toBe('BEGIN');
        (0, vitest_1.expect)(calls[calls.length - 1]).toBe('ROLLBACK');
        (0, vitest_1.expect)(mockPool.client.release).toHaveBeenCalled();
    });
    (0, vitest_1.it)('rejects empty emails', async () => {
        await (0, vitest_1.expect)((0, gated_resource_service_js_1.captureEmailAndIssueToken)({
            resource: makeResource(),
            email: '   ',
            consentNewsletter: false,
            request: {},
        })).rejects.toThrow();
    });
    (0, vitest_1.it)('hashes the IP before storing it', async () => {
        setUpHappyPath({ wasInserted: true });
        await (0, gated_resource_service_js_1.captureEmailAndIssueToken)({
            resource: makeResource(),
            email: 'foo@bar.com',
            consentNewsletter: false,
            request: { ip: '203.0.113.42' },
        });
        const upsertCall = mockPool.client.query.mock.calls[1];
        const values = upsertCall[1];
        // ip_hash is the 9th parameter (index 8) in the insert
        (0, vitest_1.expect)(values[8]).toMatch(/^[a-f0-9]{64}$/);
        (0, vitest_1.expect)(values[8]).not.toBe('203.0.113.42');
    });
});
// ── issueTokenForUser ─────────────────────────────────────────────────
(0, vitest_1.describe)('issueTokenForUser', () => {
    (0, vitest_1.it)('issues a base64url token and inserts with user_id (no lead_id)', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });
        const token = await (0, gated_resource_service_js_1.issueTokenForUser)('res-id', 'user-id');
        (0, vitest_1.expect)(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
        const [sql, values] = mockPool.query.mock.calls[0];
        (0, vitest_1.expect)(sql).toContain('gated_resource_tokens');
        (0, vitest_1.expect)(values[0]).toBe(token);
        (0, vitest_1.expect)(values[1]).toBe('res-id');
        (0, vitest_1.expect)(values[2]).toBe('user-id');
    });
});
// ── validateToken ─────────────────────────────────────────────────────
(0, vitest_1.describe)('validateToken', () => {
    (0, vitest_1.it)('returns null when the token is missing/expired', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] }); // token lookup
        const result = await (0, gated_resource_service_js_1.validateToken)('bad-token', 'website-health-checklist');
        (0, vitest_1.expect)(result).toBeNull();
        (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('returns null when token resolves to a different slug', async () => {
        mockPool.query
            .mockResolvedValueOnce({
            rows: [
                {
                    token: 't',
                    resource_id: 'res-id',
                    lead_id: 'l',
                    user_id: null,
                    expires_at: '2030-01-01T00:00:00Z',
                    uses_count: 0,
                    last_used_at: null,
                    created_at: '2026-05-12T00:00:00Z',
                },
            ],
        })
            .mockResolvedValueOnce({ rows: [] }); // resource lookup returns nothing (wrong slug)
        const result = await (0, gated_resource_service_js_1.validateToken)('t', 'wrong-slug');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('returns the pair when the token + slug match', async () => {
        const tokenRow = {
            token: 't',
            resource_id: 'res-id',
            lead_id: 'l',
            user_id: null,
            expires_at: '2030-01-01T00:00:00Z',
            uses_count: 0,
            last_used_at: null,
            created_at: '2026-05-12T00:00:00Z',
        };
        const resourceRow = makeResource({ id: 'res-id' });
        mockPool.query
            .mockResolvedValueOnce({ rows: [tokenRow] })
            .mockResolvedValueOnce({ rows: [resourceRow] });
        const result = await (0, gated_resource_service_js_1.validateToken)('t', resourceRow.slug);
        (0, vitest_1.expect)(result).not.toBeNull();
        (0, vitest_1.expect)(result.token.token).toBe('t');
        (0, vitest_1.expect)(result.resource.id).toBe('res-id');
    });
});
// ── recordDownload ────────────────────────────────────────────────────
(0, vitest_1.describe)('recordDownload', () => {
    (0, vitest_1.it)('writes the audit row, bumps the resource counter, and ticks token usage when a token is supplied', async () => {
        // 5 queries: BEGIN, insert, update resource, update token, COMMIT
        mockPool.client.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
        await (0, gated_resource_service_js_1.recordDownload)({
            resourceId: 'res-id',
            format: 'pdf',
            leadId: 'lead-id',
            token: 'tkn',
            request: { ip: '203.0.113.42', referer: 'https://example.com' },
        });
        const calls = mockPool.client.query.mock.calls.map((c) => c[0]);
        (0, vitest_1.expect)(calls[0]).toBe('BEGIN');
        (0, vitest_1.expect)(calls[1]).toContain('INSERT INTO gated_resource_downloads');
        (0, vitest_1.expect)(calls[2]).toContain('UPDATE gated_resources');
        (0, vitest_1.expect)(calls[3]).toContain('UPDATE gated_resource_tokens');
        (0, vitest_1.expect)(calls[4]).toBe('COMMIT');
    });
    (0, vitest_1.it)('skips the token update when no token is supplied (logged-in user path)', async () => {
        // 4 queries: BEGIN, insert, update resource, COMMIT
        mockPool.client.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
        await (0, gated_resource_service_js_1.recordDownload)({
            resourceId: 'res-id',
            format: 'md',
            userId: 'user-id',
            request: {},
        });
        (0, vitest_1.expect)(mockPool.client.query).toHaveBeenCalledTimes(4);
        const calls = mockPool.client.query.mock.calls.map((c) => c[0]);
        (0, vitest_1.expect)(calls.some((q) => q.includes('UPDATE gated_resource_tokens'))).toBe(false);
    });
    (0, vitest_1.it)('rolls back on failure and releases the client', async () => {
        mockPool.client.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockRejectedValueOnce(new Error('insert failed'))
            .mockResolvedValueOnce({ rows: [] }); // ROLLBACK
        await (0, vitest_1.expect)((0, gated_resource_service_js_1.recordDownload)({
            resourceId: 'res-id',
            format: 'md',
            request: {},
        })).rejects.toThrow('insert failed');
        const calls = mockPool.client.query.mock.calls.map((c) => c[0]);
        (0, vitest_1.expect)(calls[calls.length - 1]).toBe('ROLLBACK');
        (0, vitest_1.expect)(mockPool.client.release).toHaveBeenCalled();
    });
});
// ── linkLeadsToUser ───────────────────────────────────────────────────
(0, vitest_1.describe)('linkLeadsToUser', () => {
    (0, vitest_1.it)('normalises the email and returns the row count', async () => {
        mockPool.query.mockResolvedValue({ rowCount: 3 });
        const n = await (0, gated_resource_service_js_1.linkLeadsToUser)('  Foo@Bar.com  ', 'user-id');
        (0, vitest_1.expect)(n).toBe(3);
        const [sql, values] = mockPool.query.mock.calls[0];
        (0, vitest_1.expect)(sql).toContain('gated_resource_leads');
        (0, vitest_1.expect)(values).toEqual(['user-id', 'foo@bar.com']);
    });
    (0, vitest_1.it)('returns 0 when no rows match', async () => {
        mockPool.query.mockResolvedValue({ rowCount: 0 });
        const n = await (0, gated_resource_service_js_1.linkLeadsToUser)('nobody@nowhere.com', 'user-id');
        (0, vitest_1.expect)(n).toBe(0);
    });
});
// ── extractRequestContext ─────────────────────────────────────────────
(0, vitest_1.describe)('extractRequestContext', () => {
    (0, vitest_1.it)('pulls ip, UA, referer, and UTM params from an Express request', () => {
        const fakeReq = {
            ip: '203.0.113.42',
            headers: {
                'user-agent': 'Mozilla',
                referer: 'https://example.com',
            },
            query: {
                utm_source: 'twitter',
                utm_medium: 'social',
                utm_campaign: 'launch',
            },
        };
        const ctx = (0, gated_resource_service_js_1.extractRequestContext)(fakeReq);
        (0, vitest_1.expect)(ctx).toEqual({
            ip: '203.0.113.42',
            userAgent: 'Mozilla',
            referer: 'https://example.com',
            utmSource: 'twitter',
            utmMedium: 'social',
            utmCampaign: 'launch',
        });
    });
    (0, vitest_1.it)('returns nulls when headers/query are absent', () => {
        const fakeReq = {
            ip: undefined,
            headers: {},
            query: {},
        };
        const ctx = (0, gated_resource_service_js_1.extractRequestContext)(fakeReq);
        (0, vitest_1.expect)(ctx).toEqual({
            ip: null,
            userAgent: null,
            referer: null,
            utmSource: null,
            utmMedium: null,
            utmCampaign: null,
        });
    });
});
//# sourceMappingURL=gated-resource.service.test.js.map