/**
 * Structure Analysis Module
 * Analyzes content organization, heading hierarchy, and paragraph structure
 */

import * as cheerio from 'cheerio';
import type { StructureAnalysis, StructureMetrics, ContentFinding } from '../../../types/content.types.js';
import { extractWords } from './readability.js';

interface HeadingInfo {
  level: number;
  text: string;
  position: number; // word position in content
}

/**
 * Extract headings from HTML with their positions
 */
export function extractHeadings(html: string): HeadingInfo[] {
  const $ = cheerio.load(html);
  const headings: HeadingInfo[] = [];
  let wordPosition = 0;

  // Walk through content in order
  $('body *').each((_, el) => {
    const tagName = (el as any).tagName?.toLowerCase();

    if (tagName && /^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName[1]);
      const text = $(el).text().trim();

      headings.push({
        level,
        text,
        position: wordPosition,
      });
    }

    // Track word position
    if (tagName === 'p' || tagName === 'div' || tagName === 'li') {
      const text = $(el).clone().children().remove().end().text();
      wordPosition += extractWords(text).length;
    }
  });

  return headings;
}

/**
 * Count headings by level
 */
export function countHeadings($: ReturnType<typeof cheerio.load>): StructureMetrics['headingCount'] {
  return {
    h1: $('h1').length,
    h2: $('h2').length,
    h3: $('h3').length,
    h4: $('h4').length,
    h5: $('h5').length,
    h6: $('h6').length,
  };
}

/**
 * Check if heading hierarchy is valid (no skipped levels)
 */
