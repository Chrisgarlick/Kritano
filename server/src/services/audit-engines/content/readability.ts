/**
 * Readability Analysis Module
 * Implements multiple readability algorithms for content scoring
 */

import type { ReadabilityAnalysis, ReadabilityMetrics, ContentFinding } from '../../../types/content.types.js';

// Common word cache for syllable counting
const SYLLABLE_CACHE = new Map<string, number>();

// Words that don't follow normal syllable rules
const SYLLABLE_OVERRIDES: Record<string, number> = {
  'area': 3,
  'idea': 3,
  'real': 2,
  'reel': 1,
  'feel': 1,
  'ideal': 3,
  'create': 2,
  'created': 3,
  'creating': 3,
  'business': 2,
  'every': 2,
  'different': 3,
  'interesting': 4,
  'beautiful': 3,
  'family': 3,
  'evening': 2,
  'chocolate': 3,
  'camera': 3,
  'average': 3,
  'generally': 4,
  'usually': 4,
  'actually': 4,
};

/**
 * Count syllables in a word using vowel group method
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');

  if (!word) return 0;

  // Check cache first
  if (SYLLABLE_CACHE.has(word)) {
    return SYLLABLE_CACHE.get(word)!;
  }

  // Check overrides
  if (SYLLABLE_OVERRIDES[word]) {
    SYLLABLE_CACHE.set(word, SYLLABLE_OVERRIDES[word]);
    return SYLLABLE_OVERRIDES[word];
  }

  // Very short words
  if (word.length <= 3) {
    SYLLABLE_CACHE.set(word, 1);
    return 1;
  }

  // Count vowel groups
  let count = 0;
  let prevVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = /[aeiouy]/.test(word[i]);
    if (isVowel && !prevVowel) {
      count++;
    }
    prevVowel = isVowel;
  }

  // Adjust for silent e
  if (word.endsWith('e') && !word.endsWith('le') && count > 1) {
    count--;
  }

  // Adjust for -ed endings
  if (word.endsWith('ed') && word.length > 3) {
    const beforeEd = word[word.length - 3];
    if (!/[dt]/.test(beforeEd)) {
      count = Math.max(1, count - 1);
    }
  }

  // Adjust for common suffixes that add syllables
  if (word.endsWith('tion') || word.endsWith('sion')) {
    // Already counted as one syllable, which is correct
  }

  // Ensure at least 1 syllable
  count = Math.max(1, count);

  // Cache and return
  SYLLABLE_CACHE.set(word, count);
  return count;
}

/**
 * Count total syllables in text
 */
export function getSyllableCount(words: string[]): number {
  return words.reduce((total, word) => total + countSyllables(word), 0);
}

/**
 * Count sentences in text
 */
export function getSentenceCount(text: string): number {
  // Split on sentence-ending punctuation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return Math.max(1, sentences.length);
}

/**
 * Extract sentences from text
 */
export function extractSentences(text: string): string[] {
  // More sophisticated sentence splitting
  const sentences: string[] = [];
  let current = '';

  // Split on common sentence boundaries
  const parts = text.split(/([.!?]+[\s\n]+)/);

  for (let i = 0; i < parts.length; i++) {
    current += parts[i];

    // Check if this looks like end of sentence
    if (/[.!?]+[\s\n]*$/.test(parts[i]) || i === parts.length - 1) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
      current = '';
    }
  }

  return sentences;
}

/**
 * Extract words from text
 */
export function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && /[a-z]/.test(w));
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * Target: 7-9 for general web content
 */
