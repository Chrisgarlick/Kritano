/**
 * AEO (Answer Engine Optimization) — AI Citability Audit
 * Detects how likely an AI model is to cite a page as a primary source,
 * based on three pillars: Nugget Extraction, Factual Density, and Source Authority.
 * No API calls — runs via regex/cheerio pattern matching in <10ms per page.
 */

import * as cheerio from 'cheerio';
import type { AeoAnalysis, AeoMetrics, AeoNugget, ContentFinding } from '../../../types/content.types.js';
import {
  DATA_POINT_REGEX,
  LARGE_NUMBER_REGEX,
  MILLION_BILLION_REGEX,
  CITATION_PHRASES,
  AUTHORITATIVE_DOMAINS,
} from './eeat.js';

// =============================================
// Nugget Extraction patterns
// =============================================
const DEFINITION_START = /^(\w[\w\s-]{1,40})\s+(is a|is an|refers to|means)\b/i;
const QUESTION_HEADING = /^(What|How|Why|When|Where|Who|Which|Can|Does|Is|Are|Should|Do)\b.*\?$/i;

const SUMMARY_PHRASES = [
  /\bkey takeaway\b/i,
  /\bin summary\b/i,
  /\btl;?dr\b/i,
  /\bbottom line\b/i,
  /\bin short\b/i,
];

// =============================================
// Factual Density patterns
// =============================================
// Named entities: capitalized multi-word proper nouns
const NAMED_ENTITY_REGEX = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
// Date patterns
const YEAR_REGEX = /\b(19|20)\d{2}\b/g;
const WRITTEN_DATE_REGEX = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi;

/**
 * Analyze AEO signals in page content
 */
