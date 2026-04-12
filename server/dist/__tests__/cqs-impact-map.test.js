"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cqs_impact_map_1 = require("../data/cqs-impact-map");
(0, vitest_1.describe)('cqs-impact-map', () => {
    (0, vitest_1.describe)('getCqsImpact', () => {
        (0, vitest_1.it)('returns readability sub-score with weight 0.20 for poor-readability', () => {
            const result = (0, cqs_impact_map_1.getCqsImpact)('poor-readability');
            (0, vitest_1.expect)(result).toEqual({ subScores: ['readability'], weight: 0.20 });
        });
        (0, vitest_1.it)('returns multiple sub-scores for keyword-stuffing (quality + readability)', () => {
            const result = (0, cqs_impact_map_1.getCqsImpact)('keyword-stuffing');
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(result.subScores).toEqual(['quality', 'readability']);
            (0, vitest_1.expect)(result.subScores.length).toBeGreaterThan(1);
            // Combined weight: quality (0.25) + readability (0.20) = 0.45
            (0, vitest_1.expect)(result.weight).toBeCloseTo(0.45);
        });
        (0, vitest_1.it)('returns null for an unknown rule', () => {
            const result = (0, cqs_impact_map_1.getCqsImpact)('unknown-rule');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('returns eeat sub-score with weight 0.25 for no-author-bio', () => {
            const result = (0, cqs_impact_map_1.getCqsImpact)('no-author-bio');
            (0, vitest_1.expect)(result).toEqual({ subScores: ['eeat'], weight: 0.25 });
        });
    });
    (0, vitest_1.describe)('CQS_WEIGHTS', () => {
        (0, vitest_1.it)('values sum to 1.0', () => {
            const sum = Object.values(cqs_impact_map_1.CQS_WEIGHTS).reduce((a, b) => a + b, 0);
            (0, vitest_1.expect)(sum).toBeCloseTo(1.0);
        });
    });
    (0, vitest_1.describe)('impact map validity', () => {
        const validSubScores = [
            'quality',
            'eeat',
            'readability',
            'engagement',
            'structure',
        ];
        (0, vitest_1.it)('all impact map entries only reference valid CqsSubScore values', () => {
            // Test a comprehensive set of known rule IDs and verify their sub-scores are valid
            const ruleIds = [
                'thin-content',
                'no-author-bio',
                'poor-readability',
                'weak-opening',
                'missing-h1',
                'keyword-stuffing',
                'aeo-no-definition-blocks',
                'aeo-content-not-frontloaded',
                'no-multimedia',
                'no-citations',
                'long-sentences',
                'no-cta',
                'wall-of-text',
                'keyword-not-in-h1',
                'aeo-no-faq-section',
                'ghost-content-tier',
                'low-keyword-density',
                'no-toc',
                'boilerplate-heavy',
                'no-experience-signals',
            ];
            for (const ruleId of ruleIds) {
                const result = (0, cqs_impact_map_1.getCqsImpact)(ruleId);
                (0, vitest_1.expect)(result).not.toBeNull();
                for (const subScore of result.subScores) {
                    (0, vitest_1.expect)(validSubScores).toContain(subScore);
                }
            }
        });
        (0, vitest_1.it)('weight equals the sum of sub-score weights for multi-score entries', () => {
            const result = (0, cqs_impact_map_1.getCqsImpact)('aeo-no-definition-blocks');
            (0, vitest_1.expect)(result).not.toBeNull();
            // eeat (0.25) + structure (0.15) = 0.40
            (0, vitest_1.expect)(result.subScores).toEqual(['eeat', 'structure']);
            (0, vitest_1.expect)(result.weight).toBeCloseTo(0.40);
        });
    });
});
//# sourceMappingURL=cqs-impact-map.test.js.map