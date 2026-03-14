/**
 * Cold Prospect Pipeline CLI
 *
 * Processes NRD feeds entirely in-memory. Qualified prospects
 * (live site + contact email found) are written to JSON files
 * in server/prospect-output/.
 *
 * No database or Docker required.
 *
 * Usage:
 *   npm run prospects                     — full pipeline (yesterday's feed)
 *   npm run prospects -- download         — download yesterday's NRD feed only
 *   npm run prospects -- download 2026-03-12 — download a specific date's NRD feed
 *   npm run prospects -- nrd file.txt     — run pipeline from a .txt file in prospect-output/
 *   npm run prospects -- import file.csv  — import CSV, run pipeline, output JSON
 *   npm run prospects -- list             — list output files
 *   npm run prospects -- settings         — view current pipeline settings
 *   npm run prospects -- set key value    — update a setting
 *   npm run prospects -- reset            — clear checkpoints and start fresh
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import dns from 'dns';
import { promisify } from 'util';
import dotenv from 'dotenv';
dotenv.config();

import {
  downloadDailyFeed,
  parseFeed,
  extractTld,
} from './services/cold-prospect/nrd-feed.service.js';
import {
  checkDomain,
  calculateQualityScore,
} from './services/cold-prospect/domain-checker.service.js';
import {
  extractEmails,
} from './services/cold-prospect/email-extractor.service.js';
import {
  getLocalSettings,
  updateLocalSetting,
} from './services/cold-prospect/prospect-settings.js';

const dnsResolve = promisify(dns.resolve);

// Output directory at server/prospect-output/ (relative to server/)
const OUTPUT_DIR = path.resolve(process.cwd(), 'prospect-output');

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString();
}

function pct(part: number, total: number): string {
  if (total === 0) return '0%';
  return Math.round((part / total) * 100) + '%';
}

function elapsed(startMs: number): string {
  const s = Math.round((Date.now() - startMs) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

function progressBar(current: number, total: number, width: number = 20): string {
  const ratio = total > 0 ? current / total : 0;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function clearLine(): void {
  process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 120) + '\r');
}

function stepHeader(step: number, total: number, icon: string, title: string): void {
  console.log(`\n${icon}  Step ${step}/${total}: ${title}`);
  console.log('─'.repeat(50));
}

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// ─── Checkpointing ─────────────────────────────────────────────────────────

const CHECKPOINT_DIR = path.join(os.tmpdir(), 'pagepulser-pipeline');

function checkpointPath(dateStr: string, step: string): string {
  return path.join(CHECKPOINT_DIR, `${dateStr}-${step}.json`);
}

function saveCheckpoint(dateStr: string, step: string, data: unknown): void {
  if (!fs.existsSync(CHECKPOINT_DIR)) {
    fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  }
  fs.writeFileSync(checkpointPath(dateStr, step), JSON.stringify(data));
}

function loadCheckpoint<T>(dateStr: string, step: string): T | null {
  const p = checkpointPath(dateStr, step);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function clearCheckpoints(dateStr: string): void {
  if (!fs.existsSync(CHECKPOINT_DIR)) return;
  const files = fs.readdirSync(CHECKPOINT_DIR);
  for (const f of files) {
    if (f.startsWith(dateStr)) {
      fs.unlinkSync(path.join(CHECKPOINT_DIR, f));
    }
  }
}

function clearAllCheckpoints(): void {
  if (!fs.existsSync(CHECKPOINT_DIR)) return;
  const files = fs.readdirSync(CHECKPOINT_DIR);
  for (const f of files) {
    fs.unlinkSync(path.join(CHECKPOINT_DIR, f));
  }
}

// ─── In-memory domain record ────────────────────────────────────────────────

interface PipelineDomain {
  domain: string;
  tld: string;
  hasSsl: boolean;
  httpStatus: number | null;
  title: string | null;
  metaDescription: string | null;
  technologyStack: string[];
  pageCountEstimate: number | null;
  language: string | null;
  qualityScore: number;
}

// ─── Step 2: DNS filter (in-memory) ─────────────────────────────────────────

async function filterDns(domains: string[], step: number, totalSteps: number): Promise<string[]> {
  stepHeader(step, totalSteps, '📡', `DNS Filter — checking ${fmt(domains.length)} domains`);

  const start = Date.now();
  const passed: string[] = [];
  let killed = 0;
  const CONCURRENCY = 50;
  const BATCH_SIZE = 500;

  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE);

    for (let j = 0; j < batch.length; j += CONCURRENCY) {
      const chunk = batch.slice(j, j + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (domain) => {
          try {
            await dnsResolve(domain);
            return true;
          } catch {
            return false;
          }
        })
      );

      for (let k = 0; k < chunk.length; k++) {
        if (results[k]) {
          passed.push(chunk[k]);
        } else {
          killed++;
        }
      }
    }

    const checked = Math.min(i + BATCH_SIZE, domains.length);
    clearLine();
    process.stdout.write(`   ${progressBar(checked, domains.length)}  ${fmt(checked)}/${fmt(domains.length)}  |  ${fmt(passed.length)} passed  ${fmt(killed)} killed  (${elapsed(start)})`);
  }

  console.log('');
  console.log(`\n   Result: ${fmt(passed.length)} domains have DNS records (${pct(killed, domains.length)} killed) — ${elapsed(start)}`);
  return passed;
}

// ─── Step 3: HTTP check (in-memory) ─────────────────────────────────────────

async function checkDomains(domains: string[], step: number, totalSteps: number): Promise<PipelineDomain[]> {
  stepHeader(step, totalSteps, '🔍', `HTTP Check — checking ${fmt(domains.length)} domains for live sites`);

  const start = Date.now();
  const live: PipelineDomain[] = [];
  let dead = 0;
  const CONCURRENCY = 15;

  for (let i = 0; i < domains.length; i += CONCURRENCY) {
    const batch = domains.slice(i, i + CONCURRENCY);

    const results = await Promise.all(
      batch.map(async (domain) => {
        try {
          const tld = extractTld(domain);
          const result = await checkDomain(domain);
          const score = calculateQualityScore(result, tld);

          if (result.isLive && !result.isParked) {
            return {
              domain,
              tld,
              hasSsl: result.hasSsl,
              httpStatus: result.httpStatus,
              title: result.title,
              metaDescription: result.metaDescription,
              technologyStack: result.technologyStack,
              pageCountEstimate: result.pageCountEstimate,
              language: result.language,
              qualityScore: score,
            } as PipelineDomain;
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    for (const r of results) {
      if (r) {
        live.push(r);
      } else {
        dead++;
      }
    }

    const checked = Math.min(i + CONCURRENCY, domains.length);
    clearLine();
    process.stdout.write(`   ${progressBar(checked, domains.length)}  ${fmt(checked)}/${fmt(domains.length)}  |  ${fmt(live.length)} live  ${fmt(dead)} dead  (${elapsed(start)})`);

    if (i + CONCURRENCY < domains.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('');
  console.log(`\n   Result: ${fmt(live.length)} live sites found (${pct(dead, domains.length)} dead/parked) — ${elapsed(start)}`);
  return live;
}

// ─── Step 4: Email extraction → write JSON ──────────────────────────────────

interface QualifiedProspect extends PipelineDomain {
  contactEmail: string;
  contactName: string | null;
  contactRole: string | null;
  emails: unknown[];
  contactPageUrl: string | null;
  hasContactForm: boolean;
  socialLinks: Record<string, string>;
}

interface ExtractCheckpoint {
  processedDomains: string[];
  qualified: QualifiedProspect[];
  noEmail: number;
  lowQuality: number;
}

async function extractAndSave(
  liveDomains: PipelineDomain[],
  step: number,
  totalSteps: number,
  dateStr: string,
  minQualityScore: number = 50,
): Promise<number> {
  // Check for existing progress
  const existing = loadCheckpoint<ExtractCheckpoint>(dateStr, 'extract-progress');
  const processedSet = new Set(existing?.processedDomains || []);
  const qualified: QualifiedProspect[] = existing?.qualified || [];
  let noEmail = existing?.noEmail || 0;
  let lowQuality = existing?.lowQuality || 0;

  const remaining = liveDomains.filter(d => !processedSet.has(d.domain));
  const alreadyDone = liveDomains.length - remaining.length;

  if (alreadyDone > 0) {
    stepHeader(step, totalSteps, '📧', `Email Extraction — resuming (${fmt(alreadyDone)} already done, ${fmt(remaining.length)} remaining)`);
  } else {
    stepHeader(step, totalSteps, '📧', `Email Extraction — scraping ${fmt(liveDomains.length)} live sites`);
  }

  const start = Date.now();

  // Stop early once we have enough qualified prospects
  const MAX_QUALIFIED = 300;
  const MIN_QUALITY_SCORE = minQualityScore;

  if (qualified.length >= MAX_QUALIFIED) {
    console.log(`   Already have ${fmt(qualified.length)} qualified prospects from previous run — skipping extraction.`);
  }

  for (let i = 0; i < remaining.length && qualified.length < MAX_QUALIFIED; i++) {
    const d = remaining[i];
    try {
      const result = await extractEmails(d.domain, d.hasSsl);

      if (result.primaryEmail && d.qualityScore >= MIN_QUALITY_SCORE) {
        qualified.push({
          ...d,
          contactEmail: result.primaryEmail,
          contactName: result.primaryName,
          contactRole: result.primaryRole,
          emails: result.emails,
          contactPageUrl: result.contactPageUrl,
          hasContactForm: result.hasContactForm,
          socialLinks: result.socialLinks,
        });
      } else if (!result.primaryEmail) {
        noEmail++;
      } else {
        lowQuality++;
      }
    } catch {
      noEmail++;
    }

    processedSet.add(d.domain);

    const totalDone = alreadyDone + i + 1;
    clearLine();
    process.stdout.write(`   ${progressBar(totalDone, liveDomains.length)}  ${fmt(totalDone)}/${fmt(liveDomains.length)}  |  ${fmt(qualified.length)} qualified  ${fmt(lowQuality)} low quality  ${fmt(noEmail)} no email  (${elapsed(start)})`);

    // Save checkpoint every 10 domains
    if ((i + 1) % 10 === 0) {
      saveCheckpoint(dateStr, 'extract-progress', {
        processedDomains: [...processedSet],
        qualified,
        noEmail,
        lowQuality,
      } as ExtractCheckpoint);
    }

    // Rate limit: 1 second between domains
    if (i < remaining.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('');
  if (qualified.length >= MAX_QUALIFIED) {
    console.log(`\n   Reached ${fmt(MAX_QUALIFIED)} qualified limit — stopped early. ${elapsed(start)}`);
  } else {
    console.log(`\n   Result: ${fmt(qualified.length)} qualified  |  ${fmt(lowQuality)} below score threshold  |  ${fmt(noEmail)} no email — ${elapsed(start)}`);
  }

  if (qualified.length === 0) {
    return 0;
  }

  // Write qualified prospects to JSON file
  ensureOutputDir();
  const outputDate = new Date().toISOString().split('T')[0];
  const outputPath = path.join(OUTPUT_DIR, `qualified-prospects-${outputDate}.json`);

  const output = qualified.map(p => ({
    domain: p.domain,
    tld: p.tld,
    contact_email: p.contactEmail,
    contact_name: p.contactName,
    contact_role: p.contactRole,
    emails: p.emails,
    title: p.title,
    meta_description: p.metaDescription,
    technology_stack: p.technologyStack,
    quality_score: p.qualityScore,
    has_ssl: p.hasSsl,
    http_status: p.httpStatus,
    page_count_estimate: p.pageCountEstimate,
    language: p.language,
    has_contact_form: p.hasContactForm,
    social_links: p.socialLinks,
    contact_page_url: p.contactPageUrl,
  }));

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾  Wrote ${fmt(qualified.length)} qualified prospects to ${outputPath}`);

  return qualified.length;
}

// ─── Full pipeline ──────────────────────────────────────────────────────────

async function runPipeline(): Promise<void> {
  const pipelineStart = Date.now();
  const settings = getLocalSettings();
  const TOTAL_STEPS = 4;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // Check what checkpoints exist
  const savedDnsPassed = loadCheckpoint<string[]>(dateStr, 'dns-passed');
  const savedLiveDomains = loadCheckpoint<PipelineDomain[]>(dateStr, 'live-domains');
  const savedExtractProgress = loadCheckpoint<ExtractCheckpoint>(dateStr, 'extract-progress');

  if (savedDnsPassed || savedLiveDomains || savedExtractProgress) {
    console.log(`\n   Resuming pipeline for ${dateStr} from checkpoint...`);
    if (savedExtractProgress) {
      console.log(`   (${fmt(savedExtractProgress.processedDomains.length)} domains already scraped in step 4)`);
    } else if (savedLiveDomains) {
      console.log(`   (step 3 complete — ${fmt(savedLiveDomains.length)} live domains ready)`);
    } else if (savedDnsPassed) {
      console.log(`   (step 2 complete — ${fmt(savedDnsPassed.length)} DNS-passed domains ready)`);
    }
  }

  // ── Step 1: Download feed ──
  let domains: string[];
  let originalCount: number;

  stepHeader(1, TOTAL_STEPS, '📥', `Download NRD Feed (${dateStr})`);

  try {
    const csvPath = await downloadDailyFeed(yesterday);
    domains = await parseFeed(csvPath, settings.targetTlds, settings.excludedKeywords);
  } catch (err) {
    console.error(`   Feed download failed: ${(err as Error).message}`);
    return;
  }

  if (domains.length === 0) {
    console.log('   No domains matched the TLD/keyword filters. Nothing to do.');
    return;
  }

  originalCount = domains.length;
  if (domains.length > settings.dailyCheckLimit) {
    domains = domains.slice(0, settings.dailyCheckLimit);
  }

  console.log(`   Found ${fmt(originalCount)} domains matching filters (TLDs: ${settings.targetTlds.join(', ')})`);
  if (originalCount > settings.dailyCheckLimit) {
    console.log(`   Capped to ${fmt(settings.dailyCheckLimit)} (daily limit setting)`);
  }

  // ── Step 2: DNS filter ──
  let dnsPassedDomains: string[];

  if (savedDnsPassed) {
    dnsPassedDomains = savedDnsPassed;
    stepHeader(2, TOTAL_STEPS, '📡', `DNS Filter — skipped (${fmt(dnsPassedDomains.length)} cached from previous run)`);
  } else {
    dnsPassedDomains = await filterDns(domains, 2, TOTAL_STEPS);
    saveCheckpoint(dateStr, 'dns-passed', dnsPassedDomains);
  }

  if (dnsPassedDomains.length === 0) {
    console.log('\n   No domains passed DNS. Nothing left to check.');
    clearCheckpoints(dateStr);
    return;
  }

  // ── Step 3: HTTP check ──
  let liveDomains: PipelineDomain[];

  if (savedLiveDomains) {
    liveDomains = savedLiveDomains;
    stepHeader(3, TOTAL_STEPS, '🔍', `HTTP Check — skipped (${fmt(liveDomains.length)} live sites cached from previous run)`);
  } else {
    liveDomains = await checkDomains(dnsPassedDomains, 3, TOTAL_STEPS);
    saveCheckpoint(dateStr, 'live-domains', liveDomains);
  }

  if (liveDomains.length === 0) {
    console.log('\n   No live sites found. Nothing left to extract.');
    clearCheckpoints(dateStr);
    return;
  }

  // ── Step 4: Email extraction + save ──
  const saved = await extractAndSave(liveDomains, 4, TOTAL_STEPS, dateStr, settings.minQualityScore);

  // Update last feed date & clean up checkpoints
  const todayStr = new Date().toISOString().split('T')[0];
  updateLocalSetting('last_feed_date', todayStr);
  clearCheckpoints(dateStr);

  // ── Summary ──
  console.log('\n');
  console.log('━'.repeat(50));
  console.log('  Pipeline Summary');
  console.log('━'.repeat(50));
  console.log(`  Feed domains:       ${fmt(originalCount)}`);
  console.log(`  After DNS filter:   ${fmt(dnsPassedDomains.length).padStart(fmt(originalCount).length)}  (${pct(originalCount - dnsPassedDomains.length, originalCount)} removed)`);
  console.log(`  Live websites:      ${fmt(liveDomains.length).padStart(fmt(originalCount).length)}  (${pct(dnsPassedDomains.length - liveDomains.length, dnsPassedDomains.length)} dead/parked)`);
  console.log(`  Qualified (saved):  ${fmt(saved).padStart(fmt(originalCount).length)}  (${pct(saved, liveDomains.length)} of live sites)`);
  console.log(`  Total time:         ${elapsed(pipelineStart)}`);
  console.log('━'.repeat(50));
}

// ─── Import from CSV ────────────────────────────────────────────────────────

async function runImportFile(filePath: string): Promise<void> {
  const pipelineStart = Date.now();
  const TOTAL_STEPS = 4;

  stepHeader(1, TOTAL_STEPS, '📄', `Import from ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`   File not found: ${filePath}`);
    return;
  }

  const settings = getLocalSettings();
  const csv = fs.readFileSync(filePath, 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  const domains: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (i === 0 && (line.toLowerCase().includes('domain') || line.startsWith('#'))) continue;
    const domain = line.split(',')[0]?.trim().toLowerCase();
    if (domain && domain.length >= 4 && /^[a-z0-9][a-z0-9\-\.]*\.[a-z]{2,}$/.test(domain)) {
      domains.push(domain);
    }
  }

  console.log(`   Parsed ${fmt(lines.length)} lines, ${fmt(domains.length)} valid domains`);

  if (domains.length === 0) {
    console.log('   No valid domains found in file.');
    return;
  }

  const limited = domains.slice(0, settings.dailyCheckLimit);
  if (domains.length > settings.dailyCheckLimit) {
    console.log(`   Capped to ${fmt(settings.dailyCheckLimit)} (daily limit setting)`);
  }

  // Use filename as checkpoint key for imports
  const importKey = `import-${path.basename(filePath, path.extname(filePath))}`;

  const savedDnsPassed = loadCheckpoint<string[]>(importKey, 'dns-passed');
  const savedLiveDomains = loadCheckpoint<PipelineDomain[]>(importKey, 'live-domains');

  if (savedDnsPassed || savedLiveDomains) {
    console.log('   Resuming from checkpoint...');
  }

  let dnsPassedDomains: string[];
  if (savedDnsPassed) {
    dnsPassedDomains = savedDnsPassed;
    stepHeader(2, TOTAL_STEPS, '📡', `DNS Filter — skipped (${fmt(dnsPassedDomains.length)} cached)`);
  } else {
    dnsPassedDomains = await filterDns(limited, 2, TOTAL_STEPS);
    saveCheckpoint(importKey, 'dns-passed', dnsPassedDomains);
  }

  if (dnsPassedDomains.length === 0) {
    console.log('\n   No domains passed DNS. Nothing left to check.');
    clearCheckpoints(importKey);
    return;
  }

  let liveDomains: PipelineDomain[];
  if (savedLiveDomains) {
    liveDomains = savedLiveDomains;
    stepHeader(3, TOTAL_STEPS, '🔍', `HTTP Check — skipped (${fmt(liveDomains.length)} live sites cached)`);
  } else {
    liveDomains = await checkDomains(dnsPassedDomains, 3, TOTAL_STEPS);
    saveCheckpoint(importKey, 'live-domains', liveDomains);
  }

  if (liveDomains.length === 0) {
    console.log('\n   No live sites found. Nothing left to extract.');
    clearCheckpoints(importKey);
    return;
  }

  const saved = await extractAndSave(liveDomains, 4, TOTAL_STEPS, importKey);
  clearCheckpoints(importKey);

  // ── Summary ──
  console.log('\n');
  console.log('━'.repeat(50));
  console.log('  Import Summary');
  console.log('━'.repeat(50));
  console.log(`  File domains:       ${fmt(domains.length)}`);
  console.log(`  After DNS filter:   ${fmt(dnsPassedDomains.length).padStart(fmt(domains.length).length)}  (${pct(domains.length - dnsPassedDomains.length, domains.length)} removed)`);
  console.log(`  Live websites:      ${fmt(liveDomains.length).padStart(fmt(domains.length).length)}  (${pct(dnsPassedDomains.length - liveDomains.length, dnsPassedDomains.length)} dead/parked)`);
  console.log(`  Qualified (saved):  ${fmt(saved).padStart(fmt(domains.length).length)}  (${pct(saved, liveDomains.length)} of live sites)`);
  console.log(`  Total time:         ${elapsed(pipelineStart)}`);
  console.log('━'.repeat(50));
}

// ─── List output files ──────────────────────────────────────────────────────

function runList(): void {
  console.log('\n📂  Output Files');
  console.log('━'.repeat(50));

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('   No output directory yet. Run the pipeline first.');
    return;
  }

  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('   No output files yet. Run the pipeline first.');
    return;
  }

  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file);
    const stat = fs.statSync(filePath);
    const sizeKb = Math.round(stat.size / 1024);
    let count = 0;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      count = Array.isArray(data) ? data.length : 0;
    } catch { /* ignore */ }
    console.log(`   ${file}  (${count} prospects, ${sizeKb} KB)`);
  }

  console.log('━'.repeat(50));
  console.log(`\n   Directory: ${OUTPUT_DIR}`);
}

