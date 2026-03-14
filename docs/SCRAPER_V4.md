# Scraper V4 - Hybrid Fast Fetch + Playwright Architecture

## Executive Summary

SCRAPER_V4 introduces a hybrid crawling architecture that intelligently combines fast native HTTP fetching with Playwright-based browser automation. This approach reduces resource consumption and crawl time by **60-80%** for pages that don't require JavaScript execution, while maintaining full browser capabilities when needed.

### Key Insight

The SEO engine already uses **Cheerio** for static HTML parsing - it doesn't need Playwright at all. The opportunity is to skip the browser entirely for pages that don't require JavaScript rendering.

### Performance Gains

| Scenario | Current (100% Playwright) | Hybrid V4 | Improvement |
|----------|---------------------------|-----------|-------------|
| SEO-only, static site | ~2s/page, 200MB | ~200ms/page, 30MB | **70% faster, 85% less memory** |
| SEO+Security, static site | ~2s/page, 200MB | ~200ms/page, 30MB | **70% faster, 85% less memory** |
| Full audit, static site | ~2s/page, 200MB | ~1.7s/page, 180MB | **15% faster** |
| Full audit, SPA | ~2s/page, 200MB | ~2s/page, 200MB | No change |
| Mixed site (50% static) | ~2s/page, 200MB | ~1.1s/page, 115MB | **45% faster** |

---

## Part 1: Architecture Overview

### Two-Phase Fetching Model

```
                         ┌─────────────────────────┐
                         │      AuditWorker        │
                         └───────────┬─────────────┘
                                     │
                         ┌───────────▼─────────────┐
                         │    HybridCrawlerService │
                         │  (Orchestrates strategy) │
                         └───────────┬─────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
    │   FastFetcher     │  │   SPADetector     │  │ PlaywrightFetcher │
    │ (fetch + Cheerio) │  │ (Analyze HTML)    │  │ (existing Spider) │
    └─────────┬─────────┘  └───────────────────┘  └─────────┬─────────┘
              │                                             │
              └─────────────────┬───────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    CrawlResult        │
                    │ (Unified result type) │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼────────┐ ┌──────▼──────┐ ┌───────▼───────┐
    │  Static Engines  │ │ Browser     │ │  Security     │
    │  (SEO)           │ │ Engines     │ │  Engine       │
    │                  │ │ (A11y,Perf) │ │  (Static)     │
    └──────────────────┘ └─────────────┘ └───────────────┘
```

### Decision Flow

```
Start: URL to crawl
    │
    ▼
┌─────────────────────────────────────────┐
│ Is Accessibility or Performance enabled? │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ Yes               │ No
        ▼                   ▼
    Browser Required    ┌───────────────┐
    (still try fast     │  Fast Fetch   │
     fetch first for    │  HTML + Parse │
     HTML extraction)   └───────┬───────┘
                                │
                        ┌───────▼───────┐
                        │ SPA Detected? │
                        └───────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │ Yes                   │ No
                    ▼                       ▼
            ┌───────────────┐       ┌───────────────┐
            │  Playwright   │       │ Fast Fetch    │
            │  Full Render  │       │ Sufficient!   │
            └───────────────┘       └───────────────┘
```

---

## Part 2: Fast Fetch Mode

### 2.1 FastFetcherService

**File:** `server/src/services/spider/fast-fetcher.service.ts`

