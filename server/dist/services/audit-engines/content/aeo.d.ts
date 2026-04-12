/**
 * AEO (Answer Engine Optimization) — AI Citability Audit
 * Detects how likely an AI model is to cite a page as a primary source,
 * based on three pillars: Nugget Extraction, Factual Density, and Source Authority.
 * No API calls — runs via regex/cheerio pattern matching in <10ms per page.
 */
import type { AeoAnalysis } from '../../../types/content.types.js';
/**
 * Analyze AEO signals in page content
 */
export declare function analyzeAeo(html: string, text: string, sentences: string[], words: string[]): AeoAnalysis;
//# sourceMappingURL=aeo.d.ts.map