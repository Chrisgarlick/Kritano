# Scraper V3 - Comprehensive Crawling & Bot Detection Analysis

> **See Also:** [SCRAPER_V4.md](./SCRAPER_V4.md) - Hybrid Fast Fetch + Playwright architecture that provides 60-80% performance improvements for static sites by using native HTTP requests where JavaScript rendering isn't needed.

## Executive Summary

This document analyzes all issues that can cause website crawling failures and provides a comprehensive plan to maximize compatibility across all websites while maintaining ethical standards and providing clear user feedback when crawling is not possible.

---

## Part 1: Issue Analysis

### 1.1 Bot Detection Mechanisms

Modern websites use multiple layers of bot detection:

| Detection Method | Description | Current Status |
|-----------------|-------------|----------------|
| **navigator.webdriver** | JavaScript check for automation | DETECTABLE - Returns `true` in Playwright |
| **navigator.plugins** | Empty array in headless browsers | DETECTABLE - No plugin spoofing |
| **User-Agent Analysis** | Bot identification via UA string | DETECTABLE - Uses `kritano/1.0` |
| **TLS/JA3 Fingerprinting** | SSL handshake patterns | DETECTABLE - Standard Chromium fingerprint |
| **IP Reputation** | Known datacenter/proxy IPs | DETECTABLE - Single IP, no rotation |
| **Behavioral Analysis** | Mouse movement, timing patterns | DETECTABLE - No human simulation |
| **Canvas/WebGL Fingerprinting** | GPU-based identification | DETECTABLE - No randomization |
| **HTTP/2 Fingerprinting** | Protocol-level patterns | DETECTABLE - Standard patterns |
| **Challenge Pages** | Cloudflare, Imperva, etc. | PARTIAL - Detection only, no solving |

### 1.2 Common Failure Scenarios

#### Scenario 1: Cloudflare Protection
```
Symptoms: Page times out or returns challenge page
Cause: Bot detected via webdriver check + behavioral analysis
Current Handling: Detects challenge, retries 3x, then fails
```

#### Scenario 2: Rate Limiting (HTTP 429)
```
Symptoms: Server returns 429 Too Many Requests
Cause: Too many requests from single IP
Current Handling: Basic rate limiting, no 429-specific backoff
```

#### Scenario 3: IP Blocking
```
Symptoms: Connection refused or timeout
Cause: IP blacklisted by WAF
Current Handling: Generic timeout error, no detection
```

#### Scenario 4: JavaScript-Heavy Sites (SPAs)
```
Symptoms: Page loads but content is empty/loading
Cause: Content rendered client-side after initial load
Current Handling: networkidle wait, but no SPA-specific handling
```

#### Scenario 5: Geographic Restrictions
```
Symptoms: Redirect to different content or blocked
Cause: Geo-IP filtering
Current Handling: No detection, no geo-specific handling
```

#### Scenario 6: Authentication Walls
```
Symptoms: Redirect to login page
Cause: Content requires authentication
Current Handling: Crawls login page, no auth support
```

#### Scenario 7: CAPTCHA Challenges
```
Symptoms: CAPTCHA page instead of content
Cause: Bot suspicion triggered
Current Handling: Detected as challenge page, cannot solve
```

### 1.3 Current Implementation Gaps

```
CRITICAL GAPS:
[X] No stealth plugin (webdriver detection bypass)
[X] Static user agent identifies as bot
[X] No proxy support (single IP)
[X] No fingerprint randomization
[X] No header randomization

MODERATE GAPS:
[X] No 429 rate limit detection
[X] No SPA-specific rendering wait
[X] Fixed viewport (1920x1080)
[X] No timezone/locale spoofing
[X] Basic error messages

MINOR GAPS:
[X] No request timing randomization
[X] No behavioral simulation
[X] No cookie persistence between sessions
```

---

## Part 2: Implementation Plan

### Phase 1: Stealth Mode (High Priority)