```typescript
export interface FastFetchOptions {
  timeout?: number;           // Default: 10000ms
  maxRedirects?: number;      // Default: 5
  headers?: Record<string, string>;
}

export interface FastFetchResult {
  url: string;
  normalizedUrl: string;
  statusCode: number;
  contentType: string;
  responseTimeMs: number;
  pageSizeBytes: number;
  html: string;
  headers: Record<string, string>;
  cookies: CookieInfo[];
  redirectChain: RedirectHop[];

  // SPA detection results
  spaDetection: SPADetectionResult;

  // Cheerio instance for analysis
  $: cheerio.Root;
}

export class FastFetcherService {
  constructor(
    private urlNormalizer: UrlNormalizerService,
    private rateLimiter: DomainRateLimiter,
    private spaDetector: SPADetectorService
  ) {}

  async fetch(url: string, options?: FastFetchOptions): Promise<FastFetchResult> {
    const startTime = Date.now();
    const normalizedUrl = this.urlNormalizer.normalize(url);

    // Wait for rate limit
    await this.rateLimiter.waitForSlot(new URL(url).hostname);

    // Build stealth headers
    const headers = this.buildStealthHeaders(options?.headers);

    // Fetch with redirect tracking
    const { response, redirectChain } = await this.fetchWithRedirects(
      url,
      headers,
      options?.maxRedirects ?? 5,
      options?.timeout ?? 10000
    );

    const html = await response.text();
    const responseTimeMs = Date.now() - startTime;

    // Parse with Cheerio
    const $ = cheerio.load(html);

    // Extract cookies from headers
    const cookies = this.parseCookies(response.headers, new URL(url).hostname);

    // Detect SPA
    const spaDetection = this.spaDetector.detect(html, $);

    return {
      url,
      normalizedUrl,
      statusCode: response.status,
      contentType: response.headers.get('content-type') || '',
      responseTimeMs,
      pageSizeBytes: html.length,
      html,
      headers: Object.fromEntries(response.headers.entries()),
      cookies,
      redirectChain,
      spaDetection,
      $,
    };
  }
}
```

### 2.2 Stealth Headers

Reuse existing `user-agents.service.ts` fingerprinting for consistent headers:

```typescript
private buildStealthHeaders(custom?: Record<string, string>): Headers {
  const fingerprint = generateBrowserFingerprint();

  return new Headers({
    'User-Agent': fingerprint.userAgent.userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': fingerprint.locale.acceptLanguage,
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-CH-UA': fingerprint.userAgent.secChUa,
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': `"${fingerprint.userAgent.platform}"`,
    'Upgrade-Insecure-Requests': '1',
    ...custom,
  });
}
```

### 2.3 Cookie Extraction

Parse `Set-Cookie` headers into the existing `CookieInfo` format:

```typescript
private parseCookies(headers: Headers, domain: string): CookieInfo[] {
  const cookies: CookieInfo[] = [];

  // Get all Set-Cookie headers
  const setCookieHeaders = headers.getSetCookie?.() || [];

  for (const cookieStr of setCookieHeaders) {
    const parsed = this.parseCookieString(cookieStr, domain);
    if (parsed) cookies.push(parsed);
  }

  return cookies;
}

private parseCookieString(cookieStr: string, defaultDomain: string): CookieInfo | null {
  const parts = cookieStr.split(';').map(p => p.trim());
  if (parts.length === 0) return null;

  const [nameValue, ...attributes] = parts;
  const [name, ...valueParts] = nameValue.split('=');
  const value = valueParts.join('=');

  const cookie: CookieInfo = {
    name: name.trim(),
    value: value,
    domain: defaultDomain,
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: null,
    expires: null,
  };

  for (const attr of attributes) {
    const [key, val] = attr.split('=').map(s => s.trim());
    const keyLower = key.toLowerCase();

    switch (keyLower) {
      case 'domain':
        cookie.domain = val || defaultDomain;
        break;
      case 'path':
        cookie.path = val || '/';
        break;
      case 'secure':
        cookie.secure = true;
        break;
      case 'httponly':
        cookie.httpOnly = true;
        break;
      case 'samesite':
        cookie.sameSite = val as 'Strict' | 'Lax' | 'None';
        break;
      case 'expires':
        cookie.expires = new Date(val);
        break;
      case 'max-age':
        cookie.expires = new Date(Date.now() + parseInt(val) * 1000);
        break;
    }
  }

  return cookie;
}
```

### 2.4 Redirect Chain Tracking

