import { describe, it, expect } from 'vitest';
import { SCORE_CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from './analytics.types';

describe('analytics constants', () => {
  it('SCORE_CATEGORIES includes cqs', () => {
    expect(SCORE_CATEGORIES).toContain('cqs');
  });

  it('CATEGORY_COLORS.cqs equals #14b8a6', () => {
    expect(CATEGORY_COLORS.cqs).toBe('#14b8a6');
  });

  it('CATEGORY_LABELS.cqs equals Content Quality', () => {
    expect(CATEGORY_LABELS.cqs).toBe('Content Quality');
  });

  it('SCORE_CATEGORIES has 7 items', () => {
    expect(SCORE_CATEGORIES).toHaveLength(7);
  });

  it('all SCORE_CATEGORIES have entries in CATEGORY_COLORS and CATEGORY_LABELS', () => {
    for (const category of SCORE_CATEGORIES) {
      expect(CATEGORY_COLORS[category]).toBeDefined();
      expect(CATEGORY_LABELS[category]).toBeDefined();
      expect(typeof CATEGORY_COLORS[category]).toBe('string');
      expect(typeof CATEGORY_LABELS[category]).toBe('string');
    }
  });
});
