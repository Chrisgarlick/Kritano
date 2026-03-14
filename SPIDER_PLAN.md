# pagepulser Spider System - Technical Plan

## Executive Summary

A production-grade web spider system capable of crawling entire websites and performing SEO, accessibility, and security audits. Designed for multi-tenant concurrent execution with proper resource isolation and rate limiting.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React)                                  │
│  [Start Audit] → [Progress Dashboard] → [Results View]                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API SERVER (Express)                              │
│  POST /api/audits/start  →  Creates job, returns audit ID                   │
│  GET  /api/audits/:id    →  Returns audit status & results                  │
│  GET  /api/audits/:id/stream  →  SSE for real-time progress                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JOB QUEUE (PostgreSQL)                             │
│  audit_jobs table with status: pending → processing → completed/failed      │
│  SKIP LOCKED for safe concurrent job claiming                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │  Worker 1   │ │  Worker 2   │ │  Worker N   │
            │ (Playwright)│ │ (Playwright)│ │ (Playwright)│
            └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUDIT ENGINES (Per Page)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │ SEO Engine   │  │ A11y Engine  │  │ Security     │                       │
│  │ - Meta tags  │  │ - Axe-core   │  │ - Headers    │                       │
│  │ - Headings   │  │ - WCAG 2.2   │  │ - Mixed cont │                       │
│  │ - Links      │  │ - Contrast   │  │ - Exposed    │                       │
│  │ - Images     │  │ - ARIA       │  │ - HTTPS      │                       │
│  └──────────────┘  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL DATABASE                                  │
│  audits → audit_pages → audit_findings                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Audit Jobs Table

```sql
-- Main audit job record
CREATE TABLE audit_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Target configuration
    target_url TEXT NOT NULL,
    target_domain TEXT NOT NULL,  -- Extracted domain for scope limiting

    -- Crawl settings
    max_pages INT DEFAULT 100,
    max_depth INT DEFAULT 5,
    respect_robots_txt BOOLEAN DEFAULT TRUE,
    include_subdomains BOOLEAN DEFAULT FALSE,

    -- Audit settings (what to check)
    check_seo BOOLEAN DEFAULT TRUE,
    check_accessibility BOOLEAN DEFAULT TRUE,
    check_security BOOLEAN DEFAULT TRUE,
    check_performance BOOLEAN DEFAULT TRUE,

    -- Job status
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- Progress tracking
    pages_found INT DEFAULT 0,
    pages_crawled INT DEFAULT 0,
    pages_audited INT DEFAULT 0,
    current_url TEXT,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Results summary (denormalized for quick access)
    total_issues INT DEFAULT 0,
    critical_issues INT DEFAULT 0,
    seo_score INT,
    accessibility_score INT,
    security_score INT,
    performance_score INT,

    -- Error handling
    error_message TEXT,
    retry_count INT DEFAULT 0,

    -- Worker assignment
    worker_id TEXT,
    locked_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job queue operations
CREATE INDEX idx_audit_jobs_user_id ON audit_jobs(user_id);
CREATE INDEX idx_audit_jobs_status ON audit_jobs(status);
CREATE INDEX idx_audit_jobs_pending ON audit_jobs(created_at)
    WHERE status = 'pending';
CREATE INDEX idx_audit_jobs_processing ON audit_jobs(locked_at)
    WHERE status = 'processing';
```

### 2.2 Crawled Pages Table

```sql
-- Individual pages discovered and crawled
CREATE TABLE audit_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,

    -- Page identification
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,  -- SHA256 for deduplication

    -- Crawl metadata
    depth INT NOT NULL,
    discovered_from TEXT,  -- Parent URL

    -- HTTP response info
    status_code INT,
    content_type TEXT,
    response_time_ms INT,
    page_size_bytes INT,

    -- Page content (for analysis)
    title TEXT,
    meta_description TEXT,
    canonical_url TEXT,

    -- Crawl status
    crawl_status TEXT DEFAULT 'pending'
        CHECK (crawl_status IN ('pending', 'crawling', 'crawled', 'failed', 'skipped')),
    crawled_at TIMESTAMPTZ,
    error_message TEXT,

    -- Scores for this page
    seo_score INT,
    accessibility_score INT,
    security_score INT,
    performance_score INT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(audit_job_id, url_hash)
);

-- Indexes
CREATE INDEX idx_audit_pages_job_id ON audit_pages(audit_job_id);
CREATE INDEX idx_audit_pages_status ON audit_pages(audit_job_id, crawl_status);
CREATE INDEX idx_audit_pages_url_hash ON audit_pages(url_hash);
```

### 2.3 Audit Findings Table

```sql
-- Individual issues found during audit
CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
    audit_page_id UUID REFERENCES audit_pages(id) ON DELETE CASCADE,

    -- Finding classification
    category TEXT NOT NULL
        CHECK (category IN ('seo', 'accessibility', 'security', 'performance')),
    rule_id TEXT NOT NULL,           -- e.g., 'missing-alt-text', 'no-https'
    rule_name TEXT NOT NULL,         -- Human readable name

    -- Severity
    severity TEXT NOT NULL
        CHECK (severity IN ('critical', 'serious', 'moderate', 'minor', 'info')),

    -- Details
    message TEXT NOT NULL,
    description TEXT,                 -- Longer explanation
    recommendation TEXT,              -- How to fix

    -- Location info
    selector TEXT,                    -- CSS selector if applicable
    line_number INT,
    column_number INT,
    snippet TEXT,                     -- Code snippet showing the issue

    -- For accessibility (axe-core compatibility)
    impact TEXT,
    wcag_criteria TEXT[],             -- e.g., ['1.1.1', '4.1.2']

    -- Metadata
    help_url TEXT,                    -- Link to documentation

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_findings_job_id ON audit_findings(audit_job_id);
CREATE INDEX idx_audit_findings_page_id ON audit_findings(audit_page_id);
CREATE INDEX idx_audit_findings_category ON audit_findings(audit_job_id, category);
CREATE INDEX idx_audit_findings_severity ON audit_findings(audit_job_id, severity);
```

### 2.4 URL Queue Table (for crawler)

```sql
-- URLs discovered but not yet crawled (ephemeral, cleared after audit)
CREATE TABLE crawl_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,

    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,
    depth INT NOT NULL,
    discovered_from TEXT,
    priority INT DEFAULT 0,  -- Higher = crawl first

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(audit_job_id, url_hash)
);

CREATE INDEX idx_crawl_queue_job ON crawl_queue(audit_job_id, priority DESC, created_at);
```

---

## 3. Spider Engine Design

### 3.1 Core Spider Class