```typescript
private async fetchWithRedirects(
  url: string,
  headers: Headers,
  maxRedirects: number,
  timeout: number
): Promise<{ response: Response; redirectChain: RedirectHop[] }> {
  const redirectChain: RedirectHop[] = [];
  let currentUrl = url;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    for (let i = 0; i <= maxRedirects; i++) {
      const response = await fetch(currentUrl, {
        headers,
        redirect: 'manual',  // Handle redirects manually
        signal: controller.signal,
      });

      // Check for redirect
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;

        const nextUrl = new URL(location, currentUrl).href;

        redirectChain.push({
          url: currentUrl,
          statusCode: response.status,
          redirectUrl: nextUrl,
        });

        currentUrl = nextUrl;
        continue;
      }

      return { response, redirectChain };
    }

    throw new Error(`Too many redirects (max: ${maxRedirects})`);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## Part 3: SPA Detection

### 3.1 SPADetectorService

**File:** `server/src/services/spider/spa-detector.service.ts`

```typescript
export interface SPAIndicator {
  type: 'noscript-content' | 'empty-body' | 'framework-marker' |
        'root-container' | 'client-routing' | 'loading-indicator' | 'minimal-html';
  evidence: string;
  weight: number;  // 0-10
}

export interface SPADetectionResult {
  needsBrowser: boolean;
  score: number;              // 0-10 composite score
  confidence: 'high' | 'medium' | 'low';
  indicators: SPAIndicator[];
  detectedFramework: string | null;
}

export class SPADetectorService {
  private readonly BROWSER_THRESHOLD = 6;  // Score >= 6 triggers Playwright