#### 1.1 Install Stealth Dependencies

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
# Note: playwright-extra exists but puppeteer-extra-plugin-stealth is more mature
# We'll use Playwright's native capabilities + custom evasion scripts
```

#### 1.2 Browser Launch Evasion

**File: `server/src/services/spider/spider.service.ts`**

Add critical browser arguments:
```typescript
const STEALTH_ARGS = [
  // Existing args...
  '--disable-blink-features=AutomationControlled',  // Hide webdriver
  '--disable-features=IsolateOrigins,site-per-process',
  '--disable-site-isolation-trials',
  '--disable-web-security',  // For cross-origin requests
  '--allow-running-insecure-content',
];
```

#### 1.3 JavaScript Evasion Scripts

Inject scripts to mask automation detection:
```typescript
// Execute before any page scripts run
await page.addInitScript(() => {
  // Mask webdriver
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
  });

  // Add fake plugins
  Object.defineProperty(navigator, 'plugins', {
    get: () => [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Native Client', filename: 'internal-nacl-plugin' },
    ],
  });

  // Add fake languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-GB', 'en-US', 'en'],
  });

  // Mask automation properties
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

  // Chrome runtime
  window.chrome = {
    runtime: {},
    loadTimes: () => {},
    csi: () => {},
    app: {},
  };

  // Permissions API
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(parameters)
  );
});
```

#### 1.4 User Agent Rotation

Create realistic user agent pool:
```typescript
// File: server/src/services/spider/user-agents.ts
export const USER_AGENTS = {
  desktop: [
    // Chrome Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    // Chrome Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    // Firefox
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
    // Edge
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  ],
  mobile: [
    // iPhone
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    // Android
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  ],
};

export function getRandomUserAgent(type: 'desktop' | 'mobile' = 'desktop'): string {
  const agents = USER_AGENTS[type];
  return agents[Math.floor(Math.random() * agents.length)];
}
```

### Phase 2: Request Fingerprinting (High Priority)

#### 2.1 Header Randomization

```typescript
// File: server/src/services/spider/headers.service.ts
export function getRandomHeaders(userAgent: string) {
  const acceptLanguages = [
    'en-GB,en;q=0.9',
    'en-US,en;q=0.9',
    'en-GB,en-US;q=0.9,en;q=0.8',
  ];

  return {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
}
```

#### 2.2 Viewport Randomization

```typescript
const VIEWPORTS = [
  { width: 1920, height: 1080 },  // Full HD
  { width: 1366, height: 768 },   // Common laptop
  { width: 1536, height: 864 },   // Scaled laptop
  { width: 1440, height: 900 },   // MacBook
  { width: 1280, height: 720 },   // HD
  { width: 2560, height: 1440 },  // QHD
];

export function getRandomViewport() {
  return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
}
```

#### 2.3 Timezone & Locale Spoofing

```typescript
const context = await browser.newContext({
  userAgent: getRandomUserAgent(),
  viewport: getRandomViewport(),
  locale: 'en-GB',
  timezoneId: 'Europe/London',
  geolocation: { latitude: 51.5074, longitude: -0.1278 },
  permissions: ['geolocation'],
});
```

### Phase 3: Proxy Support (High Priority)

#### 3.1 Proxy Configuration

```typescript
// File: server/src/services/spider/proxy.service.ts
export interface ProxyConfig {
  server: string;      // 'http://proxy.example.com:8080'
  username?: string;
  password?: string;
}

export class ProxyService {
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;

  addProxy(proxy: ProxyConfig): void {
    this.proxies.push(proxy);
  }

  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) return null;
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    // Test proxy connectivity
  }
}
```

#### 3.2 Browser Context with Proxy

```typescript
const proxy = proxyService.getNextProxy();

