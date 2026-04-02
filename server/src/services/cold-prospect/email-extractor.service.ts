/**
 * Email Extractor Service
 *
 * Extracts contact emails and person names from live websites.
 * Checks mailto links, contact/about pages, structured data, and common patterns.
 * Uses FOR UPDATE SKIP LOCKED for safe concurrent batch processing.
 */

import { Pool } from 'pg';
import https from 'https';
import http from 'http';
import dns from 'dns';
import { promisify } from 'util';
import * as cheerio from 'cheerio';
import type { ProspectEmail, EmailExtractionResult } from '../../types/cold-prospect.types.js';

const dnsResolveMx = promisify(dns.resolveMx);

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// Common contact page paths to check
const CONTACT_PATHS = [
  '/contact',
  '/contact-us',
  '/about',
];

// Common email prefixes to guess
const EMAIL_PREFIXES = [
  'info',
  'hello',
  'contact',
  'enquiries',
  'admin',
  'sales',
  'support',
  'team',
  'hi',
  'mail',
];

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Name patterns near emails
const NAME_PATTERNS = [
  // "John Smith" before/after email
  /(?:^|\s)([A-Z][a-z]+ [A-Z][a-z]+)(?:\s|,|$)/,
  // Director, Owner, Founder patterns
  /(?:Director|Owner|Founder|CEO|CTO|Manager|Partner|Lead):\s*([A-Z][a-z]+ [A-Z][a-z]+)/i,
];

/**
 * Fetch a page with timeout and size limit
 */
function fetchPage(url: string, timeoutMs: number = 8000, maxRedirects: number = 3): Promise<string | null> {
  return new Promise((resolve) => {
    // Validate URL before making request
    try {
      new URL(url);
    } catch {
      resolve(null);
      return;
    }

    const hardTimer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: timeoutMs,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Kritano/1.0)' },
    }, (res) => {
      // Follow redirects
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        res.resume();
        clearTimeout(hardTimer);

        if (maxRedirects <= 0) { resolve(null); return; }

        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          try {
            const parsed = new URL(url);
            redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
          } catch {
            resolve(null);
            return;
          }
        }

        // Validate the redirect URL
        try {
          new URL(redirectUrl);
        } catch {
          resolve(null);
          return;
        }

        fetchPage(redirectUrl, timeoutMs, maxRedirects - 1).then(resolve);
        return;
      }

      if (res.statusCode !== 200) {
        clearTimeout(hardTimer);
        res.resume();
        resolve(null);
        return;
      }

      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
        if (body.length > 300000) {
          clearTimeout(hardTimer);
          req.destroy();
          resolve(body.substring(0, 300000));
        }
      });
      res.on('end', () => {
        clearTimeout(hardTimer);
        resolve(body);
      });
    });

    req.on('error', () => { clearTimeout(hardTimer); resolve(null); });
    req.on('timeout', () => { clearTimeout(hardTimer); req.destroy(); resolve(null); });
  });
}

/**
 * Check if a domain has valid MX records
 */