  detect(html: string, $: cheerio.Root): SPADetectionResult {
    const indicators: SPAIndicator[] = [];

    // 1. Check noscript content
    this.checkNoscriptContent($, indicators);

    // 2. Check body content density
    this.checkBodyContent($, indicators);

    // 3. Detect SPA frameworks
    const frameworks = this.detectFrameworks(html, $);
    for (const fw of frameworks) {
      indicators.push({
        type: 'framework-marker',
        evidence: fw,
        weight: 7,
      });
    }

    // 4. Check for empty root containers
    this.checkRootContainers($, indicators);

    // 5. Check for client-side routing
    this.checkClientRouting(html, $, indicators);

    // 6. Check for loading indicators
    this.checkLoadingIndicators($, indicators);

    // Calculate composite score (capped at 10)
    const score = Math.min(10, indicators.reduce((sum, i) => sum + i.weight, 0));

    return {
      needsBrowser: score >= this.BROWSER_THRESHOLD,
      score,
      confidence: score >= 8 ? 'high' : score >= 5 ? 'medium' : 'low',
      indicators,
      detectedFramework: frameworks[0] || null,
    };
  }
}
```

### 3.2 Detection Indicators

#### Noscript Content Check

```typescript
private checkNoscriptContent($: cheerio.Root, indicators: SPAIndicator[]): void {
  const noscriptContent = $('noscript').text().toLowerCase();

  const jsRequiredPhrases = [
    'enable javascript',
    'requires javascript',
    'javascript is required',
    'javascript must be enabled',
    'please enable javascript',
    'you need to enable javascript',
  ];

  for (const phrase of jsRequiredPhrases) {
    if (noscriptContent.includes(phrase)) {
      indicators.push({
        type: 'noscript-content',
        evidence: phrase,
        weight: 8,
      });
      return;  // Only add once
    }
  }
}
```

#### Body Content Density Check

```typescript
private checkBodyContent($: cheerio.Root, indicators: SPAIndicator[]): void {
  const body = $('body');
  const childCount = body.children().length;
  const textContent = body.text().replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(w => w.length > 0).length;

  // Very minimal content suggests JS-rendered
  if (childCount <= 3 && wordCount < 50) {
    indicators.push({
      type: 'empty-body',
      evidence: `${childCount} elements, ${wordCount} words`,
      weight: 9,
    });
  } else if (wordCount < 100) {
    indicators.push({
      type: 'minimal-html',
      evidence: `${wordCount} words (threshold: 100)`,
      weight: 5,
    });
  }
}
```

#### Framework Detection

```typescript
detectFrameworks(html: string, $: cheerio.Root): string[] {
  const detected: string[] = [];

  // Next.js
  if (html.includes('__NEXT_DATA__') || $('#__next').length > 0) {
    detected.push('Next.js');
  }

  // Nuxt.js
  if (html.includes('__NUXT__') || $('#__nuxt').length > 0) {
    detected.push('Nuxt.js');
  }

  // React (generic, client-rendered)
  if ($('[data-reactroot]').length > 0 || html.includes('_reactRootContainer')) {
    detected.push('React');
  }

  // Vue.js
  if ($('[data-v-app]').length > 0 || $('[id="app"][data-v-]').length > 0) {
    detected.push('Vue.js');
  }

  // Angular
  if ($('[ng-version]').length > 0 || $('[ng-app]').length > 0) {
    detected.push('Angular');
  }

  // Svelte
  if ($('[class*="svelte-"]').length > 0) {
    detected.push('Svelte');
  }

  // SvelteKit
  if ($('#svelte').length > 0 || html.includes('__sveltekit')) {
    detected.push('SvelteKit');
  }

  // Gatsby
  if ($('#___gatsby').length > 0) {
    detected.push('Gatsby');
  }

  // Remix
  if (html.includes('__remixContext') || html.includes('__remixManifest')) {
    detected.push('Remix');
  }

  // Astro (with client islands)
  if ($('astro-island').length > 0) {
    detected.push('Astro');
  }

  // Qwik
  if (html.includes('qwik/json') || $('[q\\:container]').length > 0) {
    detected.push('Qwik');
  }

  // Solid.js
  if (html.includes('_$HY')) {
    detected.push('Solid.js');
  }

  return detected;
}
```

#### Root Container Check

```typescript
private checkRootContainers($: cheerio.Root, indicators: SPAIndicator[]): void {
  const rootContainers = [
    '#root',
    '#app',
    '#__next',
    '#__nuxt',
    '#___gatsby',
    '#svelte',
    '[data-reactroot]',
  ];

  for (const selector of rootContainers) {
    const container = $(selector);
    if (container.length > 0) {
      const childCount = container.children().length;
      const textLength = container.text().trim().length;

      // Empty or nearly empty root container
      if (childCount <= 2 && textLength < 100) {
        indicators.push({
          type: 'root-container',
          evidence: `${selector}: ${childCount} children, ${textLength} chars`,
          weight: 8,
        });
        return;  // Only add once
      }
    }
  }
}
```

#### Client Routing Check

```typescript
private checkClientRouting(html: string, $: cheerio.Root, indicators: SPAIndicator[]): void {
  const routerPatterns = [
    'react-router',
    'vue-router',
    '@angular/router',
    'history.pushState',
    'window.history.pushState',
  ];

  for (const pattern of routerPatterns) {
    if (html.includes(pattern)) {
      indicators.push({
        type: 'client-routing',
        evidence: pattern,
        weight: 4,
      });
      return;
    }
  }
}
```

#### Loading Indicator Check

```typescript
private checkLoadingIndicators($: cheerio.Root, indicators: SPAIndicator[]): void {
  const loadingSelectors = [
    '.loading',
    '.spinner',
    '.skeleton',
    '.loader',
    '[aria-busy="true"]',
    '[data-loading]',
    '.placeholder',
  ];

  for (const selector of loadingSelectors) {
    if ($(selector).length > 0) {
      indicators.push({
        type: 'loading-indicator',
        evidence: selector,
        weight: 3,
      });
      return;
    }
  }
}
```

### 3.3 Framework Detection Reference

| Framework | Primary Markers | Secondary Markers |
|-----------|-----------------|-------------------|
| **Next.js** | `__NEXT_DATA__` script, `#__next` | `next/` in scripts |
| **Nuxt.js** | `__NUXT__` script, `#__nuxt` | `nuxt/` in scripts |
| **React** | `data-reactroot`, `_reactRootContainer` | React DevTools hook |
| **Vue.js** | `data-v-app`, `data-v-*` attrs | `Vue.config` |
| **Angular** | `ng-version`, `ng-app` | `angular.js` scripts |
| **Svelte** | `class="svelte-*"` | Svelte component markers |
| **SvelteKit** | `#svelte`, `__sveltekit` | SvelteKit manifest |
| **Gatsby** | `#___gatsby` | Gatsby manifest |
| **Remix** | `__remixContext`, `__remixManifest` | Remix routes |
| **Astro** | `<astro-island>` | Astro islands |
| **Qwik** | `qwik/json`, `q:container` | Qwik serialization |
| **Solid.js** | `_$HY` marker | Solid hydration |

