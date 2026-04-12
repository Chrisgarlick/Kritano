"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockQuery = vitest_1.vi.fn();
vitest_1.vi.mock('../utils/cache.utils', () => ({
    withCache: vitest_1.vi.fn((_key, _ttl, fn) => fn()),
}));
// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
const analytics_service_js_1 = require("../services/analytics.service.js");
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    (0, analytics_service_js_1.setPool)({ query: mockQuery });
});
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeScoreRow(overrides = {}) {
    return {
        id: 'id' in overrides ? overrides.id : 'a1',
        completed_at: 'completed_at' in overrides ? overrides.completed_at : new Date('2025-06-01'),
        seo_score: 'seo_score' in overrides ? overrides.seo_score : 70,
        accessibility_score: 'accessibility_score' in overrides ? overrides.accessibility_score : 80,
        security_score: 'security_score' in overrides ? overrides.security_score : 90,
        performance_score: 'performance_score' in overrides ? overrides.performance_score : 60,
        content_score: 'content_score' in overrides ? overrides.content_score : 75,
        structured_data_score: 'structured_data_score' in overrides ? overrides.structured_data_score : 50,
    };
}
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('Analytics Service', () => {
    // =======================================================================
    // calculateTrend — tested indirectly via getSiteScoreHistory
    // =======================================================================
    (0, vitest_1.describe)('calculateTrend (via getSiteScoreHistory)', () => {
        (0, vitest_1.it)('should report "up" trend when scores are improving', async () => {
            // First half: low scores, second half: high scores → improvement
            const rows = [
                makeScoreRow({ id: 'a1', completed_at: new Date('2025-01-01'), seo_score: 50 }),
                makeScoreRow({ id: 'a2', completed_at: new Date('2025-02-01'), seo_score: 55 }),
                makeScoreRow({ id: 'a3', completed_at: new Date('2025-03-01'), seo_score: 70 }),
                makeScoreRow({ id: 'a4', completed_at: new Date('2025-04-01'), seo_score: 80 }),
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: 'all' });
            // SEO trend should be 'up' because secondHalf avg (75) - firstHalf avg (52.5) > 2
            (0, vitest_1.expect)(result.summary.trends.seo).toBe('up');
        });
        (0, vitest_1.it)('should report "down" trend when scores are declining', async () => {
            const rows = [
                makeScoreRow({ id: 'a1', completed_at: new Date('2025-01-01'), accessibility_score: 90 }),
                makeScoreRow({ id: 'a2', completed_at: new Date('2025-02-01'), accessibility_score: 85 }),
                makeScoreRow({ id: 'a3', completed_at: new Date('2025-03-01'), accessibility_score: 65 }),
                makeScoreRow({ id: 'a4', completed_at: new Date('2025-04-01'), accessibility_score: 60 }),
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: 'all' });
            // Accessibility: firstHalf avg (87.5) vs secondHalf avg (62.5), diff = -25 → 'down'
            (0, vitest_1.expect)(result.summary.trends.accessibility).toBe('down');
        });
        (0, vitest_1.it)('should report "stable" trend when scores are consistent', async () => {
            const rows = [
                makeScoreRow({ id: 'a1', completed_at: new Date('2025-01-01'), security_score: 80 }),
                makeScoreRow({ id: 'a2', completed_at: new Date('2025-02-01'), security_score: 81 }),
                makeScoreRow({ id: 'a3', completed_at: new Date('2025-03-01'), security_score: 80 }),
                makeScoreRow({ id: 'a4', completed_at: new Date('2025-04-01'), security_score: 81 }),
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: 'all' });
            // Security: firstHalf avg (80.5) vs secondHalf avg (80.5), diff = 0 → 'stable'
            (0, vitest_1.expect)(result.summary.trends.security).toBe('stable');
        });
        (0, vitest_1.it)('should report "stable" when only one audit exists', async () => {
            const rows = [
                makeScoreRow({ id: 'a1', completed_at: new Date('2025-01-01') }),
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: 'all' });
            (0, vitest_1.expect)(result.summary.trends.seo).toBe('stable');
            (0, vitest_1.expect)(result.summary.trends.accessibility).toBe('stable');
        });
    });
    // =======================================================================
    // calculateOverallTrend — tested indirectly
    // The overall trend is not directly in ScoreHistory return, but we can
    // verify scores/summary structure and averages.
    // =======================================================================
    (0, vitest_1.describe)('getSiteScoreHistory summary', () => {
        (0, vitest_1.it)('should calculate correct averages', async () => {
            const rows = [
                makeScoreRow({ id: 'a1', seo_score: 60, accessibility_score: 80 }),
                makeScoreRow({ id: 'a2', seo_score: 80, accessibility_score: 90 }),
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: '30d' });
            (0, vitest_1.expect)(result.summary.averages.seo).toBe(70); // (60+80)/2
            (0, vitest_1.expect)(result.summary.averages.accessibility).toBe(85); // (80+90)/2
            (0, vitest_1.expect)(result.summary.totalAudits).toBe(2);
        });
        (0, vitest_1.it)('should handle null scores gracefully in averages', async () => {
            const rows = [
                makeScoreRow({ id: 'a1', seo_score: null, content_score: null }),
                makeScoreRow({ id: 'a2', seo_score: null, content_score: 80 }),
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: '30d' });
            // Both SEO values are null → average should be null
            (0, vitest_1.expect)(result.summary.averages.seo).toBeNull();
            // One content value is 80, the other null → average of non-null = 80
            (0, vitest_1.expect)(result.summary.averages.content).toBe(80);
            // Other categories still have defaults → non-null averages
            (0, vitest_1.expect)(result.summary.averages.accessibility).toBe(80);
        });
        (0, vitest_1.it)('should return empty scores array when no audits exist', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: '30d' });
            (0, vitest_1.expect)(result.scores).toEqual([]);
            (0, vitest_1.expect)(result.summary.totalAudits).toBe(0);
            (0, vitest_1.expect)(result.summary.averages.seo).toBeNull();
        });
        (0, vitest_1.it)('should map database columns to ScoreDataPoint fields', async () => {
            const rows = [
                makeScoreRow({
                    id: 'a1',
                    completed_at: new Date('2025-06-01T12:00:00Z'),
                    seo_score: 70,
                    accessibility_score: 80,
                    security_score: 90,
                    performance_score: 60,
                    content_score: 75,
                    structured_data_score: 50,
                }),
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: '30d' });
            (0, vitest_1.expect)(result.scores[0]).toEqual({
                auditId: 'a1',
                completedAt: rows[0].completed_at.toISOString(),
                seo: 70,
                accessibility: 80,
                security: 90,
                performance: 60,
                content: 75,
                structuredData: 50,
            });
        });
    });
    // =======================================================================
    // Edge cases
    // =======================================================================
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('should handle all null scores without crashing', async () => {
            const rows = [
                {
                    id: 'a1',
                    completed_at: new Date('2025-06-01'),
                    seo_score: null,
                    accessibility_score: null,
                    security_score: null,
                    performance_score: null,
                    content_score: null,
                    structured_data_score: null,
                },
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: '30d' });
            (0, vitest_1.expect)(result.summary.averages.seo).toBeNull();
            (0, vitest_1.expect)(result.summary.averages.accessibility).toBeNull();
            (0, vitest_1.expect)(result.summary.averages.security).toBeNull();
            (0, vitest_1.expect)(result.summary.averages.performance).toBeNull();
            (0, vitest_1.expect)(result.summary.trends.seo).toBe('stable');
        });
        (0, vitest_1.it)('should calculate trends correctly with mixed null/number values', async () => {
            const rows = [
                makeScoreRow({ id: 'a1', completed_at: new Date('2025-01-01'), seo_score: null }),
                makeScoreRow({ id: 'a2', completed_at: new Date('2025-02-01'), seo_score: 50 }),
                makeScoreRow({ id: 'a3', completed_at: new Date('2025-03-01'), seo_score: 80 }),
                makeScoreRow({ id: 'a4', completed_at: new Date('2025-04-01'), seo_score: 90 }),
            ];
            mockQuery.mockResolvedValueOnce({ rows });
            const result = await (0, analytics_service_js_1.getSiteScoreHistory)({ siteId: 'site-1', range: 'all' });
            // Non-null values: [50, 80, 90] → firstHalf [50], secondHalf [80, 90]
            // firstAvg=50, secondAvg=85, diff=35 > 2 → 'up'
            (0, vitest_1.expect)(result.summary.trends.seo).toBe('up');
        });
    });
});
//# sourceMappingURL=analytics.service.test.js.map