const context = await browser.newContext({
  proxy: proxy ? {
    server: proxy.server,
    username: proxy.username,
    password: proxy.password,
  } : undefined,
  // ... other options
});
```

### Phase 4: Advanced Wait Strategies (Medium Priority)

#### 4.1 Smart Wait Logic

```typescript
// File: server/src/services/spider/wait-strategies.ts
export async function smartWait(page: Page): Promise<void> {
  // Strategy 1: Wait for network idle
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // Timeout is okay, continue
  }

  // Strategy 2: Wait for DOM to stabilize
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      let lastHTMLSize = 0;
      let stableCount = 0;

      const checkStability = () => {
        const currentSize = document.body.innerHTML.length;
        if (currentSize === lastHTMLSize) {
          stableCount++;
          if (stableCount >= 3) {
            resolve();
            return;
          }
        } else {
          stableCount = 0;
          lastHTMLSize = currentSize;
        }
        setTimeout(checkStability, 500);
      };

      checkStability();

      // Max wait 10 seconds
      setTimeout(resolve, 10000);
    });
  });

  // Strategy 3: Check for common loading indicators
  const loadingSelectors = [
    '.loading', '.spinner', '.loader', '[data-loading]',
    '.skeleton', '.placeholder', '#loading',
  ];

  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 2000 });
    } catch {
      // Element not found or didn't hide, continue
    }
  }
}
```

#### 4.2 SPA Detection and Handling

```typescript
async function detectSPA(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // Check for common SPA frameworks
    return !!(
      window.__NUXT__ ||
      window.__NEXT_DATA__ ||
      window.angular ||
      window.React ||
      window.Vue ||
      document.querySelector('[ng-app]') ||
      document.querySelector('[data-reactroot]') ||
      document.querySelector('#__next') ||
      document.querySelector('#app[data-v-app]')
    );
  });
}

async function waitForSPAContent(page: Page): Promise<void> {
  if (await detectSPA(page)) {
    // Wait longer for SPA hydration
    await page.waitForTimeout(2000);
    await smartWait(page);
  }
}
```

### Phase 5: Enhanced Error Detection & Handling (High Priority)

#### 5.1 Comprehensive Error Classification

```typescript
// File: server/src/services/spider/error-classifier.service.ts
export enum CrawlErrorType {
  // Network Errors
  TIMEOUT = 'TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  DNS_FAILURE = 'DNS_FAILURE',
  SSL_ERROR = 'SSL_ERROR',

  // Bot Detection
  CLOUDFLARE_CHALLENGE = 'CLOUDFLARE_CHALLENGE',
  CAPTCHA_REQUIRED = 'CAPTCHA_REQUIRED',
  BOT_DETECTED = 'BOT_DETECTED',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  IP_BLOCKED = 'IP_BLOCKED',

  // Content Issues
  PAGE_NOT_FOUND = 'PAGE_NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  REDIRECT_LOOP = 'REDIRECT_LOOP',

  // Auth Required
  LOGIN_REQUIRED = 'LOGIN_REQUIRED',
  PAYWALL = 'PAYWALL',

  // Geographic
  GEO_BLOCKED = 'GEO_BLOCKED',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}

export interface CrawlError {
  type: CrawlErrorType;
  message: string;
  userMessage: string;
  suggestion: string;
  retryable: boolean;
  statusCode?: number;
}