---

## Part 4: HybridCrawlerService

### 4.1 Service Implementation

**File:** `server/src/services/spider/hybrid-crawler.service.ts`

```typescript
export interface HybridCrawlConfig {
  // Audit engine toggles
  checkSeo: boolean;
  checkAccessibility: boolean;
  checkSecurity: boolean;
  checkPerformance: boolean;

  // Crawl mode override
  crawlMode: 'auto' | 'fast-only' | 'browser-only';

  // SPA detection threshold (0-10)
  spaDetectionThreshold: number;

  // URL pattern overrides
  forceBrowserPatterns: string[];  // Always use Playwright
  skipBrowserPatterns: string[];   // Never use Playwright
}

export interface HybridCrawlResult extends CrawlResult {
  crawlMode: 'fast' | 'browser';
  spaDetection: SPADetectionResult;
  playwrightPage: Page | null;  // Available for a11y/perf engines
}

export class HybridCrawlerService {
  private fastFetcher: FastFetcherService;
  private playwrightFetcher: SpiderService;
  private spaDetector: SPADetectorService;
  private config: HybridCrawlConfig;

  async crawlPage(url: string): Promise<HybridCrawlResult> {
    // Step 1: Check if browser is absolutely required
    const browserRequired = this.isBrowserRequired();

    // Step 2: Try fast fetch (unless browser-only mode)
    if (this.config.crawlMode !== 'browser-only') {
      try {
        const fastResult = await this.fastFetcher.fetch(url);

        // Check for challenge/bot detection pages
        if (this.isChallengeResponse(fastResult)) {
          return this.fallbackToPlaywright(url, 'challenge_detected');
        }

        // Check if fast fetch is sufficient
        if (this.isFastFetchSufficient(fastResult)) {
          return this.toHybridResult(fastResult, 'fast');
        }

        // SPA detected, need browser
        if (browserRequired || fastResult.spaDetection.needsBrowser) {
          return this.escalateToPlaywright(url, fastResult);
        }

        // Fast fetch is sufficient
        return this.toHybridResult(fastResult, 'fast');

      } catch (error) {
        // Network error, try Playwright as fallback
        if (this.shouldFallbackOnError(error)) {
          return this.fallbackToPlaywright(url, 'fetch_error');
        }
        throw error;
      }
    }

    // Step 3: Browser-only mode or escalation
    return this.fallbackToPlaywright(url, 'browser_only_mode');
  }

  private isBrowserRequired(): boolean {
    // Accessibility requires Playwright for axe-core injection
    if (this.config.checkAccessibility) return true;

    // Performance requires Playwright for Core Web Vitals
    if (this.config.checkPerformance) return true;

    return false;
  }

  private isFastFetchSufficient(result: FastFetchResult): boolean {
    // Check URL pattern overrides
    for (const pattern of this.config.forceBrowserPatterns) {
      if (this.matchPattern(result.url, pattern)) return false;
    }

    for (const pattern of this.config.skipBrowserPatterns) {
      if (this.matchPattern(result.url, pattern)) return true;
    }

    // In auto mode, respect SPA detection
    if (this.config.crawlMode === 'auto') {
      return result.spaDetection.score < this.config.spaDetectionThreshold;
    }

    // fast-only mode
    return this.config.crawlMode === 'fast-only';
  }

  private isChallengeResponse(result: FastFetchResult): boolean {
    // Reuse existing patterns from spider.service.ts
    const challengePatterns = [
      /please wait while your request is being verified/i,
      /checking your browser/i,
      /just a moment/i,
      /verifying you are human/i,
      /ddos protection/i,
      /attention required/i,
      /cf-browser-verification/i,
      /cloudflare ray id/i,
    ];

    return challengePatterns.some(p => p.test(result.html));
  }
}
```

### 4.2 Escalation to Playwright

When fast fetch detects an SPA or challenge page:

