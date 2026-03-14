/**
 * NRD Feed Service
 *
 * Downloads and parses daily Newly Registered Domain feeds from WhoisDS.
 * Filters by target TLDs and excluded keywords, then bulk imports to DB.
 */

import { Pool } from 'pg';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createInterface } from 'readline';
import { execSync } from 'child_process';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

/**
 * Get a setting value from cold_prospect_settings
 */
export async function getSetting<T>(key: string): Promise<T | null> {
  const result = await pool.query(
    'SELECT value FROM cold_prospect_settings WHERE key = $1',
    [key]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].value as T;
}

/**
 * Update a setting value
 */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  await pool.query(
    `INSERT INTO cold_prospect_settings (id, key, value, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}

/**
 * Get all settings as a typed object
 */
export async function getSettings(): Promise<{
  targetTlds: string[];
  excludedKeywords: string[];
  minQualityScore: number;
  dailyCheckLimit: number;
  dailyEmailLimit: number;
  autoOutreachEnabled: boolean;
  lastFeedDate: string | null;
}> {
  const result = await pool.query('SELECT key, value FROM cold_prospect_settings');
  const settings: Record<string, unknown> = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  return {
    targetTlds: (settings.target_tlds as string[]) || ['com', 'co.uk', 'org.uk', 'uk', 'io', 'co', 'net'],
    excludedKeywords: (settings.excluded_keywords as string[]) || [],
    minQualityScore: (settings.min_quality_score as number) || 50,
    dailyCheckLimit: (settings.daily_check_limit as number) || 5000,
    dailyEmailLimit: (settings.daily_email_limit as number) || 50,
    autoOutreachEnabled: (settings.auto_outreach_enabled as boolean) || false,
    lastFeedDate: (settings.last_feed_date as string) || null,
  };
}

/**
 * Format date as YYYY-MM-DD for WhoisDS feed URL
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Download a file from URL to a local path
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    client.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(destPath);
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

/**
 * Download the daily NRD feed from WhoisDS.
 *
 * WhoisDS provides ~70k newly registered domains per day for free.
 * URL requires base64-encoded "{date}.zip" in the path.
 * The zip contains a single `domain-names.txt` file (one domain per line).
 */
export async function downloadDailyFeed(date: Date): Promise<string> {
  const dateStr = formatDate(date);
  const tmpDir = path.join(os.tmpdir(), 'pagepulser-nrd');

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const txtPath = path.join(tmpDir, `nrd-${dateStr}.txt`);

  // If already downloaded, reuse
  if (fs.existsSync(txtPath)) {
    console.log(`🎯 Using cached feed: ${txtPath}`);
    return txtPath;
  }

  // WhoisDS URL uses base64("{date}.zip") in the path
  const encoded = Buffer.from(`${dateStr}.zip`).toString('base64');
  const feedUrl = `https://whoisds.com/whois-database/newly-registered-domains/${encoded}/nrd`;
  const zipPath = path.join(tmpDir, `nrd-${dateStr}.zip`);

  console.log(`🎯 Downloading NRD feed for ${dateStr}...`);
  await downloadFile(feedUrl, zipPath);

  // Check we got a real zip (not an empty HTML response)
  const stat = fs.statSync(zipPath);
  if (stat.size < 1000) {
    fs.unlinkSync(zipPath);
    throw new Error(`Feed for ${dateStr} not available (file too small: ${stat.size} bytes)`);
  }

  // Unzip — extracts domain-names.txt
  execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { stdio: 'pipe' });
  const extractedPath = path.join(tmpDir, 'domain-names.txt');

  if (!fs.existsSync(extractedPath)) {
    throw new Error('Zip did not contain domain-names.txt');
  }

  // Rename to date-stamped file and clean up
  fs.renameSync(extractedPath, txtPath);
  fs.unlinkSync(zipPath);

  const lineCount = fs.readFileSync(txtPath, 'utf-8').split('\n').filter(l => l.trim()).length;
  console.log(`🎯 NRD feed downloaded: ${lineCount} domains`);
  return txtPath;
}

/**
 * Extract TLD from a domain name
 */