// ─── Reset checkpoints ─────────────────────────────────────────────────────

function runReset(): void {
  console.log('\n🔄  Clearing all pipeline checkpoints...');
  clearAllCheckpoints();
  console.log('   Done. Next run will start fresh.');
}

// ─── Settings ───────────────────────────────────────────────────────────────

const SETTING_KEYS: Record<string, { dbKey: string; description: string; type: 'number' | 'boolean' | 'string[]' }> = {
  daily_limit:    { dbKey: 'daily_check_limit',    description: 'Max domains to process per run',   type: 'number' },
  email_limit:    { dbKey: 'daily_email_limit',     description: 'Max outreach emails per day',      type: 'number' },
  min_score:      { dbKey: 'min_quality_score',     description: 'Minimum quality score to qualify', type: 'number' },
  tlds:           { dbKey: 'target_tlds',           description: 'TLDs to include',                  type: 'string[]' },
  excluded:       { dbKey: 'excluded_keywords',     description: 'Keywords to exclude from domains', type: 'string[]' },
  auto_outreach:  { dbKey: 'auto_outreach_enabled', description: 'Auto-send outreach emails',        type: 'boolean' },
};

function runSettings(): void {
  const settings = getLocalSettings();

  console.log('\n⚙️   Pipeline Settings');
  console.log('━'.repeat(50));
  console.log(`  daily_limit      ${fmt(settings.dailyCheckLimit).padStart(8)}   Max domains to process per run`);
  console.log(`  email_limit      ${fmt(settings.dailyEmailLimit).padStart(8)}   Max outreach emails per day`);
  console.log(`  min_score        ${String(settings.minQualityScore).padStart(8)}   Minimum quality score`);
  console.log(`  auto_outreach    ${String(settings.autoOutreachEnabled).padStart(8)}   Auto-send outreach emails`);
  console.log(`  tlds             ${settings.targetTlds.join(', ')}`);
  console.log(`  excluded         ${settings.excludedKeywords.join(', ')}`);
  console.log(`  last_feed        ${settings.lastFeedDate || 'never'}`);
  console.log('━'.repeat(50));
  console.log('\n  Update with: npm run prospects -- set <key> <value>');
  console.log('  Example:     npm run prospects -- set daily_limit 2500');
  console.log('  For lists:   npm run prospects -- set tlds com,co.uk,io');
}