```typescript
private async escalateToPlaywright(
  url: string,
  fastResult: FastFetchResult
): Promise<HybridCrawlResult> {
  // Launch Playwright with the knowledge that we need JS rendering
  const browserResult = await this.playwrightFetcher.crawlPage(url);

  return {
    ...browserResult,
    crawlMode: 'browser',
    spaDetection: fastResult.spaDetection,
    playwrightPage: this.browserRequired ?
      await this.playwrightFetcher.getCurrentPage() : null,
  };
}

private async fallbackToPlaywright(
  url: string,
  reason: 'challenge_detected' | 'fetch_error' | 'browser_only_mode'
): Promise<HybridCrawlResult> {
  const browserResult = await this.playwrightFetcher.crawlPage(url);

  return {
    ...browserResult,
    crawlMode: 'browser',
    spaDetection: {
      needsBrowser: true,
      score: 10,
      confidence: 'high',
      indicators: [{ type: 'framework-marker', evidence: reason, weight: 10 }],
      detectedFramework: null,
    },
    playwrightPage: this.browserRequired ?
      await this.playwrightFetcher.getCurrentPage() : null,
  };
}
```

---

## Part 5: Integration with AuditWorker

### 5.1 Modified AuditWorkerService

**File:** `server/src/services/queue/audit-worker.service.ts`

```typescript
private async runAudit(job: AuditJob): Promise<void> {
  // ... existing setup ...

  // NEW: Build hybrid crawl config from job settings
  const hybridConfig: HybridCrawlConfig = {
    checkSeo: job.check_seo,
    checkAccessibility: job.check_accessibility,
    checkSecurity: job.check_security,
    checkPerformance: job.check_performance,
    crawlMode: job.crawl_mode || 'auto',
    spaDetectionThreshold: job.spa_detection_threshold || 6,
    forceBrowserPatterns: job.force_browser_patterns || [],
    skipBrowserPatterns: job.skip_browser_patterns || [],
  };

  // NEW: Create hybrid crawler
  const hybridCrawler = new HybridCrawlerService(
    new FastFetcherService(urlNormalizer, rateLimiter, spaDetector),
    spider,  // Existing SpiderService
    spaDetector,
    hybridConfig
  );

  // ... in the crawl loop ...

  for (const queueItem of batch) {
    try {
      // NEW: Use hybrid crawler
      const crawlResult = await hybridCrawler.crawlPage(queueItem.url);

      // Track which mode was used
      await this.updatePageCrawlMode(
        pageId,
        crawlResult.crawlMode,
        crawlResult.spaDetection.detectedFramework
      );

      // Run audit engines
      // Note: playwrightPage is null for fast-only crawls
      const findings = await this.auditCoordinator.analyzePage(
        crawlResult,
        crawlResult.playwrightPage,  // May be null
        auditConfig,
        queueItem.depth
      );

      // ... store findings ...

    } catch (error) {
      // ... error handling ...
    }
  }
}
```

### 5.2 AuditEngineCoordinator Compatibility

The coordinator already handles `page: Page | null`:

```typescript
// In audit-engines/index.ts
async analyzePage(
  crawlResult: CrawlResult,
  page: Page | null,  // Already optional
  config: AuditConfig,
  depth: number
): Promise<Finding[]> {
  const findings: Finding[] = [];

  // SEO engine: Only needs HTML (Cheerio)
  if (config.checkSeo) {
    const seoFindings = await this.seoEngine.analyze(crawlResult, depth);
    findings.push(...seoFindings);
  }

  // Security engine: Only needs HTML + headers
  if (config.checkSecurity) {
    const securityFindings = await this.securityEngine.analyze(crawlResult);
    findings.push(...securityFindings);
  }

  // Accessibility engine: Requires Playwright page
  if (config.checkAccessibility && page) {
    const a11yFindings = await this.accessibilityEngine.analyze(page, crawlResult.url);
    findings.push(...a11yFindings);
  }

  // Performance engine: Some checks need page, some are static
  if (config.checkPerformance) {
    const perfFindings = await this.performanceEngine.analyze(crawlResult, page);
    findings.push(...perfFindings);
  }

  return findings;
}
```

---

## Part 6: Configuration Schema

### 6.1 Database Migrations