async function hasMxRecords(domain: string): Promise<boolean> {
  try {
    const records = await dnsResolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

/**
 * Extract emails from HTML content
 */
function extractEmailsFromHtml(html: string, domain: string, footerOnly: boolean = false): ProspectEmail[] {
  const emails: ProspectEmail[] = [];
  const seen = new Set<string>();
  const $ = cheerio.load(html);

  // When footerOnly, narrow the search scope to footer-like elements
  const scope = footerOnly
    ? $('footer, [class*="footer"], [id*="footer"], [role="contentinfo"]')
    : $('body');

  // If footerOnly but no footer found, fall back to full body
  const searchScope = footerOnly && scope.length === 0 ? $('body') : scope;

  // 1. Check mailto: links (highest confidence)
  searchScope.find('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
    if (email && !seen.has(email) && email.includes('@')) {
      seen.add(email);

      const surroundingText = $(el).parent().text().trim();
      const name = extractNameNearEmail(surroundingText, email);

      emails.push({
        email,
        name,
        role: null,
        source: 'mailto',
        confidence: 'high',
      });
    }
  });

  // 2. Scan text for emails
  const bodyText = searchScope.text();
  const foundEmails = bodyText.match(EMAIL_REGEX) || [];
  for (const email of foundEmails) {
    const lower = email.toLowerCase();
    if (!seen.has(lower) && !isSpamEmail(lower)) {
      seen.add(lower);

      const idx = bodyText.indexOf(email);
      const surroundingText = bodyText.substring(Math.max(0, idx - 200), idx + 200);
      const name = extractNameNearEmail(surroundingText, lower);

      emails.push({
        email: lower,
        name,
        role: null,
        source: 'page_scrape',
        confidence: 'medium',
      });
    }
  }

  // 3. Check structured data (JSON-LD) — always check full page for these
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item.email) {
          const email = item.email.replace('mailto:', '').toLowerCase();
          if (!seen.has(email)) {
            seen.add(email);
            emails.push({
              email,
              name: item.name || item.contactPoint?.name || null,
              role: item.jobTitle || null,
              source: 'structured_data',
              confidence: 'high',
            });
          }
        }
        // Check contactPoint
        if (item.contactPoint?.email) {
          const email = item.contactPoint.email.replace('mailto:', '').toLowerCase();
          if (!seen.has(email)) {
            seen.add(email);
            emails.push({
              email,
              name: item.contactPoint.name || null,
              role: item.contactPoint.contactType || null,
              source: 'structured_data',
              confidence: 'high',
            });
          }
        }
        // Check author
        if (item.author?.email) {
          const email = item.author.email.replace('mailto:', '').toLowerCase();
          if (!seen.has(email)) {
            seen.add(email);
            emails.push({
              email,
              name: item.author.name || null,
              role: 'Author',
              source: 'structured_data',
              confidence: 'high',
            });
          }
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  });

  // 4. Check meta tags
  const emailMeta = $('meta[name="author"]').attr('content');
  if (emailMeta && emailMeta.match(EMAIL_REGEX)) {
    const matches = emailMeta.match(EMAIL_REGEX) || [];
    for (const email of matches) {
      const lower = email.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        emails.push({
          email: lower,
          name: null,
          role: 'Author',
          source: 'meta_tag',
          confidence: 'medium',
        });
      }
    }
  }

  return emails;
}

/**
 * Try to extract a person's name from text near an email address
 */
function extractNameNearEmail(text: string, email: string): string | null {
  // Remove the email itself from the text
  const cleanText = text.replace(email, '').trim();

  // Look for capitalized name patterns
  for (const pattern of NAME_PATTERNS) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate it looks like a real name (2 words, each capitalized, reasonable length)
      if (name.length >= 5 && name.length <= 50) {
        return name;
      }
    }
  }

  // Try to find names in common HTML patterns
  // "By John Smith" or "John Smith |" or "— John Smith"
  const nameMatch = cleanText.match(/(?:by|—|–|-|:)\s*([A-Z][a-z]+ [A-Z][a-z]+)/);
  if (nameMatch && nameMatch[1]) return nameMatch[1].trim();

  return null;
}

/**
 * Extract social media links from HTML
 */
function extractSocialLinks(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const socials: Record<string, string> = {};

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes('twitter.com/') || href.includes('x.com/')) socials.twitter = href;
    else if (href.includes('linkedin.com/')) socials.linkedin = href;
    else if (href.includes('facebook.com/')) socials.facebook = href;
    else if (href.includes('instagram.com/')) socials.instagram = href;
    else if (href.includes('youtube.com/')) socials.youtube = href;
    else if (href.includes('tiktok.com/')) socials.tiktok = href;
  });

  return socials;
}

/**
 * Check if a page has a contact form
 */
