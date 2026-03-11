// @ts-nocheck

/** E-E-A-T Signal Detection Module
 * Detects Experience, Expertise, Authoritativeness, and Trustworthiness signals
 * via regex/cheerio pattern matching — no API calls, runs in <10ms per page.
 */

import * as cheerio from 'cheerio';
import type { EeatAnalysis, EeatMetrics, EeatEvidence, ContentFinding } from '../../../types/content.types.js';

// =============================================
// Common words set (words that look "technical" by syllable count but aren't)
// =============================================
const COMMON_WORDS = new Set([
  'another', 'everything', 'everyone', 'different', 'important', 'beautiful',
  'interesting', 'understand', 'remember', 'together', 'however', 'absolutely',
  'actually', 'probably', 'generally', 'usually', 'especially', 'immediately',
  'certainly', 'obviously', 'basically', 'seriously', 'definitely', 'literally',
  'unfortunately', 'apparently', 'naturally', 'completely', 'essentially',
  'eventually', 'extremely', 'fortunately', 'frequently', 'hopefully',
  'increasingly', 'originally', 'particularly', 'potentially', 'previously',
  'primarily', 'relatively', 'significantly', 'similarly', 'specifically',
  'suddenly', 'traditionally', 'typically', 'ultimately', 'virtually',
  'approximately', 'automatically', 'communication', 'community', 'company',
  'computer', 'different', 'education', 'environment', 'experience',
  'government', 'information', 'management', 'opportunity', 'organization',
  'performance', 'population', 'production', 'professional', 'quality',
  'relationship', 'technology', 'television', 'university', 'everybody',
  'everything', 'whatever', 'somebody', 'anywhere', 'everywhere',
]);

// =============================================
// Experience detection patterns
// =============================================
const FIRST_PERSON_REGEX = /\b(I|me|my|our|we)\b/gi;

const EXPERIENCE_PHRASES = [
  /\bin my (testing|experience|opinion|view|practice)\b/i,
  /\bi (noticed|found|discovered|observed|realized|learned) that\b/i,
  /\bhaving (used|tried|tested|worked with|experienced)\b/i,
  /\bfrom my experience\b/i,
  /\bin our (testing|experience|practice)\b/i,
  /\bwe (noticed|found|discovered|observed|tested|tried)\b/i,
  /\bafter (using|trying|testing|working with)\b/i,
  /\bwhen (I|we) (first|initially|started)\b/i,
  /\bpersonally,? (I|we)\b/i,
  /\bI['']ve (been|spent|worked)\b/i,
  /\bover the (years|months|weeks)\b/i,
  /\bfirsthand\b/i,
  /\bhands-on\b/i,
];

// =============================================
// Expertise detection patterns
// =============================================
export const DATA_POINT_REGEX = /\b\d+(\.\d+)?\s*(%|kg|lbs?|oz|g|mg|ml|L|°[FC]|mph|km\/h|GB|MB|TB|px|em|rem|ms|Hz|kHz|dB)\b/gi;
export const LARGE_NUMBER_REGEX = /\b\d{1,3}(,\d{3})+\b/g;
export const MILLION_BILLION_REGEX = /\b\d+(\.\d+)?\s*(million|billion|trillion)\b/gi;

export const CITATION_PHRASES = [
  /\baccording to\b/i,
  /\bresearch (shows?|suggests?|indicates?|finds?|reveals?)\b/i,
  /\bstudies? (shows?|suggests?|indicates?|finds?|reveals?)\b/i,
  /\bdata (shows?|suggests?|indicates?)\b/i,
  /\bevidence (shows?|suggests?|indicates?)\b/i,
  /\ba (\d{4} )?study (by|from|published)\b/i,
  /\bpublished (in|by)\b/i,
  /\bpeer[- ]reviewed\b/i,
  /\bclinical (trial|study|research)\b/i,
  /\bmeta[- ]analysis\b/i,
];