export function classifyError(
  error: Error,
  html?: string,
  statusCode?: number
): CrawlError {
  const errorMessage = error.message.toLowerCase();

  // Timeout errors
  if (errorMessage.includes('timeout')) {
    return {
      type: CrawlErrorType.TIMEOUT,
      message: error.message,
      userMessage: 'The page took too long to load',
      suggestion: 'The website may be slow or experiencing issues. Try again later.',
      retryable: true,
    };
  }

  // Connection refused
  if (errorMessage.includes('connection refused') || errorMessage.includes('econnrefused')) {
    return {
      type: CrawlErrorType.CONNECTION_REFUSED,
      message: error.message,
      userMessage: 'Could not connect to the website',
      suggestion: 'The website may be down or blocking connections from our servers.',
      retryable: true,
    };
  }

  // DNS failure
  if (errorMessage.includes('getaddrinfo') || errorMessage.includes('dns')) {
    return {
      type: CrawlErrorType.DNS_FAILURE,
      message: error.message,
      userMessage: 'Could not resolve website address',
      suggestion: 'Please check that the URL is correct and the website exists.',
      retryable: false,
    };
  }

  // SSL errors
  if (errorMessage.includes('ssl') || errorMessage.includes('certificate')) {
    return {
      type: CrawlErrorType.SSL_ERROR,
      message: error.message,
      userMessage: 'SSL/Security certificate error',
      suggestion: 'The website has an invalid or expired security certificate.',
      retryable: false,
    };
  }

  // Bot detection from error message
  if (errorMessage.includes('bot verification') || errorMessage.includes('cloudflare')) {
    return {
      type: CrawlErrorType.CLOUDFLARE_CHALLENGE,
      message: error.message,
      userMessage: 'Website has strong bot protection (Cloudflare)',
      suggestion: 'This website uses advanced security that prevents automated scanning. Consider contacting the website owner to whitelist our crawler.',
      retryable: false,
    };
  }

  // HTTP status codes
  if (statusCode) {
    if (statusCode === 403) {
      return {
        type: CrawlErrorType.ACCESS_DENIED,
        message: `HTTP ${statusCode} Forbidden`,
        userMessage: 'Access denied by the website',
        suggestion: 'The website is blocking access. This could be due to bot detection or IP blocking.',
        retryable: false,
        statusCode,
      };
    }

    if (statusCode === 429) {
      return {
        type: CrawlErrorType.RATE_LIMITED,
        message: `HTTP ${statusCode} Too Many Requests`,
        userMessage: 'Rate limited by the website',
        suggestion: 'We sent too many requests. The audit will automatically slow down and retry.',
        retryable: true,
        statusCode,
      };
    }

    if (statusCode === 404) {
      return {
        type: CrawlErrorType.PAGE_NOT_FOUND,
        message: `HTTP ${statusCode} Not Found`,
        userMessage: 'Page not found',
        suggestion: 'This page does not exist. Check that the URL is correct.',
        retryable: false,
        statusCode,
      };
    }

    if (statusCode >= 500) {
      return {
        type: CrawlErrorType.SERVER_ERROR,
        message: `HTTP ${statusCode} Server Error`,
        userMessage: 'Website server error',
        suggestion: 'The website is experiencing technical difficulties. Try again later.',
        retryable: true,
        statusCode,
      };
    }
  }

  // Check HTML content for patterns
  if (html) {
    const htmlLower = html.toLowerCase();

    // Cloudflare patterns
    if (htmlLower.includes('cf-browser-verification') ||
        htmlLower.includes('cloudflare') && htmlLower.includes('challenge')) {
      return {
        type: CrawlErrorType.CLOUDFLARE_CHALLENGE,
        message: 'Cloudflare challenge detected',
        userMessage: 'Website protected by Cloudflare security',
        suggestion: 'This website uses Cloudflare bot protection that we cannot bypass. The website owner would need to whitelist our crawler IP or disable "Bot Fight Mode".',
        retryable: false,
      };
    }

    // CAPTCHA patterns
    if (htmlLower.includes('captcha') ||
        htmlLower.includes('recaptcha') ||
        htmlLower.includes('hcaptcha')) {
      return {
        type: CrawlErrorType.CAPTCHA_REQUIRED,
        message: 'CAPTCHA challenge detected',
        userMessage: 'Website requires CAPTCHA verification',
        suggestion: 'This website requires human verification that cannot be automated.',
        retryable: false,
      };
    }

    // Login patterns
    if (htmlLower.includes('login') && htmlLower.includes('password') ||
        htmlLower.includes('sign in') && htmlLower.includes('password')) {
      return {
        type: CrawlErrorType.LOGIN_REQUIRED,
        message: 'Login page detected',
        userMessage: 'Content requires authentication',
        suggestion: 'This content is behind a login wall and cannot be audited without credentials.',
        retryable: false,
      };
    }

    // Generic bot detection
    if (htmlLower.includes('access denied') ||
        htmlLower.includes('blocked') && htmlLower.includes('security') ||
        htmlLower.includes('suspicious activity')) {
      return {
        type: CrawlErrorType.BOT_DETECTED,
        message: 'Bot detection triggered',
        userMessage: 'Website detected automated access',
        suggestion: 'The website has security measures that detected our crawler. Try again later or contact the website owner.',
        retryable: false,
      };
    }
  }

  // Unknown error
  return {
    type: CrawlErrorType.UNKNOWN,
    message: error.message,
    userMessage: 'An unexpected error occurred',
    suggestion: 'Please try again. If the problem persists, the website may have issues.',
    retryable: true,
  };
}
```

#### 5.2 User-Friendly Error Messages

```typescript
// Enhanced error storage
interface AuditPageError {
  errorType: CrawlErrorType;
  errorMessage: string;
  userMessage: string;
  suggestion: string;
  retryable: boolean;
  timestamp: Date;
}

