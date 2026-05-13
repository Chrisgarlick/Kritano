"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const resource_delivery_service_js_1 = require("../services/resource-delivery.service.js");
const typesetService = __importStar(require("../services/typeset.service.js"));
const gated_resource_types_js_1 = require("../types/gated-resource.types.js");
/**
 * deliverFormat resolves source MD against process.cwd() + /src/data, and the
 * disk cache against process.cwd() + /uploads/resources. Tests run from
 * server/ as cwd (vitest's default), so we operate against the real source MD
 * placeholder for happy-path MD delivery, and against a temp-isolated cache
 * dir we wipe before each test.
 */
const SLUG = 'website-health-checklist';
const SOURCE_REL = 'resources/website-health-checklist/source.md';
const CONTENT_HASH = 'defdccf46613a213be2d036b52c91f5431e2f90781f30f0a2dbcd56443453cfd';
// Mirrors the cache-key construction in resource-delivery.service.ts —
// content_hash + slugified client + document_type. Tests don't set
// TYPESET_CLIENT_SLUG so we expect the 'default' fallback.
const CACHE_KEY = `${CONTENT_HASH}-default-report`;
function makeResource(overrides = {}) {
    return {
        id: '00000000-0000-0000-0000-000000000001',
        slug: SLUG,
        title: 'The Website Health Checklist',
        subtitle: null,
        hook: 'Pre-launch checklist',
        category: 'guides',
        audience: null,
        description: 'desc',
        preview_md: 'preview',
        source_md_path: SOURCE_REL,
        formats: ['md', 'pdf', 'html'],
        content_hash: CONTENT_HASH,
        page_count: 6,
        published: false,
        download_count: 0,
        focus_keyword: null,
        secondary_keywords: [],
        seo_title: null,
        seo_description: null,
        tags: [],
        created_at: '2026-05-12T00:00:00Z',
        updated_at: '2026-05-12T00:00:00Z',
        ...overrides,
    };
}
const CACHE_BASE = path_1.default.resolve(process.cwd(), 'uploads', 'resources');
(0, vitest_1.beforeEach)(async () => {
    // Wipe the cache for our test slug between runs so cache-miss tests start clean.
    await promises_1.default.rm(path_1.default.join(CACHE_BASE, SLUG), { recursive: true, force: true });
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.describe)('deliverFormat — md', () => {
    (0, vitest_1.it)('returns the source MD file path with the right mime and filename', async () => {
        const result = await (0, resource_delivery_service_js_1.deliverFormat)(makeResource(), 'md');
        (0, vitest_1.expect)(result.mimeType).toBe(gated_resource_types_js_1.FORMAT_MIME.md);
        (0, vitest_1.expect)(result.filename).toBe(`${SLUG}.md`);
        (0, vitest_1.expect)(result.path).toContain(SOURCE_REL.replace(/\//g, path_1.default.sep));
        // The returned path resolves to a real, readable file.
        const stat = await promises_1.default.stat(result.path);
        (0, vitest_1.expect)(stat.isFile()).toBe(true);
    });
    (0, vitest_1.it)('does not call typeset for md delivery', async () => {
        const spy = vitest_1.vi.spyOn(typesetService, 'renderViaTypeset');
        await (0, resource_delivery_service_js_1.deliverFormat)(makeResource(), 'md');
        (0, vitest_1.expect)(spy).not.toHaveBeenCalled();
    });
});
(0, vitest_1.describe)('deliverFormat — pdf / html via typeset', () => {
    (0, vitest_1.it)('returns a cached file without calling typeset when the cache hit exists', async () => {
        const resource = makeResource();
        const cacheDir = path_1.default.join(CACHE_BASE, SLUG);
        const cachePath = path_1.default.join(cacheDir, `${CACHE_KEY}.pdf`);
        await promises_1.default.mkdir(cacheDir, { recursive: true });
        await promises_1.default.writeFile(cachePath, new Uint8Array([0x25, 0x50, 0x44, 0x46]));
        const spy = vitest_1.vi.spyOn(typesetService, 'renderViaTypeset');
        const result = await (0, resource_delivery_service_js_1.deliverFormat)(resource, 'pdf');
        (0, vitest_1.expect)(result.path).toBe(cachePath);
        (0, vitest_1.expect)(result.filename).toBe(`${SLUG}.pdf`);
        (0, vitest_1.expect)(result.mimeType).toBe(gated_resource_types_js_1.FORMAT_MIME.pdf);
        (0, vitest_1.expect)(spy).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('on cache miss, calls typeset and writes the response to the cache', async () => {
        const resource = makeResource();
        const fake = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x99]);
        vitest_1.vi.spyOn(typesetService, 'renderViaTypeset').mockResolvedValue({
            bytes: fake,
            mimeType: 'application/pdf',
        });
        const result = await (0, resource_delivery_service_js_1.deliverFormat)(resource, 'pdf');
        const expected = path_1.default.join(CACHE_BASE, SLUG, `${CACHE_KEY}.pdf`);
        (0, vitest_1.expect)(result.path).toBe(expected);
        const written = await promises_1.default.readFile(expected);
        (0, vitest_1.expect)(Array.from(written)).toEqual(Array.from(fake));
    });
    (0, vitest_1.it)('propagates TypesetNotConfiguredError when typeset is disabled', async () => {
        vitest_1.vi.spyOn(typesetService, 'renderViaTypeset').mockRejectedValue(new gated_resource_types_js_1.TypesetNotConfiguredError());
        await (0, vitest_1.expect)((0, resource_delivery_service_js_1.deliverFormat)(makeResource(), 'pdf')).rejects.toBeInstanceOf(gated_resource_types_js_1.TypesetNotConfiguredError);
    });
    (0, vitest_1.it)('re-renders after content_hash changes (cache key bumps)', async () => {
        const original = makeResource();
        const newHash = 'a'.repeat(64);
        const updated = makeResource({ content_hash: newHash });
        vitest_1.vi.spyOn(typesetService, 'renderViaTypeset').mockResolvedValue({
            bytes: new Uint8Array([1, 2, 3]),
            mimeType: 'application/pdf',
        });
        const first = await (0, resource_delivery_service_js_1.deliverFormat)(original, 'pdf');
        const second = await (0, resource_delivery_service_js_1.deliverFormat)(updated, 'pdf');
        (0, vitest_1.expect)(first.path).toContain(`${CONTENT_HASH}-default-report.pdf`);
        (0, vitest_1.expect)(second.path).toContain(`${newHash}-default-report.pdf`);
        (0, vitest_1.expect)(first.path).not.toBe(second.path);
    });
    (0, vitest_1.it)('re-renders after the typeset client slug changes', async () => {
        const resource = makeResource();
        vitest_1.vi.spyOn(typesetService, 'renderViaTypeset').mockResolvedValue({
            bytes: new Uint8Array([1, 2, 3]),
            mimeType: 'application/pdf',
        });
        const before = await (0, resource_delivery_service_js_1.deliverFormat)(resource, 'pdf');
        const originalEnv = process.env.TYPESET_CLIENT_SLUG;
        process.env.TYPESET_CLIENT_SLUG = 'acme';
        try {
            const after = await (0, resource_delivery_service_js_1.deliverFormat)(resource, 'pdf');
            (0, vitest_1.expect)(before.path).toContain('-default-report.pdf');
            (0, vitest_1.expect)(after.path).toContain('-acme-report.pdf');
            (0, vitest_1.expect)(before.path).not.toBe(after.path);
        }
        finally {
            if (originalEnv === undefined)
                delete process.env.TYPESET_CLIENT_SLUG;
            else
                process.env.TYPESET_CLIENT_SLUG = originalEnv;
        }
    });
});
(0, vitest_1.describe)('deliverFormat — invalid input', () => {
    (0, vitest_1.it)('throws UnsupportedFormatError for an unknown format', async () => {
        await (0, vitest_1.expect)(
        // @ts-expect-error: deliberately invalid
        (0, resource_delivery_service_js_1.deliverFormat)(makeResource(), 'rtf')).rejects.toBeInstanceOf(gated_resource_types_js_1.UnsupportedFormatError);
    });
    (0, vitest_1.it)('throws UnsupportedFormatError when the resource does not advertise the format', async () => {
        const mdOnly = makeResource({ formats: ['md'] });
        await (0, vitest_1.expect)((0, resource_delivery_service_js_1.deliverFormat)(mdOnly, 'pdf')).rejects.toBeInstanceOf(gated_resource_types_js_1.UnsupportedFormatError);
    });
});
//# sourceMappingURL=resource-delivery.service.test.js.map