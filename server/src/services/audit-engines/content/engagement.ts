/**
 * Engagement Analysis Module
 * Analyzes hooks, CTAs, power words, questions, and transitions
 */

import * as cheerio from 'cheerio';
import type { EngagementAnalysis, EngagementMetrics, ContentFinding } from '../../../types/content.types.js';
import { extractWords, extractSentences } from './readability.js';

// Power words by category
const POWER_WORDS: Record<string, string[]> = {
  urgency: [
    'now', 'today', 'immediately', 'instant', 'fast', 'quick', 'hurry', 'limited',
    'deadline', 'expires', 'final', 'last chance', 'don\'t miss', 'act now', 'urgent',
  ],
  exclusivity: [
    'exclusive', 'secret', 'insider', 'members-only', 'private', 'hidden', 'confidential',
    'invitation', 'vip', 'elite', 'premium', 'limited edition', 'rare',
  ],
  value: [
    'free', 'bonus', 'save', 'discount', 'bargain', 'valuable', 'priceless', 'affordable',
    'cheap', 'economical', 'reduced', 'deal', 'offer', 'gift', 'reward',
  ],
  trust: [
    'proven', 'guaranteed', 'certified', 'official', 'authentic', 'secure', 'trusted',
    'verified', 'expert', 'professional', 'reliable', 'safe', 'tested', 'endorsed',
  ],
  emotion: [
    'amazing', 'incredible', 'remarkable', 'stunning', 'breathtaking', 'shocking',
    'inspiring', 'powerful', 'extraordinary', 'mind-blowing', 'awesome', 'spectacular',
  ],
  curiosity: [
    'surprising', 'unexpected', 'unusual', 'strange', 'mysterious', 'revealed', 'discover',
    'uncover', 'unknown', 'secret', 'hidden', 'little-known', 'insider',
  ],
};

// Flatten power words for easy lookup
const ALL_POWER_WORDS = new Set(
  Object.values(POWER_WORDS).flat().map(w => w.toLowerCase())
);

// Transition words by category
const TRANSITION_WORDS: Record<string, string[]> = {
  addition: [
    'additionally', 'furthermore', 'moreover', 'also', 'besides', 'in addition',
    'likewise', 'similarly', 'as well', 'too', 'not only', 'what\'s more',
  ],
  contrast: [
    'however', 'nevertheless', 'although', 'despite', 'whereas', 'but', 'yet',
    'on the other hand', 'in contrast', 'conversely', 'still', 'even so', 'nonetheless',
  ],
  cause: [
    'because', 'since', 'therefore', 'consequently', 'thus', 'hence', 'as a result',
    'due to', 'owing to', 'for this reason', 'accordingly', 'so',
  ],
  sequence: [
    'first', 'second', 'third', 'next', 'then', 'finally', 'subsequently',
    'meanwhile', 'afterward', 'previously', 'before', 'after', 'lastly', 'initially',
  ],
  example: [
    'for example', 'for instance', 'such as', 'specifically', 'namely', 'including',
    'to illustrate', 'in particular', 'especially', 'notably',
  ],
  conclusion: [
    'in conclusion', 'to summarize', 'overall', 'in summary', 'ultimately',
    'to conclude', 'in short', 'finally', 'all in all', 'in the end',
  ],
};

// Flatten transition phrases
const ALL_TRANSITIONS = Object.values(TRANSITION_WORDS).flat().map(t => t.toLowerCase());

