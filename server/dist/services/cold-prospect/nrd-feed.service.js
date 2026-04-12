"use strict";
/**
 * NRD Feed Service
 *
 * Downloads and parses daily Newly Registered Domain feeds from WhoisDS.
 * Filters by target TLDs and excluded keywords, then bulk imports to DB.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.getSetting = getSetting;
exports.updateSetting = updateSetting;
exports.getSettings = getSettings;
exports.downloadDailyFeed = downloadDailyFeed;
exports.extractTld = extractTld;
exports.parseFeed = parseFeed;
exports.importDomains = importDomains;
exports.importFromCsv = importFromCsv;
exports.cleanupTempFiles = cleanupTempFiles;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const readline_1 = require("readline");
const adm_zip_1 = __importDefault(require("adm-zip"));
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
/**
 * Get a setting value from cold_prospect_settings
 */
async function getSetting(key) {
    const result = await pool.query('SELECT value FROM cold_prospect_settings WHERE key = $1', [key]);
    if (result.rows.length === 0)
        return null;
    return result.rows[0].value;
}
/**
 * Update a setting value
 */
async function updateSetting(key, value) {
    await pool.query(`INSERT INTO cold_prospect_settings (id, key, value, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`, [key, JSON.stringify(value)]);
}
/**
 * Get all settings as a typed object
 */