```typescript
// server/src/services/spider/spider.service.ts

interface SpiderConfig {
  maxPages: number;
  maxDepth: number;
  maxConcurrentPages: number;  // Concurrent pages per audit
  requestDelayMs: number;       // Delay between requests (politeness)
  timeoutMs: number;            // Page load timeout
  respectRobotsTxt: boolean;
  includeSubdomains: boolean;
  userAgent: string;
}

interface CrawlResult {
  url: string;
  statusCode: number;
  contentType: string;
  responseTimeMs: number;
  html: string;
  links: string[];
  resources: ResourceInfo[];
}

class Spider {
  private config: SpiderConfig;
  private browser: Browser;
  private visitedUrls: Set<string>;
  private robotsTxt: RobotsTxtParser | null;
  private rateLimiter: RateLimiter;

  constructor(config: SpiderConfig) {
    this.config = config;
    this.visitedUrls = new Set();
  }

  async initialize(): Promise<void> {
    // Launch browser with security settings
    this.browser = await playwright.chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }

  async crawlPage(url: string): Promise<CrawlResult> {
    const context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    try {
      // Set timeout
      page.setDefaultTimeout(this.config.timeoutMs);

      // Navigate and wait for network idle
      const startTime = Date.now();
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
      });
      const responseTimeMs = Date.now() - startTime;

      // Extract links
      const links = await this.extractLinks(page, url);

      // Get HTML content
      const html = await page.content();

      return {
        url,
        statusCode: response?.status() || 0,
        contentType: response?.headers()['content-type'] || '',
        responseTimeMs,
        html,
        links,
        resources: await this.extractResources(page),
      };
    } finally {
      await context.close();
    }
  }

  private async extractLinks(page: Page, baseUrl: string): Promise<string[]> {
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.getAttribute('href'))
        .filter(Boolean);
    });

    return links
      .map(link => this.normalizeUrl(link, baseUrl))
      .filter(link => this.isInScope(link));
  }

  private isInScope(url: string): boolean {
    // Check if URL is within crawl scope
    // - Same domain (or subdomain if enabled)
    // - HTTP/HTTPS only
    // - Not in robots.txt disallow
    // - Not a file download (pdf, zip, etc.)
  }

  async shutdown(): Promise<void> {
    await this.browser?.close();
  }
}
```

### 3.2 Crawl Coordinator

```typescript
// server/src/services/spider/coordinator.service.ts

interface AuditProgress {
  pagesFound: number;
  pagesCrawled: number;
  pagesAudited: number;
  currentUrl: string;
  estimatedTimeRemaining: number;
}

class CrawlCoordinator {
  private spider: Spider;
  private auditEngines: AuditEngine[];
  private jobId: string;
  private config: AuditJobConfig;

  async run(job: AuditJob): Promise<void> {
    this.jobId = job.id;

    // 1. Initialize spider
    await this.spider.initialize();

    // 2. Fetch and parse robots.txt
    if (job.respect_robots_txt) {
      await this.loadRobotsTxt(job.target_url);
    }

    // 3. Add seed URL to queue
    await this.addToQueue(job.target_url, 0, null);

    // 4. Process queue until done or limit reached
    while (await this.hasMoreWork() && !this.shouldStop()) {
      const batch = await this.getNextBatch(this.config.concurrentPages);

      await Promise.all(batch.map(url => this.processUrl(url)));

      await this.updateProgress();
    }

    // 5. Calculate final scores
    await this.calculateFinalScores();

    // 6. Cleanup
    await this.spider.shutdown();
  }

  private async processUrl(queueItem: QueueItem): Promise<void> {
    try {
      // Mark as crawling
      await this.updatePageStatus(queueItem.url, 'crawling');

      // Respect rate limiting
      await this.rateLimiter.wait();

      // Crawl the page
      const result = await this.spider.crawlPage(queueItem.url);

      // Store page data
      const pageId = await this.storePage(result, queueItem);

      // Add discovered links to queue
      for (const link of result.links) {
        if (queueItem.depth < this.config.maxDepth) {
          await this.addToQueue(link, queueItem.depth + 1, queueItem.url);
        }
      }

      // Run audits on the page
      await this.runAudits(pageId, result);

      // Mark as complete
      await this.updatePageStatus(queueItem.url, 'crawled');

    } catch (error) {
      await this.handlePageError(queueItem.url, error);
    }
  }

  private async runAudits(pageId: string, crawlResult: CrawlResult): Promise<void> {
    const audits = [];

    if (this.config.checkSeo) {
      audits.push(this.seoEngine.analyze(crawlResult));
    }
    if (this.config.checkAccessibility) {
      audits.push(this.accessibilityEngine.analyze(crawlResult));
    }
    if (this.config.checkSecurity) {
      audits.push(this.securityEngine.analyze(crawlResult));
    }
    if (this.config.checkPerformance) {
      audits.push(this.performanceEngine.analyze(crawlResult));
    }

    const results = await Promise.all(audits);

    // Store findings
    for (const findings of results.flat()) {
      await this.storeFinding(pageId, findings);
    }
  }
}
```

---

## 4. Audit Engines

### 4.1 SEO Engine

```typescript
// server/src/services/audit-engines/seo.engine.ts

interface SeoFinding {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  message: string;
  recommendation: string;
  selector?: string;
  snippet?: string;
}

class SeoEngine {
  private rules: SeoRule[] = [
    // Title checks
    { id: 'missing-title', check: this.checkMissingTitle },
    { id: 'title-too-long', check: this.checkTitleLength },
    { id: 'title-too-short', check: this.checkTitleTooShort },
    { id: 'duplicate-title', check: this.checkDuplicateTitle },

    // Meta description
    { id: 'missing-meta-description', check: this.checkMissingMetaDescription },
    { id: 'meta-description-too-long', check: this.checkMetaDescriptionLength },

    // Headings
    { id: 'missing-h1', check: this.checkMissingH1 },
    { id: 'multiple-h1', check: this.checkMultipleH1 },
    { id: 'heading-hierarchy', check: this.checkHeadingHierarchy },

    // Images
    { id: 'missing-alt-text', check: this.checkMissingAltText },
    { id: 'empty-alt-text', check: this.checkEmptyAltText },

    // Links
    { id: 'broken-internal-link', check: this.checkBrokenInternalLinks },
    { id: 'broken-external-link', check: this.checkBrokenExternalLinks },
    { id: 'no-follow-internal', check: this.checkNoFollowInternal },
    { id: 'orphan-page', check: this.checkOrphanPage },

    // Canonical & Indexing
    { id: 'missing-canonical', check: this.checkMissingCanonical },
    { id: 'noindex-page', check: this.checkNoIndex },

    // Open Graph
    { id: 'missing-og-tags', check: this.checkOpenGraphTags },

    // Structured Data
    { id: 'invalid-structured-data', check: this.checkStructuredData },

    // Content
    { id: 'thin-content', check: this.checkThinContent },
    { id: 'keyword-stuffing', check: this.checkKeywordStuffing },
  ];

  async analyze(page: CrawlResult): Promise<SeoFinding[]> {
    const findings: SeoFinding[] = [];
    const $ = cheerio.load(page.html);

    for (const rule of this.rules) {
      const result = await rule.check($, page);
      if (result) {
        findings.push(...(Array.isArray(result) ? result : [result]));
      }
    }

    return findings;
  }

  // Example rule implementations
  private checkMissingTitle($: CheerioAPI): SeoFinding | null {
    const title = $('title').text().trim();
    if (!title) {
      return {
        ruleId: 'missing-title',
        ruleName: 'Missing Page Title',
        severity: 'critical',
        message: 'Page is missing a <title> tag',
        recommendation: 'Add a unique, descriptive title tag between 30-60 characters',
        selector: 'head',
      };
    }
    return null;
  }

  private checkMissingAltText($: CheerioAPI): SeoFinding[] {
    const findings: SeoFinding[] = [];

    $('img').each((i, el) => {
      const alt = $(el).attr('alt');
      const src = $(el).attr('src');

      if (alt === undefined) {
        findings.push({
          ruleId: 'missing-alt-text',
          ruleName: 'Missing Image Alt Text',
          severity: 'serious',
          message: `Image is missing alt attribute: ${src}`,
          recommendation: 'Add descriptive alt text for accessibility and SEO',
          selector: `img[src="${src}"]`,
          snippet: $.html(el).substring(0, 200),
        });
      }
    });

    return findings;
  }
}
```

### 4.2 Accessibility Engine (Axe-core Integration)

