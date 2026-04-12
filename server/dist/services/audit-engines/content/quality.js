"use strict";
/**
 * Quality Analysis Module
 * Analyzes content depth, uniqueness, multimedia, and freshness
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreContentDepth = scoreContentDepth;
exports.calculateUniqueContentRatio = calculateUniqueContentRatio;
exports.detectBoilerplate = detectBoilerplate;
exports.countMultimedia = countMultimedia;
exports.detectFreshness = detectFreshness;
exports.analyzeQuality = analyzeQuality;
const cheerio = __importStar(require("cheerio"));
// Boilerplate detection patterns
const BOILERPLATE_PATTERNS = [
    /all rights reserved/i,
    /copyright\s*©?\s*\d{4}/i,
    /privacy policy/i,
    /terms\s*(of|and)\s*(service|use|conditions)/i,
    /cookie\s*(policy|consent|notice)/i,
    /powered by\s+\w+/i,
    /built with\s+\w+/i,
    /subscribe to our newsletter/i,
    /follow us on/i,
    /share\s*(this|on)\s*(facebook|twitter|linkedin)/i,
    /sign up for our/i,
    /join our mailing list/i,
    /leave a (comment|reply)/i,
    /posted in:/i,
    /filed under:/i,
    /tags?:/i,
    /categories?:/i,
    /related (posts|articles)/i,
    /you may also like/i,
    /recommended for you/i,
    /popular posts/i,
    /recent posts/i,
    /about the author/i,
    /share this article/i,
];
// Current year for freshness detection
const CURRENT_YEAR = new Date().getFullYear();
/**
 * Score content depth based on word count
 */
function scoreContentDepth(wordCount) {
    if (wordCount < 100)
        return 0;
    if (wordCount < 300)
        return 20;
    if (wordCount < 600)
        return 50;
    if (wordCount < 1200)
        return 80;
    if (wordCount <= 2500)
        return 100;
    return 90; // Diminishing returns for very long content
}
/**
 * Calculate unique content ratio (main content vs total HTML)
 */
function calculateUniqueContentRatio(mainContentLength, totalHtmlLength) {
    if (totalHtmlLength === 0)
        return 0;
    return Math.min(1, mainContentLength / totalHtmlLength);
}
/**
 * Detect boilerplate content and calculate ratio
 */
function detectBoilerplate(text) {
    const matches = [];
    let boilerplateLength = 0;
    for (const pattern of BOILERPLATE_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
            matches.push(match[0]);
            boilerplateLength += match[0].length;
        }
    }
    // Also check for repeated phrases (potential template content)
    const sentences = text.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 20);
    const sentenceCounts = new Map();
    for (const sentence of sentences) {
        sentenceCounts.set(sentence, (sentenceCounts.get(sentence) || 0) + 1);
    }
    // Count repeated sentences as boilerplate
    for (const [sentence, count] of sentenceCounts) {
        if (count > 1) {
            boilerplateLength += sentence.length * (count - 1);
        }
    }
    const ratio = text.length > 0 ? boilerplateLength / text.length : 0;
    return { ratio: Math.min(1, ratio), matches };
}
/**
 * Count multimedia elements
 */
function countMultimedia($) {
    // Get main content area
    const mainContent = $('main, article, [role="main"], .content, .post-content').first();
    const container = mainContent.length > 0 ? mainContent : $('body');
    // Count relevant images (not icons, not tiny)
    const images = container.find('img').filter((_, el) => {
        const $el = $(el);
        const width = parseInt($el.attr('width') || '0', 10);
        const height = parseInt($el.attr('height') || '0', 10);
        const src = $el.attr('src') || '';
        // Exclude tiny images, icons, and tracking pixels
        if (width > 0 && width < 50)
            return false;
        if (height > 0 && height < 50)
            return false;
        if (src.includes('icon') || src.includes('logo') || src.includes('pixel'))
            return false;
        if (src.includes('tracking') || src.includes('analytics'))
            return false;
        return true;
    }).length;
    // Count videos (including embeds)
    const videos = container.find('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"]').length;
    // Count data tables (not layout tables)
    const tables = container.find('table').filter((_, el) => {
        const $table = $(el);
        // Likely a data table if it has headers
        return $table.find('th').length > 0 || $table.find('thead').length > 0;
    }).length;
    // Count code blocks
    const codeBlocks = container.find('pre code, .highlight, .code-block, [class*="language-"]').length;
    return {
        total: images + videos + tables + codeBlocks,
        images,
        videos,
        tables,
        codeBlocks,
    };
}
/**
 * Detect content freshness signals
 */
