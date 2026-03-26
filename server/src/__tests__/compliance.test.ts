import { describe, it, expect } from 'vitest';
import { enMapping, buildWcagToEnMap } from '../data/en-301-549-mapping';

describe('EN 301 549 mapping', () => {
  describe('enMapping', () => {
    it('has exactly 50 clauses', () => {
      expect(enMapping).toHaveLength(50);
    });

    it('all clauses have required fields', () => {
      const requiredFields = ['clause', 'title', 'section', 'wcagCriteria', 'level'];
      for (const clause of enMapping) {
        for (const field of requiredFields) {
          expect(clause, `Clause ${clause.clause} missing field "${field}"`).toHaveProperty(field);
        }
        expect(typeof clause.manualOnly).toBe('boolean');
      }
    });

    it('all clauses have valid level values', () => {
      const validLevels = ['A', 'AA', 'AAA'];
      for (const clause of enMapping) {
        expect(
          validLevels,
          `Clause ${clause.clause} has invalid level "${clause.level}"`,
        ).toContain(clause.level);
      }
    });

    it('all clauses have section set to "Web"', () => {
      for (const clause of enMapping) {
        expect(clause.section).toBe('Web');
      }
    });

    it('manualOnly clauses exist (e.g., 9.1.2.1 and 9.1.2.2)', () => {
      const manualClauses = enMapping.filter((c) => c.manualOnly);
      expect(manualClauses.length).toBeGreaterThan(0);

      // 9.1.2.2 is "Captions (Pre-recorded)" — should be manual only
      const captionsClause = enMapping.find((c) => c.clause === '9.1.2.2');
      expect(captionsClause).toBeDefined();
      expect(captionsClause!.manualOnly).toBe(true);
      expect(captionsClause!.title).toContain('Captions');

      // 9.1.2.1 is also manual only
      const audioOnlyClause = enMapping.find((c) => c.clause === '9.1.2.1');
      expect(audioOnlyClause).toBeDefined();
      expect(audioOnlyClause!.manualOnly).toBe(true);
    });
  });

  describe('buildWcagToEnMap', () => {
    it('returns a Map with WCAG criteria keys', () => {
      const map = buildWcagToEnMap();
      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBeGreaterThan(0);
    });

    it('looking up "1.1.1" returns EN clause(s)', () => {
      const map = buildWcagToEnMap();
      const clauses = map.get('1.1.1');
      expect(clauses).toBeDefined();
      expect(clauses!.length).toBeGreaterThanOrEqual(1);
      expect(clauses![0].clause).toBe('9.1.1.1');
      expect(clauses![0].title).toBe('Non-text Content');
    });

    it('all keys follow WCAG criterion format (e.g., x.y.z)', () => {
      const map = buildWcagToEnMap();
      for (const key of map.keys()) {
        expect(key).toMatch(/^\d+\.\d+\.\d+$/);
      }
    });

    it('every enMapping entry is represented in the map', () => {
      const map = buildWcagToEnMap();
      for (const clause of enMapping) {
        const entries = map.get(clause.wcagCriteria);
        expect(entries, `WCAG ${clause.wcagCriteria} not found in map`).toBeDefined();
        const found = entries!.some((e) => e.clause === clause.clause);
        expect(found, `EN clause ${clause.clause} not found under WCAG ${clause.wcagCriteria}`).toBe(
          true,
        );
      }
    });
  });
});
