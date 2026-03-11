// @ts-nocheck

/** Keyword Analysis Module
 * Analyzes keyword density, placement, variations, and stuffing
 */

import * as cheerio from 'cheerio';
import type { KeywordAnalysis, KeywordMetrics, ContentFinding } from '../../../types/content.types.js';
import { extractWords } from './readability.js';

// Common word variations and synonyms generator
const SUFFIX_PATTERNS = ['s', 'es', 'ed', 'ing', 'er', 'est', 'ly', 'tion', 'ness'];

interface PageData {
  title: string | null;
  h1: string | null;
  metaDescription: string | null;
  url: string;
  html: string;
}

/**
 * Generate keyword variations (plurals, common forms)
 */
export function generateVariations(keyword: string): string[] {
  const variations = new Set<string>();
  const lower = keyword.toLowerCase().trim();

  variations.add(lower);

  // Handle multi-word keywords
  const words = lower.split(/\s+/);

  if (words.length === 1) {
    // Single word variations
    const word = words[0];

    // Add plural forms
    if (!word.endsWith('s')) {
      variations.add(word + 's');
      if (word.endsWith('y')) {
        variations.add(word.slice(0, -1) + 'ies');
      } else if (word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x')) {
        variations.add(word + 'es');
      }
    }

    // Add common verb forms
    if (!word.endsWith('ing')) {
      if (word.endsWith('e')) {
        variations.add(word.slice(0, -1) + 'ing');
      } else {
        variations.add(word + 'ing');
      }
    }

    if (!word.endsWith('ed')) {
      if (word.endsWith('e')) {
        variations.add(word + 'd');
      } else {
        variations.add(word + 'ed');
      }
    }
  } else {
    // Multi-word keyword - generate variations of last word
    const lastWord = words[words.length - 1];
    const prefix = words.slice(0, -1).join(' ');

    if (!lastWord.endsWith('s')) {
      variations.add(`${prefix} ${lastWord}s`);
    }
    if (!lastWord.endsWith('ing')) {
      if (lastWord.endsWith('e')) {
        variations.add(`${prefix} ${lastWord.slice(0, -1)}ing`);
      } else {
        variations.add(`${prefix} ${lastWord}ing`);
      }
    }
  }

  return [...variations];
}

/**
 * Count keyword occurrences in text (case-insensitive)
 */