// =============================================
// Authoritativeness detection
// =============================================
const AUTHOR_BIO_SELECTORS = [
  '.author-bio',
  '.about-author',
  '.author-info',
  '.author-description',
  '.bio',
  '[class*="author"]',
  '[rel="author"]',
  '.byline',
  '[itemprop="author"]',
];

const CREDENTIAL_PATTERNS = [
  /\bPh\.?D\.?\b/,
  /\bM\.?D\.?\b/,
  /\bMBA\b/,
  /\bM\.?S\.?\b/,
  /\bB\.?S\.?\b/,
  /\bJ\.?D\.?\b/,
  /\bCPA\b/,
  /\bCFA\b/,
  /\b(certified|licensed|accredited|registered)\b/i,
  /\b\d+\+?\s*years?\s*(of\s+)?(experience|practicing)\b/i,
  /\bboard[- ]certified\b/i,
  /\bfellow (of|at)\b/i,
];

// =============================================
// Trustworthiness detection
// =============================================
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
const ADDRESS_REGEX = /\b\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Place|Pl|Suite|Ste)\.?\b/i;

export const AUTHORITATIVE_DOMAINS = ['.gov', '.edu', '.org'];

/**
 * Count syllables in a word (rough heuristic)
 */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return 1;

  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Silent e
  if (w.endsWith('e') && count > 1) count--;
  // -le at end
  if (w.endsWith('le') && w.length > 2 && !vowels.includes(w[w.length - 3])) count++;

  return Math.max(1, count);
}

/**
 * Analyze E-E-A-T signals in page content
 */