export function getFleschKincaidGrade(wordCount: number, sentenceCount: number, syllableCount: number): number {
  if (wordCount === 0 || sentenceCount === 0) return 0;

  const grade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

/**
 * Calculate Flesch Reading Ease
 * 90-100: Very easy, 60-69: Standard, 0-29: Very difficult
 */
export function getFleschReadingEase(wordCount: number, sentenceCount: number, syllableCount: number): number {
  if (wordCount === 0 || sentenceCount === 0) return 0;

  const ease = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
  return Math.max(0, Math.min(100, Math.round(ease * 10) / 10));
}

/**
 * Calculate Gunning Fog Index
 * Estimates years of formal education needed
 */
export function getGunningFog(words: string[], sentenceCount: number): number {
  if (words.length === 0 || sentenceCount === 0) return 0;

  // Complex words = 3+ syllables, excluding common suffixes
  const complexWords = words.filter(word => {
    if (word.length < 6) return false;
    const syllables = countSyllables(word);
    if (syllables < 3) return false;

    // Exclude words with common suffixes that inflate complexity
    if (word.endsWith('ing') || word.endsWith('ed') || word.endsWith('es')) {
      return syllables > 3;
    }
    return true;
  });

  const fog = 0.4 * ((words.length / sentenceCount) + 100 * (complexWords.length / words.length));
  return Math.max(0, Math.round(fog * 10) / 10);
}

/**
 * Calculate Automated Readability Index (ARI)
 * Uses characters instead of syllables
 */
export function getARI(text: string, wordCount: number, sentenceCount: number): number {
  if (wordCount === 0 || sentenceCount === 0) return 0;

  const characters = text.replace(/[^a-zA-Z0-9]/g, '').length;
  const ari = 4.71 * (characters / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;
  return Math.max(0, Math.round(ari * 10) / 10);
}

/**
 * Calculate sentence length variance (variety)
 */
export function getSentenceVariety(sentences: string[]): number {
  if (sentences.length < 2) return 0;

  const lengths = sentences.map(s => extractWords(s).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  if (mean === 0) return 0;

  // Calculate coefficient of variation
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // Normalize to 0-1 (higher is better variety)
  // CV of 0.4-0.6 is considered good variety
  return Math.min(1, cv / 0.6);
}

/**
 * Score readability grade (targeting grade 7-9)
 */
function scoreGradeLevel(grade: number): number {
  // Perfect score at grade 8
  const diff = Math.abs(grade - 8);

  if (diff <= 1) return 100;      // 7-9: Perfect
  if (diff <= 2) return 85;       // 6-10: Good
  if (diff <= 3) return 70;       // 5-11: Acceptable
  if (diff <= 5) return 50;       // 3-13: Difficult
  return 30;                       // Very difficult or very easy
}

/**
 * Main readability analysis function
 */
export function analyzeReadability(
  text: string,
  sentences: string[],
  words: string[]
): ReadabilityAnalysis {
  const findings: ContentFinding[] = [];

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const syllableCount = getSyllableCount(words);

  // Calculate all metrics
  const fleschKincaidGrade = getFleschKincaidGrade(wordCount, sentenceCount, syllableCount);
  const fleschReadingEase = getFleschReadingEase(wordCount, sentenceCount, syllableCount);
  const gunningFog = getGunningFog(words, sentenceCount);
  const automatedReadabilityIndex = getARI(text, wordCount, sentenceCount);
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0;
  const avgSyllablesPerWord = wordCount > 0 ? Math.round((syllableCount / wordCount) * 100) / 100 : 0;
  const sentenceVariety = getSentenceVariety(sentences);

  const metrics: ReadabilityMetrics = {
    fleschKincaidGrade,
    fleschReadingEase,
    gunningFog,
    automatedReadabilityIndex,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    sentenceCount,
    sentenceVariety,
  };

  // Calculate score from multiple algorithms
  const gradeScore = scoreGradeLevel(fleschKincaidGrade);
  const easeScore = Math.min(100, fleschReadingEase);
  const fogScore = Math.max(0, 100 - (gunningFog - 8) * 8);
  const varietyScore = sentenceVariety * 100;

  // Weighted average (grade level and ease are most important)
  let score = Math.round(
    gradeScore * 0.35 +
    easeScore * 0.35 +
    fogScore * 0.15 +
    varietyScore * 0.15
  );

  // Generate findings

  // Poor overall readability
  if (score < 50) {
    findings.push({
      ruleId: 'poor-readability',
      ruleName: 'Poor Readability Score',
      category: 'content-readability',
      severity: 'serious',
      message: `Content has a readability score of ${score}/100, which may be difficult for many readers`,
      description: 'Content that is difficult to read reduces engagement and comprehension.',
      recommendation: 'Simplify sentence structure, use shorter words, and break up complex ideas into smaller chunks.',
    });
  } else if (score < 70) {
    findings.push({
      ruleId: 'moderate-readability',
      ruleName: 'Moderate Readability',
      category: 'content-readability',
      severity: 'moderate',
      message: `Content readability (${score}/100) could be improved for broader audience appeal`,
      description: 'While readable, the content could be simplified for better engagement.',
      recommendation: 'Consider simplifying some sentences and using more common vocabulary.',
    });
  }

  // Long sentences
  const longSentences = sentences.filter(s => extractWords(s).length > 35);
  if (longSentences.length > 0) {
    findings.push({
      ruleId: 'long-sentences',
      ruleName: 'Excessive Sentence Length',
      category: 'content-readability',
      severity: 'moderate',
      message: `Found ${longSentences.length} sentence(s) with more than 35 words`,
      description: 'Very long sentences are harder to follow and reduce comprehension.',
      recommendation: 'Break long sentences into shorter ones. Aim for an average of 15-20 words per sentence.',
      location: {
        excerpt: longSentences[0]?.substring(0, 100) + '...',
      },
    });
  }

  // Low sentence variety
  if (sentenceVariety < 0.3 && sentenceCount > 5) {
    findings.push({
      ruleId: 'no-sentence-variety',
      ruleName: 'Monotonous Sentence Structure',
      category: 'content-readability',
      severity: 'minor',
      message: 'Sentences have similar lengths, creating a monotonous reading experience',
      description: 'Varying sentence length creates rhythm and keeps readers engaged.',
      recommendation: 'Mix short punchy sentences with longer explanatory ones.',
    });
  }

  // High vocabulary complexity
  if (avgSyllablesPerWord > 1.8) {
    findings.push({
      ruleId: 'complex-vocabulary',
      ruleName: 'High Vocabulary Complexity',
      category: 'content-readability',
      severity: 'moderate',
      message: `Average word complexity (${avgSyllablesPerWord} syllables/word) is higher than recommended`,
      description: 'Using too many complex words reduces accessibility for general audiences.',
      recommendation: 'Replace complex words with simpler alternatives where possible.',
    });
  }

  // Very high grade level
  if (fleschKincaidGrade > 14) {
    findings.push({
      ruleId: 'academic-reading-level',
      ruleName: 'Academic Reading Level',
      category: 'content-readability',
      severity: 'moderate',
      message: `Content requires college-level reading ability (grade ${fleschKincaidGrade})`,
      description: 'Content written at an academic level may exclude many potential readers.',
      recommendation: 'Aim for a grade level of 7-9 for general web content.',
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    metrics,
    findings,
  };
}
