/**
 * Maps content finding rule_ids to the CQS sub-score(s) they impact.
 * Used to tag findings with their CQS sub-score impact and calculate priority.
 *
 * Sub-scores and their weights in CQS:
 *   quality (25%), eeat (25%), readability (20%), engagement (15%), structure (15%)
 */
export type CqsSubScore = 'quality' | 'eeat' | 'readability' | 'engagement' | 'structure';
export declare const CQS_WEIGHTS: Record<CqsSubScore, number>;
export interface CqsImpact {
    subScores: CqsSubScore[];
    /** Estimated impact weight (sum of affected sub-score weights) */
    weight: number;
}
/**
 * Get the CQS sub-score impact for a finding rule_id.
 * Returns null for non-content findings.
 */
export declare function getCqsImpact(ruleId: string): CqsImpact | null;
//# sourceMappingURL=cqs-impact-map.d.ts.map