function hasContactForm(html: string): boolean {
  const $ = cheerio.load(html);
  // Look for forms with email-like inputs
  const forms = $('form');
  let hasForm = false;

  forms.each((_, form) => {
    const formHtml = $(form).html() || '';
    if (
      formHtml.includes('type="email"') ||
      formHtml.includes('name="email"') ||
      formHtml.includes('name="message"') ||
      formHtml.includes('contact') ||
      formHtml.includes('enquir')
    ) {
      hasForm = true;
    }
  });

  return hasForm;
}

/**
 * Filter out spam/system email addresses
 */
function isSpamEmail(email: string): boolean {
  const spamPatterns = [
    'noreply', 'no-reply', 'donotreply', 'mailer-daemon',
    'postmaster', 'webmaster', 'root@', 'abuse@',
    'sentry', 'bugsnag', 'datadog', 'newrelic',
    '@example.com', '@test.com', '@localhost',
    'wix.com', 'squarespace.com', 'wordpress.com',
    'godaddy.com', 'google.com', 'facebook.com',
  ];
  return spamPatterns.some(p => email.includes(p));
}

/**
 * Generic/free email providers — emails from these don't belong to the domain owner
 */
const GENERIC_EMAIL_PROVIDERS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk',
  'hotmail.com', 'hotmail.co.uk',
  'outlook.com', 'live.com', 'msn.com',
  'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'mail.com', 'zoho.com',
  'yandex.com', 'yandex.ru',
  'tutanota.com', 'fastmail.com',
  'gmx.com', 'gmx.co.uk',
  'btinternet.com', 'sky.com', 'virginmedia.com',
  'talktalk.net', 'plusnet.com',
];

/**
 * Check if an email uses a generic/free provider rather than the prospect's own domain
 */
function isGenericEmail(email: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase();
  return GENERIC_EMAIL_PROVIDERS.includes(emailDomain);
}

/**
 * Check if an email's domain matches the prospect's domain
 */
function emailMatchesDomain(email: string, prospectDomain: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return false;

  const prospect = prospectDomain.toLowerCase();

  // Exact match: info@example.com for example.com
  if (emailDomain === prospect) return true;

  // Subdomain match: info@mail.example.com for example.com
  if (emailDomain.endsWith('.' + prospect)) return true;

  return false;
}

/**
 * Extract all contact information from a domain
 */