export function analyzeAeo(
  html: string,
  text: string,
  sentences: string[],
  words: string[]
): AeoAnalysis {
  const $ = cheerio.load(html);
  const findings: ContentFinding[] = [];
  const wordCount = words.length;
  const nuggets: AeoNugget[] = [];

  // =============================================
  // PILLAR A: NUGGET EXTRACTION (40% weight)
  // =============================================

  // --- Definition blocks: paragraphs 30-70 words matching definition pattern or following question heading ---
  let definitionBlockCount = 0;
  const questionHeadingTexts = new Set<string>();
  $('h2, h3').each((_, el) => {
    const headingText = $(el).text().trim();
    if (QUESTION_HEADING.test(headingText)) {
      questionHeadingTexts.add(headingText);
    }
  });

  $('p').each((_, el) => {
    const pText = $(el).text().trim();
    const pWords = pText.split(/\s+/).filter(w => w.length > 0);
    if (pWords.length < 30 || pWords.length > 70) return;

    const isDefinition = DEFINITION_START.test(pText);

    // Check if preceded by a question heading
    let followsQuestion = false;
    const prevHeading = $(el).prevAll('h2, h3').first();
    if (prevHeading.length > 0 && questionHeadingTexts.has(prevHeading.text().trim())) {
      followsQuestion = true;
    }

    if (isDefinition || followsQuestion) {
      definitionBlockCount++;
      if (nuggets.length < 10) {
        nuggets.push({
          text: pText.substring(0, 300),
          type: 'definition',
          wordCount: pWords.length,
        });
      }
    }
  });

  // --- Summary statements ---
  let summaryStatementCount = 0;
  for (const sentence of sentences) {
    for (const pattern of SUMMARY_PHRASES) {
      if (pattern.test(sentence)) {
        summaryStatementCount++;
        if (nuggets.length < 10) {
          nuggets.push({
            text: sentence.substring(0, 300),
            type: 'summary',
            wordCount: sentence.split(/\s+/).length,
          });
        }
        break;
      }
    }
  }

  // --- FAQ sections: question headings OR FAQPage schema ---
  let faqSectionCount = 0;
  let hasFaqSchema = false;

  // Count question headings
  $('h2, h3').each((_, el) => {
    const headingText = $(el).text().trim();
    if (QUESTION_HEADING.test(headingText)) {
      faqSectionCount++;
      // Extract the answer (next paragraph after the question heading)
      const nextP = $(el).next('p');
      if (nextP.length > 0 && nuggets.length < 10) {
        nuggets.push({
          text: nextP.text().trim().substring(0, 300),
          type: 'faq-answer',
          wordCount: nextP.text().trim().split(/\s+/).length,
        });
      }
    }
  });

  // Check for FAQPage schema
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const types = Array.isArray(data) ? data : [data];
      for (const item of types) {
        if (item['@type'] === 'FAQPage') {
          hasFaqSchema = true;
          faqSectionCount = Math.max(faqSectionCount, 1);
        }
      }
    } catch {
      // ignore parse errors
    }
  });

  // --- Data tables ---
  let dataTableCount = 0;
  $('table').each((_, el) => {
    const hasHeaders = $(el).find('th').length > 0;
    const rowCount = $(el).find('tr').length;
    if (hasHeaders && rowCount >= 3) { // th row + 2+ data rows
      dataTableCount++;
      if (nuggets.length < 10) {
        // Extract first row as representative nugget
        const firstRow = $(el).find('tr').first().text().trim();
        nuggets.push({
          text: firstRow.substring(0, 300),
          type: 'data-table',
          wordCount: firstRow.split(/\s+/).length,
        });
      }
    }
  });

  // --- Extractable lists ---
  let extractableListCount = 0;
  $('ul, ol').each((_, el) => {
    const liCount = $(el).find('> li').length;
    if (liCount >= 3) {
      extractableListCount++;
      if (nuggets.length < 10) {
        const listItems = $(el).find('> li').slice(0, 3).map((__, li) => $(li).text().trim()).get();
        nuggets.push({
          text: listItems.join('; ').substring(0, 300),
          type: 'list',
          wordCount: listItems.join(' ').split(/\s+/).length,
        });
      }
    }
  });

  // --- Concise answer paragraphs: 15-40 words with a factual claim ---
  let conciseAnswerCount = 0;
  $('p').each((_, el) => {
    const pText = $(el).text().trim();
    const pWords = pText.split(/\s+/).filter(w => w.length > 0);
    if (pWords.length < 15 || pWords.length > 40) return;

    // Must contain a factual claim (data point or named entity)
    const hasDataPoint = DATA_POINT_REGEX.test(pText) ||
      LARGE_NUMBER_REGEX.test(pText) ||
      MILLION_BILLION_REGEX.test(pText);
    // Reset lastIndex for global regexes
    DATA_POINT_REGEX.lastIndex = 0;
    LARGE_NUMBER_REGEX.lastIndex = 0;
    MILLION_BILLION_REGEX.lastIndex = 0;

    const hasNamedEntity = NAMED_ENTITY_REGEX.test(pText);
    NAMED_ENTITY_REGEX.lastIndex = 0;

    if (hasDataPoint || hasNamedEntity) {
      conciseAnswerCount++;
      if (nuggets.length < 10) {
        nuggets.push({
          text: pText.substring(0, 300),
          type: 'concise-answer',
          wordCount: pWords.length,
        });
      }
    }
  });

  // --- Content front-loading: is substantive content in the first third of the page? ---
  const bodyText = $('body').text().trim();
  const bodyWords = bodyText.split(/\s+/).filter(w => w.length > 0);
  const totalBodyWords = bodyWords.length;
  const firstThirdLength = Math.floor(totalBodyWords / 3);
  const wordsInFirstThird = bodyWords.slice(0, firstThirdLength).length;
  // Ratio of how front-loaded content is (first third should have ~33% of words by definition,
  // but we check if the first third has at least 100 substantive words)
  const contentFrontloaded = wordsInFirstThird >= 100;
  const contentFrontloadingRatio = totalBodyWords > 0 ? wordsInFirstThird / totalBodyWords : 0;
  const contentFrontloadingScore = contentFrontloaded ? 10 : 5;

  // Calculate Nugget Extraction score
  const nuggetScore = Math.min(100,
    Math.min(25, definitionBlockCount * 12.5) +
    Math.min(20, summaryStatementCount * 10) +
    Math.min(20, faqSectionCount * 5) +
    Math.min(15, dataTableCount * 7.5) +
    Math.min(10, extractableListCount * 3.3) +
    Math.min(10, conciseAnswerCount * 2.5) +
    contentFrontloadingScore
  );

  // =============================================
  // PILLAR B: FACTUAL DENSITY (30% weight)
  // =============================================

  // Hard numbers (reuse from eeat)
  const dataPointMatches = [
    ...(text.match(DATA_POINT_REGEX) || []),
    ...(text.match(LARGE_NUMBER_REGEX) || []),
    ...(text.match(MILLION_BILLION_REGEX) || []),
  ];
  // Reset lastIndex for global regexes
  DATA_POINT_REGEX.lastIndex = 0;
  LARGE_NUMBER_REGEX.lastIndex = 0;
  MILLION_BILLION_REGEX.lastIndex = 0;

  const hardNumberCount = dataPointMatches.length;
  const hardNumberDensity = wordCount > 0 ? (hardNumberCount / (wordCount / 100)) : 0;
  const hardNumberScore = Math.min(35, hardNumberDensity * 7);

  // Named entities
  const namedEntityMatches = text.match(NAMED_ENTITY_REGEX) || [];
  NAMED_ENTITY_REGEX.lastIndex = 0;
  const namedEntityCount = namedEntityMatches.length;
  const namedEntityScore = Math.min(25, namedEntityCount * 2.5);

  // Verifiable claims: sentences with BOTH a data point AND a citation phrase
  let verifiableClaimCount = 0;
  for (const sentence of sentences) {
    const hasData = DATA_POINT_REGEX.test(sentence) ||
      LARGE_NUMBER_REGEX.test(sentence) ||
      MILLION_BILLION_REGEX.test(sentence);
    DATA_POINT_REGEX.lastIndex = 0;
    LARGE_NUMBER_REGEX.lastIndex = 0;
    MILLION_BILLION_REGEX.lastIndex = 0;

    let hasCitation = false;
    for (const pattern of CITATION_PHRASES) {
      if (pattern.test(sentence)) {
        hasCitation = true;
        break;
      }
    }
    if (hasData && hasCitation) {
      verifiableClaimCount++;
    }
  }
  const verifiableClaimScore = Math.min(25, verifiableClaimCount * 8.3);

  // Specific dates
  const yearMatches = text.match(YEAR_REGEX) || [];
  YEAR_REGEX.lastIndex = 0;
  const writtenDateMatches = text.match(WRITTEN_DATE_REGEX) || [];
  WRITTEN_DATE_REGEX.lastIndex = 0;
  const specificDateCount = yearMatches.length + writtenDateMatches.length;
  const specificDateScore = Math.min(15, specificDateCount * 3);

  const factualDensityScore = Math.min(100,
    hardNumberScore + namedEntityScore + verifiableClaimScore + specificDateScore
  );

  // =============================================
  // PILLAR C: SOURCE AUTHORITY / SCHEMA (30% weight)
  // =============================================

  // Author sameAs links (JSON-LD Person with sameAs containing linkedin/wikipedia/twitter)
  let hasAuthorSameAs = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const author = item.author || item.creator;
        if (!author) continue;
        const authors = Array.isArray(author) ? author : [author];
        for (const a of authors) {
          const sameAs = a.sameAs;
          if (!sameAs) continue;
          const links = Array.isArray(sameAs) ? sameAs : [sameAs];
          for (const link of links) {
            if (/linkedin\.com|wikipedia\.org|twitter\.com|x\.com/i.test(link)) {
              hasAuthorSameAs = true;
              return false; // break cheerio each
            }
          }
        }
      }
    } catch {
      // ignore
    }
  });

  // HowTo schema
  let hasHowToSchema = false;
  // ClaimReview schema
  let hasClaimReviewSchema = false;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'HowTo') hasHowToSchema = true;
        if (item['@type'] === 'ClaimReview') hasClaimReviewSchema = true;
      }
    } catch {
      // ignore
    }
  });

  // Authoritative outbound links (reuse AUTHORITATIVE_DOMAINS)
  let authoritativeLinkCount = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const domain of AUTHORITATIVE_DOMAINS) {
      if (href.includes(domain)) {
        authoritativeLinkCount++;
        break;
      }
    }
  });

  // Semantic citation markup: <cite> tags, <blockquote cite="...">
  const citeTagCount = $('cite').length;
  const blockquoteCiteCount = $('blockquote[cite]').length;
  const semanticCitationCount = citeTagCount + blockquoteCiteCount;

  const sourceAuthorityScore = Math.min(100,
    (hasAuthorSameAs ? 25 : 0) +
    (hasFaqSchema ? 20 : 0) +
    (hasHowToSchema ? 15 : 0) +
    (hasClaimReviewSchema ? 15 : 0) +
    Math.min(15, authoritativeLinkCount * 3) +
    Math.min(10, semanticCitationCount * 5)
  );

  // =============================================
  // OVERALL SCORE
  // =============================================
  const overallScore = Math.round(
    nuggetScore * 0.40 +
    factualDensityScore * 0.30 +
    sourceAuthorityScore * 0.30
  );
  const score = Math.max(0, Math.min(100, overallScore));

  // Tier classification
  let tier: AeoMetrics['tier'];
  if (score >= 76) {
    tier = 'primary-source';
  } else if (score >= 41) {
    tier = 'general-reference';
  } else {
    tier = 'ignored';
  }

  // =============================================
  // FINDINGS
  // =============================================

  if (definitionBlockCount === 0 && wordCount >= 300) {
    findings.push({
      ruleId: 'aeo-no-definition-blocks',
      ruleName: 'No Definition Blocks',
      category: 'content-aeo',
      severity: 'serious',
      message: 'No extractable definition blocks found on the page',
      description: 'AI models look for concise definitions (30-70 words) that directly answer "what is X" questions.',
      recommendation: 'Add clear definition paragraphs that start with "X is a..." or "X refers to..." to make content easily citable by AI.',
    });
  }

  if (summaryStatementCount === 0 && wordCount >= 300) {
    findings.push({
      ruleId: 'aeo-no-summary-statement',
      ruleName: 'No Summary Statements',
      category: 'content-aeo',
      severity: 'moderate',
      message: 'No summary or takeaway statements found',
      description: 'AI models prefer content with clear summaries they can extract and cite.',
      recommendation: 'Add "Key takeaway", "In summary", or "TL;DR" sections to make main points easily extractable.',
    });
  }

  if (faqSectionCount === 0) {
    findings.push({
      ruleId: 'aeo-no-faq-section',
      ruleName: 'No FAQ Section',
      category: 'content-aeo',
      severity: 'moderate',
      message: 'No FAQ schema or question-based headings found',
      description: 'FAQ sections directly answer questions that AI models use as citation targets.',
      recommendation: 'Add question-based H2/H3 headings (e.g., "What is...?", "How does...?") or implement FAQPage schema.',
    });
  }

  if (dataTableCount === 0 && extractableListCount === 0 && wordCount >= 500) {
    findings.push({
      ruleId: 'aeo-no-structured-content',
      ruleName: 'No Structured Content',
      category: 'content-aeo',
      severity: 'minor',
      message: 'No data tables or extractable lists found',
      description: 'Structured content (tables, lists) is easier for AI models to extract and reference.',
      recommendation: 'Add comparison tables, data tables, or organized lists to present information in an AI-friendly format.',
    });
  }

  if (factualDensityScore < 25) {
    findings.push({
      ruleId: 'aeo-low-factual-density',
      ruleName: 'Low Factual Density',
      category: 'content-aeo',
      severity: 'serious',
      message: 'Content has low factual density — few numbers, entities, or verifiable claims',
      description: 'AI models prioritize content rich in specific data points, named entities, and verifiable claims.',
      recommendation: 'Add specific statistics, research data, named sources, and date-stamped information.',
    });
  }

  if (verifiableClaimCount === 0 && wordCount >= 300) {
    findings.push({
      ruleId: 'aeo-no-verifiable-claims',
      ruleName: 'No Verifiable Claims',
      category: 'content-aeo',
      severity: 'moderate',
      message: 'No sentences contain both a data point and a citation',
      description: 'Verifiable claims (data + source attribution) are the highest-quality signals for AI citability.',
      recommendation: 'Combine data points with source attributions, e.g., "According to [source], 85% of users..."',
    });
  }

  if (!hasAuthorSameAs) {
    findings.push({
      ruleId: 'aeo-no-author-sameas',
      ruleName: 'No Author sameAs Links',
      category: 'content-aeo',
      severity: 'moderate',
      message: 'No author sameAs links to LinkedIn, Wikipedia, or Twitter/X found in structured data',
      description: 'Author sameAs links help AI models verify author identity and expertise.',
      recommendation: 'Add sameAs property to your JSON-LD Person schema linking to LinkedIn, Wikipedia, or Twitter profiles.',
    });
  }

  if (!hasClaimReviewSchema && !hasFaqSchema && !hasHowToSchema) {
    findings.push({
      ruleId: 'aeo-no-citation-schema',
      ruleName: 'No Citation-Friendly Schema',
      category: 'content-aeo',
      severity: 'minor',
      message: 'No ClaimReview, FAQPage, or HowTo schema found',
      description: 'These schema types signal to AI models that content is structured for citation.',
      recommendation: 'Implement FAQPage, HowTo, or ClaimReview schema to boost AI citability.',
    });
  }

  if (!contentFrontloaded && wordCount >= 300) {
    findings.push({
      ruleId: 'aeo-content-not-frontloaded',
      ruleName: 'Content Not Front-Loaded',
      category: 'content-aeo',
      severity: 'moderate',
      message: 'Key content is not front-loaded — the first third of the page has fewer than 100 substantive words',
      description: 'AI models often weight early content more heavily and may truncate long pages. Pages with substantive content near the top are more likely to be cited.',
      recommendation: 'Move your core message, key definitions, and primary answers to the top of the page. Reduce navigation boilerplate and filler before the main content.',
    });
  }

  if (semanticCitationCount === 0 && wordCount >= 500) {
    findings.push({
      ruleId: 'aeo-no-semantic-citations',
      ruleName: 'No Semantic Citation Markup',
      category: 'content-aeo',
      severity: 'info',
      message: 'No <cite> tags or <blockquote cite="..."> elements found',
      description: 'Semantic citation markup helps AI models identify and attribute quoted sources.',
      recommendation: 'Use <cite> tags for source names and <blockquote cite="URL"> for quoted content.',
    });
  }

  if (tier === 'ignored') {
    findings.push({
      ruleId: 'aeo-ignored-tier',
      ruleName: 'AI Ignored — Low Citability',
      category: 'content-aeo',
      severity: 'serious',
      message: `AEO score is ${score}/100 — AI models are unlikely to cite this page as a source`,
      description: 'Content lacks the structured, fact-dense, and authoritative signals that AI models look for when selecting citation sources.',
      recommendation: 'Add definitions, summaries, FAQ sections, data points, and author authority signals to improve AI citability.',
    });
  }

  const metrics: AeoMetrics = {
    nuggetScore: Math.round(nuggetScore),
    factualDensityScore: Math.round(factualDensityScore),
    sourceAuthorityScore: Math.round(sourceAuthorityScore),
    definitionBlockCount,
    summaryStatementCount,
    faqSectionCount,
    dataTableCount,
    extractableListCount,
    conciseAnswerCount,
    hardNumberCount,
    namedEntityCount,
    verifiableClaimCount,
    specificDateCount,
    hasAuthorSameAs,
    hasFaqSchema,
    hasHowToSchema,
    hasClaimReviewSchema,
    authoritativeLinkCount,
    semanticCitationCount,
    contentFrontloaded,
    contentFrontloadingRatio: Math.round(contentFrontloadingRatio * 100) / 100,
    tier,
    nuggets: nuggets.slice(0, 10),
  };

  return { score, metrics, findings };
}