// Database migration to add structured error data
ALTER TABLE audit_pages ADD COLUMN error_type VARCHAR(50);
ALTER TABLE audit_pages ADD COLUMN error_suggestion TEXT;
ALTER TABLE audit_pages ADD COLUMN error_retryable BOOLEAN DEFAULT false;
```

#### 5.3 Audit-Level Error Summary

```typescript
interface AuditErrorSummary {
  totalErrors: number;
  errorsByType: Record<CrawlErrorType, number>;
  hasSecurityBlocking: boolean;
  securityBlockingMessage?: string;
  overallStatus: 'success' | 'partial' | 'blocked' | 'failed';
}

function generateErrorSummary(pages: AuditPage[]): AuditErrorSummary {
  const errors = pages.filter(p => p.crawl_status === 'failed');
  const errorsByType: Record<string, number> = {};

  for (const page of errors) {
    const type = page.error_type || 'UNKNOWN';
    errorsByType[type] = (errorsByType[type] || 0) + 1;
  }

  const securityTypes = [
    CrawlErrorType.CLOUDFLARE_CHALLENGE,
    CrawlErrorType.BOT_DETECTED,
    CrawlErrorType.CAPTCHA_REQUIRED,
    CrawlErrorType.ACCESS_DENIED,
  ];

  const hasSecurityBlocking = securityTypes.some(t => errorsByType[t] > 0);

  let overallStatus: 'success' | 'partial' | 'blocked' | 'failed';
  const successPages = pages.filter(p => p.crawl_status === 'crawled').length;

  if (successPages === pages.length) {
    overallStatus = 'success';
  } else if (successPages === 0 && hasSecurityBlocking) {
    overallStatus = 'blocked';
  } else if (successPages === 0) {
    overallStatus = 'failed';
  } else {
    overallStatus = 'partial';
  }

  return {
    totalErrors: errors.length,
    errorsByType: errorsByType as Record<CrawlErrorType, number>,
    hasSecurityBlocking,
    securityBlockingMessage: hasSecurityBlocking
      ? 'This website has security measures that prevent automated scanning. Some or all pages could not be audited.'
      : undefined,
    overallStatus,
  };
}
```

### Phase 6: Request Timing Randomization (Medium Priority)

#### 6.1 Human-Like Delays

```typescript
// File: server/src/services/spider/timing.service.ts
export function getRandomDelay(minMs: number, maxMs: number): number {
  // Use gaussian distribution for more realistic timing
  const mean = (minMs + maxMs) / 2;
  const stdDev = (maxMs - minMs) / 6;  // 99.7% within range

  let delay: number;
  do {
    // Box-Muller transform for gaussian random
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    delay = mean + z * stdDev;
  } while (delay < minMs || delay > maxMs);

  return Math.round(delay);
}

export function getPageLoadDelay(): number {
  // Simulate human reading/thinking time between pages
  return getRandomDelay(1000, 3000);
}

export function getScrollDelay(): number {
  // Delay between scroll actions
  return getRandomDelay(200, 500);
}
```

### Phase 7: Behavioral Simulation (Low Priority)

#### 7.1 Human-Like Interactions

```typescript
// File: server/src/services/spider/behavior.service.ts
export async function simulateHumanBehavior(page: Page): Promise<void> {
  // Random mouse movements
  const viewport = page.viewportSize();
  if (viewport) {
    const x = Math.random() * viewport.width;
    const y = Math.random() * viewport.height;
    await page.mouse.move(x, y);
  }

  // Random scrolling
  const scrollAmount = Math.floor(Math.random() * 500) + 100;
  await page.evaluate((amount) => {
    window.scrollBy(0, amount);
  }, scrollAmount);

  // Brief pause
  await page.waitForTimeout(getRandomDelay(500, 1500));
}
```

---

## Part 3: Database Changes

### 3.1 Migration: Enhanced Error Tracking

```sql
-- Migration: 025_enhanced_error_tracking.sql

-- Add structured error columns to audit_pages
ALTER TABLE audit_pages ADD COLUMN IF NOT EXISTS error_type VARCHAR(50);
ALTER TABLE audit_pages ADD COLUMN IF NOT EXISTS error_user_message TEXT;
ALTER TABLE audit_pages ADD COLUMN IF NOT EXISTS error_suggestion TEXT;
ALTER TABLE audit_pages ADD COLUMN IF NOT EXISTS error_retryable BOOLEAN DEFAULT false;