export async function extractEmails(domain: string, hasSsl: boolean = true): Promise<EmailExtractionResult> {
  const protocol = hasSsl ? 'https' : 'http';
  const baseUrl = `${protocol}://${domain}`;
  const allEmails: ProspectEmail[] = [];
  const seen = new Set<string>();
  let contactPageUrl: string | null = null;
  let foundContactForm = false;
  let socialLinks: Record<string, string> = {};

  // 1. Fetch homepage (footer only — emails are almost always in the footer)
  const homepage = await fetchPage(baseUrl);
  if (homepage) {
    const homepageEmails = extractEmailsFromHtml(homepage, domain, true);
    for (const e of homepageEmails) {
      if (!seen.has(e.email)) {
        seen.add(e.email);
        allEmails.push(e);
      }
    }
    socialLinks = extractSocialLinks(homepage);
    foundContactForm = hasContactForm(homepage);
  }

  // 2. Check contact/about pages
  for (const contactPath of CONTACT_PATHS) {
    const url = `${baseUrl}${contactPath}`;
    const page = await fetchPage(url);
    if (page) {
      contactPageUrl = contactPageUrl || url;
      const pageEmails = extractEmailsFromHtml(page, domain);
      for (const e of pageEmails) {
        if (!seen.has(e.email)) {
          seen.add(e.email);
          allEmails.push(e);
        }
      }
      if (!foundContactForm) foundContactForm = hasContactForm(page);
      // Merge social links
      const pageSocials = extractSocialLinks(page);
      socialLinks = { ...socialLinks, ...pageSocials };

      // Rate limit: 500ms between page fetches
      await new Promise(r => setTimeout(r, 500));

      // Stop after finding emails on a contact page
      if (pageEmails.length > 0) break;
    }
  }

  // 3. Try common email patterns with MX verification
  if (allEmails.length === 0) {
    const hasMx = await hasMxRecords(domain);
    if (hasMx) {
      // Only add the most common patterns as guesses
      for (const prefix of EMAIL_PREFIXES.slice(0, 5)) {
        allEmails.push({
          email: `${prefix}@${domain}`,
          name: null,
          role: null,
          source: 'pattern_guess',
          confidence: 'low',
        });
      }
    }
  }

  // 4. Select primary contact — ONLY domain-matching emails qualify
  //    Generic emails (gmail, hotmail, etc.) are kept in the emails array
  //    but never used as the primary contact for outreach.
  let primaryEmail: string | null = null;
  let primaryName: string | null = null;
  let primaryRole: string | null = null;

  // Split emails into domain-matching and generic
  const domainEmails = allEmails.filter(e => emailMatchesDomain(e.email, domain) && e.source !== 'pattern_guess');
  const domainGuesses = allEmails.filter(e => emailMatchesDomain(e.email, domain) && e.source === 'pattern_guess');

  // Priority: domain email with name > domain email high confidence > domain guess > nothing
  // Generic emails (gmail etc.) are NEVER used as primary
  const bestDomainWithName = domainEmails.find(e => e.name);
  const bestDomainHigh = domainEmails.find(e => e.confidence === 'high');
  const bestDomain = domainEmails[0];
  const bestGuess = domainGuesses[0];

  const primary = bestDomainWithName || bestDomainHigh || bestDomain || bestGuess;

  if (primary) {
    primaryEmail = primary.email;
    primaryName = primary.name;
    primaryRole = primary.role;
  }

  // Tag generic emails so the UI can show them differently
  for (const e of allEmails) {
    if (isGenericEmail(e.email)) {
      e.confidence = 'low';
    }
  }

  return {
    emails: allEmails,
    contactPageUrl,
    hasContactForm: foundContactForm,
    socialLinks,
    primaryEmail,
    primaryName,
    primaryRole,
  };
}

/**
 * Process a batch of live domains for email extraction
 * Uses FOR UPDATE SKIP LOCKED to prevent duplicate processing
 */
export async function processLiveBatch(batchSize: number = 20): Promise<number> {
  const client = await pool.connect();
  let processed = 0;

  try {
    // Claim a batch of live domains
    const claimed = await client.query(
      `UPDATE cold_prospects
       SET status = 'extracting', updated_at = NOW()
       WHERE id IN (
         SELECT id FROM cold_prospects
         WHERE status = 'live' AND is_excluded = FALSE
         ORDER BY quality_score DESC, created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id, domain, has_ssl`,
      [batchSize]
    );

    if (claimed.rows.length === 0) return 0;

    console.log(`📧 Extracting emails from ${claimed.rows.length} domains...`);

    // Process sequentially with small delay (respect rate limits)
    for (const row of claimed.rows) {
      try {
        const result = await extractEmails(row.domain, row.has_ssl);

        const newStatus = result.primaryEmail ? 'qualified' : 'live';

        await client.query(
          `UPDATE cold_prospects SET
            status = $2,
            contact_email = $3,
            contact_name = $4,
            contact_role = $5,
            emails = $6,
            contact_page_url = $7,
            has_contact_form = $8,
            social_links = $9,
            updated_at = NOW()
          WHERE id = $1`,
          [
            row.id,
            newStatus,
            result.primaryEmail,
            result.primaryName,
            result.primaryRole,
            JSON.stringify(result.emails),
            result.contactPageUrl,
            result.hasContactForm,
            JSON.stringify(result.socialLinks),
          ]
        );

        processed++;
      } catch (err) {
        console.error(`📧 Error extracting emails from ${row.domain}:`, err);
        // Keep as 'live' so it can be retried
        await client.query(
          `UPDATE cold_prospects SET status = 'live', updated_at = NOW() WHERE id = $1`,
          [row.id]
        );
        processed++;
      }

      // Rate limit: 1 second between domains
      await new Promise(r => setTimeout(r, 1000));
    }
  } finally {
    client.release();
  }

  return processed;
}
