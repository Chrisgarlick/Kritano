/**
 * Engagement Analysis Module
 * Analyzes hooks, CTAs, power words, questions, and transitions
 */
import type { EngagementAnalysis } from '../../../types/content.types.js';
/**
 * Analyze opening hook strength
 */
export declare function analyzeHook(text: string): {
    score: number;
    hasGenericOpener: boolean;
    hookType: string | null;
};
/**
 * Count power words and calculate density
 */
export declare function analyzePowerWords(words: string[]): {
    count: number;
    density: number;
    examples: string[];
};
/**
 * Count questions in content
 */
export declare function countQuestions(text: string): number;
/**
 * Analyze transition word usage
 */
export declare function analyzeTransitions(sentences: string[]): {
    count: number;
    ratio: number;
};
/**
 * Count CTAs in content
 */
export declare function countCTAs(html: string, text: string): number;
/**
 * Main engagement analysis function
 */
export declare function analyzeEngagement(html: string, text: string, sentences: string[], words: string[]): EngagementAnalysis;
//# sourceMappingURL=engagement.d.ts.map