```sql
-- Migration: 026_hybrid_crawler.sql

-- Add crawl mode configuration to audit_jobs
ALTER TABLE audit_jobs
  ADD COLUMN crawl_mode VARCHAR(20) DEFAULT 'auto';
  -- Values: 'auto' | 'fast-only' | 'browser-only'

ALTER TABLE audit_jobs
  ADD COLUMN spa_detection_threshold INTEGER DEFAULT 6;
  -- Range: 0-10, lower = more aggressive fast fetch

ALTER TABLE audit_jobs
  ADD COLUMN force_browser_patterns TEXT[];
  -- URL patterns that always use Playwright

ALTER TABLE audit_jobs
  ADD COLUMN skip_browser_patterns TEXT[];
  -- URL patterns that never use Playwright

-- Add crawl mode tracking to audit_pages
ALTER TABLE audit_pages
  ADD COLUMN crawl_mode_used VARCHAR(20);
  -- Values: 'fast' | 'browser'

ALTER TABLE audit_pages
  ADD COLUMN spa_detected BOOLEAN DEFAULT false;

ALTER TABLE audit_pages
  ADD COLUMN spa_framework VARCHAR(50);
  -- Detected framework name, e.g., 'Next.js', 'React'

ALTER TABLE audit_pages
  ADD COLUMN spa_detection_score INTEGER;
  -- 0-10 score from SPA detector

-- Index for analytics
CREATE INDEX idx_audit_pages_crawl_mode
  ON audit_pages(audit_job_id, crawl_mode_used);
```

### 6.2 API Types

```typescript
// In audit.types.ts

export interface StartAuditInput {
  targetUrl: string;
  options?: {
    // Existing options...
    checkSeo?: boolean;
    checkAccessibility?: boolean;
    checkSecurity?: boolean;
    checkPerformance?: boolean;
    maxPages?: number;
    maxDepth?: number;

    // NEW: Hybrid crawler options
    crawlMode?: 'auto' | 'fast-only' | 'browser-only';
    spaDetectionThreshold?: number;
    forceBrowserPatterns?: string[];
    skipBrowserPatterns?: string[];
  };
}

export interface AuditPageResult {
  // Existing fields...
  url: string;
  statusCode: number;
  crawlStatus: 'crawled' | 'failed' | 'pending';

  // NEW: Hybrid crawl info
  crawlModeUsed?: 'fast' | 'browser';
  spaDetected?: boolean;
  spaFramework?: string;
  spaDetectionScore?: number;
}
```

### 6.3 User-Facing Configuration UI

```typescript
// Frontend types

interface CrawlModeOption {
  value: 'auto' | 'fast-only' | 'browser-only';
  label: string;
  description: string;
  recommended?: boolean;
}

const CRAWL_MODE_OPTIONS: CrawlModeOption[] = [
  {
    value: 'auto',
    label: 'Smart Mode',
    description: 'Automatically detects SPAs and uses browser only when needed. Recommended for most sites.',
    recommended: true,
  },
  {
    value: 'fast-only',
    label: 'Fast Mode',
    description: 'Never uses browser rendering. Best for static sites. May miss dynamic content.',
  },
  {
    value: 'browser-only',
    label: 'Full Browser',
    description: 'Always uses browser rendering. Slowest but most accurate for JavaScript-heavy sites.',
  },
];
```

---

## Part 7: Error Handling & Fallback

### 7.1 Error Classification

Extend existing `error-classifier.service.ts`:

```typescript
// Add new error types for hybrid mode
export enum CrawlErrorType {
  // Existing types...

  // NEW: Hybrid-specific
  FAST_FETCH_TIMEOUT = 'FAST_FETCH_TIMEOUT',
  FAST_FETCH_NETWORK = 'FAST_FETCH_NETWORK',
  SPA_DETECTION_ESCALATION = 'SPA_DETECTION_ESCALATION',
  CHALLENGE_PAGE_ESCALATION = 'CHALLENGE_PAGE_ESCALATION',
}
```

### 7.2 Fallback Decision Matrix