function runSet(key: string, value: string): void {
  const setting = SETTING_KEYS[key];

  if (!setting) {
    console.error(`\n   Unknown setting: "${key}"`);
    console.error(`   Available: ${Object.keys(SETTING_KEYS).join(', ')}`);
    return;
  }

  let parsed: unknown;

  switch (setting.type) {
    case 'number': {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) {
        console.error(`   "${value}" is not a valid number`);
        return;
      }
      parsed = num;
      break;
    }
    case 'boolean': {
      if (!['true', 'false'].includes(value.toLowerCase())) {
        console.error(`   "${value}" is not a valid boolean (use true/false)`);
        return;
      }
      parsed = value.toLowerCase() === 'true';
      break;
    }
    case 'string[]': {
      parsed = value.split(',').map(s => s.trim()).filter(Boolean);
      break;
    }
  }

  updateLocalSetting(setting.dbKey, parsed);
  console.log(`\n   ✓ ${key} updated to ${JSON.stringify(parsed)}`);
}

// ─── Run pipeline from NRD .txt file ─────────────────────────────────────────

async function runNrdFile(fileName: string): Promise<void> {
  const pipelineStart = Date.now();
  const settings = getLocalSettings();
  const TOTAL_STEPS = 4;

  // Resolve the file path from prospect-output/
  const filePath = path.resolve(OUTPUT_DIR, fileName);

  stepHeader(1, TOTAL_STEPS, '📄', `Load NRD file: ${fileName}`);

  if (!fs.existsSync(filePath)) {
    console.error(`   File not found: ${filePath}`);
    console.error(`   Available files in prospect-output/:`);
    if (fs.existsSync(OUTPUT_DIR)) {
      const txtFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.txt')).sort();
      if (txtFiles.length === 0) {
        console.error('   (none)');
      } else {
        for (const f of txtFiles) console.error(`     ${f}`);
      }
    }
    return;
  }

  let domains = await parseFeed(filePath, settings.targetTlds, settings.excludedKeywords);
  const originalCount = domains.length;

  if (domains.length === 0) {
    console.log('   No domains matched the TLD/keyword filters. Nothing to do.');
    return;
  }

  if (domains.length > settings.dailyCheckLimit) {
    domains = domains.slice(0, settings.dailyCheckLimit);
  }

  console.log(`   Found ${fmt(originalCount)} domains matching filters (TLDs: ${settings.targetTlds.join(', ')})`);
  if (originalCount > settings.dailyCheckLimit) {
    console.log(`   Capped to ${fmt(settings.dailyCheckLimit)} (daily limit setting)`);
  }

  // Use filename as checkpoint key
  const checkpointKey = `nrd-${path.basename(fileName, path.extname(fileName))}`;

  const savedDnsPassed = loadCheckpoint<string[]>(checkpointKey, 'dns-passed');
  const savedLiveDomains = loadCheckpoint<PipelineDomain[]>(checkpointKey, 'live-domains');

  if (savedDnsPassed || savedLiveDomains) {
    console.log('   Resuming from checkpoint...');
  }

  // ── Step 2: DNS filter ──
  let dnsPassedDomains: string[];
  if (savedDnsPassed) {
    dnsPassedDomains = savedDnsPassed;
    stepHeader(2, TOTAL_STEPS, '📡', `DNS Filter — skipped (${fmt(dnsPassedDomains.length)} cached)`);
  } else {
    dnsPassedDomains = await filterDns(domains, 2, TOTAL_STEPS);
    saveCheckpoint(checkpointKey, 'dns-passed', dnsPassedDomains);
  }

  if (dnsPassedDomains.length === 0) {
    console.log('\n   No domains passed DNS. Nothing left to check.');
    clearCheckpoints(checkpointKey);
    return;
  }

  // ── Step 3: HTTP check ──
  let liveDomains: PipelineDomain[];
  if (savedLiveDomains) {
    liveDomains = savedLiveDomains;
    stepHeader(3, TOTAL_STEPS, '🔍', `HTTP Check — skipped (${fmt(liveDomains.length)} live sites cached)`);
  } else {
    liveDomains = await checkDomains(dnsPassedDomains, 3, TOTAL_STEPS);
    saveCheckpoint(checkpointKey, 'live-domains', liveDomains);
  }

  if (liveDomains.length === 0) {
    console.log('\n   No live sites found. Nothing left to extract.');
    clearCheckpoints(checkpointKey);
    return;
  }

  // ── Step 4: Email extraction + save ──
  const saved = await extractAndSave(liveDomains, 4, TOTAL_STEPS, checkpointKey, settings.minQualityScore);
  clearCheckpoints(checkpointKey);

  // Clean up the source .txt file now that we have the JSON output
  if (saved > 0) {
    fs.unlinkSync(filePath);
    console.log(`\n🗑️  Deleted source file: ${fileName}`);
  }

  // ── Summary ──
  console.log('\n');
  console.log('━'.repeat(50));
  console.log(`  NRD File Pipeline Summary (${fileName})`);
  console.log('━'.repeat(50));
  console.log(`  Feed domains:       ${fmt(originalCount)}`);
  console.log(`  After DNS filter:   ${fmt(dnsPassedDomains.length).padStart(fmt(originalCount).length)}  (${pct(originalCount - dnsPassedDomains.length, originalCount)} removed)`);
  console.log(`  Live websites:      ${fmt(liveDomains.length).padStart(fmt(originalCount).length)}  (${pct(dnsPassedDomains.length - liveDomains.length, dnsPassedDomains.length)} dead/parked)`);
  console.log(`  Qualified (saved):  ${fmt(saved).padStart(fmt(originalCount).length)}  (${pct(saved, liveDomains.length)} of live sites)`);
  console.log(`  Total time:         ${elapsed(pipelineStart)}`);
  console.log('━'.repeat(50));
}

