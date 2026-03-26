/**
 * Maps content finding rule_ids to the CQS sub-score(s) they impact.
 * Used to tag findings with their CQS sub-score impact and calculate priority.
 *
 * Sub-scores and their weights in CQS:
 *   quality (25%), eeat (25%), readability (20%), engagement (15%), structure (15%)
 */

export type CqsSubScore = 'quality' | 'eeat' | 'readability' | 'engagement' | 'structure';

export const CQS_WEIGHTS: Record<CqsSubScore, number> = {
  quality: 0.25,
  eeat: 0.25,
  readability: 0.20,
  engagement: 0.15,
  structure: 0.15,
};

export interface CqsImpact {
  subScores: CqsSubScore[];
  /** Estimated impact weight (sum of affected sub-score weights) */
  weight: number;
}

/**
 * Static mapping of content rule_ids to their CQS sub-score impact.
 */
const impactMap: Record<string, CqsSubScore[]> = {
  // Quality (25%) — content/quality.ts
  'thin-content': ['quality'],
  'short-content': ['quality'],
  'no-multimedia': ['quality'],
  'no-images': ['quality'],
  'boilerplate-heavy': ['quality'],
  'low-content-ratio': ['quality'],
  'outdated-content': ['quality'],

  // E-E-A-T (25%) — content/eeat.ts
  'no-author-bio': ['eeat'],
  'no-author-credentials': ['eeat'],
  'no-experience-signals': ['eeat'],
  'low-expertise-depth': ['eeat'],
  'no-citations': ['eeat'],
  'no-contact-info': ['eeat'],
  'no-privacy-policy': ['eeat'],
  'no-terms-of-service': ['eeat'],
  'ghost-content-tier': ['eeat'],

  // Readability (20%) — content/readability.ts
  'poor-readability': ['readability'],
  'moderate-readability': ['readability'],
  'long-sentences': ['readability'],
  'no-sentence-variety': ['readability'],
  'complex-vocabulary': ['readability'],
  'academic-reading-level': ['readability'],

  // Engagement (15%) — content/engagement.ts
  'weak-opening': ['engagement'],
  'no-cta': ['engagement'],
  'too-many-ctas': ['engagement'],
  'no-questions': ['engagement'],
  'low-transition-words': ['engagement'],
  'no-power-words': ['engagement'],

  // Structure (15%) — content/structure.ts
  'missing-h1': ['structure'],
  'multiple-h1': ['structure'],
  'heading-hierarchy-broken': ['structure'],
  'no-subheadings': ['structure'],
  'wall-of-text': ['structure'],
  'poor-paragraph-structure': ['structure'],
  'no-lists': ['structure'],
  'no-toc': ['structure'],

  // Keywords — impacts both quality and readability
  'keyword-not-in-title': ['quality'],
  'keyword-not-in-h1': ['quality', 'structure'],
  'keyword-not-in-intro': ['quality'],
  'keyword-not-in-meta': ['quality'],
  'low-keyword-density': ['quality'],
  'keyword-stuffing': ['quality', 'readability'],
  'keyword-not-found': ['quality'],
  'low-keyword-variation': ['quality'],
  'keyword-not-in-url': ['quality'],

  // AEO — primarily impacts E-E-A-T and structure
  'aeo-no-definition-blocks': ['eeat', 'structure'],
  'aeo-no-summary-statement': ['eeat'],
  'aeo-no-faq-section': ['engagement', 'structure'],
  'aeo-no-structured-content': ['structure'],
  'aeo-low-factual-density': ['eeat'],
  'aeo-no-verifiable-claims': ['eeat'],
  'aeo-no-author-sameas': ['eeat'],
  'aeo-no-citation-schema': ['eeat'],
  'aeo-content-not-frontloaded': ['readability', 'engagement'],
  'aeo-no-semantic-citations': ['eeat'],
};

/**
 * Get the CQS sub-score impact for a finding rule_id.
 * Returns null for non-content findings.
 */
export function getCqsImpact(ruleId: string): CqsImpact | null {
  const subScores = impactMap[ruleId];
  if (!subScores) return null;

  const weight = subScores.reduce((sum, s) => sum + CQS_WEIGHTS[s], 0);
  return { subScores, weight };
}