| Fast Fetch Result | Action |
|-------------------|--------|
| Success, no SPA indicators | Use fast fetch result |
| Success, SPA detected | Escalate to Playwright |
| Challenge page detected | Escalate to Playwright |
| Network timeout | Fallback to Playwright |
| DNS failure | Error (no fallback) |
| HTTP 403/429 | Fallback to Playwright |
| HTTP 404 | Use fast fetch result (page doesn't exist) |
| HTTP 5xx | Retry, then fallback to Playwright |

### 7.3 Retry Logic

```typescript
private async crawlWithRetry(url: string, maxRetries: number = 2): Promise<HybridCrawlResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await this.crawlPage(url);
    } catch (error) {
      lastError = error as Error;

      // Don't retry DNS failures or 404s
      if (this.isNonRetryableError(error)) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  throw lastError;
}
```

---

## Part 8: New Files Summary

### Files to Create

| File | Purpose | ~Lines |
|------|---------|--------|
| `server/src/services/spider/fast-fetcher.service.ts` | Native fetch + Cheerio | 250 |
| `server/src/services/spider/spa-detector.service.ts` | SPA/framework detection | 200 |
| `server/src/services/spider/hybrid-crawler.service.ts` | Orchestration | 300 |
| `server/src/db/migrations/026_hybrid_crawler.sql` | DB schema | 30 |

### Files to Modify

| File | Changes |
|------|---------|
| `server/src/services/spider/index.ts` | Export new services |
| `server/src/services/queue/audit-worker.service.ts` | Use HybridCrawlerService |
| `server/src/types/spider.types.ts` | Add hybrid types |
| `server/src/types/audit.types.ts` | Add crawl mode options |

---

## Part 9: Implementation Priority

### Phase 1: Core Services
1. Create `spa-detector.service.ts` with framework detection
2. Create `fast-fetcher.service.ts` with stealth headers
3. Add unit tests for SPA detection accuracy

### Phase 2: Orchestration
4. Create `hybrid-crawler.service.ts`
5. Implement decision tree and fallback logic
6. Add integration tests

### Phase 3: Integration
7. Database migration for crawl mode tracking
8. Update `audit-worker.service.ts` to use hybrid crawler
9. Add API types for configuration

### Phase 4: Testing & Tuning
10. Benchmark against known static vs SPA sites
11. Tune SPA detection thresholds
12. Performance comparison metrics

---

## Part 10: Verification & Testing

### Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Static HTML site (e.g., blog) | 100% fast fetch, ~70% faster |
| Next.js SSR site | Fast fetch detects Next.js, escalates |
| React SPA (create-react-app) | Fast fetch detects empty #root, escalates |
| Cloudflare-protected site | Fast fetch detects challenge, escalates |
| Mixed site (static + SPA sections) | Per-page decision based on content |
| SEO-only audit on static site | Never launches Playwright |
| Accessibility audit on any site | Always uses Playwright |

### Benchmark Targets

| Metric | Static Site | SPA Site |
|--------|-------------|----------|
| Pages/minute (SEO only) | 200+ | 30-50 |
| Memory per worker | <100MB | <300MB |
| SPA detection accuracy | N/A | >95% |
| False positive rate (wrongly skipping browser) | <5% | N/A |

---

## Appendix A: Challenge Page Patterns

Inherited from `spider.service.ts`:

```typescript
const CHALLENGE_PAGE_PATTERNS = [
  /please wait while your request is being verified/i,
  /checking your browser/i,
  /just a moment/i,
  /verifying you are human/i,
  /please wait\.\.\./i,
  /ddos protection/i,
  /attention required/i,
  /one more step/i,
  /please complete the security check/i,
  /ray id/i,
  /cf-browser-verification/i,
  /cloudflare/i,
  /sucuri/i,
  /imperva/i,
  /incapsula/i,
  /blocked/i,
  /access denied/i,
  /security check/i,
  /bot detection/i,
  /human verification/i,
];
```

## Appendix B: Comparison with V3

| Feature | SCRAPER_V3 | SCRAPER_V4 |
|---------|------------|------------|
| Primary fetcher | Playwright only | Hybrid (fetch + Playwright) |
| Static site speed | ~2s/page | ~200ms/page |
| Memory usage | High (always browser) | Adaptive |
| SPA handling | Always rendered | Detected & escalated |
| Bot evasion | Playwright stealth | Stealth headers + Playwright fallback |
| Accessibility | Playwright + axe-core | Same (requires browser) |
| Configuration | Basic | Crawl mode, thresholds, patterns |
