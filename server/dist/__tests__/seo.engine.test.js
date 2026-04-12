"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const seo_engine_1 = require("../services/audit-engines/seo.engine");
// Helper to create mock crawl result
function mockCrawlResult(overrides = {}) {
    return {
        url: 'https://example.com/test',
        normalizedUrl: 'https://example.com/test',
        statusCode: 200,
        contentType: 'text/html',
        html: '<html><head><title>Test Page</title></head><body><h1>Hello</h1></body></html>',
        title: 'Test Page',
        metaDescription: 'A good meta description that is long enough to pass the minimum length check.',
        metaKeywords: null,
        canonicalUrl: 'https://example.com/test',
        h1Text: 'Hello',
        wordCount: 500,
        responseTimeMs: 200,
        pageSizeBytes: 5000,
        links: [],
        resources: [],
        headers: {},
        cookies: [],
        redirectChain: [],
        deviceType: 'desktop',
        viewport: { width: 1920, height: 1080 },
        ...overrides,
    };
}
(0, vitest_1.describe)('SeoEngine', () => {
    const engine = (0, seo_engine_1.createSeoEngine)();
    (0, vitest_1.describe)('Title rules', () => {
        (0, vitest_1.it)('should detect missing title', async () => {
            const result = mockCrawlResult({
                title: null,
                html: '<html><head></head><body></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'missing-title')).toBe(true);
        });
        (0, vitest_1.it)('should detect title too short', async () => {
            const result = mockCrawlResult({
                title: 'Short',
                html: '<html><head><title>Short</title></head><body></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'title-too-short')).toBe(true);
        });
        (0, vitest_1.it)('should detect title too long', async () => {
            const longTitle = 'A'.repeat(70);
            const result = mockCrawlResult({
                title: longTitle,
                html: `<html><head><title>${longTitle}</title></head><body></body></html>`,
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'title-too-long')).toBe(true);
        });
        (0, vitest_1.it)('should pass for valid title', async () => {
            const result = mockCrawlResult({
                title: 'This is a perfectly good page title',
                html: '<html><head><title>This is a perfectly good page title</title></head><body></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'missing-title')).toBe(false);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'title-too-short')).toBe(false);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'title-too-long')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Meta description rules', () => {
        (0, vitest_1.it)('should detect missing meta description', async () => {
            const result = mockCrawlResult({
                metaDescription: null,
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'missing-meta-description')).toBe(true);
        });
        (0, vitest_1.it)('should detect meta description too short', async () => {
            const result = mockCrawlResult({
                metaDescription: 'Too short',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'meta-description-too-short')).toBe(true);
        });
        (0, vitest_1.it)('should detect meta description too long', async () => {
            const result = mockCrawlResult({
                metaDescription: 'A'.repeat(200),
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'meta-description-too-long')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Heading rules', () => {
        (0, vitest_1.it)('should detect missing H1', async () => {
            const result = mockCrawlResult({
                h1Text: null,
                html: '<html><head><title>Test</title></head><body><h2>Subheading</h2></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'missing-h1')).toBe(true);
        });
        (0, vitest_1.it)('should detect multiple H1s', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title></head><body><h1>First</h1><h1>Second</h1></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'multiple-h1')).toBe(true);
        });
        (0, vitest_1.it)('should detect heading hierarchy issues', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title></head><body><h1>Title</h1><h3>Skipped H2</h3></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'heading-hierarchy')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Image rules', () => {
        (0, vitest_1.it)('should detect missing alt text', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title></head><body><h1>Title</h1><img src="test.jpg"></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'missing-alt-text')).toBe(true);
        });
        (0, vitest_1.it)('should detect empty alt text', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title></head><body><h1>Title</h1><img src="test.jpg" alt=""></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'empty-alt-text')).toBe(true);
        });
        (0, vitest_1.it)('should not flag presentation images with empty alt', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title></head><body><h1>Title</h1><img src="test.jpg" alt="" role="presentation"></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'empty-alt-text')).toBe(false);
        });
        (0, vitest_1.it)('should detect low quality alt text', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title></head><body><h1>Title</h1><img src="test.jpg" alt="image.jpg"></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'low-quality-alt-text')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Canonical rules', () => {
        (0, vitest_1.it)('should detect missing canonical', async () => {
            const result = mockCrawlResult({
                canonicalUrl: null,
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'missing-canonical')).toBe(true);
        });
        (0, vitest_1.it)('should detect non-self-referencing canonical', async () => {
            const result = mockCrawlResult({
                url: 'https://example.com/page1',
                canonicalUrl: 'https://example.com/page2',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'self-referencing-canonical')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Content rules', () => {
        (0, vitest_1.it)('should detect thin content', async () => {
            const result = mockCrawlResult({
                wordCount: 100,
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'thin-content')).toBe(true);
        });
        (0, vitest_1.it)('should not flag pages with sufficient content', async () => {
            const result = mockCrawlResult({
                wordCount: 500,
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'thin-content')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Mobile rules', () => {
        (0, vitest_1.it)('should detect missing viewport', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title></head><body><h1>Title</h1></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'missing-viewport')).toBe(true);
        });
        (0, vitest_1.it)('should not flag pages with viewport', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>Title</h1></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'missing-viewport')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Language rules', () => {
        (0, vitest_1.it)('should detect missing lang attribute', async () => {
            const result = mockCrawlResult({
                html: '<html><head><title>Test</title></head><body><h1>Title</h1></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'no-language')).toBe(true);
        });
        (0, vitest_1.it)('should not flag pages with lang attribute', async () => {
            const result = mockCrawlResult({
                html: '<html lang="en"><head><title>Test</title></head><body><h1>Title</h1></body></html>',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'no-language')).toBe(false);
        });
    });
    (0, vitest_1.describe)('URL rules', () => {
        (0, vitest_1.it)('should detect long URLs', async () => {
            const result = mockCrawlResult({
                url: 'https://example.com/' + 'a'.repeat(200),
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'url-too-long')).toBe(true);
        });
        (0, vitest_1.it)('should detect underscores in URLs', async () => {
            const result = mockCrawlResult({
                url: 'https://example.com/my_page_name',
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'url-has-underscores')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Performance rules', () => {
        (0, vitest_1.it)('should detect slow pages', async () => {
            const result = mockCrawlResult({
                responseTimeMs: 5000,
            });
            const findings = await engine.analyze(result);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'slow-page')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Page depth', () => {
        (0, vitest_1.it)('should detect deep pages', async () => {
            const result = mockCrawlResult();
            const findings = await engine.analyze(result, 5);
            (0, vitest_1.expect)(findings.some(f => f.ruleId === 'deep-page-depth')).toBe(true);
        });
    });
});
//# sourceMappingURL=seo.engine.test.js.map