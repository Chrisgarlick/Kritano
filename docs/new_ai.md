# AI Readiness Scoring for Web Scrapers
### Using Playwright & Cheerio

---

## Overview

This guide covers how to extend your existing scraper to surface **AI Readiness** signals — the factors that influence how AI models and answer engines (like ChatGPT, Claude, Perplexity, and Google's AI Overviews) perceive, trust, and cite a webpage.

These checks can all be derived from scraped HTML and text **without passing anything to an LLM**. An LLM layer can be added later on top of this foundation.

---

## Why This Matters

Traditional SEO focuses on signals like backlinks, keyword density, and technical performance. **AEO (Answer Engine Optimisation)** and **GEO (Generative Engine Optimisation)** are the emerging counterparts — optimising content so AI systems can extract, trust, and surface it in generated responses.

Key differences:

| Traditional SEO | AI / Answer Engine Optimisation |
|---|---|
| Keywords & backlinks | Clarity & extractability |
| Page authority | Author & trust signals |
| Meta tags | Structured data (JSON-LD) |
| Click-through rate | Citation worthiness |
| Crawlability | AI bot accessibility |

---

## Setup

```bash
npm install playwright cheerio natural syllable
```

```js
const { chromium } = require('playwright');
const cheerio = require('cheerio');
```

### Fetching the page

```js
async function fetchPage(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const html = await page.content();
  const $ = cheerio.load(html);

  await browser.close();
  return { html, $ };
}
```

---

## Signal Categories

### 1. Content Structure

Good content structure makes it easier for AI models to extract the core meaning of a page.

#### H1 Presence & Uniqueness

```js
function checkH1($) {
  const h1s = $('h1');
  return {
    count: h1s.length,
    hasExactlyOne: h1s.length === 1,
    text: h1s.first().text().trim(),
    score: h1s.length === 1 ? 10 : 0
  };
}
```

#### Heading Hierarchy

```js
function checkHeadingHierarchy($) {
  const headings = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    headings.push(parseInt(el.tagName.replace('h', '')));
  });

  let hierarchyBroken = false;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      hierarchyBroken = true;
      break;
    }
  }

  return {
    headings,
    hierarchyBroken,
    score: hierarchyBroken ? 5 : 10
  };
}
```

#### FAQ / Q&A Sections

AI models heavily favour pages with explicit question-and-answer structure.

```js
function checkFAQContent($) {
  const questionPatterns = /^(what|how|why|when|where|who|is|are|can|does|do|will|should)/i;

  const headingTexts = [];
  $('h2, h3, h4').each((_, el) => {
    headingTexts.push($(el).text().trim());
  });

  const questionHeadings = headingTexts.filter(t => questionPatterns.test(t));

  return {
    questionHeadingCount: questionHeadings.length,
    examples: questionHeadings.slice(0, 3),
    score: Math.min(questionHeadings.length * 3, 15)
  };
}
```

#### Content Density & Placement

Is the key content near the top, or buried?

```js
function checkContentPlacement($) {
  const bodyText = $('body').text().trim();
  const firstThirdLength = Math.floor(bodyText.length / 3);
  const firstThird = bodyText.substring(0, firstThirdLength);

  const wordCountTotal = bodyText.split(/\s+/).length;
  const wordCountFirstThird = firstThird.split(/\s+/).length;

  return {
    totalWords: wordCountTotal,
    wordsInFirstThird: wordCountFirstThird,
    contentFrontloaded: wordCountFirstThird > 100,
    score: wordCountFirstThird > 100 ? 10 : 5
  };
}
```

---

### 2. Readability

AI systems extract more reliably from clear, concise prose. Short sentences and plain language are better.

#### Flesch-Kincaid Reading Ease

```js
const syllable = require('syllable');

function fleschKincaid(text) {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const syllableCount = words.reduce((acc, word) => acc + syllable(word), 0);

  if (sentences.length === 0 || words.length === 0) return null;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllableCount / words.length;

  const score = 206.835
    - (1.015 * avgSentenceLength)
    - (84.6 * avgSyllablesPerWord);

  return {
    score: Math.round(score),
    grade: fleschGrade(score),
    avgSentenceLength: Math.round(avgSentenceLength),
    avgSyllablesPerWord: avgSyllablesPerWord.toFixed(2)
  };
}

function fleschGrade(score) {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}
```

#### Average Sentence Length

```js
function checkSentenceLength(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgLength = sentences.reduce((acc, s) => {
    return acc + s.trim().split(/\s+/).length;
  }, 0) / sentences.length;

  return {
    avgWordsPerSentence: Math.round(avgLength),
    isOptimal: avgLength <= 20,
    score: avgLength <= 20 ? 10 : avgLength <= 30 ? 5 : 0
  };
}
```

---

### 3. Authority & Trust Signals

AI models are more likely to cite pages that demonstrate authorship, currency, and credibility.

#### Author Detection

```js
function checkAuthor($) {
  const authorSelectors = [
    '[rel="author"]',
    '[class*="author"]',
    '[itemprop="author"]',
    'meta[name="author"]'
  ];

  let found = false;
  let authorText = null;

  for (const selector of authorSelectors) {
    const el = $(selector).first();
    if (el.length) {
      found = true;
      authorText = el.attr('content') || el.text().trim();
      break;
    }
  }

  return {
    hasAuthor: found,
    author: authorText,
    score: found ? 10 : 0
  };
}
```

#### Date / Freshness

```js
function checkDate($) {
  const dateSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'time[datetime]',
    '[itemprop="datePublished"]',
    '[itemprop="dateModified"]',
    'meta[property="article:modified_time"]'
  ];

  let publishedDate = null;
  let modifiedDate = null;

  const published = $('meta[property="article:published_time"], [itemprop="datePublished"], time[datetime]').first();
  if (published.length) {
    publishedDate = published.attr('content') || published.attr('datetime');
  }

  const modified = $('meta[property="article:modified_time"], [itemprop="dateModified"]').first();
  if (modified.length) {
    modifiedDate = modified.attr('content') || modified.attr('datetime');
  }

  const hasDate = !!(publishedDate || modifiedDate);
  const dateToCheck = modifiedDate || publishedDate;
  let isRecent = false;

  if (dateToCheck) {
    const date = new Date(dateToCheck);
    const monthsAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    isRecent = monthsAgo <= 12;
  }

  return {
    hasDate,
    publishedDate,
    modifiedDate,
    isRecent,
    score: hasDate ? (isRecent ? 10 : 5) : 0
  };
}
```

#### Trust Page Signals

```js
function checkTrustPages($, html) {
  const links = [];
  $('a[href]').each((_, el) => links.push($(el).attr('href').toLowerCase()));

  const hasPrivacyPolicy = links.some(l => l.includes('privacy'));
  const hasAboutPage = links.some(l => l.includes('about'));
  const hasContactPage = links.some(l => l.includes('contact'));

  return {
    hasPrivacyPolicy,
    hasAboutPage,
    hasContactPage,
    score: [hasPrivacyPolicy, hasAboutPage, hasContactPage].filter(Boolean).length * 3
  };
}
```

#### Outbound Links to Credible Sources

```js
function checkOutboundLinks($, pageUrl) {
  const pageDomain = new URL(pageUrl).hostname;
  const outboundLinks = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    try {
      const url = new URL(href);
      if (url.hostname !== pageDomain) {
        outboundLinks.push(url.hostname);
      }
    } catch (_) {}
  });

  return {
    outboundLinkCount: outboundLinks.length,
    hasOutboundLinks: outboundLinks.length > 0,
    score: Math.min(outboundLinks.length * 2, 10)
  };
}
```

---

### 4. Structured Data

Structured data (JSON-LD / schema.org) is one of the strongest signals for AI readiness. It gives machines an unambiguous understanding of your content.

#### JSON-LD Detection

```js
function checkStructuredData($) {
  const schemas = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      schemas.push(data['@type'] || 'Unknown');
    } catch (_) {}
  });

  const highValueTypes = ['FAQPage', 'HowTo', 'Article', 'NewsArticle', 'BlogPosting', 'Product', 'Review', 'BreadcrumbList'];
  const hasHighValueSchema = schemas.some(t => highValueTypes.includes(t));

  return {
    hasStructuredData: schemas.length > 0,
    schemaTypes: schemas,
    hasHighValueSchema,
    score: schemas.length === 0 ? 0 : hasHighValueSchema ? 20 : 10
  };
}
```

#### Meta Tags (Open Graph & Twitter)

```js
function checkMetaTags($) {
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const twitterCard = $('meta[name="twitter:card"]').attr('content');
  const metaDescription = $('meta[name="description"]').attr('content');

  return {
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    metaDescription,
    score: [ogTitle, ogDescription, metaDescription].filter(Boolean).length * 3
  };
}
```

---

### 5. AI Crawlability

It doesn't matter how good your content is if AI bots can't access it.

#### Robots.txt Check

```js
async function checkRobotsTxt(url) {
  const { origin } = new URL(url);
  const robotsUrl = `${origin}/robots.txt`;

  try {
    const response = await fetch(robotsUrl);
    const text = await response.text();

    const blockedBots = [];
    const aiCrawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'anthropic-ai', 'GoogleExtended', 'CCBot'];

    for (const bot of aiCrawlers) {
      const regex = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/`, 'i');
      if (regex.test(text)) {
        blockedBots.push(bot);
      }
    }

    return {
      robotsTxtFound: true,
      blockedAICrawlers: blockedBots,
      allAIBotsAllowed: blockedBots.length === 0,
      score: blockedBots.length === 0 ? 15 : Math.max(0, 15 - blockedBots.length * 3)
    };
  } catch (_) {
    return { robotsTxtFound: false, blockedAICrawlers: [], allAIBotsAllowed: true, score: 10 };
  }
}
```

#### Meta Robots Tag

```js
function checkMetaRobots($) {
  const metaRobots = $('meta[name="robots"]').attr('content') || '';
  const isNoIndex = metaRobots.toLowerCase().includes('noindex');
  const isNoFollow = metaRobots.toLowerCase().includes('nofollow');

  return {
    metaRobotsContent: metaRobots || null,
    isNoIndex,
    isNoFollow,
    score: isNoIndex ? 0 : 10
  };
}
```

---

## Putting It All Together

```js
async function getAIReadinessScore(url) {
  const { html, $ } = await fetchPage(url);
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  const results = {
    url,
    timestamp: new Date().toISOString(),
    signals: {
      h1: checkH1($),
      headingHierarchy: checkHeadingHierarchy($),
      faqContent: checkFAQContent($),
      contentPlacement: checkContentPlacement($),
      readability: fleschKincaid(bodyText),
      sentenceLength: checkSentenceLength(bodyText),
      author: checkAuthor($),
      date: checkDate($),
      trustPages: checkTrustPages($, html),
      outboundLinks: checkOutboundLinks($, url),
      structuredData: checkStructuredData($),
      metaTags: checkMetaTags($),
      metaRobots: checkMetaRobots($),
      robotsTxt: await checkRobotsTxt(url)
    }
  };

  // Calculate total score
  const scores = Object.values(results.signals).map(s => s?.score || 0);
  const total = scores.reduce((a, b) => a + b, 0);
  const maxScore = 148; // sum of all max scores above

  results.aiReadinessScore = Math.round((total / maxScore) * 100);
  results.grade = scoreGrade(results.aiReadinessScore);

  return results;
}