```typescript
// server/src/services/audit-engines/accessibility.engine.ts

import { AxeResults, Result } from 'axe-core';

class AccessibilityEngine {
  async analyze(page: Page): Promise<AccessibilityFinding[]> {
    // Inject and run axe-core
    const results: AxeResults = await page.evaluate(async () => {
      // axe-core is injected via page.addScriptTag
      return await (window as any).axe.run();
    });

    return this.mapAxeResults(results);
  }

  private mapAxeResults(results: AxeResults): AccessibilityFinding[] {
    const findings: AccessibilityFinding[] = [];

    // Map violations
    for (const violation of results.violations) {
      for (const node of violation.nodes) {
        findings.push({
          ruleId: violation.id,
          ruleName: violation.help,
          severity: this.mapImpact(violation.impact),
          message: violation.description,
          recommendation: violation.helpUrl,
          selector: node.target.join(', '),
          snippet: node.html,
          wcagCriteria: violation.tags
            .filter(t => t.startsWith('wcag'))
            .map(t => t.replace('wcag', '')),
          impact: violation.impact,
          helpUrl: violation.helpUrl,
        });
      }
    }

    return findings;
  }

  private mapImpact(impact: string | undefined): Severity {
    switch (impact) {
      case 'critical': return 'critical';
      case 'serious': return 'serious';
      case 'moderate': return 'moderate';
      case 'minor': return 'minor';
      default: return 'info';
    }
  }
}
```

### 4.3 Security Engine

```typescript
// server/src/services/audit-engines/security.engine.ts

class SecurityEngine {
  private rules: SecurityRule[] = [
    // HTTPS
    { id: 'no-https', check: this.checkHttps },
    { id: 'mixed-content', check: this.checkMixedContent },

    // Security Headers
    { id: 'missing-csp', check: this.checkCSP },
    { id: 'missing-hsts', check: this.checkHSTS },
    { id: 'missing-x-frame-options', check: this.checkXFrameOptions },
    { id: 'missing-x-content-type', check: this.checkXContentType },
    { id: 'missing-referrer-policy', check: this.checkReferrerPolicy },
    { id: 'missing-permissions-policy', check: this.checkPermissionsPolicy },

    // Exposed Files
    { id: 'exposed-env', check: this.checkExposedEnv },
    { id: 'exposed-git', check: this.checkExposedGit },
    { id: 'exposed-config', check: this.checkExposedConfig },
    { id: 'exposed-backup', check: this.checkExposedBackup },
    { id: 'directory-listing', check: this.checkDirectoryListing },

    // Cookies
    { id: 'insecure-cookies', check: this.checkInsecureCookies },
    { id: 'missing-httponly', check: this.checkHttpOnlyCookies },
    { id: 'missing-samesite', check: this.checkSameSiteCookies },

    // Forms
    { id: 'form-no-https', check: this.checkFormAction },
    { id: 'autocomplete-password', check: this.checkAutocomplete },

    // Information Disclosure
    { id: 'server-version-exposed', check: this.checkServerVersion },
    { id: 'error-messages-exposed', check: this.checkErrorMessages },

    // CORS
    { id: 'cors-wildcard', check: this.checkCorsWildcard },
  ];

  async analyze(page: CrawlResult, responseHeaders: Headers): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    const $ = cheerio.load(page.html);

    // Check each rule
    for (const rule of this.rules) {
      const result = await rule.check($, page, responseHeaders);
      if (result) {
        findings.push(...(Array.isArray(result) ? result : [result]));
      }
    }

    // Check for exposed sensitive files
    const exposedFiles = await this.probeExposedFiles(page.url);
    findings.push(...exposedFiles);

    return findings;
  }

  private async probeExposedFiles(baseUrl: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    const sensitiveFiles = [
      { path: '/.env', name: 'Environment file' },
      { path: '/.git/config', name: 'Git configuration' },
      { path: '/wp-config.php', name: 'WordPress config' },
      { path: '/config.php', name: 'Config file' },
      { path: '/.htaccess', name: 'Apache config' },
      { path: '/web.config', name: 'IIS config' },
      { path: '/backup.sql', name: 'Database backup' },
      { path: '/dump.sql', name: 'Database dump' },
      { path: '/.DS_Store', name: 'macOS metadata' },
      { path: '/phpinfo.php', name: 'PHP info' },
    ];

    for (const file of sensitiveFiles) {
      try {
        const response = await fetch(new URL(file.path, baseUrl).toString(), {
          method: 'HEAD',
          redirect: 'manual',
        });

        if (response.status === 200) {
          findings.push({
            ruleId: 'exposed-sensitive-file',
            ruleName: 'Exposed Sensitive File',
            severity: 'critical',
            message: `${file.name} is publicly accessible at ${file.path}`,
            recommendation: 'Remove or restrict access to this file immediately',
          });
        }
      } catch {
        // File not accessible, which is good
      }
    }

    return findings;
  }

  private checkMixedContent($: CheerioAPI, page: CrawlResult): SecurityFinding[] {
    if (!page.url.startsWith('https://')) return [];

    const findings: SecurityFinding[] = [];

    // Check for HTTP resources on HTTPS page
    const httpResources = [
      ...$('script[src^="http://"]').toArray(),
      ...$('link[href^="http://"]').toArray(),
      ...$('img[src^="http://"]').toArray(),
      ...$('iframe[src^="http://"]').toArray(),
    ];

    for (const el of httpResources) {
      const src = $(el).attr('src') || $(el).attr('href');
      findings.push({
        ruleId: 'mixed-content',
        ruleName: 'Mixed Content',
        severity: 'serious',
        message: `HTTP resource loaded on HTTPS page: ${src}`,
        recommendation: 'Update all resources to use HTTPS',
        selector: $.html(el).substring(0, 100),
      });
    }

    return findings;
  }
}
```

### 4.4 Performance Engine

```typescript
// server/src/services/audit-engines/performance.engine.ts

class PerformanceEngine {
  async analyze(page: Page, url: string): Promise<PerformanceFinding[]> {
    const findings: PerformanceFinding[] = [];

    // Get Core Web Vitals via Performance API
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve({
            lcp: entries.find(e => e.entryType === 'largest-contentful-paint')?.startTime,
            fid: entries.find(e => e.entryType === 'first-input')?.processingStart,
            cls: entries.find(e => e.entryType === 'layout-shift')?.value,
          });
        });
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    // Check Core Web Vitals thresholds
    if (metrics.lcp > 4000) {
      findings.push({
        ruleId: 'slow-lcp',
        ruleName: 'Slow Largest Contentful Paint',
        severity: 'serious',
        message: `LCP is ${metrics.lcp}ms (should be < 2500ms)`,
        recommendation: 'Optimize images, fonts, and server response time',
      });
    }

    // Check resource sizes
    const resources = await this.analyzeResources(page);
    findings.push(...resources);

    // Optionally call PageSpeed Insights API
    if (process.env.PAGESPEED_API_KEY) {
      const psiResults = await this.callPageSpeedInsights(url);
      findings.push(...psiResults);
    }

    return findings;
  }

  private async analyzeResources(page: Page): Promise<PerformanceFinding[]> {
    const findings: PerformanceFinding[] = [];

    // Check for large images
    const images = await page.evaluate(() => {
      return Array.from(document.images).map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height,
      }));
    });

    for (const img of images) {
      // Check for oversized images
      if (img.naturalWidth > img.displayWidth * 2 || img.naturalHeight > img.displayHeight * 2) {
        findings.push({
          ruleId: 'oversized-image',
          ruleName: 'Oversized Image',
          severity: 'moderate',
          message: `Image is ${img.naturalWidth}x${img.naturalHeight} but displayed at ${img.displayWidth}x${img.displayHeight}`,
          recommendation: 'Resize images to match display size or use responsive images',
          selector: `img[src="${img.src}"]`,
        });
      }
    }

    return findings;
  }
}
```