export function extractTld(domain: string): string {
  const parts = domain.toLowerCase().split('.');
  if (parts.length < 2) return '';

  // Handle common two-part TLDs
  const twoPartTlds = ['co.uk', 'org.uk', 'ac.uk', 'me.uk', 'co.nz', 'co.za', 'com.au', 'com.br'];
  if (parts.length >= 3) {
    const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (twoPartTlds.includes(lastTwo)) return lastTwo;
  }

  return parts[parts.length - 1];
}

/**
 * Parse the NRD feed CSV and filter by target TLDs
 * Returns array of domain names that pass filters
 */
export async function parseFeed(
  filePath: string,
  targetTlds: string[],
  excludedKeywords: string[]
): Promise<string[]> {
  const domains: string[] = [];
  const tldSet = new Set(targetTlds.map(t => t.toLowerCase()));
  const keywordPatterns = excludedKeywords.map(k => k.toLowerCase());

  const fileStream = fs.createReadStream(filePath);
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    // Skip header
    if (lineCount === 1 && (line.toLowerCase().includes('domain') || line.startsWith('#'))) continue;

    // CSV might have: domain,registrar,date or just domain per line
    const domain = line.split(',')[0]?.trim().toLowerCase();
    if (!domain || domain.length < 4) continue;

    // Filter by TLD
    const tld = extractTld(domain);
    if (!tldSet.has(tld)) continue;

    // Exclude domains matching keywords
    const hasExcludedKeyword = keywordPatterns.some(kw => domain.includes(kw));
    if (hasExcludedKeyword) continue;

    // Basic domain validation
    if (!/^[a-z0-9][a-z0-9\-\.]*\.[a-z]{2,}$/.test(domain)) continue;

    domains.push(domain);
  }

  console.log(`🎯 Parsed ${lineCount} lines, ${domains.length} domains passed filters`);
  return domains;
}

/**
 * Bulk import domains into cold_prospects table
 * Uses ON CONFLICT DO NOTHING to skip duplicates
 */
export async function importDomains(
  domains: string[],
  batchDate: Date,
  source: string = 'whoisds'
): Promise<{ imported: number; duplicates: number }> {
  if (domains.length === 0) return { imported: 0, duplicates: 0 };

  const batchDateStr = formatDate(batchDate);
  let imported = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE);

    // Build bulk insert with parameterized values
    const values: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    for (const domain of batch) {
      const tld = extractTld(domain);
      values.push(`(gen_random_uuid(), $${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`);
      params.push(domain, tld, batchDateStr, batchDateStr, source);
      paramIdx += 5;
    }

    const result = await pool.query(
      `INSERT INTO cold_prospects (id, domain, tld, registered_at, batch_date, source)
       VALUES ${values.join(', ')}
       ON CONFLICT (domain) DO NOTHING`,
      params
    );

    imported += result.rowCount || 0;
  }

  return {
    imported,
    duplicates: domains.length - imported,
  };
}

/**
 * Import domains from a manual CSV upload
 * Expects CSV with at least a "domain" column
 */
export async function importFromCsv(csvContent: string): Promise<{ imported: number; duplicates: number; errors: number }> {
  const lines = csvContent.split('\n').filter(l => l.trim());
  const domains: string[] = [];
  let errors = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (i === 0 && (line.toLowerCase().includes('domain') || line.startsWith('#'))) continue;

    const domain = line.split(',')[0]?.trim().toLowerCase();
    if (!domain || domain.length < 4) {
      errors++;
      continue;
    }

    if (!/^[a-z0-9][a-z0-9\-\.]*\.[a-z]{2,}$/.test(domain)) {
      errors++;
      continue;
    }

    domains.push(domain);
  }

  const result = await importDomains(domains, new Date(), 'manual_csv');
  return { ...result, errors };
}

/**
 * Clean up old temp files
 */
export function cleanupTempFiles(olderThanDays: number = 7): void {
  const tmpDir = path.join(os.tmpdir(), 'pagepulser-nrd');
  if (!fs.existsSync(tmpDir)) return;

  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(tmpDir);

  for (const file of files) {
    const filePath = path.join(tmpDir, file);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
    }
  }
}
