/**
 * E-E-A-T Signal Detection Module
 * Detects Experience, Expertise, Authoritativeness, and Trustworthiness signals
 * via regex/cheerio pattern matching — no API calls, runs in <10ms per page.
 */
import type { EeatAnalysis } from '../../../types/content.types.js';
export declare const DATA_POINT_REGEX: RegExp;
export declare const LARGE_NUMBER_REGEX: RegExp;
export declare const MILLION_BILLION_REGEX: RegExp;
export declare const CITATION_PHRASES: RegExp[];
export declare const AUTHORITATIVE_DOMAINS: string[];
/**
 * Analyze E-E-A-T signals in page content
 */
export declare function analyzeEeat(html: string, text: string, sentences: string[], words: string[]): EeatAnalysis;
//# sourceMappingURL=eeat.d.ts.map