// ─── Download NRD feed only ──────────────────────────────────────────────────

async function runDownload(dateArg?: string): Promise<void> {
  let targetDate: Date;

  if (dateArg) {
    // Parse YYYY-MM-DD
    const parsed = new Date(dateArg + 'T00:00:00');
    if (isNaN(parsed.getTime())) {
      console.error(`   Invalid date: "${dateArg}". Use YYYY-MM-DD format.`);
      return;
    }
    targetDate = parsed;
  } else {
    targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
  }

  const dateStr = targetDate.toISOString().split('T')[0];
  console.log(`\n📥  Downloading NRD feed for ${dateStr}...`);

  const txtPath = await downloadDailyFeed(targetDate);

  // Copy the downloaded file to prospect-output/ as a .txt
  ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, `nrd-${dateStr}.txt`);
  fs.copyFileSync(txtPath, outputPath);

  const lineCount = fs.readFileSync(outputPath, 'utf-8').split('\n').filter(l => l.trim()).length;
  console.log(`\n💾  Saved ${fmt(lineCount)} domains to ${outputPath}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  console.log('');
  console.log('🎯  PagePulser Cold Prospect Pipeline');
  console.log('━'.repeat(50));

  try {
    switch (command) {
      case 'download':
        await runDownload(args[1]);
        break;

      case 'list':
        runList();
        break;

      case 'reset':
        runReset();
        break;

      case 'settings':
        runSettings();
        break;

      case 'set': {
        const key = args[1];
        const value = args[2];
        if (!key || !value) {
          console.error('Usage: npm run prospects -- set <key> <value>');
          console.error('Run "npm run prospects -- settings" to see available keys');
          break;
        }
        runSet(key, value);
        break;
      }

      case 'nrd': {
        const nrdFileName = args[1];
        if (!nrdFileName) {
          console.error('Usage: npm run prospects -- nrd <filename.txt>');
          console.error('Example: npm run prospects -- nrd nrd-2026-03-13.txt');
          break;
        }
        await runNrdFile(nrdFileName);
        break;
      }

      case 'import': {
        const filePath = args[1];
        if (!filePath) {
          console.error('Usage: npm run prospects -- import <file.csv>');
          break;
        }
        await runImportFile(filePath);
        break;
      }

      case 'all':
      default:
        await runPipeline();
        break;
    }
  } catch (err) {
    console.error('\n💥 Pipeline error:', err);
  }

  console.log('\n✅  Done\n');
}

main();
