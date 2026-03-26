import { describe, it, expect } from 'vitest';
import {
  getCqsImpact,
  CQS_WEIGHTS,
  type CqsSubScore,
} from '../data/cqs-impact-map';

describe('cqs-impact-map', () => {
  describe('getCqsImpact', () => {
    it('returns readability sub-score with weight 0.20 for poor-readability', () => {
      const result = getCqsImpact('poor-readability');
      expect(result).toEqual({ subScores: ['readability'], weight: 0.20 });
    });

    it('returns multiple sub-scores for keyword-stuffing (quality + readability)', () => {
      const result = getCqsImpact('keyword-stuffing');
      expect(result).not.toBeNull();
      expect(result!.subScores).toEqual(['quality', 'readability']);
      expect(result!.subScores.length).toBeGreaterThan(1);
      // Combined weight: quality (0.25) + readability (0.20) = 0.45
      expect(result!.weight).toBeCloseTo(0.45);
    });

    it('returns null for an unknown rule', () => {
      const result = getCqsImpact('unknown-rule');
      expect(result).toBeNull();
    });

    it('returns eeat sub-score with weight 0.25 for no-author-bio', () => {
      const result = getCqsImpact('no-author-bio');
      expect(result).toEqual({ subScores: ['eeat'], weight: 0.25 });
    });
  });

  describe('CQS_WEIGHTS', () => {
    it('values sum to 1.0', () => {
      const sum = Object.values(CQS_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });
  });

  describe('impact map validity', () => {
    const validSubScores: CqsSubScore[] = [
      'quality',
      'eeat',
      'readability',
      'engagement',
      'structure',
    ];

    it('all impact map entries only reference valid CqsSubScore values', () => {
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
        const result = getCqsImpact(ruleId);
        expect(result).not.toBeNull();
        for (const subScore of result!.subScores) {
          expect(validSubScores).toContain(subScore);
        }
      }
    });

    it('weight equals the sum of sub-score weights for multi-score entries', () => {
      const result = getCqsImpact('aeo-no-definition-blocks');
      expect(result).not.toBeNull();
      // eeat (0.25) + structure (0.15) = 0.40
      expect(result!.subScores).toEqual(['eeat', 'structure']);
      expect(result!.weight).toBeCloseTo(0.40);
    });
  });
});