export function countKeywordOccurrences(text: string, keyword: string): number {
  const lower = text.toLowerCase();
  const keywordLower = keyword.toLowerCase().trim();

  // Use word boundary matching for single words
  if (!keywordLower.includes(' ')) {
    const pattern = new RegExp(`\\b${escapeRegex(keywordLower)}\\b`, 'gi');
    const matches = lower.match(pattern);
    return matches ? matches.length : 0;
  }

  // For phrases, use simple includes with word boundary check
  let count = 0;
  let pos = 0;

  while ((pos = lower.indexOf(keywordLower, pos)) !== -1) {
    // Check word boundaries
    const before = pos === 0 || /\W/.test(lower[pos - 1]);
    const after = pos + keywordLower.length >= lower.length ||
                  /\W/.test(lower[pos + keywordLower.length]);

    if (before && after) {
      count++;
    }
    pos++;
  }

  return count;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculate keyword density
 */
export function calculateDensity(occurrences: number, wordCount: number): number {
  if (wordCount === 0) return 0;
  return Math.round((occurrences / wordCount) * 10000) / 100; // Percentage with 2 decimals
}

/**
 * Check if keyword is in title
 */
export function isInTitle(title: string | null, keyword: string): boolean {
  if (!title) return false;
  return title.toLowerCase().includes(keyword.toLowerCase().trim());
}

/**
 * Check if keyword is in H1
 */
export function isInH1(h1: string | null, keyword: string): boolean {
  if (!h1) return false;
  return h1.toLowerCase().includes(keyword.toLowerCase().trim());
}

/**
 * Check if keyword is in first paragraph
 */
export function isInFirstParagraph(html: string, keyword: string): boolean {
  const $ = cheerio.load(html);

  // Try to find main content first paragraph
  const mainContent = $('main, article, [role="main"], .content, .post-content').first();
  const container = mainContent.length > 0 ? mainContent : $('body');

  const firstParagraph = container.find('p').first().text();
  if (!firstParagraph) return false;

  return firstParagraph.toLowerCase().includes(keyword.toLowerCase().trim());
}

/**
 * Check if keyword is in last paragraph
 */
export function isInLastParagraph(html: string, keyword: string): boolean {
  const $ = cheerio.load(html);

  const mainContent = $('main, article, [role="main"], .content, .post-content').first();
  const container = mainContent.length > 0 ? mainContent : $('body');

  const paragraphs = container.find('p');
  if (paragraphs.length === 0) return false;

  const lastParagraph = paragraphs.last().text();
  return lastParagraph.toLowerCase().includes(keyword.toLowerCase().trim());
}

/**
 * Check if keyword is in meta description
 */
export function isInMetaDescription(metaDescription: string | null, keyword: string): boolean {
  if (!metaDescription) return false;
  return metaDescription.toLowerCase().includes(keyword.toLowerCase().trim());
}

/**
 * Check if keyword is in URL
 */
export function isInUrl(url: string, keyword: string): boolean {
  const urlLower = url.toLowerCase();
  const keywordLower = keyword.toLowerCase().trim();

  // Check for exact match or hyphenated version
  const hyphenated = keywordLower.replace(/\s+/g, '-');
  const underscored = keywordLower.replace(/\s+/g, '_');
  const noSpace = keywordLower.replace(/\s+/g, '');

  return urlLower.includes(keywordLower) ||
         urlLower.includes(hyphenated) ||
         urlLower.includes(underscored) ||
         urlLower.includes(noSpace);
}

/**
 * Check if keyword is in image alt text
 */
export function isInAltText(html: string, keyword: string): boolean {
  const $ = cheerio.load(html);
  const keywordLower = keyword.toLowerCase().trim();

  let found = false;
  $('img[alt]').each((_, el) => {
    const alt = $(el).attr('alt')?.toLowerCase() || '';
    if (alt.includes(keywordLower)) {
      found = true;
      return false; // Break loop
    }
  });

  return found;
}

/**
 * Find which variations are used in the text
 */
export function findUsedVariations(text: string, variations: string[]): string[] {
  const used: string[] = [];
  const lower = text.toLowerCase();

  for (const variation of variations) {
    if (countKeywordOccurrences(lower, variation) > 0) {
      used.push(variation);
    }
  }

  return used;
}

/**
 * Detect keyword stuffing
 */
export function detectKeywordStuffing(
  density: number,
  occurrences: number,
  wordCount: number
): boolean {
  // Keyword stuffing indicators:
  // 1. Density > 3% is generally considered stuffing
  // 2. More than 1 occurrence per 50 words in short content

  if (density > 3) return true;

  // For short content, be stricter
  if (wordCount < 500 && occurrences > 10) return true;

  return false;
}

/**
 * Score keyword placement (where the keyword appears)
 */
export function scoreKeywordPlacement(metrics: KeywordMetrics): number {
  let score = 0;

  // Critical placements (high weight)
  if (metrics.inTitle) score += 25;
  if (metrics.inH1) score += 25;
  if (metrics.inFirstParagraph) score += 15;

  // Important placements (medium weight)
  if (metrics.inMetaDescription) score += 15;
  if (metrics.inUrl) score += 10;

  // Additional placements (lower weight)
  if (metrics.inAltText) score += 5;
  if (metrics.inLastParagraph) score += 5;

  return Math.min(100, score);
}

/**
 * Score keyword density (optimal is 1-2%)
 */
export function scoreDensity(density: number): number {
  if (density === 0) return 0;
  if (density >= 1 && density <= 2) return 100; // Optimal
  if (density >= 0.5 && density < 1) return 80;  // Slightly low
  if (density > 2 && density <= 3) return 70;    // Slightly high
  if (density > 3 && density <= 4) return 40;    // Too high
  if (density > 4) return 20;                     // Stuffing
  return 60; // Very low (0 < d < 0.5)
}

/**
 * Main keyword analysis function
 */
export function analyzeKeywords(
  text: string,
  pageData: PageData,
  targetKeyword: string
): KeywordAnalysis {
  const findings: ContentFinding[] = [];
  const words = extractWords(text);
  const wordCount = words.length;

  // Generate variations
  const variations = generateVariations(targetKeyword);

  // Count occurrences (include variations)
  let totalOccurrences = 0;
  for (const variation of variations) {
    totalOccurrences += countKeywordOccurrences(text, variation);
  }

  // Calculate density
  const density = calculateDensity(totalOccurrences, wordCount);

  // Check placements
  const inTitle = isInTitle(pageData.title, targetKeyword);
  const inH1 = isInH1(pageData.h1, targetKeyword);
  const inFirstParagraph = isInFirstParagraph(pageData.html, targetKeyword);
  const inMetaDescription = isInMetaDescription(pageData.metaDescription, targetKeyword);
  const inUrl = isInUrl(pageData.url, targetKeyword);
  const inAltText = isInAltText(pageData.html, targetKeyword);
  const inLastParagraph = isInLastParagraph(pageData.html, targetKeyword);

  // Find used variations
  const variationsUsed = findUsedVariations(text, variations);

  // Detect stuffing
  const isStuffed = detectKeywordStuffing(density, totalOccurrences, wordCount);

  const metrics: KeywordMetrics = {
    keyword: targetKeyword,
    density,
    occurrences: totalOccurrences,
    inTitle,
    inH1,
    inFirstParagraph,
    inMetaDescription,
    inUrl,
    inAltText,
    inLastParagraph,
    variationsUsed,
    isStuffed,
  };

  // Calculate scores
  const placementScore = scoreKeywordPlacement(metrics);
  const densityScore = scoreDensity(density);

  // Weighted score (placement 60%, density 40%)
  let score = Math.round(placementScore * 0.6 + densityScore * 0.4);

  // Penalty for stuffing
  if (isStuffed) {
    score = Math.max(20, score - 40);
  }

  // Generate findings

  // Missing from title
  if (!inTitle) {
    findings.push({
      ruleId: 'keyword-not-in-title',
      ruleName: 'Keyword Missing from Title',
      category: 'content-keywords',
      severity: 'serious',
      message: `Target keyword "${targetKeyword}" is not in the page title`,
      description: 'The page title is one of the most important places for your target keyword.',
      recommendation: 'Include the target keyword naturally in your page title, preferably near the beginning.',
    });
  }

  // Missing from H1
  if (!inH1) {
    findings.push({
      ruleId: 'keyword-not-in-h1',
      ruleName: 'Keyword Missing from H1',
      category: 'content-keywords',
      severity: 'serious',
      message: `Target keyword "${targetKeyword}" is not in the H1 heading`,
      description: 'The H1 heading should contain your target keyword for optimal SEO.',
      recommendation: 'Include the target keyword in your main H1 heading.',
    });
  }

  // Missing from first paragraph
  if (!inFirstParagraph) {
    findings.push({
      ruleId: 'keyword-not-in-intro',
      ruleName: 'Keyword Missing from Introduction',
      category: 'content-keywords',
      severity: 'moderate',
      message: `Target keyword "${targetKeyword}" is not in the first paragraph`,
      description: 'Including the keyword early in the content signals relevance to search engines.',
      recommendation: 'Mention your target keyword naturally in the first paragraph.',
    });
  }

  // Missing from meta description
  if (!inMetaDescription) {
    findings.push({
      ruleId: 'keyword-not-in-meta',
      ruleName: 'Keyword Missing from Meta Description',
      category: 'content-keywords',
      severity: 'moderate',
      message: `Target keyword "${targetKeyword}" is not in the meta description`,
      description: 'Meta descriptions with the target keyword appear bolded in search results.',
      recommendation: 'Include the target keyword in your meta description.',
    });
  }

  // Low density
  if (density < 0.5 && wordCount > 300) {
    findings.push({
      ruleId: 'low-keyword-density',
      ruleName: 'Low Keyword Density',
      category: 'content-keywords',
      severity: 'moderate',
      message: `Keyword density (${density}%) is below recommended 1-2%`,
      description: 'Very low keyword density may indicate the content isn\'t focused on the target topic.',
      recommendation: 'Naturally include the keyword and its variations more frequently.',
    });
  }

  // Keyword stuffing
  if (isStuffed) {
    findings.push({
      ruleId: 'keyword-stuffing',
      ruleName: 'Keyword Stuffing Detected',
      category: 'content-keywords',
      severity: 'serious',
      message: `Keyword density (${density}%) is too high, which may be seen as spam`,
      description: 'Overusing keywords can result in search engine penalties and poor user experience.',
      recommendation: 'Reduce keyword frequency and use more natural language with synonyms and variations.',
    });
  }

  // No occurrences at all
  if (totalOccurrences === 0) {
    findings.push({
      ruleId: 'keyword-not-found',
      ruleName: 'Target Keyword Not Found',
      category: 'content-keywords',
      severity: 'serious',
      message: `Target keyword "${targetKeyword}" was not found in the content`,
      description: 'The target keyword should appear naturally throughout your content.',
      recommendation: 'Include the target keyword and its variations naturally in your content.',
    });
  }

  // Low variation usage
  if (variationsUsed.length <= 1 && wordCount > 500) {
    findings.push({
      ruleId: 'low-keyword-variation',
      ruleName: 'Limited Keyword Variations',
      category: 'content-keywords',
      severity: 'minor',
      message: 'Content uses few variations of the target keyword',
      description: 'Using keyword variations (plurals, synonyms) improves content naturalness.',
      recommendation: `Consider using variations like: ${variations.slice(0, 4).join(', ')}`,
    });
  }

  // Missing from URL
  if (!inUrl && wordCount > 300) {
    findings.push({
      ruleId: 'keyword-not-in-url',
      ruleName: 'Keyword Missing from URL',
      category: 'content-keywords',
      severity: 'minor',
      message: `Target keyword "${targetKeyword}" is not in the URL`,
      description: 'URLs containing keywords can improve click-through rates and SEO.',
      recommendation: 'Consider including the keyword in the URL slug when possible.',
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    metrics,
    findings,
  };
}
