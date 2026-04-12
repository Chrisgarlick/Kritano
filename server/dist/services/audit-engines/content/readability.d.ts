/**
 * Readability Analysis Module
 * Implements multiple readability algorithms for content scoring
 */
import type { ReadabilityAnalysis } from '../../../types/content.types.js';
/**
 * Count syllables in a word using vowel group method
 */
export declare function countSyllables(word: string): number;
/**
 * Count total syllables in text
 */
export declare function getSyllableCount(words: string[]): number;
/**
 * Count sentences in text
 */
export declare function getSentenceCount(text: string): number;
/**
 * Extract sentences from text
 */
export declare function extractSentences(text: string): string[];
/**
 * Extract words from text
 */
export declare function extractWords(text: string): string[];
/**
 * Calculate Flesch-Kincaid Grade Level
 * Target: 7-9 for general web content
 */
export declare function getFleschKincaidGrade(wordCount: number, sentenceCount: number, syllableCount: number): number;
/**
 * Calculate Flesch Reading Ease
 * 90-100: Very easy, 60-69: Standard, 0-29: Very difficult
 */
export declare function getFleschReadingEase(wordCount: number, sentenceCount: number, syllableCount: number): number;
/**
 * Calculate Gunning Fog Index
 * Estimates years of formal education needed
 */
export declare function getGunningFog(words: string[], sentenceCount: number): number;
/**
 * Calculate Automated Readability Index (ARI)
 * Uses characters instead of syllables
 */
export declare function getARI(text: string, wordCount: number, sentenceCount: number): number;
/**
 * Calculate sentence length variance (variety)
 */
export declare function getSentenceVariety(sentences: string[]): number;
/**
 * Main readability analysis function
 */
export declare function analyzeReadability(text: string, sentences: string[], words: string[]): ReadabilityAnalysis;
//# sourceMappingURL=readability.d.ts.map