---

## 5. Job Queue System

### 5.1 PostgreSQL-Based Queue

Using PostgreSQL with `SKIP LOCKED` for safe concurrent job processing (no Redis needed).

```typescript
// server/src/services/queue/job-queue.service.ts

class JobQueueService {
  private workerId: string;
  private isRunning: boolean = false;

  constructor() {
    this.workerId = `worker-${os.hostname()}-${process.pid}`;
  }

  // Claim and process jobs
  async startWorker(): Promise<void> {
    this.isRunning = true;

    while (this.isRunning) {
      const job = await this.claimJob();

      if (job) {
        await this.processJob(job);
      } else {
        // No jobs available, wait before checking again
        await this.sleep(1000);
      }
    }
  }

  // Claim a job using SKIP LOCKED (PostgreSQL advisory locking)
  private async claimJob(): Promise<AuditJob | null> {
    const result = await pool.query<AuditJob>(`
      UPDATE audit_jobs
      SET
        status = 'processing',
        worker_id = $1,
        locked_at = NOW(),
        started_at = COALESCE(started_at, NOW())
      WHERE id = (
        SELECT id FROM audit_jobs
        WHERE status = 'pending'
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
    `, [this.workerId]);

    return result.rows[0] || null;
  }

  private async processJob(job: AuditJob): Promise<void> {
    const coordinator = new CrawlCoordinator(job);

    try {
      await coordinator.run();

      await this.completeJob(job.id);
    } catch (error) {
      await this.failJob(job.id, error.message);
    }
  }

  private async completeJob(jobId: string): Promise<void> {
    await pool.query(`
      UPDATE audit_jobs
      SET
        status = 'completed',
        completed_at = NOW(),
        worker_id = NULL,
        locked_at = NULL
      WHERE id = $1
    `, [jobId]);
  }

  private async failJob(jobId: string, errorMessage: string): Promise<void> {
    await pool.query(`
      UPDATE audit_jobs
      SET
        status = 'failed',
        completed_at = NOW(),
        error_message = $2,
        worker_id = NULL,
        locked_at = NULL
      WHERE id = $1
    `, [jobId, errorMessage]);
  }

  // Recover stale jobs (workers that crashed)
  async recoverStaleJobs(): Promise<number> {
    const result = await pool.query(`
      UPDATE audit_jobs
      SET
        status = 'pending',
        worker_id = NULL,
        locked_at = NULL,
        retry_count = retry_count + 1
      WHERE
        status = 'processing'
        AND locked_at < NOW() - INTERVAL '10 minutes'
        AND retry_count < 3
      RETURNING id
    `);

    return result.rowCount || 0;
  }
}
```

### 5.2 Worker Process

```typescript
// server/src/worker.ts

import { JobQueueService } from './services/queue/job-queue.service';

async function main() {
  console.log(`Starting worker process ${process.pid}...`);

  const queue = new JobQueueService();

  // Recover any stale jobs on startup
  const recovered = await queue.recoverStaleJobs();
  if (recovered > 0) {
    console.log(`Recovered ${recovered} stale jobs`);
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    queue.stop();
  });

  // Start processing
  await queue.startWorker();
}

main().catch(console.error);
```

---

## 6. API Endpoints

### 6.1 Start Audit

```typescript
// POST /api/audits
router.post('/', authenticate, validateBody(startAuditSchema), async (req, res) => {
  const { targetUrl, options } = req.body;

  // Validate URL
  const url = new URL(targetUrl);
  const domain = url.hostname;

  // Check user's audit limits (if applicable)
  const activeAudits = await getActiveAuditsCount(req.user.id);
  if (activeAudits >= MAX_CONCURRENT_AUDITS) {
    return res.status(429).json({
      error: 'Too many active audits',
      code: 'AUDIT_LIMIT_REACHED',
    });
  }

  // Create audit job
  const job = await pool.query<AuditJob>(`
    INSERT INTO audit_jobs (
      user_id, target_url, target_domain,
      max_pages, max_depth, respect_robots_txt, include_subdomains,
      check_seo, check_accessibility, check_security, check_performance
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    req.user.id,
    targetUrl,
    domain,
    options.maxPages || 100,
    options.maxDepth || 5,
    options.respectRobotsTxt ?? true,
    options.includeSubdomains ?? false,
    options.checkSeo ?? true,
    options.checkAccessibility ?? true,
    options.checkSecurity ?? true,
    options.checkPerformance ?? true,
  ]);

  res.status(201).json({
    audit: job.rows[0],
    message: 'Audit queued successfully',
  });
});
```

### 6.2 Get Audit Status & Results

```typescript
// GET /api/audits/:id
router.get('/:id', authenticate, async (req, res) => {
  const audit = await pool.query<AuditJob>(`
    SELECT * FROM audit_jobs WHERE id = $1 AND user_id = $2
  `, [req.params.id, req.user.id]);

  if (!audit.rows[0]) {
    return res.status(404).json({ error: 'Audit not found' });
  }

  // Get findings summary
  const findingsSummary = await pool.query(`
    SELECT category, severity, COUNT(*) as count
    FROM audit_findings
    WHERE audit_job_id = $1
    GROUP BY category, severity
  `, [req.params.id]);

  res.json({
    audit: audit.rows[0],
    findings: {
      summary: findingsSummary.rows,
    },
  });
});

