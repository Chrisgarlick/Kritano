/**
 * Pre-rendering service for SEO/bot user agents.
 *
 * Renders SPA pages with headless Chrome via Puppeteer and caches the
 * resulting HTML so that crawlers (Googlebot, GPTBot, Bingbot, etc.)
 * see fully rendered content including structured data, meta tags,
 * and semantic HTML.
 *
 * - In-memory LRU cache with configurable TTL
 * - Single browser instance reused across requests
 * - Only renders public pages (not /dashboard, /admin, etc.)
 */

import puppeteer, { type Browser } from 'puppeteer';

// ── Configuration ────────────────────────────────────────────────────

const CACHE_TTL_MS = parseInt(process.env.PRERENDER_CACHE_TTL || '3600000', 10); // 1 hour default
const MAX_CACHE_SIZE = parseInt(process.env.PRERENDER_MAX_CACHE || '200', 10);
const RENDER_TIMEOUT_MS = 10_000;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Paths that should never be pre-rendered (authenticated/dynamic)
const BLOCKED_PREFIXES = [
  '/app', '/admin', '/api/', '/auth/', '/sitemap', '/robots',
];

// ── Cache ────────────────────────────────────────────────────────────

interface CacheEntry {
  html: string;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(url: string): string | null {
  const entry = cache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    cache.delete(url);
    return null;
  }
  return entry.html;
}

function setCache(url: string, html: string): void {
  // Evict oldest if at capacity
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(url, { html, createdAt: Date.now() });
}

export function clearPrerenderCache(): void {
  cache.clear();
}

// ── Browser Management ───────────────────────────────────────────────

let browser: Browser | null = null;
let launching = false;
let launchQueue: Array<(b: Browser) => void> = [];

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) return browser;

  // Avoid multiple simultaneous launches
  if (launching) {
    return new Promise<Browser>(resolve => launchQueue.push(resolve));
  }

  launching = true;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--single-process',
      ],
    });

    // Auto-cleanup on disconnect
    browser.on('disconnected', () => {
      browser = null;
    });

    // Resolve any queued requests
    for (const resolve of launchQueue) {
      resolve(browser);
    }
    launchQueue = [];

    return browser;
  } finally {
    launching = false;
  }
}

export async function shutdownPrerenderBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

// ── Public API ───────────────────────────────────────────────────────

export function shouldPrerender(path: string): boolean {
  return !BLOCKED_PREFIXES.some(prefix => path.startsWith(prefix));
}

export async function renderPage(urlPath: string): Promise<string | null> {
  if (!shouldPrerender(urlPath)) return null;

  // Check cache first
  const cached = getCached(urlPath);
  if (cached) return cached;

  let page = null;
  try {
    const b = await getBrowser();
    page = await b.newPage();

    // Block unnecessary resources to speed up rendering
    await page.setRequestInterception(true);
    page.on('request', req => {
      const type = req.resourceType();
      if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate and wait for the SPA to render
    const fullUrl = `${APP_URL}${urlPath}`;
    await page.goto(fullUrl, {
      waitUntil: 'networkidle0',
      timeout: RENDER_TIMEOUT_MS,
    });

    // Wait a bit more for React to finish hydration
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

    const html = await page.content();

    // Cache the result
    setCache(urlPath, html);

    return html;
  } catch (err) {
    console.error(`Prerender failed for ${urlPath}:`, (err as Error).message);
    return null;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}