-- Add error summary to audit_jobs
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS error_summary JSONB;
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS security_blocked BOOLEAN DEFAULT false;
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS security_blocked_reason TEXT;

-- Index for error analysis
CREATE INDEX IF NOT EXISTS idx_audit_pages_error_type ON audit_pages(audit_job_id, error_type);
```

---

## Part 4: UI Changes

### 4.1 Security Blocking Alert

```tsx
// Component: SecurityBlockedAlert.tsx
interface SecurityBlockedAlertProps {
  reason: string;
  suggestion: string;
}

export function SecurityBlockedAlert({ reason, suggestion }: SecurityBlockedAlertProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <ShieldExclamationIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-800">Website Security Protection Detected</h3>
          <p className="text-amber-700 mt-1">{reason}</p>
          <div className="mt-3 p-3 bg-amber-100 rounded text-sm">
            <strong>What you can do:</strong>
            <p className="mt-1">{suggestion}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.2 Error Summary Display

```tsx
// Component: AuditErrorSummary.tsx
export function AuditErrorSummary({ summary }: { summary: AuditErrorSummary }) {
  if (summary.totalErrors === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">
        Crawl Issues ({summary.totalErrors} pages affected)
      </h3>

      <div className="space-y-2">
        {Object.entries(summary.errorsByType).map(([type, count]) => (
          <div key={type} className="flex justify-between text-sm">
            <span className="text-gray-600">{getErrorTypeLabel(type)}</span>
            <span className="font-medium">{count} pages</span>
          </div>
        ))}
      </div>

      {summary.hasSecurityBlocking && (
        <div className="mt-4 p-3 bg-amber-50 rounded text-sm text-amber-800">
          <strong>Note:</strong> Some pages were blocked by security measures.
          The audit results may be incomplete.
        </div>
      )}
    </div>
  );
}
```

---

## Part 5: Implementation Priority

### High Priority (Week 1-2)
1. JavaScript evasion scripts (webdriver masking)
2. User agent rotation
3. Enhanced error classification
4. User-friendly error messages
5. Database migration for error tracking

### Medium Priority (Week 3-4)
1. Header randomization
2. Viewport randomization
3. Smart wait strategies
4. SPA detection and handling
5. UI error summary components

### Low Priority (Week 5+)
1. Proxy support infrastructure
2. Request timing randomization
3. Behavioral simulation
4. Timezone/locale spoofing
5. Advanced fingerprint evasion

---

## Part 6: Files to Create/Modify

### New Files
- `server/src/services/spider/stealth.service.ts` - Evasion scripts
- `server/src/services/spider/user-agents.ts` - UA rotation
- `server/src/services/spider/headers.service.ts` - Header randomization
- `server/src/services/spider/error-classifier.service.ts` - Error classification
- `server/src/services/spider/wait-strategies.ts` - Smart waiting
- `server/src/services/spider/proxy.service.ts` - Proxy support
- `server/src/services/spider/timing.service.ts` - Request timing
- `server/src/db/migrations/025_enhanced_error_tracking.sql`
- `client/src/components/audit/SecurityBlockedAlert.tsx`
- `client/src/components/audit/AuditErrorSummary.tsx`

### Modified Files
- `server/src/services/spider/spider.service.ts` - Integrate stealth
- `server/src/services/queue/audit-worker.service.ts` - Use error classifier
- `server/src/types/spider.types.ts` - Add error types
- `client/src/pages/audits/AuditDetail.tsx` - Display error summary
- `client/src/types/audit.types.ts` - Add error types

---

## Part 7: Verification

### Test Scenarios
1. **Cloudflare-protected site** - Should show clear "security blocked" message
2. **Rate-limited site** - Should automatically back off and retry
3. **Slow site** - Should wait appropriately with smart wait
4. **SPA site** - Should detect and wait for hydration
5. **Normal site** - Should work without detection
6. **DNS failure** - Should show "domain not found" message
7. **SSL error** - Should show certificate error message

### Success Criteria
- 90%+ success rate on non-protected sites
- Clear, actionable error messages for all failure types
- No false positives (working sites flagged as blocked)
- Graceful degradation (partial results when possible)