async function getSettings() {
    const result = await pool.query('SELECT key, value FROM cold_prospect_settings');
    const settings = {};
    for (const row of result.rows) {
        settings[row.key] = row.value;
    }
    return {
        targetTlds: settings.target_tlds || ['com', 'co.uk', 'org.uk', 'uk', 'io', 'co', 'net'],
        excludedKeywords: settings.excluded_keywords || [],
        minQualityScore: settings.min_quality_score || 50,
        dailyCheckLimit: settings.daily_check_limit || 5000,
        dailyEmailLimit: settings.daily_email_limit || 50,
        autoOutreachEnabled: settings.auto_outreach_enabled || false,
        lastFeedDate: settings.last_feed_date || null,
    };
}
/**
 * Format date as YYYY-MM-DD for WhoisDS feed URL
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
/**
 * Download a file from URL to a local path
 */
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https_1.default : http_1.default;
        const file = fs_1.default.createWriteStream(destPath);
        client.get(url, (response) => {
            // Follow redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    file.close();
                    fs_1.default.unlinkSync(destPath);
                    downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
                    return;
                }
            }
            if (response.statusCode !== 200) {
                file.close();
                fs_1.default.unlinkSync(destPath);
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
            if (fs_1.default.existsSync(destPath))
                fs_1.default.unlinkSync(destPath);
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
async function downloadDailyFeed(date) {
    const dateStr = formatDate(date);
    const tmpDir = path_1.default.join(os_1.default.tmpdir(), 'kritano-nrd');
    if (!fs_1.default.existsSync(tmpDir)) {
        fs_1.default.mkdirSync(tmpDir, { recursive: true });
    }
    const txtPath = path_1.default.join(tmpDir, `nrd-${dateStr}.txt`);
    // If already downloaded, reuse
    if (fs_1.default.existsSync(txtPath)) {
        console.log(`🎯 Using cached feed: ${txtPath}`);
        return txtPath;
    }
    // WhoisDS URL uses base64("{date}.zip") in the path
    const encoded = Buffer.from(`${dateStr}.zip`).toString('base64');
    const feedUrl = `https://whoisds.com/whois-database/newly-registered-domains/${encoded}/nrd`;
    const zipPath = path_1.default.join(tmpDir, `nrd-${dateStr}.zip`);
    console.log(`🎯 Downloading NRD feed for ${dateStr}...`);
    await downloadFile(feedUrl, zipPath);
    // Check we got a real zip (not an empty HTML response)
    const stat = fs_1.default.statSync(zipPath);
    if (stat.size < 1000) {
        fs_1.default.unlinkSync(zipPath);
        throw new Error(`Feed for ${dateStr} not available (file too small: ${stat.size} bytes)`);
    }
    // Unzip — extracts domain-names.txt
    const zip = new adm_zip_1.default(zipPath);
    zip.extractAllTo(tmpDir, true);
    const extractedPath = path_1.default.join(tmpDir, 'domain-names.txt');
    if (!fs_1.default.existsSync(extractedPath)) {
        throw new Error('Zip did not contain domain-names.txt');
    }
    // Rename to date-stamped file and clean up
    fs_1.default.renameSync(extractedPath, txtPath);
    fs_1.default.unlinkSync(zipPath);
    const lineCount = fs_1.default.readFileSync(txtPath, 'utf-8').split('\n').filter(l => l.trim()).length;
    console.log(`🎯 NRD feed downloaded: ${lineCount} domains`);
    return txtPath;
}
/**
 * Extract TLD from a domain name
 */
function extractTld(domain) {
    const parts = domain.toLowerCase().split('.');
    if (parts.length < 2)
        return '';
    // Handle common two-part TLDs
    const twoPartTlds = ['co.uk', 'org.uk', 'ac.uk', 'me.uk', 'co.nz', 'co.za', 'com.au', 'com.br'];
    if (parts.length >= 3) {
        const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
        if (twoPartTlds.includes(lastTwo))
            return lastTwo;
    }
    return parts[parts.length - 1];
}
/**
 * Parse the NRD feed CSV and filter by target TLDs
 * Returns array of domain names that pass filters
 */
async function parseFeed(filePath, targetTlds, excludedKeywords) {
    const domains = [];
    const tldSet = new Set(targetTlds.map(t => t.toLowerCase()));
    const keywordPatterns = excludedKeywords.map(k => k.toLowerCase());
    const fileStream = fs_1.default.createReadStream(filePath);
    const rl = (0, readline_1.createInterface)({ input: fileStream, crlfDelay: Infinity });
    let lineCount = 0;
    for await (const line of rl) {
        lineCount++;
        // Skip header
        if (lineCount === 1 && (line.toLowerCase().includes('domain') || line.startsWith('#')))
            continue;
        // CSV might have: domain,registrar,date or just domain per line
        const domain = line.split(',')[0]?.trim().toLowerCase();
        if (!domain || domain.length < 4)
            continue;
        // Filter by TLD
        const tld = extractTld(domain);
        if (!tldSet.has(tld))
            continue;
        // Exclude domains matching keywords
        const hasExcludedKeyword = keywordPatterns.some(kw => domain.includes(kw));
        if (hasExcludedKeyword)
            continue;
        // Basic domain validation
        if (!/^[a-z0-9][a-z0-9\-\.]*\.[a-z]{2,}$/.test(domain))
            continue;
        domains.push(domain);
    }
    console.log(`🎯 Parsed ${lineCount} lines, ${domains.length} domains passed filters`);
    return domains;
}
/**
 * Bulk import domains into cold_prospects table
 * Uses ON CONFLICT DO NOTHING to skip duplicates
 */
async function importDomains(domains, batchDate, source = 'whoisds') {
    if (domains.length === 0)
        return { imported: 0, duplicates: 0 };
    const batchDateStr = formatDate(batchDate);
    let imported = 0;
    const BATCH_SIZE = 500;
    for (let i = 0; i < domains.length; i += BATCH_SIZE) {
        const batch = domains.slice(i, i + BATCH_SIZE);
        // Build bulk insert with parameterized values
        const values = [];
        const params = [];
        let paramIdx = 1;
        for (const domain of batch) {
            const tld = extractTld(domain);
            values.push(`(gen_random_uuid(), $${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`);
            params.push(domain, tld, batchDateStr, batchDateStr, source);
            paramIdx += 5;
        }
        const result = await pool.query(`INSERT INTO cold_prospects (id, domain, tld, registered_at, batch_date, source)
       VALUES ${values.join(', ')}
       ON CONFLICT (domain) DO NOTHING`, params);
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
async function importFromCsv(csvContent) {
    const lines = csvContent.split('\n').filter(l => l.trim());
    const domains = [];
    let errors = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (i === 0 && (line.toLowerCase().includes('domain') || line.startsWith('#')))
            continue;
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
function cleanupTempFiles(olderThanDays = 7) {
    const tmpDir = path_1.default.join(os_1.default.tmpdir(), 'kritano-nrd');
    if (!fs_1.default.existsSync(tmpDir))
        return;
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const files = fs_1.default.readdirSync(tmpDir);
    for (const file of files) {
        const filePath = path_1.default.join(tmpDir, file);
        const stat = fs_1.default.statSync(filePath);
        if (stat.mtimeMs < cutoff) {
            fs_1.default.unlinkSync(filePath);
        }
    }
}
//# sourceMappingURL=nrd-feed.service.js.map