// GET /api/audits/:id/findings
router.get('/:id/findings', authenticate, async (req, res) => {
  const { category, severity, page = 1, limit = 50 } = req.query;

  let query = `
    SELECT f.*, p.url as page_url
    FROM audit_findings f
    LEFT JOIN audit_pages p ON f.audit_page_id = p.id
    WHERE f.audit_job_id = $1
  `;
  const params: any[] = [req.params.id];

  if (category) {
    params.push(category);
    query += ` AND f.category = $${params.length}`;
  }

  if (severity) {
    params.push(severity);
    query += ` AND f.severity = $${params.length}`;
  }

  query += ` ORDER BY
    CASE f.severity
      WHEN 'critical' THEN 1
      WHEN 'serious' THEN 2
      WHEN 'moderate' THEN 3
      WHEN 'minor' THEN 4
      ELSE 5
    END,
    f.created_at DESC
  `;

  query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);

  const findings = await pool.query(query, params);

  res.json({
    findings: findings.rows,
    pagination: { page, limit },
  });
});
```

### 6.3 Real-time Progress (Server-Sent Events)

```typescript
// GET /api/audits/:id/stream
router.get('/:id/stream', authenticate, async (req, res) => {
  const auditId = req.params.id;

  // Verify ownership
  const audit = await pool.query(
    'SELECT id FROM audit_jobs WHERE id = $1 AND user_id = $2',
    [auditId, req.user.id]
  );

  if (!audit.rows[0]) {
    return res.status(404).json({ error: 'Audit not found' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = async () => {
    const progress = await pool.query(`
      SELECT
        status, pages_found, pages_crawled, pages_audited,
        current_url, total_issues, critical_issues,
        seo_score, accessibility_score, security_score, performance_score
      FROM audit_jobs WHERE id = $1
    `, [auditId]);

    res.write(`data: ${JSON.stringify(progress.rows[0])}\n\n`);

    return progress.rows[0].status;
  };

  // Send initial state
  let status = await sendProgress();

  // Poll for updates
  const interval = setInterval(async () => {
    status = await sendProgress();

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});
```

---

## 7. Concurrency & Resource Management

### 7.1 Rate Limiting Per Domain

```typescript
class DomainRateLimiter {
  private limits: Map<string, { lastRequest: number; requestCount: number }> = new Map();

  // Default: 1 request per second per domain
  private requestsPerSecond = 1;
  private burstLimit = 5;

  async waitForSlot(domain: string): Promise<void> {
    const now = Date.now();
    const state = this.limits.get(domain) || { lastRequest: 0, requestCount: 0 };

    // Reset counter if more than 1 second has passed
    if (now - state.lastRequest > 1000) {
      state.requestCount = 0;
    }

    // If at burst limit, wait
    if (state.requestCount >= this.burstLimit) {
      const waitTime = 1000 - (now - state.lastRequest);
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
      state.requestCount = 0;
    }

    state.lastRequest = Date.now();
    state.requestCount++;
    this.limits.set(domain, state);
  }
}
```

### 7.2 Browser Pool Management

```typescript
class BrowserPool {
  private browsers: Browser[] = [];
  private maxBrowsers: number;
  private pagesPerBrowser: number;
  private available: Browser[] = [];

  constructor(maxBrowsers = 3, pagesPerBrowser = 5) {
    this.maxBrowsers = maxBrowsers;
    this.pagesPerBrowser = pagesPerBrowser;
  }

  async acquire(): Promise<Browser> {
    // Return available browser if exists
    if (this.available.length > 0) {
      return this.available.pop()!;
    }

    // Create new browser if under limit
    if (this.browsers.length < this.maxBrowsers) {
      const browser = await this.createBrowser();
      this.browsers.push(browser);
      return browser;
    }

    // Wait for available browser
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.available.length > 0) {
          clearInterval(check);
          resolve(this.available.pop()!);
        }
      }, 100);
    });
  }

  release(browser: Browser): void {
    this.available.push(browser);
  }

  async shutdown(): Promise<void> {
    for (const browser of this.browsers) {
      await browser.close();
    }
    this.browsers = [];
    this.available = [];
  }
}
```

### 7.3 Memory Management

```typescript
class MemoryMonitor {
  private maxHeapUsage = 0.8; // 80% of available heap

  isMemoryPressure(): boolean {
    const usage = process.memoryUsage();
    const heapUsedRatio = usage.heapUsed / usage.heapTotal;
    return heapUsedRatio > this.maxHeapUsage;
  }

