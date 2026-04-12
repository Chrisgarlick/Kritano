"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const en_301_549_mapping_1 = require("../data/en-301-549-mapping");
(0, vitest_1.describe)('EN 301 549 mapping', () => {
    (0, vitest_1.describe)('enMapping', () => {
        (0, vitest_1.it)('has exactly 50 clauses', () => {
            (0, vitest_1.expect)(en_301_549_mapping_1.enMapping).toHaveLength(50);
        });
        (0, vitest_1.it)('all clauses have required fields', () => {
            const requiredFields = ['clause', 'title', 'section', 'wcagCriteria', 'level'];
            for (const clause of en_301_549_mapping_1.enMapping) {
                for (const field of requiredFields) {
                    (0, vitest_1.expect)(clause, `Clause ${clause.clause} missing field "${field}"`).toHaveProperty(field);
                }
                (0, vitest_1.expect)(typeof clause.manualOnly).toBe('boolean');
            }
        });
        (0, vitest_1.it)('all clauses have valid level values', () => {
            const validLevels = ['A', 'AA', 'AAA'];
            for (const clause of en_301_549_mapping_1.enMapping) {
                (0, vitest_1.expect)(validLevels, `Clause ${clause.clause} has invalid level "${clause.level}"`).toContain(clause.level);
            }
        });
        (0, vitest_1.it)('all clauses have section set to "Web"', () => {
            for (const clause of en_301_549_mapping_1.enMapping) {
                (0, vitest_1.expect)(clause.section).toBe('Web');
            }
        });
        (0, vitest_1.it)('manualOnly clauses exist (e.g., 9.1.2.1 and 9.1.2.2)', () => {
            const manualClauses = en_301_549_mapping_1.enMapping.filter((c) => c.manualOnly);
            (0, vitest_1.expect)(manualClauses.length).toBeGreaterThan(0);
            // 9.1.2.2 is "Captions (Pre-recorded)" — should be manual only
            const captionsClause = en_301_549_mapping_1.enMapping.find((c) => c.clause === '9.1.2.2');
            (0, vitest_1.expect)(captionsClause).toBeDefined();
            (0, vitest_1.expect)(captionsClause.manualOnly).toBe(true);
            (0, vitest_1.expect)(captionsClause.title).toContain('Captions');
            // 9.1.2.1 is also manual only
            const audioOnlyClause = en_301_549_mapping_1.enMapping.find((c) => c.clause === '9.1.2.1');
            (0, vitest_1.expect)(audioOnlyClause).toBeDefined();
            (0, vitest_1.expect)(audioOnlyClause.manualOnly).toBe(true);
        });
    });
    (0, vitest_1.describe)('buildWcagToEnMap', () => {
        (0, vitest_1.it)('returns a Map with WCAG criteria keys', () => {
            const map = (0, en_301_549_mapping_1.buildWcagToEnMap)();
            (0, vitest_1.expect)(map).toBeInstanceOf(Map);
            (0, vitest_1.expect)(map.size).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('looking up "1.1.1" returns EN clause(s)', () => {
            const map = (0, en_301_549_mapping_1.buildWcagToEnMap)();
            const clauses = map.get('1.1.1');
            (0, vitest_1.expect)(clauses).toBeDefined();
            (0, vitest_1.expect)(clauses.length).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(clauses[0].clause).toBe('9.1.1.1');
            (0, vitest_1.expect)(clauses[0].title).toBe('Non-text Content');
        });
        (0, vitest_1.it)('all keys follow WCAG criterion format (e.g., x.y.z)', () => {
            const map = (0, en_301_549_mapping_1.buildWcagToEnMap)();
            for (const key of map.keys()) {
                (0, vitest_1.expect)(key).toMatch(/^\d+\.\d+\.\d+$/);
            }
        });
        (0, vitest_1.it)('every enMapping entry is represented in the map', () => {
            const map = (0, en_301_549_mapping_1.buildWcagToEnMap)();
            for (const clause of en_301_549_mapping_1.enMapping) {
                const entries = map.get(clause.wcagCriteria);
                (0, vitest_1.expect)(entries, `WCAG ${clause.wcagCriteria} not found in map`).toBeDefined();
                const found = entries.some((e) => e.clause === clause.clause);
                (0, vitest_1.expect)(found, `EN clause ${clause.clause} not found under WCAG ${clause.wcagCriteria}`).toBe(true);
            }
        });
    });
});
//# sourceMappingURL=compliance.test.js.map