function scoreGrade(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}
```

---

## Score Breakdown

| Category | Signal | Max Score |
|---|---|---|
| Content Structure | H1 presence | 10 |
| Content Structure | Heading hierarchy | 10 |
| Content Structure | FAQ/Q&A sections | 15 |
| Content Structure | Content front-loaded | 10 |
| Readability | Sentence length | 10 |
| Authority | Author present | 10 |
| Authority | Date present & recent | 10 |
| Authority | Trust pages | 9 |
| Authority | Outbound links | 10 |
| Structured Data | JSON-LD / Schema | 20 |
| Structured Data | Meta tags | 9 |
| Crawlability | Meta robots | 10 |
| Crawlability | Robots.txt AI bots | 15 |
| **Total** | | **148** |

---

## Adding the LLM Layer Later

When you're ready to integrate an LLM, you can pass the scraped `bodyText` and your signal results directly to the API:

```js
async function getLLMAssessment(bodyText, signals) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `
          You are an AI readiness auditor. Analyse this webpage content and return a JSON object with:
          - citationLikelihood: 1-10 score for how likely an AI would cite this page
          - primaryQuestion: the single question this page best answers
          - missingElements: array of up to 5 things that would improve AI perception
          - trustAssessment: brief sentence on how trustworthy the content appears

          Page content:
          ${bodyText.substring(0, 3000)}

          Existing signals:
          ${JSON.stringify(signals, null, 2)}

          Respond with JSON only.
        `
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}
```

---

## Suggested Output Structure

```json
{
  "url": "https://example.com/page",
  "timestamp": "2026-03-18T10:00:00Z",
  "aiReadinessScore": 74,
  "grade": "Good",
  "signals": {
    "structuredData": { "hasStructuredData": true, "schemaTypes": ["FAQPage"], "score": 20 },
    "author": { "hasAuthor": false, "score": 0 },
    "date": { "hasDate": true, "isRecent": true, "score": 10 }
  },
  "llmAssessment": {
    "citationLikelihood": 7,
    "primaryQuestion": "How do I set up a Node.js server?",
    "missingElements": ["No author identified", "No outbound citations"],
    "trustAssessment": "Content is clear and well-structured but lacks author attribution."
  }
}
```

---

## References

- [Google Search Central — Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Schema.org — Full Type Hierarchy](https://schema.org/docs/full.html)
- [Flesch-Kincaid Readability Tests](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests)
- [Google's AI Overviews & GEO](https://searchengineland.com/generative-engine-optimization-geo)
- [Anthropic API Docs](https://docs.anthropic.com)