"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const typeset_service_js_1 = require("../services/typeset.service.js");
const gated_resource_types_js_1 = require("../types/gated-resource.types.js");
const ORIGINAL_ENV = { ...process.env };
(0, vitest_1.beforeEach)(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.TYPESET_ENABLED;
    delete process.env.TYPESET_BASE_URL;
    delete process.env.TYPESET_API_KEY;
    delete process.env.TYPESET_CLIENT_SLUG;
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
    process.env = ORIGINAL_ENV;
});
// ── buildContent (pure) ────────────────────────────────────────────────
(0, vitest_1.describe)('buildContent', () => {
    (0, vitest_1.it)('returns markdown unchanged when frontmatter is empty/absent', () => {
        (0, vitest_1.expect)((0, typeset_service_js_1.buildContent)('# Hi')).toBe('# Hi');
        (0, vitest_1.expect)((0, typeset_service_js_1.buildContent)('# Hi', {})).toBe('# Hi');
        (0, vitest_1.expect)((0, typeset_service_js_1.buildContent)('# Hi', { title: '' })).toBe('# Hi');
        (0, vitest_1.expect)((0, typeset_service_js_1.buildContent)('# Hi', { title: null, subtitle: undefined })).toBe('# Hi');
    });
    (0, vitest_1.it)('prepends a YAML frontmatter block with single-line key/value pairs', () => {
        const content = (0, typeset_service_js_1.buildContent)('# Body', {
            title: 'My Title',
            subtitle: 'A subtitle',
            date: '2026-05-12',
        });
        (0, vitest_1.expect)(content).toBe('---\ntitle: My Title\nsubtitle: A subtitle\ndate: 2026-05-12\n---\n\n# Body');
    });
    (0, vitest_1.it)('flattens embedded newlines in values to single spaces', () => {
        const content = (0, typeset_service_js_1.buildContent)('# Body', {
            title: 'Line one\nLine two',
        });
        (0, vitest_1.expect)(content).toContain('title: Line one Line two');
        // no raw newline within the YAML key
        (0, vitest_1.expect)(content.split('---\n')[1]).not.toMatch(/title:[^\n]*\n[^-]/);
    });
    (0, vitest_1.it)('coerces numeric values to strings', () => {
        const content = (0, typeset_service_js_1.buildContent)('# Body', { page_count: 12 });
        (0, vitest_1.expect)(content).toContain('page_count: 12');
    });
});
// ── renderViaTypeset — feature flag ────────────────────────────────────
(0, vitest_1.describe)('renderViaTypeset — feature flag', () => {
    (0, vitest_1.it)('throws TypesetNotConfiguredError when TYPESET_ENABLED is unset', async () => {
        await (0, vitest_1.expect)((0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'pdf' })).rejects.toBeInstanceOf(gated_resource_types_js_1.TypesetNotConfiguredError);
    });
    (0, vitest_1.it)('defaults base URL to the production typeset host when not explicitly set', async () => {
        process.env.TYPESET_ENABLED = 'true';
        process.env.TYPESET_API_KEY = 'ts_x_y';
        const fetchSpy = vitest_1.vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
        await (0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'pdf' });
        (0, vitest_1.expect)(fetchSpy.mock.calls[0][0]).toBe('https://typeset.chrisgarlick.com/api/render');
    });
    (0, vitest_1.it)('throws TypesetNotConfiguredError when enabled but API key missing', async () => {
        process.env.TYPESET_ENABLED = 'true';
        process.env.TYPESET_BASE_URL = 'https://typeset.example.com';
        await (0, vitest_1.expect)((0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'pdf' })).rejects.toBeInstanceOf(gated_resource_types_js_1.TypesetNotConfiguredError);
    });
    (0, vitest_1.it)('throws TypesetRenderError for the not-yet-supported html format', async () => {
        process.env.TYPESET_ENABLED = 'true';
        process.env.TYPESET_BASE_URL = 'https://typeset.example.com';
        process.env.TYPESET_API_KEY = 'ts_x_y';
        await (0, vitest_1.expect)((0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'html' })).rejects.toBeInstanceOf(gated_resource_types_js_1.TypesetRenderError);
    });
});
// ── renderViaTypeset — happy path ──────────────────────────────────────
(0, vitest_1.describe)('renderViaTypeset — happy path', () => {
    (0, vitest_1.beforeEach)(() => {
        process.env.TYPESET_ENABLED = 'true';
        process.env.TYPESET_BASE_URL = 'https://typeset.example.com';
        process.env.TYPESET_API_KEY = 'ts_550e8400-e29b-41d4-a716-446655440000_test';
    });
    (0, vitest_1.it)('POSTs to /api/render with the correct shape and bearer auth', async () => {
        const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
        const fetchSpy = vitest_1.vi.spyOn(global, 'fetch').mockResolvedValue(new Response(pdfBytes, {
            status: 200,
            headers: { 'content-type': 'application/pdf' },
        }));
        const result = await (0, typeset_service_js_1.renderViaTypeset)({
            markdown: '# Body',
            format: 'pdf',
            frontmatter: { title: 'Demo', author: 'Kritano' },
        });
        (0, vitest_1.expect)(result.mimeType).toBe('application/pdf');
        (0, vitest_1.expect)(Array.from(result.bytes)).toEqual([0x25, 0x50, 0x44, 0x46]);
        (0, vitest_1.expect)(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, init] = fetchSpy.mock.calls[0];
        (0, vitest_1.expect)(url).toBe('https://typeset.example.com/api/render');
        (0, vitest_1.expect)(init?.method).toBe('POST');
        (0, vitest_1.expect)((init?.headers).Authorization).toBe('Bearer ts_550e8400-e29b-41d4-a716-446655440000_test');
        const body = JSON.parse(init?.body);
        (0, vitest_1.expect)(body.document_type).toBe('report');
        (0, vitest_1.expect)(body.format).toBe('pdf');
        (0, vitest_1.expect)(body.content).toBe('---\ntitle: Demo\nauthor: Kritano\n---\n\n# Body');
        (0, vitest_1.expect)(body.client).toBeUndefined();
    });
    (0, vitest_1.it)('passes a custom document_type when supplied', async () => {
        const fetchSpy = vitest_1.vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
        await (0, typeset_service_js_1.renderViaTypeset)({
            markdown: '# Hi',
            format: 'pdf',
            documentType: 'brief',
        });
        const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body);
        (0, vitest_1.expect)(body.document_type).toBe('brief');
    });
    (0, vitest_1.it)('passes the client slug from the request', async () => {
        const fetchSpy = vitest_1.vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
        await (0, typeset_service_js_1.renderViaTypeset)({
            markdown: '# Hi',
            format: 'pdf',
            clientSlug: 'acme',
        });
        const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body);
        (0, vitest_1.expect)(body.client).toBe('acme');
    });
    (0, vitest_1.it)('falls back to TYPESET_CLIENT_SLUG env when no clientSlug is supplied', async () => {
        process.env.TYPESET_CLIENT_SLUG = 'kritano';
        const fetchSpy = vitest_1.vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
        await (0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'pdf' });
        const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body);
        (0, vitest_1.expect)(body.client).toBe('kritano');
    });
    (0, vitest_1.it)('strips trailing slash from TYPESET_BASE_URL before appending /api/render', async () => {
        process.env.TYPESET_BASE_URL = 'https://typeset.example.com/';
        const fetchSpy = vitest_1.vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
        await (0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'pdf' });
        (0, vitest_1.expect)(fetchSpy.mock.calls[0][0]).toBe('https://typeset.example.com/api/render');
    });
});
// ── renderViaTypeset — error mapping ───────────────────────────────────
(0, vitest_1.describe)('renderViaTypeset — error mapping', () => {
    (0, vitest_1.beforeEach)(() => {
        process.env.TYPESET_ENABLED = 'true';
        process.env.TYPESET_BASE_URL = 'https://typeset.example.com';
        process.env.TYPESET_API_KEY = 'ts_x_y';
    });
    (0, vitest_1.it)('maps non-2xx responses to TypesetRenderError with status code and body excerpt', async () => {
        vitest_1.vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{"error":"Render capacity exceeded","status":500}', {
            status: 500,
        }));
        await (0, vitest_1.expect)((0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'pdf' })).rejects.toMatchObject({
            name: 'TypesetRenderError',
            statusCode: 500,
            message: vitest_1.expect.stringContaining('Render capacity exceeded'),
        });
    });
    (0, vitest_1.it)('maps an empty body to TypesetRenderError', async () => {
        vitest_1.vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array(0), { status: 200 }));
        await (0, vitest_1.expect)((0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'pdf' })).rejects.toBeInstanceOf(gated_resource_types_js_1.TypesetRenderError);
    });
    (0, vitest_1.it)('maps fetch network failures to TypesetRenderError', async () => {
        vitest_1.vi.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
        await (0, vitest_1.expect)((0, typeset_service_js_1.renderViaTypeset)({ markdown: '# Hi', format: 'pdf' })).rejects.toMatchObject({
            name: 'TypesetRenderError',
            message: vitest_1.expect.stringContaining('ECONNREFUSED'),
        });
    });
});
//# sourceMappingURL=typeset.service.test.js.map