// Generic openers to detect (negative signals)
const GENERIC_OPENERS = [
  /^in (this|today's) (article|post|guide|blog)/i,
  /^welcome to/i,
  /^have you ever wondered/i,
  /^are you looking for/i,
  /^if you('re| are) (looking|searching|trying)/i,
  /^do you want to/i,
  /^want to learn/i,
  /^let's (talk about|discuss|explore)/i,
  /^today we('ll| will) (discuss|talk|explore)/i,
  /^in this (post|article|guide)/i,
];

// CTA detection patterns
const CTA_PATTERNS = [
  /\b(click|tap|press|hit)\s+(here|now|below|the button)/i,
  /\b(sign up|subscribe|register|join|download|get started)/i,
  /\b(learn more|read more|find out|discover more|explore)/i,
  /\b(buy|purchase|order|shop|add to cart|checkout)/i,
  /\b(contact|call|email|reach out|get in touch)/i,
  /\b(try|start|begin|request|claim)\s+(free|now|today|your)/i,
  /\b(get|grab|download|access)\s+(your|the|a|our)\s+(free|guide|ebook|copy)/i,
  /\bbook\s+(a|your)\s+(call|demo|consultation)/i,
  /\bschedule\s+(a|your)/i,
  /\bstart\s+(your|a)\s+(free|trial)/i,
];

// Strong hook patterns (positive signals)
const HOOK_PATTERNS = {
  question: /^[^.!?]*\?/,
  statistic: /\b\d+(\.\d+)?%|\b\d{1,3}(,\d{3})+|\b(million|billion|thousand)\b/i,
  story: /^(when i|imagine|picture this|let me tell you|once upon|i remember)/i,
  bold: /^(the truth is|here's (the|a) secret|what if i told you|you won't believe)/i,
  problem: /^(tired of|struggling with|frustrated by|sick of|fed up with)/i,
};

/**
 * Analyze opening hook strength
 */
export function analyzeHook(text: string): { score: number; hasGenericOpener: boolean; hookType: string | null } {
  // Get first ~150 words
  const words = extractWords(text);
  const openingText = words.slice(0, 150).join(' ');
  const firstSentence = extractSentences(text)[0] || '';

  // Check for generic openers (bad)
  for (const pattern of GENERIC_OPENERS) {
    if (pattern.test(firstSentence)) {
      return { score: 30, hasGenericOpener: true, hookType: null };
    }
  }

  // Check for strong hooks (good)
  if (HOOK_PATTERNS.question.test(firstSentence)) {
    return { score: 90, hasGenericOpener: false, hookType: 'question' };
  }

  if (HOOK_PATTERNS.statistic.test(openingText)) {
    return { score: 85, hasGenericOpener: false, hookType: 'statistic' };
  }

  if (HOOK_PATTERNS.story.test(firstSentence)) {
    return { score: 85, hasGenericOpener: false, hookType: 'story' };
  }

  if (HOOK_PATTERNS.bold.test(firstSentence)) {
    return { score: 80, hasGenericOpener: false, hookType: 'bold' };
  }

  if (HOOK_PATTERNS.problem.test(firstSentence)) {
    return { score: 80, hasGenericOpener: false, hookType: 'problem' };
  }

  // Default - not particularly strong or weak
  return { score: 60, hasGenericOpener: false, hookType: null };
}

/**
 * Count power words and calculate density
 */
export function analyzePowerWords(words: string[]): { count: number; density: number; examples: string[] } {
  const found: string[] = [];

  for (const word of words) {
    const lower = word.toLowerCase();
    if (ALL_POWER_WORDS.has(lower)) {
      found.push(lower);
    }
  }

  // Also check for multi-word power phrases
  const text = words.join(' ').toLowerCase();
  for (const category of Object.values(POWER_WORDS)) {
    for (const phrase of category) {
      if (phrase.includes(' ') && text.includes(phrase.toLowerCase())) {
        found.push(phrase);
      }
    }
  }

  const uniqueExamples = [...new Set(found)].slice(0, 5);
  const density = words.length > 0 ? (found.length / words.length) * 100 : 0;

  return {
    count: found.length,
    density: Math.round(density * 100) / 100,
    examples: uniqueExamples,
  };
}

/**
 * Count questions in content
 */
export function countQuestions(text: string): number {
  const matches = text.match(/\?/g);
  return matches ? matches.length : 0;
}

/**
 * Analyze transition word usage
 */
export function analyzeTransitions(sentences: string[]): { count: number; ratio: number } {
  let transitionCount = 0;

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase().trim();

    for (const transition of ALL_TRANSITIONS) {
      if (lower.startsWith(transition) || lower.includes(`, ${transition}`)) {
        transitionCount++;
        break; // Count each sentence only once
      }
    }
  }

  const ratio = sentences.length > 0 ? (transitionCount / sentences.length) * 100 : 0;

  return {
    count: transitionCount,
    ratio: Math.round(ratio * 100) / 100,
  };
}

/**
 * Count CTAs in content
 */
export function countCTAs(html: string, text: string): number {
  const $ = cheerio.load(html);
  let ctaCount = 0;

  // Check for CTA buttons/links
  $('a, button').each((_, el) => {
    const elText = $(el).text().toLowerCase();
    for (const pattern of CTA_PATTERNS) {
      if (pattern.test(elText)) {
        ctaCount++;
        break;
      }
    }
  });

  // Check text content for CTA phrases
  for (const pattern of CTA_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      ctaCount += matches.length;
    }
  }

  // Dedupe approximate count
  return Math.ceil(ctaCount / 2);
}

/**
 * Main engagement analysis function
 */
export function analyzeEngagement(
  html: string,
  text: string,
  sentences: string[],
  words: string[]
): EngagementAnalysis {
  const findings: ContentFinding[] = [];

  // Analyze components
  const hook = analyzeHook(text);
  const powerWords = analyzePowerWords(words);
  const questionCount = countQuestions(text);
  const transitions = analyzeTransitions(sentences);
  const ctaCount = countCTAs(html, text);

  const metrics: EngagementMetrics = {
    hookStrength: hook.score,
    ctaCount,
    questionCount,
    powerWordCount: powerWords.count,
    powerWordDensity: powerWords.density,
    transitionWordCount: transitions.count,
    transitionWordRatio: transitions.ratio,
    hasGenericOpener: hook.hasGenericOpener,
  };

  // Calculate score
  let score = 0;

  // Hook strength (30% weight)
  score += hook.score * 0.30;

  // CTA presence (25% weight)
  let ctaScore = 0;
  if (ctaCount >= 1) ctaScore = 70;
  if (ctaCount >= 2) ctaScore = 90;
  if (ctaCount >= 3) ctaScore = 100;
  if (ctaCount > 5) ctaScore = 80; // Too many CTAs
  score += ctaScore * 0.25;

  // Power words (20% weight)
  let powerScore = 0;
  if (powerWords.density >= 1 && powerWords.density <= 2) powerScore = 100;
  else if (powerWords.density >= 0.5 && powerWords.density < 1) powerScore = 80;
  else if (powerWords.density >= 2 && powerWords.density <= 4) powerScore = 70;
  else if (powerWords.density > 4) powerScore = 40; // Oversaturation
  else powerScore = 50; // Too few
  score += powerScore * 0.20;

  // Transitions (15% weight)
  let transitionScore = 0;
  if (transitions.ratio >= 20 && transitions.ratio <= 40) transitionScore = 100;
  else if (transitions.ratio >= 10 && transitions.ratio < 20) transitionScore = 80;
  else if (transitions.ratio >= 40 && transitions.ratio <= 60) transitionScore = 70;
  else if (transitions.ratio > 60) transitionScore = 50;
  else transitionScore = 50; // Too few
  score += transitionScore * 0.15;

  // Questions (10% weight)
  const wordsPerQuestion = questionCount > 0 ? words.length / questionCount : words.length;
  let questionScore = 0;
  if (wordsPerQuestion >= 200 && wordsPerQuestion <= 500) questionScore = 100;
  else if (wordsPerQuestion >= 100 && wordsPerQuestion < 200) questionScore = 80;
  else if (wordsPerQuestion > 500 && wordsPerQuestion <= 1000) questionScore = 70;
  else if (wordsPerQuestion < 100) questionScore = 50; // Too many questions
  else questionScore = 50; // No questions
  score += questionScore * 0.10;

  // Generate findings

  // Weak opening
  if (hook.hasGenericOpener) {
    findings.push({
      ruleId: 'weak-opening',
      ruleName: 'Weak Opening Hook',
      category: 'content-engagement',
      severity: 'moderate',
      message: 'Content opens with a generic phrase that may not capture reader attention',
      description: 'Generic openings like "In this article..." don\'t differentiate your content.',
      recommendation: 'Start with a question, statistic, bold statement, or story to hook readers immediately.',
    });
  } else if (hook.score < 60) {
    findings.push({
      ruleId: 'weak-opening',
      ruleName: 'Weak Opening Hook',
      category: 'content-engagement',
      severity: 'moderate',
      message: 'Opening paragraph could be more engaging',
      description: 'A strong hook in the first few sentences increases reader engagement.',
      recommendation: 'Consider opening with a compelling question, surprising statistic, or relatable problem.',
    });
  }

  // No CTA
  if (ctaCount === 0) {
    findings.push({
      ruleId: 'no-cta',
      ruleName: 'No Call-to-Action',
      category: 'content-engagement',
      severity: 'moderate',
      message: 'Content has no clear call-to-action',
      description: 'CTAs guide readers to take the next step after reading your content.',
      recommendation: 'Add a relevant CTA such as "Learn more," "Get started," or "Contact us."',
    });
  }

  // Too many CTAs
  if (ctaCount > 5) {
    findings.push({
      ruleId: 'too-many-ctas',
      ruleName: 'Too Many CTAs',
      category: 'content-engagement',
      severity: 'minor',
      message: `Content has ${ctaCount} CTAs, which may overwhelm readers`,
      description: 'Too many calls-to-action can confuse readers about what to do next.',
      recommendation: 'Focus on 2-3 primary CTAs that align with your content goals.',
    });
  }

  // No questions
  if (questionCount === 0 && words.length > 300) {
    findings.push({
      ruleId: 'no-questions',
      ruleName: 'No Questions in Content',
      category: 'content-engagement',
      severity: 'minor',
      message: 'Content has no questions to engage readers',
      description: 'Rhetorical questions help readers connect with your content.',
      recommendation: 'Add 1-2 questions to make readers reflect on the topic.',
    });
  }

  // Low transition usage
  if (transitions.ratio < 10 && sentences.length > 10) {
    findings.push({
      ruleId: 'low-transition-words',
      ruleName: 'Low Transition Word Usage',
      category: 'content-engagement',
      severity: 'minor',
      message: `Only ${Math.round(transitions.ratio)}% of sentences use transition words`,
      description: 'Transition words help content flow and guide readers through your arguments.',
      recommendation: 'Use words like "however," "therefore," "for example," to connect ideas.',
    });
  }

  // No power words
  if (powerWords.count === 0 && words.length > 200) {
    findings.push({
      ruleId: 'no-power-words',
      ruleName: 'No Emotional Language',
      category: 'content-engagement',
      severity: 'info',
      message: 'Content lacks emotional or persuasive language',
      description: 'Power words can make content more compelling and memorable.',
      recommendation: 'Consider using words that evoke emotion, urgency, or curiosity.',
    });
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    metrics,
    findings,
  };
}