function detectFreshness($, text) {
    let score = 0;
    let hasPublishedDate = false;
    let hasModifiedDate = false;
    let detectedYear = null;
    // Check meta tags for dates
    const publishedMeta = $('meta[property="article:published_time"], meta[name="pubdate"], meta[name="date"]').attr('content');
    const modifiedMeta = $('meta[property="article:modified_time"], meta[name="lastmod"]').attr('content');
    if (publishedMeta) {
        hasPublishedDate = true;
        const pubDate = new Date(publishedMeta);
        if (!isNaN(pubDate.getTime())) {
            const monthsAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            if (monthsAgo < 6)
                score += 30;
            else if (monthsAgo < 12)
                score += 20;
            else if (monthsAgo < 24)
                score += 10;
            detectedYear = pubDate.getFullYear();
        }
    }
    if (modifiedMeta) {
        hasModifiedDate = true;
        const modDate = new Date(modifiedMeta);
        if (!isNaN(modDate.getTime())) {
            const monthsAgo = (Date.now() - modDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            if (monthsAgo < 3)
                score += 30;
            else if (monthsAgo < 6)
                score += 20;
            else if (monthsAgo < 12)
                score += 10;
        }
    }
    // Check for "Updated" text with date
    const updatedPattern = /updated:?\s*(\w+\s+\d{1,2},?\s+\d{4}|\d{4})/i;
    const updatedMatch = text.match(updatedPattern);
    if (updatedMatch) {
        score += 15;
        const yearMatch = updatedMatch[1].match(/\d{4}/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0], 10);
            if (year === CURRENT_YEAR)
                score += 5;
            if (!detectedYear)
                detectedYear = year;
        }
    }
    // Check for current year references in content
    const yearPattern = new RegExp(`\\b(${CURRENT_YEAR}|${CURRENT_YEAR - 1})\\b`, 'g');
    const yearMatches = text.match(yearPattern);
    if (yearMatches && yearMatches.length > 0) {
        score += 10;
        if (!detectedYear && yearMatches.some(y => parseInt(y, 10) === CURRENT_YEAR)) {
            detectedYear = CURRENT_YEAR;
        }
    }
    // Check structured data for dates
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || '');
            if (json.datePublished)
                hasPublishedDate = true;
            if (json.dateModified)
                hasModifiedDate = true;
        }
        catch {
            // Ignore JSON parse errors
        }
    });
    return {
        score: Math.min(100, score),
        hasPublishedDate,
        hasModifiedDate,
        detectedYear,
    };
}
/**
 * Main quality analysis function
 */
