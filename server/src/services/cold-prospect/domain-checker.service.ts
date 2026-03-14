/**
 * Domain Checker Service
 *
 * Checks if newly registered domains have live websites.
 * Detects technology stack, SSL, page count, and calculates a quality score.
 * Uses FOR UPDATE SKIP LOCKED for safe concurrent batch processing.
 */

import { Pool } from 'pg';
import https from 'https';
import http from 'http';
import dns from 'dns';
import { promisify } from 'util';
import * as cheerio from 'cheerio';
import type { DomainCheckResult } from '../../types/cold-prospect.types.js';

const dnsResolve = promisify(dns.resolve);

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// Parked domain signals
const PARKED_SIGNALS = [
  'this domain is for sale',
  'domain parking',
  'buy this domain',
  'is parked free',
  'godaddy',
  'sedo.com',
  'hugedomains',
  'afternic',
  'dan.com',
  'undeveloped',
  'this webpage is parked',
  'domain registered at',
  'coming soon',
  'under construction',
  'website coming soon',
  'site under construction',
  'future home of',
  'nothing here yet',
  'default web page',
  'it works!',
  'apache2 default page',
  'welcome to nginx',
  'test page for',
  'congratulations, your site is live',
];

// Technology detection patterns
const TECH_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: 'WordPress', patterns: [/wp-content/i, /wp-includes/i, /wordpress/i] },
  { name: 'Shopify', patterns: [/shopify/i, /cdn\.shopify/i] },
  { name: 'Wix', patterns: [/wix\.com/i, /wixsite/i] },
  { name: 'Squarespace', patterns: [/squarespace/i, /sqsp\.net/i] },
  { name: 'Webflow', patterns: [/webflow/i] },
  { name: 'React', patterns: [/react/i, /__next/i, /next\.js/i] },
  { name: 'Vue', patterns: [/vue\.js/i, /nuxt/i] },
  { name: 'Angular', patterns: [/angular/i, /ng-version/i] },
  { name: 'Laravel', patterns: [/laravel/i] },
  { name: 'Drupal', patterns: [/drupal/i] },
  { name: 'Joomla', patterns: [/joomla/i] },
  { name: 'Ghost', patterns: [/ghost\.org/i, /ghost\.io/i] },
  { name: 'Magento', patterns: [/magento/i, /mage\//i] },
  { name: 'WooCommerce', patterns: [/woocommerce/i, /wc-/i] },
  { name: 'PrestaShop', patterns: [/prestashop/i] },
  { name: 'HubSpot', patterns: [/hubspot/i, /hs-scripts/i] },
  { name: 'Bootstrap', patterns: [/bootstrap/i] },
  { name: 'Tailwind', patterns: [/tailwind/i] },
  { name: 'jQuery', patterns: [/jquery/i] },
  { name: 'Google Analytics', patterns: [/google-analytics/i, /gtag/i, /googletagmanager/i] },
];

/**
 * Make an HTTP(S) request and return status + body
 */
function fetchPage(url: string, timeoutMs: number = 10000, maxRedirects: number = 3): Promise<{ status: number; body: string; headers: Record<string, string>; finalUrl: string }> {
  return new Promise((resolve, reject) => {
    // Hard overall timeout — kills the request no matter what
    const hardTimer = setTimeout(() => {
      reject(new Error('Hard timeout exceeded'));
    }, timeoutMs);

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PagePulser/1.0)' } }, (res) => {
      // Follow redirects (up to maxRedirects)
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
        if (maxRedirects <= 0) {
          clearTimeout(hardTimer);
          reject(new Error('Too many redirects'));
          return;
        }
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        res.resume(); // drain the response
        clearTimeout(hardTimer);
        fetchPage(redirectUrl, timeoutMs, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }

      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
        // Limit body size to 500KB
        if (body.length > 500000) {
          clearTimeout(hardTimer);
          req.destroy();
          resolve({
            status: res.statusCode || 200,
            body: body.substring(0, 500000),
            headers: res.headers as Record<string, string>,
            finalUrl: url,
          });
        }
      });
      res.on('end', () => {
        clearTimeout(hardTimer);
        resolve({
          status: res.statusCode || 200,
          body,
          headers: res.headers as Record<string, string>,
          finalUrl: url,
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(hardTimer);
      reject(err);
    });
    req.on('timeout', () => {
      clearTimeout(hardTimer);
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Check if a domain has valid DNS records
 */
async function hasDns(domain: string): Promise<boolean> {
  try {
    await dnsResolve(domain);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect technologies from HTML content and headers
 */
function detectTechStack(html: string, headers: Record<string, string>): string[] {
  const detected: string[] = [];
  const combined = html + ' ' + JSON.stringify(headers);

  for (const tech of TECH_PATTERNS) {
    if (tech.patterns.some(p => p.test(combined))) {
      detected.push(tech.name);
    }
  }

  // Check meta generator tag
  const $ = cheerio.load(html);
  const generator = $('meta[name="generator"]').attr('content');
  if (generator && !detected.some(t => generator.toLowerCase().includes(t.toLowerCase()))) {
    detected.push(generator.trim());
  }

  return detected;
}

/**
 * Check if page content indicates a parked/placeholder domain
 */
function isParkedDomain(html: string, title: string): boolean {
  const lowerHtml = html.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  const combined = lowerHtml + ' ' + lowerTitle;

  return PARKED_SIGNALS.some(signal => combined.includes(signal));
}

/**
 * Estimate page count from sitemap or links
 */
function estimatePageCount(html: string, domain: string): number {
  const $ = cheerio.load(html);
  const internalLinks = new Set<string>();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Count internal links
    if (href.startsWith('/') || href.includes(domain)) {
      const normalized = href.split('#')[0].split('?')[0];
      if (normalized && normalized !== '/') {
        internalLinks.add(normalized);
      }
    }
  });

  return Math.max(1, internalLinks.size);
}

/**
 * Check a single domain for liveness and gather info
 */
export async function checkDomain(domain: string): Promise<DomainCheckResult> {
  // 1. DNS check
  const hasDnsRecords = await hasDns(domain);
  if (!hasDnsRecords) {
    return {
      isLive: false,
      httpStatus: null,
      hasSsl: false,
      title: null,
      metaDescription: null,
      technologyStack: [],
      pageCountEstimate: null,
      language: null,
      isParked: false,
    };
  }

  // 2. Try HTTPS first, then HTTP
  let result: { status: number; body: string; headers: Record<string, string>; finalUrl: string } | null = null;
  let hasSsl = false;

  try {
    result = await fetchPage(`https://${domain}`);
    hasSsl = true;
  } catch {
    try {
      result = await fetchPage(`http://${domain}`);
    } catch {
      return {
        isLive: false,
        httpStatus: null,
        hasSsl: false,
        title: null,
        metaDescription: null,
        technologyStack: [],
        pageCountEstimate: null,
        language: null,
        isParked: false,
      };
    }
  }

  if (!result || result.status >= 400) {
    return {
      isLive: false,
      httpStatus: result?.status || null,
      hasSsl,
      title: null,
      metaDescription: null,
      technologyStack: [],
      pageCountEstimate: null,
      language: null,
      isParked: false,
    };
  }

  // 3. Parse HTML
  const $ = cheerio.load(result.body);
  const title = $('title').text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  const language = $('html').attr('lang')?.split('-')[0] || null;

  // 4. Detect tech stack
  const technologyStack = detectTechStack(result.body, result.headers);

  // 5. Check if parked
  const parked = isParkedDomain(result.body, title || '');

  // 6. Estimate pages
  const pageCountEstimate = parked ? 1 : estimatePageCount(result.body, domain);

  return {
    isLive: true,
    httpStatus: result.status,
    hasSsl,
    title,
    metaDescription,
    technologyStack,
    pageCountEstimate,
    language,
    isParked: parked,
  };
}

/**
 * Calculate quality score for a prospect based on domain check results
 */
export function calculateQualityScore(result: DomainCheckResult, tld: string): number {
  let score = 0;

  if (!result.isLive) return 0;
  if (result.isParked) return 5; // Minimal score for parked domains

  // SSL
  if (result.hasSsl) score += 20;

  // Has real title (not empty, not default)
  if (result.title && result.title.length > 5) score += 15;

  // Has meta description
  if (result.metaDescription && result.metaDescription.length > 20) score += 15;

  // Multiple pages
  if (result.pageCountEstimate && result.pageCountEstimate >= 5) score += 10;

  // Detected CMS/framework
  if (result.technologyStack.length > 0) score += 10;

  // English language
  if (result.language === 'en') score += 10;

  // Relevant TLD bonus
  const premiumTlds = ['com', 'co.uk', 'org.uk', 'io'];
  if (premiumTlds.includes(tld)) score += 10;

  // Has analytics (investment signal)
  if (result.technologyStack.includes('Google Analytics')) score += 10;

  return Math.min(100, score);
}

/**
 * Process a batch of pending domains
 * Uses FOR UPDATE SKIP LOCKED to prevent duplicate processing
 */
export async function processPendingBatch(batchSize: number = 50): Promise<number> {
  const client = await pool.connect();
  let processed = 0;

  try {
    // Claim a batch
    const claimed = await client.query(
      `UPDATE cold_prospects
       SET status = 'http_checking', updated_at = NOW()
       WHERE id IN (
         SELECT id FROM cold_prospects
         WHERE status = 'checking' AND is_excluded = FALSE
         ORDER BY created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id, domain, tld`,
      [batchSize]
    );

    if (claimed.rows.length === 0) return 0;

    console.log(`🎯 Checking ${claimed.rows.length} domains...`);

    // Process with concurrency limit (DNS pre-filter already removed dead domains)
    const CONCURRENCY = 15;
    const rows = claimed.rows;

    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      const batch = rows.slice(i, i + CONCURRENCY);

      await Promise.all(batch.map(async (row) => {
        try {
          const result = await checkDomain(row.domain);
          const score = calculateQualityScore(result, row.tld);

          await client.query(
            `UPDATE cold_prospects SET
              status = $2,
              is_live = $3,
              http_status = $4,
              has_ssl = $5,
              title = $6,
              meta_description = $7,
              technology_stack = $8,
              page_count_estimate = $9,
              language = $10,
              quality_score = $11,
              updated_at = NOW()
            WHERE id = $1`,
            [
              row.id,
              result.isLive && !result.isParked ? 'live' : 'dead',
              result.isLive,
              result.httpStatus,
              result.hasSsl,
              result.title,
              result.metaDescription,
              JSON.stringify(result.technologyStack),
              result.pageCountEstimate,
              result.language,
              score,
            ]
          );

          processed++;
        } catch (err) {
          console.error(`🎯 Error checking ${row.domain}:`, err);
          await client.query(
            `UPDATE cold_prospects SET status = 'dead', updated_at = NOW() WHERE id = $1`,
            [row.id]
          );
          processed++;
        }
      }));

      // Rate limit between batches (1 second)
      if (i + CONCURRENCY < rows.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  } finally {
    client.release();
  }

  return processed;
}

/**
 * Fast DNS pre-filter — kills domains without A/AAAA records.
 * No A record = no website = no point doing slow HTTP checks.
 * DNS lookups are fast and can be heavily parallelised (50 concurrent).
 *
 * Domains WITHOUT A/AAAA records → marked 'dead' immediately
 * Domains WITH A/AAAA records → marked 'checking' for the HTTP check
 */
export async function processDnsBatch(batchSize: number = 500): Promise<{ checked: number; killed: number; passed: number }> {
  const client = await pool.connect();
  let killed = 0;
  let passed = 0;

  try {
    // Claim a big batch — DNS checks are fast
    const claimed = await client.query(
      `UPDATE cold_prospects
       SET updated_at = NOW()
       WHERE id IN (
         SELECT id FROM cold_prospects
         WHERE status = 'pending' AND is_excluded = FALSE
         ORDER BY created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id, domain`,
      [batchSize]
    );

    if (claimed.rows.length === 0) return { checked: 0, killed: 0, passed: 0 };

    // Check A/AAAA records with high concurrency (DNS is fast)
    const CONCURRENCY = 50;
    const rows = claimed.rows;

    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      const batch = rows.slice(i, i + CONCURRENCY);

      await Promise.all(batch.map(async (row) => {
        try {
          await dnsResolve(row.domain);
          // Has A record — move to 'checking' for HTTP check
          await client.query(
            `UPDATE cold_prospects SET status = 'checking', updated_at = NOW() WHERE id = $1`,
            [row.id]
          );
          passed++;
        } catch {
          // No A record (NXDOMAIN, SERVFAIL, etc.) — no website possible
          await client.query(
            `UPDATE cold_prospects SET status = 'dead', updated_at = NOW() WHERE id = $1`,
            [row.id]
          );
          killed++;
        }
      }));
    }
  } finally {
    client.release();
  }

  return { checked: killed + passed, killed, passed };
}