export function validateHeadingHierarchy(headings: HeadingInfo[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (headings.length === 0) {
    return { valid: true, issues: [] };
  }

  let lastLevel = 0;

  for (const heading of headings) {
    // First heading should be H1 or H2
    if (lastLevel === 0) {
      if (heading.level > 2) {
        issues.push(`Content starts with H${heading.level} instead of H1 or H2`);
      }
    } else {
      // Check for skipped levels (going deeper)
      if (heading.level > lastLevel + 1) {
        issues.push(`H${heading.level} follows H${lastLevel} (skipped H${lastLevel + 1})`);
      }
    }

    lastLevel = heading.level;
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Extract paragraphs from HTML
 */
export function extractParagraphs(html: string): string[] {
  const $ = cheerio.load(html);
  const paragraphs: string[] = [];

  // Get main content area
  const mainContent = $('main, article, [role="main"], .content, .post-content, .entry-content').first();
  const container = mainContent.length > 0 ? mainContent : $('body');

  container.find('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0) {
      paragraphs.push(text);
    }
  });

  return paragraphs;
}

/**
 * Detect walls of text (long sections without headings)
 */
export function detectWallsOfText(
  text: string,
  headings: HeadingInfo[],
  wordCount: number
): { count: number; positions: number[] } {
  if (headings.length === 0) {
    // If no headings and content is long, the whole thing is a wall
    if (wordCount > 500) {
      return { count: 1, positions: [0] };
    }
    return { count: 0, positions: [] };
  }

  const walls: number[] = [];

  // Check content before first heading
  if (headings[0].position > 500) {
    walls.push(0);
  }

  // Check gaps between headings
  for (let i = 0; i < headings.length - 1; i++) {
    const gap = headings[i + 1].position - headings[i].position;
    if (gap > 500) {
      walls.push(headings[i].position);
    }
  }

  // Check content after last heading
  const lastHeadingPos = headings[headings.length - 1].position;
  if (wordCount - lastHeadingPos > 500) {
    walls.push(lastHeadingPos);
  }

  return { count: walls.length, positions: walls };
}

/**
 * Detect table of contents
 */
export function detectTableOfContents($: ReturnType<typeof cheerio.load>): boolean {
  // Look for common TOC patterns
  const tocSelectors = [
    '[class*="toc"]',
    '[class*="table-of-contents"]',
    '[id*="toc"]',
    '#table-of-contents',
    '.contents',
    'nav[aria-label*="contents"]',
  ];

  for (const selector of tocSelectors) {
    if ($(selector).length > 0) {
      return true;
    }
  }

  // Look for a list of links to anchors early in content
  const firstList = $('main ul, article ul, .content ul').first();
  if (firstList.length > 0) {
    const links = firstList.find('a[href^="#"]');
    if (links.length >= 3) {
      return true;
    }
  }

  return false;
}

/**
 * Count lists in content
 */
export function countLists($: ReturnType<typeof cheerio.load>): number {
  const mainContent = $('main, article, [role="main"], .content').first();
  const container = mainContent.length > 0 ? mainContent : $('body');

  // Count ul and ol, excluding navigation
  return container.find('ul, ol').not('nav ul, nav ol, header ul, header ol, footer ul, footer ol').length;
}

/**
 * Main structure analysis function
 */
export function analyzeStructure(
  html: string,
  text: string,
  wordCount: number
): StructureAnalysis {
  const $ = cheerio.load(html);
  const findings: ContentFinding[] = [];

  // Extract data
  const headings = extractHeadings(html);
  const headingCount = countHeadings($);
  const paragraphs = extractParagraphs(html);
  const hierarchyResult = validateHeadingHierarchy(headings);
  const wallsOfText = detectWallsOfText(text, headings, wordCount);
  const hasTableOfContents = detectTableOfContents($);
  const listCount = countLists($);

  // Calculate paragraph metrics
  const paragraphLengths = paragraphs.map(p => extractWords(p).length);
  const avgParagraphLength = paragraphLengths.length > 0
    ? Math.round(paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length)
    : 0;
  const maxParagraphLength = paragraphLengths.length > 0
    ? Math.max(...paragraphLengths)
    : 0;

  const metrics: StructureMetrics = {
    headingCount,
    headingHierarchyValid: hierarchyResult.valid,
    avgParagraphLength,
    maxParagraphLength,
    paragraphCount: paragraphs.length,
    listCount,
    hasTableOfContents,
    wallsOfText: wallsOfText.count,
  };

  // Calculate score
  let score = 100;

  // H1 checks (up to -25)
  if (headingCount.h1 === 0) {
    score -= 25;
    findings.push({
      ruleId: 'missing-h1',
      ruleName: 'Missing H1 Heading',
      category: 'content-structure',
      severity: 'serious',
      message: 'Page is missing an H1 heading',
      description: 'Every page should have exactly one H1 heading that describes the main topic.',
      recommendation: 'Add a clear, descriptive H1 heading at the beginning of your content.',
    });
  } else if (headingCount.h1 > 1) {
    score -= 15;
    findings.push({
      ruleId: 'multiple-h1',
      ruleName: 'Multiple H1 Headings',
      category: 'content-structure',
      severity: 'moderate',
      message: `Page has ${headingCount.h1} H1 headings instead of one`,
      description: 'Having multiple H1 tags can confuse search engines and screen readers.',
      recommendation: 'Use only one H1 for the main title. Use H2-H6 for subheadings.',
    });
  } else {
    score += 5; // Bonus for correct H1
  }

  // Heading hierarchy check (up to -15)
  if (!hierarchyResult.valid) {
    score -= 10;
    findings.push({
      ruleId: 'heading-hierarchy-broken',
      ruleName: 'Broken Heading Hierarchy',
      category: 'content-structure',
      severity: 'moderate',
      message: 'Heading hierarchy has skipped levels',
      description: `Issues found: ${hierarchyResult.issues.join('; ')}`,
      recommendation: 'Ensure headings follow a logical hierarchy (H1 → H2 → H3) without skipping levels.',
    });
  } else if (headings.length > 0) {
    score += 5; // Bonus for valid hierarchy
  }

  // H2 presence for sectioning
  if (wordCount > 300 && headingCount.h2 === 0) {
    score -= 10;
    findings.push({
      ruleId: 'no-subheadings',
      ruleName: 'No Subheadings',
      category: 'content-structure',
      severity: 'moderate',
      message: 'Content has no H2 subheadings to organize sections',
      description: 'Long content without subheadings is harder to scan and navigate.',
      recommendation: 'Add H2 headings to divide content into logical sections.',
    });
  } else if (headingCount.h2 >= 2) {
    score += 5; // Bonus for good sectioning
  }

  // Walls of text (-10 each, max -30)
  if (wallsOfText.count > 0) {
    const deduction = Math.min(30, wallsOfText.count * 10);
    score -= deduction;
    findings.push({
      ruleId: 'wall-of-text',
      ruleName: 'Wall of Text Detected',
      category: 'content-structure',
      severity: 'serious',
      message: `Found ${wallsOfText.count} section(s) with 500+ words without a subheading`,
      description: 'Large blocks of text without visual breaks reduce readability and user engagement.',
      recommendation: 'Break up long sections with H2 or H3 subheadings every 300-400 words.',
    });
  }

  // Paragraph length checks
  const longParagraphs = paragraphLengths.filter(len => len > 100);
  if (longParagraphs.length > 0) {
    const deduction = Math.min(15, longParagraphs.length * 3);
    score -= deduction;
    findings.push({
      ruleId: 'poor-paragraph-structure',
      ruleName: 'Poor Paragraph Structure',
      category: 'content-structure',
      severity: 'moderate',
      message: `Found ${longParagraphs.length} paragraph(s) with more than 100 words`,
      description: 'Long paragraphs are harder to read on screen.',
      recommendation: 'Break long paragraphs into smaller chunks of 40-80 words each.',
    });
  } else if (avgParagraphLength >= 40 && avgParagraphLength <= 80) {
    score += 5; // Bonus for good paragraph length
  }

  // List usage
  if (listCount === 0 && wordCount > 500) {
    score -= 5;
    findings.push({
      ruleId: 'no-lists',
      ruleName: 'No List Elements',
      category: 'content-structure',
      severity: 'minor',
      message: 'Content has no bulleted or numbered lists',
      description: 'Lists improve scannability and help readers quickly find key information.',
      recommendation: 'Consider using lists for steps, features, or key points.',
    });
  } else if (listCount >= 1 && listCount <= 5) {
    score += 5; // Bonus for appropriate list usage
  }

  // TOC bonus for long content
  if (wordCount > 1500 && hasTableOfContents) {
    score += 5;
  } else if (wordCount > 2000 && !hasTableOfContents) {
    findings.push({
      ruleId: 'no-toc',
      ruleName: 'No Table of Contents',
      category: 'content-structure',
      severity: 'info',
      message: 'Long content would benefit from a table of contents',
      description: 'A table of contents helps readers navigate long articles.',
      recommendation: 'Add a table of contents with links to major sections.',
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    metrics,
    findings,
  };
}
