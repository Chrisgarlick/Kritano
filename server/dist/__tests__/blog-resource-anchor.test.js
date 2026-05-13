"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const blog_ssr_service_js_1 = require("../services/blog-ssr.service.js");
function makeResource(over = {}) {
    return {
        id: 'res-id',
        slug: 'website-health-checklist',
        title: 'The Website Health Checklist',
        subtitle: null,
        hook: 'A printable, six-pillar audit checklist.',
        category: 'guides',
        audience: null,
        description: 'desc',
        preview_md: 'preview',
        source_md_path: 'resources/website-health-checklist/source.md',
        formats: ['md', 'pdf'],
        content_hash: 'a'.repeat(64),
        page_count: 7,
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
(0, vitest_1.describe)('anchorSlugForCategory', () => {
    (0, vitest_1.it)('returns the matrix slug for known categories', () => {
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.anchorSlugForCategory)('seo')).toBe('website-health-checklist');
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.anchorSlugForCategory)('accessibility')).toBe('wcag-quick-reference-card');
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.anchorSlugForCategory)('security')).toBe('security-headers-guide');
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.anchorSlugForCategory)('performance')).toBe('core-web-vitals-fix-guide');
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.anchorSlugForCategory)('aeo')).toBe('aeo-optimisation-guide');
    });
    (0, vitest_1.it)('returns null for product-updates so promo posts skip the CTA', () => {
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.anchorSlugForCategory)('product-updates')).toBeNull();
    });
    (0, vitest_1.it)('falls back to the flagship checklist for unmapped categories', () => {
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.anchorSlugForCategory)('something-new')).toBe('website-health-checklist');
    });
});
(0, vitest_1.describe)('renderResourceAnchor', () => {
    (0, vitest_1.it)('returns an empty string when no resource is supplied', () => {
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.renderResourceAnchor)(null)).toBe('');
    });
    (0, vitest_1.it)('returns an empty string for an unpublished resource', () => {
        (0, vitest_1.expect)((0, blog_ssr_service_js_1.renderResourceAnchor)(makeResource({ published: false }))).toBe('');
    });
    (0, vitest_1.it)('renders a link to /resources/<slug> with the title and hook', () => {
        const html = (0, blog_ssr_service_js_1.renderResourceAnchor)(makeResource());
        (0, vitest_1.expect)(html).toContain('href="/resources/website-health-checklist"');
        (0, vitest_1.expect)(html).toContain('The Website Health Checklist');
        (0, vitest_1.expect)(html).toContain('A printable, six-pillar audit checklist.');
    });
    (0, vitest_1.it)('renders a badge per format and the page count', () => {
        const html = (0, blog_ssr_service_js_1.renderResourceAnchor)(makeResource({ formats: ['md', 'pdf'], page_count: 7 }));
        (0, vitest_1.expect)(html).toContain('>md<');
        (0, vitest_1.expect)(html).toContain('>pdf<');
        (0, vitest_1.expect)(html).toContain('7 pages');
    });
    (0, vitest_1.it)('escapes HTML in title and hook to prevent injection', () => {
        const html = (0, blog_ssr_service_js_1.renderResourceAnchor)(makeResource({
            title: '<script>alert(1)</script>',
            hook: 'Hook with "quotes" & ampersand',
        }));
        (0, vitest_1.expect)(html).not.toContain('<script>alert');
        (0, vitest_1.expect)(html).toContain('&lt;script&gt;');
        (0, vitest_1.expect)(html).toContain('&quot;quotes&quot;');
        (0, vitest_1.expect)(html).toContain('&amp;');
    });
    (0, vitest_1.it)('omits the page-count badge when page_count is null', () => {
        const html = (0, blog_ssr_service_js_1.renderResourceAnchor)(makeResource({ page_count: null }));
        (0, vitest_1.expect)(html).not.toContain('pages');
    });
});
//# sourceMappingURL=blog-resource-anchor.test.js.map