function analyzeQuality(html, text, wordCount) {
    const $ = cheerio.load(html);
    const findings = [];
    // Calculate metrics
    const depthScore = scoreContentDepth(wordCount);
    const uniqueContentRatio = calculateUniqueContentRatio(text.length, html.length);
    const boilerplate = detectBoilerplate(text);
    const multimedia = countMultimedia($);
    const freshness = detectFreshness($, text);
    const metrics = {
        wordCount,
        uniqueContentRatio,
        boilerplateRatio: boilerplate.ratio,
        multimediaCount: multimedia.total,
        imageCount: multimedia.images,
        videoCount: multimedia.videos,
        tableCount: multimedia.tables,
        codeBlockCount: multimedia.codeBlocks,
        freshnessScore: freshness.score,
        hasPublishedDate: freshness.hasPublishedDate,
        hasModifiedDate: freshness.hasModifiedDate,
    };
    // Calculate score
    let score = 0;
    // Content depth (35% weight)
    score += depthScore * 0.35;
    // Uniqueness (25% weight)
    const uniquenessScore = Math.max(0, 100 - boilerplate.ratio * 200);
    score += uniquenessScore * 0.25;
    // Multimedia (25% weight)
    let multimediaScore = 0;
    if (multimedia.images > 0)
        multimediaScore += 30;
    if (multimedia.images > 2)
        multimediaScore += 15;
    if (multimedia.videos > 0)
        multimediaScore += 25;
    if (multimedia.tables > 0)
        multimediaScore += 15;
    if (multimedia.codeBlocks > 0)
        multimediaScore += 15;
    multimediaScore = Math.min(100, multimediaScore);
    score += multimediaScore * 0.25;
    // Freshness (15% weight)
    score += freshness.score * 0.15;
    // Generate findings
    // Thin content
    if (wordCount < 300) {
        findings.push({
            ruleId: 'thin-content',
            ruleName: 'Thin Content',
            category: 'content-quality',
            severity: 'serious',
            message: `Page has only ${wordCount} words, which may be considered thin content`,
            description: 'Pages with very little content may not provide enough value to rank well or engage users.',
            recommendation: 'Aim for at least 300 words of substantive, valuable content. For in-depth topics, 1000+ words is often better.',
        });
    }
    else if (wordCount < 600) {
        findings.push({
            ruleId: 'short-content',
            ruleName: 'Short Content',
            category: 'content-quality',
            severity: 'moderate',
            message: `Page has ${wordCount} words, which is relatively short`,
            description: 'While not thin content, longer articles tend to perform better for comprehensive topics.',
            recommendation: 'Consider expanding the content to cover the topic more thoroughly.',
        });
    }
    // No multimedia
    if (multimedia.total === 0) {
        findings.push({
            ruleId: 'no-multimedia',
            ruleName: 'No Images or Media',
            category: 'content-quality',
            severity: 'minor',
            message: 'Content has no images, videos, or other visual elements',
            description: 'Visual content improves engagement and helps break up text.',
            recommendation: 'Add relevant images, diagrams, or videos to illustrate key points.',
        });
    }
    else if (multimedia.images === 0 && wordCount > 500) {
        findings.push({
            ruleId: 'no-images',
            ruleName: 'No Images',
            category: 'content-quality',
            severity: 'minor',
            message: 'Long content has no images to break up the text',
            description: 'Images help readers stay engaged with longer content.',
            recommendation: 'Add at least one relevant image for every 300-500 words of content.',
        });
    }
    // High boilerplate
    if (boilerplate.ratio > 0.3) {
        findings.push({
            ruleId: 'boilerplate-heavy',
            ruleName: 'High Boilerplate Ratio',
            category: 'content-quality',
            severity: 'moderate',
            message: `${Math.round(boilerplate.ratio * 100)}% of content appears to be boilerplate or template text`,
            description: 'High amounts of repeated or template content can dilute the unique value of your page.',
            recommendation: 'Focus on unique, valuable content. Move repetitive elements to sidebars or footers.',
        });
    }
    // Low unique content ratio
    if (uniqueContentRatio < 0.1) {
        findings.push({
            ruleId: 'low-content-ratio',
            ruleName: 'Low Content-to-HTML Ratio',
            category: 'content-quality',
            severity: 'moderate',
            message: 'Main content is a very small portion of the page',
            description: 'Pages with very low content-to-code ratios may be seen as low quality.',
            recommendation: 'Increase the amount of substantive content relative to HTML markup and navigation.',
        });
    }
    // No freshness signals
    if (freshness.score < 20 && wordCount > 500) {
        findings.push({
            ruleId: 'outdated-content',
            ruleName: 'No Freshness Signals',
            category: 'content-quality',
            severity: 'minor',
            message: 'Content has no visible publication or update dates',
            description: 'Date information helps users and search engines understand content freshness.',
            recommendation: 'Add a published date and update it when content is revised.',
        });
    }
    return {
        score: Math.max(0, Math.min(100, Math.round(score))),
        metrics,
        findings,
    };
}
//# sourceMappingURL=quality.js.map