  async waitForMemory(): Promise<void> {
    while (this.isMemoryPressure()) {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

---

## 8. File Structure

```
server/src/
├── services/
│   ├── spider/
│   │   ├── spider.service.ts           # Core spider/crawler
│   │   ├── coordinator.service.ts      # Crawl orchestration
│   │   ├── robots-parser.service.ts    # robots.txt parser
│   │   ├── url-normalizer.service.ts   # URL normalization
│   │   └── rate-limiter.service.ts     # Per-domain rate limiting
│   │
│   ├── audit-engines/
│   │   ├── seo.engine.ts               # SEO checks
│   │   ├── accessibility.engine.ts     # Accessibility (axe-core)
│   │   ├── security.engine.ts          # Security checks
│   │   ├── performance.engine.ts       # Performance checks
│   │   └── index.ts                    # Engine aggregator
│   │
│   ├── queue/
│   │   ├── job-queue.service.ts        # PostgreSQL job queue
│   │   └── job-recovery.service.ts     # Stale job recovery
│   │
│   └── audit/
│       ├── audit.service.ts            # Audit CRUD operations
│       └── score-calculator.service.ts # Score calculation
│
├── routes/
│   └── audits/
│       ├── index.ts                    # Route aggregator
│       ├── start.route.ts              # POST /api/audits
│       ├── status.route.ts             # GET /api/audits/:id
│       ├── findings.route.ts           # GET /api/audits/:id/findings
│       ├── pages.route.ts              # GET /api/audits/:id/pages
│       └── stream.route.ts             # GET /api/audits/:id/stream (SSE)
│
├── db/migrations/
│   ├── 006_create_audit_jobs.sql
│   ├── 007_create_audit_pages.sql
│   ├── 008_create_audit_findings.sql
│   └── 009_create_crawl_queue.sql
│
├── types/
│   ├── spider.types.ts
│   ├── audit.types.ts
│   └── finding.types.ts
│
├── worker.ts                           # Worker process entry point
└── index.ts                            # API server entry point
```

---

## 9. Deployment Considerations

### 9.1 Scaling Workers

```yaml
# docker-compose.prod.yml
services:
  api:
    build: ./server
    command: npm start
    deploy:
      replicas: 2

  worker:
    build: ./server
    command: npm run worker
    deploy:
      replicas: 4  # Scale based on demand
    environment:
      - MAX_CONCURRENT_AUDITS=2  # Per worker
```

### 9.2 Resource Limits

```yaml
# Per worker container
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      cpus: '1'
      memory: 2G
```

### 9.3 Monitoring

```typescript
// Prometheus metrics
const auditMetrics = {
  auditsStarted: new Counter('audits_started_total'),
  auditsCompleted: new Counter('audits_completed_total'),
  auditsFailed: new Counter('audits_failed_total'),
  auditDuration: new Histogram('audit_duration_seconds'),
  pagesPerAudit: new Histogram('pages_per_audit'),
  findingsPerAudit: new Histogram('findings_per_audit'),
  activeWorkers: new Gauge('active_workers'),
  queueLength: new Gauge('audit_queue_length'),
};
```

---

## 10. Implementation Phases

### Phase 1: Core Spider (Week 1)
- [ ] Database migrations for audit tables
- [ ] Basic spider with Playwright
- [ ] URL queue management
- [ ] robots.txt parser
- [ ] Rate limiting

### Phase 2: Audit Engines (Week 2)
- [ ] SEO engine with all rules
- [ ] Accessibility engine (axe-core integration)
- [ ] Security engine with file probing
- [ ] Performance engine (Core Web Vitals)

### Phase 3: Job Queue (Week 3)
- [ ] PostgreSQL-based job queue
- [ ] Worker process
- [ ] Job recovery
- [ ] Progress tracking

### Phase 4: API & Real-time (Week 4)
- [ ] Audit API endpoints
- [ ] Server-Sent Events for progress
- [ ] Results API with filtering
- [ ] Export functionality (PDF/CSV)

### Phase 5: Frontend (Week 5)
- [ ] Start audit form
- [ ] Progress dashboard
- [ ] Results viewer
- [ ] Findings detail view

### Phase 6: Polish & Scale (Week 6)
- [ ] Browser pool optimization
- [ ] Memory management
- [ ] Error recovery
- [ ] Monitoring & alerts

---

## 11. Security Considerations

1. **Sandbox browser**: Run Playwright in sandboxed mode
2. **Timeout all operations**: Prevent hanging on malicious sites
3. **Validate URLs**: Prevent SSRF attacks (no internal IPs, localhost)
4. **Rate limit users**: Prevent abuse of crawling resources
5. **Content size limits**: Don't process excessively large pages
6. **Isolate workers**: Each worker should be isolated
7. **Audit logging**: Log all audit operations for accountability

---

## 12. Testing Strategy

```typescript
// Unit tests for each engine
describe('SeoEngine', () => {
  it('detects missing title', async () => {
    const html = '<html><head></head><body></body></html>';
    const findings = await seoEngine.analyze({ html, url: 'https://example.com' });
    expect(findings).toContainEqual(expect.objectContaining({
      ruleId: 'missing-title',
    }));
  });
});

// Integration tests for spider
describe('Spider', () => {
  it('respects max depth', async () => {
    const spider = new Spider({ maxDepth: 2 });
    // ... test with mock server
  });

  it('respects robots.txt', async () => {
    // ... test disallowed paths
  });
});

// E2E tests for full audit flow
describe('Audit Flow', () => {
  it('completes audit and returns findings', async () => {
    const response = await request(app)
      .post('/api/audits')
      .send({ targetUrl: 'https://example.com' });

    expect(response.status).toBe(201);

    // Wait for completion
    // ... poll or use SSE

    // Check results
    const results = await request(app)
      .get(`/api/audits/${response.body.audit.id}`);

    expect(results.body.audit.status).toBe('completed');
  });
});
```

---

## 13. Phase 1 Review & Improvements

### Completed in Phase 1

- [x] Database migrations (006-009) with proper indexes for job queue operations
- [x] TypeScript types for spider, audit, and findings
- [x] URL normalizer with SSRF protection (blocks private IPs, localhost)
- [x] robots.txt parser with crawl-delay support
- [x] Domain-based rate limiter with burst control
- [x] Core spider with Playwright headless browser
- [x] Crawl coordinator for orchestrating the crawl process

### Speed Improvements Identified

1. **Browser Context Reuse** (Phase 6)
   - Current: Creates new browser context per page
   - Improvement: Implement browser context pooling to reuse contexts
   - Impact: ~200ms savings per page

2. **Parallel Page Processing** (Phase 6)
   - Current: Sequential page processing within an audit
   - Improvement: Process multiple pages concurrently (configurable)
   - Impact: 3-5x faster for large sites

3. **DNS Prefetching** (Add to Phase 2)
   - Pre-resolve DNS for discovered links before crawling
   - Impact: Reduces connection time per page

4. **Response Streaming** (Phase 4)
   - Stream page content instead of buffering
   - Impact: Faster processing for large pages

### Security Improvements Identified

1. **Request Origin Validation** (Add to Phase 3)
   - Validate that crawled content comes from expected domain
   - Prevent DNS rebinding attacks

2. **Content Security Policy for Browser** (Phase 6)
   - Configure strict CSP in Playwright context
   - Prevent XSS from crawled pages affecting spider

3. **Resource Limits per Audit** (Add to Phase 3)
   - Maximum total bytes per audit
   - Maximum resources per page
   - Timeout escalation for slow pages

4. **Audit Event Logging** (Add to Phase 3)
   - Log all crawl operations to auth_audit_logs
   - Track unusual patterns (rapid crawling, large data transfer)

### UX Improvements Identified

1. **Estimated Time Remaining** (Add to Phase 4)
   - Calculate based on pages_found, pages_crawled, and avg response time
   - Update in real-time via SSE

2. **Crawl Preview** (Add to Phase 5)
   - Show live preview of pages being crawled
   - Display discovered issues as they're found

3. **Smart Defaults** (Add to Phase 4)
   - Auto-detect max_pages based on sitemap size
   - Suggest optimal depth based on site structure

4. **Pause/Resume Crawl** (Add to Phase 3)
   - Allow pausing a running audit
   - Resume from where it left off

5. **Partial Results** (Add to Phase 4)
   - Show results as they're discovered
   - Don't wait for full crawl to display findings

### New Items to Add

#### Phase 2 Additions
- [ ] DNS prefetching for discovered links
- [ ] Link validation engine (check external links)

#### Phase 3 Additions
- [ ] Request origin validation
- [ ] Resource limits per audit (bytes, resources, time)
- [ ] Audit event logging to auth_audit_logs
- [ ] Pause/Resume crawl functionality

#### Phase 4 Additions
- [ ] Estimated time remaining calculation
- [ ] Smart defaults for crawl settings
- [ ] Partial results API (stream findings as discovered)
- [ ] Response streaming for large pages

#### Phase 5 Additions
- [ ] Live crawl preview component
- [ ] Real-time findings display
- [ ] Crawl status visualization (sitemap view)

#### Phase 6 Additions
- [ ] Browser context pooling
- [ ] Parallel page processing
- [ ] Content Security Policy configuration
- [ ] Memory pressure monitoring and relief

---

## 14. Phase 2 Review & Improvements

### Completed in Phase 2

- [x] SEO Engine with 25+ rules covering:
  - Title and meta description validation
  - Heading hierarchy checks
  - Image alt text analysis
  - Internal linking analysis
  - Canonical URL verification
  - Open Graph tags
  - Structured data detection
  - Mobile viewport check
  - Language attribute check
  - Robots meta directives

- [x] Accessibility Engine (axe-core integration):
  - WCAG 2.0, 2.1, 2.2 Level A/AA compliance
  - Best practice rules
  - Maps axe-core impacts to severity levels
  - Extracts WCAG criteria from violations
  - Human-readable recommendations

- [x] Security Engine with rules for:
  - HTTPS verification
  - Mixed content detection
  - Security headers (HSTS, CSP, X-Frame-Options, etc.)
  - Cookie security (Secure, HttpOnly, SameSite)
  - Form security checks
  - Information disclosure detection
  - External script integrity (SRI)
  - Sensitive file probing

- [x] Performance Engine with rules for:
  - Server response time
  - Page and HTML size
  - HTTP request count
  - JavaScript/CSS payload size
  - Image optimization hints
  - Render-blocking resources
  - Lazy loading detection
  - Inline code detection

- [x] Audit Engine Coordinator:
  - Parallel execution of engines
  - Batch finding storage
  - Score calculation per category
  - Page audit result updates

### Speed Improvements Identified

1. **Parallel Engine Execution** ✅ (Already implemented)
   - All four engines run in parallel via Promise.all

2. **Batch Database Inserts** ✅ (Already implemented)
   - Findings inserted in single query with values array

3. **Rule Short-Circuiting** (Add to optimization phase)
   - Exit early when issue count exceeds threshold
   - Skip expensive rules if page already has critical issues

4. **Cached Cheerio Instance** (Add to optimization phase)
   - Share parsed DOM across SEO, Security, Performance engines
   - Currently each engine parses HTML separately

### Security Improvements Identified

1. **Sensitive File Probing Rate Limiting** (Add to Phase 3)
   - Currently probes are not rate limited
   - Add configurable delay between probes
   - Consider ethical scanning practices

2. **User-Agent Identification** (Add to Phase 3)
   - Ensure all security probes identify as pagepulser
   - Include contact URL in User-Agent

3. **Timeout on Probes** ✅ (Already implemented)
   - 5 second timeout on sensitive file checks

4. **Probe Results Caching** (Add to optimization phase)
   - Cache probe results per domain
   - Don't re-probe same domain in same audit

### UX Improvements Identified

1. **Severity-Based Rule Ordering** (Add to Phase 5)
   - Present critical issues first in UI
   - Group by page for easier fixing

2. **Fix Suggestions with Code** (Add to Phase 5)
   - Include specific code fixes in recommendations
   - Show before/after examples where applicable

3. **Issue Deduplication** (Add to Phase 4)
   - Aggregate similar issues across pages
   - Show "This issue affects 15 pages" instead of 15 separate findings

4. **Score Breakdown** (Add to Phase 5)
   - Show how each issue affects the score
   - Visualize potential score gain from fixing issues

5. **WCAG Reference Links** (Add to Phase 5)
   - Link accessibility issues to WCAG documentation
   - Include success criterion text in findings

### New Items to Add

#### Phase 3 Additions (Updated)
- [ ] Sensitive file probe rate limiting
- [ ] Clear pagepulser identification in all requests
- [ ] Issue deduplication logic

#### Phase 4 Additions (Updated)
- [ ] Aggregate similar issues across pages
- [ ] Issue count limits per category (prevent spam)

#### Phase 5 Additions (Updated)
- [ ] Severity-based issue ordering in UI
- [ ] Fix suggestions with code examples
- [ ] Score breakdown visualization
- [ ] WCAG reference integration
- [ ] "Affects X pages" aggregation display

#### Optimization Phase (New)
- [ ] Rule short-circuiting for efficiency
- [ ] Shared Cheerio instance across engines
- [ ] Probe results caching per domain
- [ ] Finding deduplication at insert time

---

## 15. Phase 3 Review & Improvements

### Completed in Phase 3

- [x] PostgreSQL Job Queue Service:
  - SKIP LOCKED pattern for safe concurrent access
  - Unique worker IDs per process
  - Job claiming with atomic UPDATE
  - Progress tracking with periodic updates
  - Job cancellation support
  - Queue statistics

- [x] Audit Worker Service:
  - Browser lifecycle management
  - Full audit orchestration
  - Crawl queue processing
  - Audit engine integration
  - Score calculation
  - Graceful shutdown

- [x] Job Recovery:
  - Stale job detection (10 minute timeout)
  - Automatic retry (up to 3 attempts)
  - Failed job marking after max retries
  - Worker crash recovery

- [x] Worker Entry Point:
  - Standalone process for production
  - Signal handling (SIGTERM, SIGINT)
  - Uncaught error handling
  - Connection cleanup on shutdown

### Speed Improvements Identified

1. **Worker Pooling** (Add to Phase 6)
   - Run multiple workers per process
   - Share browser instance across jobs
   - Reduce browser startup overhead

2. **Warm Browser Contexts** (Add to Phase 6)
   - Pre-create browser contexts
   - Reuse contexts between pages
   - Clear cookies/storage between uses

3. **Batch Progress Updates** (Add to optimization)
   - Currently updates DB after every page
   - Batch updates every 5 pages or 10 seconds
   - Reduces DB write load

4. **Job Prioritization** (Add to Phase 4)
   - Priority queue for paid users
   - Smaller sites get faster start

### Security Improvements Identified

1. **Worker Isolation** (Add to Phase 6)
   - Run workers in separate containers
   - Resource limits per worker
   - Network isolation

2. **Job Validation** (Add to Phase 4)
   - Validate target URL against blacklist
   - Check domain ownership (optional)
   - Rate limit per user

3. **Audit Trail** (Partially done)
   - Log job state changes
   - Track worker assignments
   - Add to auth_audit_logs table

4. **Timeout Escalation** (Add to optimization)
   - Start with shorter timeouts
   - Extend for known-slow pages
   - Hard cap at 60 seconds

### UX Improvements Identified

1. **Real-time Progress** (Add to Phase 4)
   - SSE endpoint for job progress
   - Emit events as pages are crawled
   - Show live findings count

2. **Estimated Completion** (Add to Phase 4)
   - Calculate based on pages_found and avg time
   - Update estimate as crawl progresses
   - Show "X minutes remaining"

3. **Job History** (Add to Phase 5)
   - List past audits for user
   - Show completion rate, issues found
   - Allow re-running audits

4. **Email Notifications** (Add to Phase 5)
   - Notify when audit completes
   - Include summary of findings
   - Link to full results

### New Items to Add

#### Phase 4 Additions (Updated)
- [ ] SSE endpoint for real-time progress
- [ ] Job prioritization (FIFO with priority levels)
- [ ] Target URL validation and blacklisting
- [ ] Estimated completion time calculation

#### Phase 5 Additions (Updated)
- [ ] Job history page
- [ ] Re-run audit functionality
- [ ] Email notification on completion

#### Phase 6 Additions (Updated)
- [ ] Worker pooling (multiple workers per process)
- [ ] Warm browser context reuse
- [ ] Worker container isolation
- [ ] Batch progress updates

#### Worker Script Commands
```bash
# Start a single worker
npm run worker

# Start worker in development (with hot reload)
npm run worker:dev
```

---

## 16. Phase 4 Review & Improvements

### Completed in Phase 4

- [x] Audit API Routes:
  - `POST /api/audits` - Start new audit with validation
  - `GET /api/audits` - List user's audits with pagination
  - `GET /api/audits/:id` - Get audit details with summaries
  - `GET /api/audits/:id/findings` - Get findings with filtering
  - `GET /api/audits/:id/pages` - Get crawled pages
  - `GET /api/audits/:id/stream` - SSE for real-time progress
  - `POST /api/audits/:id/cancel` - Cancel running audit
  - `DELETE /api/audits/:id` - Delete completed audit

- [x] Real-time Progress (SSE):
  - Server-Sent Events endpoint
  - Polls database every 1 second
  - Auto-closes when audit completes
  - Handles client disconnect

- [x] Validation & Security:
  - Zod schemas for input validation
  - User authorization on all endpoints
  - Concurrent audit limit (3 per user)
  - URL normalization and HTTPS enforcement

- [x] Database Integration:
  - Pool injection for routes
  - Pagination support
  - Filtering by category/severity/status

### Speed Improvements Identified

1. **Database Connection Pooling** ✅ (Already implemented)
   - Pool size of 20 connections
   - Shared across routes and workers

2. **Response Caching** (Add to Phase 6)
   - Cache audit summaries for completed audits
   - Cache findings aggregations
   - Invalidate on audit completion

3. **Query Optimization** (Add to optimization)
   - Add composite indexes for common queries
   - Use EXPLAIN ANALYZE on slow queries
   - Consider materialized views for summaries

4. **SSE Connection Pooling** (Add to Phase 6)
   - Currently each SSE opens new DB queries
   - Use shared subscription model
   - Consider Redis pub/sub for scale

### Security Improvements Identified

1. **URL Blacklisting** (Add to Phase 5)
   - Block internal IPs (partially done in URL normalizer)
   - Block known bad domains
   - Admin-managed blacklist

2. **Rate Limiting per User** (Add to Phase 5)
   - Currently only concurrent audit limit
   - Add audits per day limit
   - Add pages per audit billing tier

3. **Audit Access Logging** (Add to Phase 5)
   - Log who accesses what audits
   - Track export/download actions
   - Security audit trail

4. **API Key Authentication** (Add to Phase 6)
   - Support API keys for automation
   - Separate from session auth
   - Rate limits per key

### UX Improvements Identified

1. **Progress Percentage** (Add to frontend)
   - Calculate from pages_crawled / max_pages
   - Show progress bar in UI
   - Update via SSE

2. **Time Estimates** (Add to Phase 5)
   - Track average time per page
   - Estimate remaining time
   - Show in SSE updates

3. **Findings Preview** (Add to Phase 5)
   - Stream findings as discovered
   - Show live count updates
   - Highlight critical issues

4. **Filter Persistence** (Add to frontend)
   - Remember last used filters
   - URL-based filter state
   - Shareable filter URLs

### API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/audits` | Yes | Start new audit |
| GET | `/api/audits` | Yes | List user's audits |
| GET | `/api/audits/:id` | Yes | Get audit details |
| GET | `/api/audits/:id/findings` | Yes | Get findings |
| GET | `/api/audits/:id/pages` | Yes | Get crawled pages |
| GET | `/api/audits/:id/stream` | Yes | SSE progress |
| POST | `/api/audits/:id/cancel` | Yes | Cancel audit |
| DELETE | `/api/audits/:id` | Yes | Delete audit |

### New Items to Add

#### Phase 5 Additions (Updated)
- [ ] URL blacklist management
- [ ] Audit rate limiting per user
- [ ] Audit access logging
- [ ] Time remaining estimation
- [ ] Findings preview stream

#### Phase 6 Additions (Updated)
- [ ] Response caching layer
- [ ] SSE connection optimization
- [ ] API key authentication
- [ ] Query optimization pass

---

## 17. Phase 5 Review & Improvements

### Completed in Phase 5

- [x] Audit API Service (client/src/services/api.ts):
  - Start new audit
  - List audits with filters
  - Get audit details
  - Get findings with filters
  - Get pages
  - Cancel and delete audits
  - SSE EventSource factory

- [x] Dashboard Layout Component:
  - Shared navigation
  - User context display
  - Email verification warning
  - Active route highlighting

- [x] Audit List Page:
  - Table view with all audits
  - Status badges with colors
  - Score display per category
  - Issue counts with critical highlighting
  - Status filtering
  - Empty state with CTA
  - Loading state

- [x] New Audit Form:
  - URL input with validation
  - Advanced options toggle
  - Crawl settings (max pages, depth)
  - Behavior options (robots.txt, subdomains)
  - Audit type toggles (SEO, A11y, Security, Perf)
  - Form validation with user feedback
  - Redirect to audit detail on start

- [x] Audit Detail Page:
  - Breadcrumb navigation
  - Status badge with real-time updates
  - Score cards for all four categories
  - Progress bars during crawl
  - Current URL display
  - Tabbed interface (Overview, Findings, Pages)
  - SSE integration for live updates
  - Cancel and delete actions

- [x] Findings Tab:
  - Category and severity filters
  - Finding cards with badges
  - Recommendations display
  - Code snippets
  - Help URL links

- [x] Pages Tab:
  - URL and title display
  - Crawl status badges
  - Response code and time
  - Issue counts per page
  - Score breakdown

- [x] Updated Dashboard:
  - Real stats from API
  - Quick action buttons
  - Recent audits list
  - Direct links to audit details

- [x] App Router Updates:
  - `/audits` - Audit list
  - `/audits/new` - Start new audit
  - `/audits/:id` - Audit detail

### Speed Improvements Identified

1. **Virtual Scrolling for Large Lists** (Add to Phase 6)
   - Findings list can have 100+ items
   - Use react-window for virtualized lists
   - Impact: Smoother scrolling, less memory

2. **Paginated API Calls** (Partially done)
   - Pagination exists in API
   - Frontend needs infinite scroll or pagination UI
   - Impact: Faster initial load

3. **Optimistic UI Updates** (Add to Phase 6)
   - Show cancel immediately, revert on error
   - Show delete immediately with undo option
   - Impact: Feels more responsive

4. **SSE Debouncing** (Add to Phase 6)
   - Currently updates on every message
   - Batch updates every 500ms
   - Impact: Fewer re-renders

### Security Improvements Identified

1. **URL Display Sanitization** ✅ (Already done)
   - URLs truncated with title attribute
   - No raw HTML rendering

2. **CSRF on State Changes** ✅ (Already done)
   - API interceptor adds CSRF token
   - All POST/DELETE protected

3. **Auth State Validation** (Add to Phase 6)
   - Check auth before SSE connect
   - Handle token expiry during long audits
   - Reconnect SSE on token refresh

4. **Export Validation** (Add to Phase 6)
   - Validate audit belongs to user before export
   - Rate limit exports
   - Log export actions

### UX Improvements Identified

1. **Toast Notifications** (Add to Phase 6)
   - Success/error toasts for actions
   - "Audit started" confirmation
   - "Audit cancelled" confirmation

2. **Keyboard Navigation** (Add to Phase 6)
   - Tab through findings
   - Enter to expand details
   - Escape to close modals

3. **Mobile Responsive** (Add to Phase 6)
   - Currently desktop-focused
   - Responsive tables
   - Mobile nav menu

4. **Accessibility** (Add to Phase 6)
   - ARIA labels on interactive elements
   - Focus management
   - Screen reader announcements

5. **Dark Mode** (Add to Phase 6)
   - Toggle in header
   - Persist preference
   - System default detection

6. **Findings Search** (Add to Phase 6)
   - Search within findings
   - Full-text search across message, recommendation
   - Highlight matches

7. **Bulk Actions** (Add to Phase 6)
   - Select multiple audits
   - Bulk delete
   - Bulk export

8. **Shareable URLs** (Add to Phase 6)
   - Filter state in URL
   - Deep links to specific findings
   - Public share links (optional)

### New Items to Add

#### Phase 6: Polish & Scale (Updated)

**Frontend Polish:**
- [ ] Virtual scrolling for findings list
- [ ] Pagination UI with page controls
- [ ] Toast notification system
- [ ] Keyboard navigation
- [ ] Mobile responsive design
- [ ] Accessibility audit and fixes
- [ ] Dark mode toggle
- [ ] Findings search
- [ ] Bulk actions for audits

**Backend Optimization:**
- [ ] Browser context pooling
- [ ] Parallel page processing
- [ ] Response caching layer
- [ ] SSE connection optimization
- [ ] Query optimization pass
- [ ] Batch progress updates

**Security Hardening:**
- [ ] Auth state validation in SSE
- [ ] Export rate limiting
- [ ] Worker container isolation
- [ ] API key authentication
- [ ] Audit action logging

**Feature Additions:**
- [ ] PDF/CSV export
- [ ] Email notifications
- [ ] Scheduled recurring audits
- [ ] Webhook integrations
- [ ] Custom rule configuration
- [ ] White-label branding

---

## 18. Phase 6 Implementation Checklist

### Week 6.1: Performance & Polish

**Day 1-2: Frontend Performance**
```
- [ ] Install react-window
- [ ] Implement virtualized findings list
- [ ] Add pagination controls to list views
- [ ] Implement SSE message debouncing
```

**Day 3-4: UX Polish**
```
- [ ] Create Toast component
- [ ] Add toast notifications to all actions
- [ ] Implement keyboard navigation
- [ ] Add ARIA labels and roles
```

**Day 5: Mobile & Dark Mode**
```
- [ ] Responsive tables with horizontal scroll
- [ ] Mobile navigation drawer
- [ ] Dark mode CSS variables
- [ ] Theme toggle component
```

### Week 6.2: Backend Optimization

**Day 1-2: Browser Optimization**
```
- [ ] Implement browser context pool
- [ ] Add warm context recycling
- [ ] Configure parallel page processing
- [ ] Add memory pressure monitoring
```

**Day 3-4: Database Optimization**
```
- [ ] Add response caching with Redis or in-memory
- [ ] Optimize slow queries with EXPLAIN ANALYZE
- [ ] Create materialized views for summaries
- [ ] Implement batch progress updates
```

**Day 5: Monitoring**
```
- [ ] Add Prometheus metrics
- [ ] Create health check endpoints
- [ ] Set up error alerting
- [ ] Add performance logging
```

### Week 6.3: Features & Security

**Day 1-2: Export Features**
```
- [ ] PDF report generation (puppeteer or react-pdf)
- [ ] CSV export for findings
- [ ] Email notification on completion
- [ ] Export rate limiting
```

**Day 3-4: Advanced Features**
```
- [ ] Scheduled recurring audits
- [ ] Webhook notifications
- [ ] API key authentication
- [ ] Custom rule configuration UI
```

**Day 5: Security & Testing**
```
- [ ] Security audit of all endpoints
- [ ] Container isolation for workers
- [ ] Audit action logging
- [ ] E2E test suite