export function analyzeEeat(
  html: string,
  text: string,
  sentences: string[],
  words: string[]
): EeatAnalysis {
  const $ = cheerio.load(html);
  const findings: ContentFinding[] = [];
  const evidence: EeatEvidence[] = [];
  const wordCount = words.length;

  // =============================================
  // EXPERIENCE (20% weight)
  // =============================================
  const firstPersonMatches = text.match(FIRST_PERSON_REGEX) || [];
  const firstPersonCount = firstPersonMatches.length;

  let experiencePhraseCount = 0;
  const experiencePhraseExamples: string[] = [];
  for (const pattern of EXPERIENCE_PHRASES) {
    const matches = text.match(pattern);
    if (matches) {
      experiencePhraseCount += matches.length;
      for (const m of matches) {
        if (experiencePhraseExamples.length < 5) {
          // Get surrounding context (find the sentence containing this match)
          const idx = text.indexOf(m);
          const start = Math.max(0, text.lastIndexOf('.', idx) + 1);
          const end = text.indexOf('.', idx + m.length);
          const sentence = text.substring(start, end > 0 ? end + 1 : start + 120).trim();
          experiencePhraseExamples.push(sentence.substring(0, 150));
        }
      }
    }
  }

  if (experiencePhraseExamples.length > 0) {
    for (const ex of experiencePhraseExamples) {
      evidence.push({ pillar: 'experience', type: 'experience-phrase', label: 'Experience phrase', text: ex });
    }
  }
  if (firstPersonCount > 0) {
    evidence.push({ pillar: 'experience', type: 'first-person-count', label: `${firstPersonCount} first-person references found` });
  }

  const experienceScore = Math.min(100, firstPersonCount * 3 + experiencePhraseCount * 15);

  // =============================================
  // EXPERTISE (25% weight)
  // =============================================

  // Technical terms: 3+ syllable words not in common set
  let technicalTermCount = 0;
  const technicalTermExamples = new Set<string>();
  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length >= 4 && countSyllables(clean) >= 3 && !COMMON_WORDS.has(clean)) {
      technicalTermCount++;
      if (technicalTermExamples.size < 8) technicalTermExamples.add(clean);
    }
  }
  const technicalTermDensity = wordCount > 0 ? (technicalTermCount / wordCount) * 100 : 0;

  if (technicalTermCount > 0) {
    evidence.push({ pillar: 'expertise', type: 'technical-terms', label: `${technicalTermCount} technical terms`, text: [...technicalTermExamples].join(', ') });
  }

  // Data points
  const dataPointMatches = [
    ...(text.match(DATA_POINT_REGEX) || []),
    ...(text.match(LARGE_NUMBER_REGEX) || []),
    ...(text.match(MILLION_BILLION_REGEX) || []),
  ];
  const dataPointCount = dataPointMatches.length;

  if (dataPointCount > 0) {
    const examples = dataPointMatches.slice(0, 6).join(', ');
    evidence.push({ pillar: 'expertise', type: 'data-points', label: `${dataPointCount} data points`, text: examples });
  }

  // Citation phrases
  let citationPhraseCount = 0;
  const citationExamples: string[] = [];
  for (const pattern of CITATION_PHRASES) {
    const matches = text.match(pattern);
    if (matches) {
      citationPhraseCount += matches.length;
      for (const m of matches) {
        if (citationExamples.length < 3) citationExamples.push(m);
      }
    }
  }

  if (citationPhraseCount > 0) {
    evidence.push({ pillar: 'expertise', type: 'citation-phrases', label: `${citationPhraseCount} citation phrases`, text: citationExamples.join(', ') });
  }

  const expertiseScore = Math.min(100,
    technicalTermDensity * 40 + dataPointCount * 5 + citationPhraseCount * 10
  );

  // =============================================
  // AUTHORITATIVENESS (30% weight)
  // =============================================
  let authoritativenessScore = 0;

  // Author bio detection
  let hasAuthorBio = false;
  let authorBioSnippet = '';
  for (const selector of AUTHOR_BIO_SELECTORS) {
    const el = $(selector).first();
    if (el.length > 0) {
      hasAuthorBio = true;
      authorBioSnippet = el.text().trim().substring(0, 150);
      break;
    }
  }

  // Author name from meta or structured data
  let hasAuthorName = false;
  let authorNameText = '';
  const metaAuthor = $('meta[name="author"]').attr('content');
  if (metaAuthor && metaAuthor.trim().length > 0) {
    hasAuthorName = true;
    authorNameText = metaAuthor.trim();
  }
  // Check JSON-LD for author
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const author = data.author || data.creator;
      if (author) {
        hasAuthorName = true;
        const name = typeof author === 'string' ? author : (author.name || '');
        if (name && !authorNameText) authorNameText = name;
      }
    } catch {
      // ignore parse errors
    }
  });

  // Credentials detection
  let hasAuthorCredentials = false;
  let credentialMatch = '';
  // Check in author bio area or full page
  const authorBioText = AUTHOR_BIO_SELECTORS
    .map(sel => $(sel).text())
    .join(' ');
  const textToSearchCreds = authorBioText || text;
  for (const pattern of CREDENTIAL_PATTERNS) {
    const match = textToSearchCreds.match(pattern);
    if (match) {
      hasAuthorCredentials = true;
      credentialMatch = match[0];
      break;
    }
  }

  // LinkedIn link
  const hasLinkedIn = $('a[href*="linkedin.com"]').length > 0;

  if (hasAuthorBio) {
    authoritativenessScore += 30;
    evidence.push({ pillar: 'authority', type: 'author-bio', label: 'Author bio found', text: authorBioSnippet || undefined });
  }
  if (hasAuthorCredentials) {
    authoritativenessScore += 25;
    evidence.push({ pillar: 'authority', type: 'credentials', label: 'Credentials detected', text: credentialMatch });
  }
  if (hasAuthorName) {
    authoritativenessScore += 20;
    evidence.push({ pillar: 'authority', type: 'author-name', label: 'Author name', text: authorNameText });
  }
  if (hasLinkedIn) {
    authoritativenessScore += 15;
    evidence.push({ pillar: 'authority', type: 'linkedin', label: 'LinkedIn profile linked' });
  }

  authoritativenessScore = Math.min(100, authoritativenessScore);

  // =============================================
  // TRUSTWORTHINESS (25% weight)
  // =============================================
  let trustworthinessScore = 0;

  // Contact info
  const hasPhone = PHONE_REGEX.test(text) || PHONE_REGEX.test(html);
  const hasAddress = ADDRESS_REGEX.test(text) || ADDRESS_REGEX.test(html);
  const hasContactInfo = hasPhone || hasAddress;
  if (hasContactInfo) {
    trustworthinessScore += 20;
    evidence.push({ pillar: 'trust', type: 'contact-info', label: hasPhone && hasAddress ? 'Phone and address found' : hasPhone ? 'Phone number found' : 'Physical address found' });
  }

  // Outbound authoritative links
  let authoritativeLinkCount = 0;
  const authLinkExamples: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const domain of AUTHORITATIVE_DOMAINS) {
      if (href.includes(domain)) {
        authoritativeLinkCount++;
        if (authLinkExamples.length < 3) authLinkExamples.push(href.substring(0, 80));
        break;
      }
    }
  });
  // Cap contribution at 25
  trustworthinessScore += Math.min(25, authoritativeLinkCount * 5);

  if (authoritativeLinkCount > 0) {
    evidence.push({ pillar: 'trust', type: 'authoritative-links', label: `${authoritativeLinkCount} links to .gov/.edu/.org`, text: authLinkExamples.join(', ') });
  }

  // Privacy policy link
  let hasPrivacyPolicy = false;
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const linkText = $(el).text() || '';
    if (/privacy/i.test(href) || /privacy\s*policy/i.test(linkText)) {
      hasPrivacyPolicy = true;
      return false; // break
    }
  });
  if (hasPrivacyPolicy) {
    trustworthinessScore += 15;
    evidence.push({ pillar: 'trust', type: 'privacy-policy', label: 'Privacy policy linked' });
  }

  // Terms of service link
  let hasTermsOfService = false;
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const linkText = $(el).text() || '';
    if (/terms/i.test(href) || /terms\s*(of\s*(service|use)|&\s*conditions)/i.test(linkText)) {
      hasTermsOfService = true;
      return false; // break
    }
  });
  if (hasTermsOfService) {
    trustworthinessScore += 15;
    evidence.push({ pillar: 'trust', type: 'terms-of-service', label: 'Terms of service linked' });
  }

  trustworthinessScore = Math.min(100, trustworthinessScore);

  // =============================================
  // OVERALL SCORE
  // =============================================
  const overallScore = Math.round(
    experienceScore * 0.20 +
    expertiseScore * 0.25 +
    authoritativenessScore * 0.30 +
    trustworthinessScore * 0.25
  );
  const score = Math.max(0, Math.min(100, overallScore));

  // Tier classification
  let tier: EeatMetrics['tier'];
  if (score >= 75) {
    tier = 'expert-verified';
  } else if (score >= 40) {
    tier = 'standard-web';
  } else {
    tier = 'ghost-content';
  }

  // Total citation count for metrics (citation phrases + authoritative links)
  const citationCount = citationPhraseCount + authoritativeLinkCount;

  // =============================================
  // FINDINGS
  // =============================================

  if (!hasAuthorBio) {
    findings.push({
      ruleId: 'no-author-bio',
      ruleName: 'No Author Bio',
      category: 'content-eeat',
      severity: 'serious',
      message: 'No author biography section detected on the page',
      description: 'Author bios help establish credibility and are a key E-E-A-T signal for Google.',
      recommendation: 'Add an author bio section with credentials, experience, and a photo. Use schema markup like [itemprop="author"].',
    });
  }

  if (!hasAuthorCredentials) {
    findings.push({
      ruleId: 'no-author-credentials',
      ruleName: 'No Author Credentials',
      category: 'content-eeat',
      severity: 'moderate',
      message: 'No professional credentials or qualifications found for the author',
      description: 'Credentials (degrees, certifications, years of experience) signal expertise to both users and search engines.',
      recommendation: 'Include relevant credentials, certifications, or experience in the author bio.',
    });
  }

  if (experienceScore < 20) {
    findings.push({
      ruleId: 'no-experience-signals',
      ruleName: 'No First-Hand Experience Signals',
      category: 'content-eeat',
      severity: 'moderate',
      message: 'Content lacks first-hand experience indicators',
      description: 'Google values content that demonstrates real-world experience with the topic.',
      recommendation: 'Include personal observations, test results, or hands-on experience. Use phrases like "In my testing..." or "Having used...".',
    });
  }

  if (expertiseScore < 30) {
    findings.push({
      ruleId: 'low-expertise-depth',
      ruleName: 'Low Expertise Depth',
      category: 'content-eeat',
      severity: 'moderate',
      message: 'Content shows limited subject-matter expertise signals',
      description: 'Expert content typically includes technical terminology, data points, and references to research.',
      recommendation: 'Add specific data, statistics, technical details, or references to studies and research.',
    });
  }

  if (citationCount === 0 && wordCount >= 300) {
    findings.push({
      ruleId: 'no-citations',
      ruleName: 'No Citations or References',
      category: 'content-eeat',
      severity: 'moderate',
      message: 'Content has no citations, references, or links to authoritative sources',
      description: 'Citing sources improves credibility and is an important trust signal.',
      recommendation: 'Link to authoritative sources (.gov, .edu) and reference studies or research to support claims.',
    });
  }

  if (!hasContactInfo) {
    findings.push({
      ruleId: 'no-contact-info',
      ruleName: 'No Contact Information',
      category: 'content-eeat',
      severity: 'minor',
      message: 'No phone number or physical address detected',
      description: 'Contact information signals legitimacy and trustworthiness to users and search engines.',
      recommendation: 'Include a physical address and phone number, especially for YMYL (Your Money Your Life) content.',
    });
  }

  if (!hasPrivacyPolicy) {
    findings.push({
      ruleId: 'no-privacy-policy',
      ruleName: 'No Privacy Policy Link',
      category: 'content-eeat',
      severity: 'minor',
      message: 'No privacy policy link found on the page',
      description: 'A privacy policy is expected on professional websites and is a trust signal.',
      recommendation: 'Add a link to your privacy policy in the footer or navigation.',
    });
  }

  if (!hasTermsOfService) {
    findings.push({
      ruleId: 'no-terms-of-service',
      ruleName: 'No Terms of Service Link',
      category: 'content-eeat',
      severity: 'info',
      message: 'No terms of service or terms of use link found',
      description: 'Terms of service demonstrate professionalism and legal compliance.',
      recommendation: 'Add a link to terms of service in the footer.',
    });
  }

  if (tier === 'ghost-content') {
    findings.push({
      ruleId: 'ghost-content-tier',
      ruleName: 'Ghost Content — Minimal E-E-A-T Signals',
      category: 'content-eeat',
      severity: 'serious',
      message: `E-E-A-T score is ${score}/100 — content has very few trust and authority signals`,
      description: 'Ghost content lacks author attribution, credentials, citations, and trust signals. Google may rank this content lower.',
      recommendation: 'Add author information, credentials, citations, contact details, and link to privacy/terms pages.',
    });
  }

  const metrics: EeatMetrics = {
    experienceScore,
    expertiseScore,
    authoritativenessScore,
    trustworthinessScore,
    hasAuthorBio,
    hasAuthorCredentials,
    citationCount,
    hasContactInfo,
    hasPrivacyPolicy,
    hasTermsOfService,
    tier,
    evidence: evidence.slice(0, 20), // cap at 20 items
  };

  return { score, metrics, findings };
}
