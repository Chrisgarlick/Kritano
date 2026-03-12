import { chromium, Browser } from 'playwright';
import type { ResolvedBranding } from './pdf-branding.service.js';
import type { AuditJob } from '../types/audit.types.js';
import type { AuditFinding } from '../types/finding.types.js';

// ── Types ──────────────────────────────────────────────────────────

export interface PdfReportData {
  audit: AuditJob;
  findings: Array<AuditFinding & { page_url: string }>;
  brokenLinks: Array<{
    broken_url: string;
    source_url: string;
    status_code: number | null;
  }>;
  branding: ResolvedBranding;
}

// ── Browser singleton ──────────────────────────────────────────────

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) return browser;
  browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
    ],
  });
  return browser;
}

export async function shutdownPdfBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

// ── Main export ────────────────────────────────────────────────────

export async function generateAuditPdf(data: PdfReportData): Promise<Buffer> {
  const b = await getBrowser();
  const context = await b.newContext();
  try {
    const page = await context.newPage();

    // Pre-fetch logo as base64 data URI if available
    let logoDataUri: string | null = null;
    if (data.branding.canWhiteLabel && data.branding.logoUrl) {
      try {
        const resp = await fetch(data.branding.logoUrl, {
          signal: AbortSignal.timeout(5000),
        });
        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer());
          const ct = resp.headers.get('content-type') || 'image/png';
          logoDataUri = `data:${ct};base64,${buf.toString('base64')}`;
        }
      } catch {
        // Logo fetch failed — continue without it
      }
    }

    const html = buildReportHtml(data, logoDataUri);

    await page.setContent(html, { waitUntil: 'load' });

    const footerLeft = escapeHtml(data.branding.footerText);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="width:100%;font-size:9px;font-family:Outfit,Helvetica,sans-serif;color:#94a3b8;padding:0 40px;display:flex;justify-content:space-between;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span>${footerLeft}</span>
        </div>`,
      margin: { top: '10mm', bottom: '16mm', left: '0', right: '0' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await context.close();
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateUrl(url: string, max: number = 70): string {
  if (!url) return '';
  return url.length > max ? url.substring(0, max) + '...' : url;
}

function getScoreColor(score: number | null): string {
  if (score === null) return '#94a3b8';
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#f97316';
  return '#ef4444';
}

function getScoreLabel(score: number | null): string {
  if (score === null) return 'N/A';
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'serious': return '#f97316';
    case 'moderate': return '#f59e0b';
    case 'minor': return '#64748b';
    default: return '#94a3b8';
  }
}

function severityBg(severity: string): string {
  switch (severity) {
    case 'critical': return '#fef2f2';
    case 'serious': return '#fff7ed';
    case 'moderate': return '#fffbeb';
    case 'minor': return '#f8fafc';
    default: return '#f8fafc';
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  seo: '#8b5cf6',
  accessibility: '#10b981',
  security: '#ef4444',
  performance: '#0ea5e9',
  content: '#6366f1',
  'structured-data': '#d97706',
  'content-eeat': '#0d9488',
  'content-aeo': '#7c3aed',
};

const CATEGORY_LABELS: Record<string, { short: string; full: string }> = {
  seo: { short: 'SEO', full: 'Search Engine Optimization' },
  accessibility: { short: 'Accessibility', full: 'Web Accessibility' },
  security: { short: 'Security', full: 'Security & Best Practices' },
  performance: { short: 'Performance', full: 'Performance Optimization' },
  content: { short: 'Content', full: 'Content Quality' },
  'structured-data': { short: 'Schema', full: 'Structured Data' },
  'content-eeat': { short: 'E-E-A-T', full: 'Experience, Expertise, Authoritativeness & Trust' },
  'content-aeo': { short: 'AEO', full: 'Answer Engine Optimization (AI Citability)' },
};

function svgGauge(score: number | null, size: number = 80): string {
  const val = score ?? 0;
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 45; // r=45, ~282.7
  const offset = circumference - (val / 100) * circumference;
  const display = score !== null ? `${score}` : 'N/A';
  const fontSize = score !== null ? 24 : 16;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}">
    <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" stroke-width="8"/>
    <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="8"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
      stroke-linecap="round" transform="rotate(-90 50 50)"/>
    <text x="50" y="${score !== null ? 55 : 55}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="${color}" font-family="Outfit,sans-serif">${display}</text>
  </svg>`;
}

// ── HTML builder ───────────────────────────────────────────────────

export function buildReportHtml(data: PdfReportData, logoDataUri: string | null): string {
  const { audit, findings, brokenLinks, branding } = data;

  // Compute stats
  const severityCounts: Record<string, number> = { critical: 0, serious: 0, moderate: 0, minor: 0, info: 0 };
  const findingsByCategory: Record<string, Array<AuditFinding & { page_url: string }>> = {};

  for (const f of findings) {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
    if (!findingsByCategory[f.category]) findingsByCategory[f.category] = [];
    findingsByCategory[f.category].push(f);
  }

  const validScores: Array<{ key: string; score: number }> = [];
  const scoreMap: Record<string, number | null> = {
    seo: audit.seo_score,
    accessibility: audit.accessibility_score,
    security: audit.security_score,
    performance: audit.performance_score,
    content: audit.content_score,
    'structured-data': audit.structured_data_score,
  };
  for (const [key, score] of Object.entries(scoreMap)) {
    if (score != null) validScores.push({ key, score });
  }
  const overallScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length)
    : null;

  const totalFindings = findings.length;
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Build HTML sections
  const sections: string[] = [];

  // ── Cover Page ───────────────────────────────────────────────
  sections.push(buildCoverPage(audit, branding, logoDataUri, overallScore, dateStr));

  // ── Score Overview ───────────────────────────────────────────
  sections.push(buildScoreOverview(validScores, scoreMap));

  // ── Key Stats ────────────────────────────────────────────────
  sections.push(buildKeyStats(audit, totalFindings, brokenLinks.length));

  // ── Executive Summary ────────────────────────────────────────
  sections.push(buildExecutiveSummary(severityCounts, findings));

  // ── Category Detail Pages ────────────────────────────────────
  const categoryOrder = [
    'seo', 'accessibility', 'security', 'performance',
    'content', 'content-eeat', 'content-aeo', 'structured-data',
  ];
  // Show ordered categories first, then any unexpected ones
  const orderedCategories = [
    ...categoryOrder.filter(c => findingsByCategory[c]?.length),
    ...Object.keys(findingsByCategory).filter(c => !categoryOrder.includes(c) && findingsByCategory[c]?.length),
  ];
  for (const category of orderedCategories) {
    sections.push(buildCategoryPage(category, findingsByCategory[category], scoreMap[category] ?? null));
  }

  // ── Broken Links ─────────────────────────────────────────────
  if (brokenLinks.length > 0) {
    sections.push(buildBrokenLinksPage(brokenLinks));
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: ${branding.primaryColor};
    --secondary: ${branding.secondaryColor};
    --accent: ${branding.accentColor};
    --text: #1e293b;
    --text-muted: #64748b;
    --text-light: #94a3b8;
    --bg: #ffffff;
    --bg-subtle: #f8fafc;
    --bg-muted: #f1f5f9;
    --border: #e2e8f0;
  }

  body {
    font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text);
    background: var(--bg);
  }

  .page { padding: 0 40px; }
  .page-break { break-before: page; }
  .avoid-break { break-inside: avoid; }

  /* ── Cover ─────────────────────────────── */
  .cover-banner {
    background: var(--primary);
    color: #fff;
    padding: 40px 40px 36px;
    margin: 0 -40px;
    position: relative;
  }
  .cover-banner .brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }
  .cover-banner .brand-logo { height: 28px; }
  .cover-banner .brand-name {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.9;
  }
  .cover-title {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 8px;
  }
  .cover-domain {
    font-size: 15px;
    opacity: 0.85;
    margin-bottom: 0;
  }
  .cover-date {
    position: absolute;
    top: 36px;
    right: 40px;
    background: rgba(255,255,255,0.15);
    border-radius: 6px;
    padding: 8px 16px;
    text-align: center;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .cover-date .date-value {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
    margin-top: 2px;
  }

  /* ── Overall Score ─────────────────────── */
  .overall-score-section {
    display: flex;
    align-items: center;
    gap: 32px;
    padding: 32px 0 24px;
  }
  .overall-gauge { text-align: center; }
  .overall-gauge .label {
    display: block;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── Score Grid ────────────────────────── */
  .score-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  .score-card {
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .score-card .top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }
  .score-card .cat-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  }

  /* ── Stats Row ─────────────────────────── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: var(--bg-subtle);
    border-radius: 8px;
    padding: 16px;
  }
  .stat-card .stat-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .stat-card .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }
  .stat-card .stat-sub {
    font-size: 11px;
    color: var(--text-light);
    margin-top: 2px;
  }

  /* ── Severity Bars ─────────────────────── */
  .section-heading {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 14px;
  }
  .severity-bars { margin-bottom: 28px; }
  .sev-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .sev-indicator {
    width: 4px;
    height: 20px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .sev-label {
    width: 70px;
    font-size: 12px;
    flex-shrink: 0;
  }
  .sev-bar-bg {
    flex: 1;
    height: 16px;
    background: var(--bg-muted);
    border-radius: 4px;
    overflow: hidden;
  }
  .sev-bar-fill {
    height: 100%;
    border-radius: 4px;
    min-width: 4px;
  }
  .sev-count {
    width: 36px;
    text-align: right;
    font-weight: 600;
    font-size: 13px;
    flex-shrink: 0;
  }

  /* ── Top Priorities ────────────────────── */
  .priority-list { margin-bottom: 28px; }
  .priority-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .priority-item:last-child { border-bottom: none; }
  .priority-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .priority-info { flex: 1; }
  .priority-name {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .priority-meta {
    font-size: 10px;
    color: var(--text-muted);
  }

  /* ── Category Page ─────────────────────── */
  .cat-header {
    color: #fff;
    padding: 28px 40px 24px;
    margin: 0 -40px 24px;
    position: relative;
  }
  .cat-header .cat-subtitle {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.7;
    margin-bottom: 6px;
  }
  .cat-header .cat-title {
    font-size: 24px;
    font-weight: 700;
  }
  .cat-header .cat-score-badge {
    position: absolute;
    top: 24px;
    right: 40px;
    background: rgba(255,255,255,0.2);
    border-radius: 6px;
    padding: 6px 16px;
    font-size: 22px;
    font-weight: 700;
  }
  .cat-header .cat-issue-count {
    position: absolute;
    bottom: 24px;
    right: 40px;
    font-size: 11px;
    opacity: 0.8;
  }

  /* ── Finding Cards ─────────────────────── */
  .finding-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 12px;
    break-inside: avoid;
  }
  .finding-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .sev-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #fff;
    padding: 3px 10px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .finding-rule {
    font-size: 12px;
    font-weight: 600;
    flex: 1;
  }
  .finding-pages {
    font-size: 10px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .finding-message {
    font-size: 11px;
    color: var(--text);
    margin-bottom: 6px;
    line-height: 1.5;
  }
  .finding-rec {
    background: var(--bg-subtle);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 11px;
    color: var(--secondary);
    margin-bottom: 6px;
    line-height: 1.4;
  }
  .finding-urls {
    font-size: 10px;
    color: var(--text-muted);
    font-family: 'Courier New', monospace;
    line-height: 1.7;
  }

  /* ── Broken Links Table ────────────────── */
  .bl-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .bl-table th {
    background: var(--bg-muted);
    padding: 8px 10px;
    text-align: left;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }
  .bl-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
  }
  .bl-url {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    word-break: break-all;
  }

  /* ── Empty state ───────────────────────── */
  .empty-state {
    background: var(--bg-subtle);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    color: #10b981;
    font-size: 13px;
  }
</style>
</head>
<body>
${sections.join('\n')}
</body>
</html>`;
}

// ── Section builders ───────────────────────────────────────────────

function buildCoverPage(
  audit: AuditJob,
  branding: ResolvedBranding,
  logoDataUri: string | null,
  overallScore: number | null,
  dateStr: string,
): string {
  const logoHtml = logoDataUri
    ? `<img class="brand-logo" src="${logoDataUri}" alt="">`
    : '';

  return `<div class="page">
  <div class="cover-banner">
    <div class="brand-row">
      ${logoHtml}
      <span class="brand-name">${escapeHtml(branding.companyName)}</span>
    </div>
    <div class="cover-title">Website Audit<br>Report</div>
    <div class="cover-domain">${escapeHtml(audit.target_domain)}</div>
    <div class="cover-date">
      Generated
      <div class="date-value">${escapeHtml(dateStr)}</div>
    </div>
  </div>

  <div class="overall-score-section">
    <div class="overall-gauge">
      ${svgGauge(overallScore, 120)}
      <span class="label">${getScoreLabel(overallScore)}</span>
    </div>
  </div>`;
}

function buildScoreOverview(
  validScores: Array<{ key: string; score: number }>,
  scoreMap: Record<string, number | null>,
): string {
  if (validScores.length === 0) return '';

  const cards = Object.entries(scoreMap)
    .filter(([, score]) => score != null)
    .map(([key, score]) => {
      const labels = CATEGORY_LABELS[key] || { short: key, full: key };
      const color = CATEGORY_COLORS[key] || '#6366f1';
      return `<div class="score-card avoid-break">
        <div class="top-bar" style="background:${color}"></div>
        <div class="cat-label">${escapeHtml(labels.short)}</div>
        ${svgGauge(score, 64)}
      </div>`;
    })
    .join('\n');

  return `<div class="score-grid">${cards}</div>`;
}

function buildKeyStats(audit: AuditJob, totalFindings: number, brokenLinkCount: number): string {
  return `<div class="stats-row">
    <div class="stat-card avoid-break">
      <div class="stat-label">Pages Crawled</div>
      <div class="stat-value">${audit.pages_crawled || 0}</div>
      <div class="stat-sub">of ${audit.pages_found || 0} found</div>
    </div>
    <div class="stat-card avoid-break">
      <div class="stat-label">Total Issues</div>
      <div class="stat-value">${totalFindings}</div>
      <div class="stat-sub">${audit.critical_issues || 0} critical</div>
    </div>
    <div class="stat-card avoid-break">
      <div class="stat-label">Broken Links</div>
      <div class="stat-value">${brokenLinkCount}</div>
      <div class="stat-sub">detected</div>
    </div>
  </div>`;
}

function buildExecutiveSummary(
  severityCounts: Record<string, number>,
  findings: Array<AuditFinding & { page_url: string }>,
): string {
  const sevs = [
    { key: 'critical', label: 'Critical', color: '#ef4444' },
    { key: 'serious', label: 'Serious', color: '#f97316' },
    { key: 'moderate', label: 'Moderate', color: '#f59e0b' },
    { key: 'minor', label: 'Minor', color: '#64748b' },
  ];
  const maxSev = Math.max(...Object.values(severityCounts), 1);

  const bars = sevs.map(s => {
    const count = severityCounts[s.key] || 0;
    const pct = maxSev > 0 ? (count / maxSev) * 100 : 0;
    return `<div class="sev-row">
      <div class="sev-indicator" style="background:${s.color}"></div>
      <div class="sev-label">${s.label}</div>
      <div class="sev-bar-bg"><div class="sev-bar-fill" style="width:${Math.max(pct, 1)}%;background:${s.color}"></div></div>
      <div class="sev-count">${count}</div>
    </div>`;
  }).join('\n');

  // Top priorities (max 10)
  const top = findings.slice(0, 10);
  let prioritiesHtml: string;
  if (top.length === 0) {
    prioritiesHtml = '<div class="empty-state">No issues found. Your website is in great shape!</div>';
  } else {
    const items = top.map((f, i) => {
      const color = severityColor(f.severity);
      const catLabel = CATEGORY_LABELS[f.category]?.short || f.category;
      return `<div class="priority-item avoid-break">
        <div class="priority-num" style="background:${color}">${i + 1}</div>
        <div class="priority-info">
          <div class="priority-name">${escapeHtml(f.rule_name || f.rule_id)}</div>
          <div class="priority-meta">${escapeHtml(catLabel)} &middot; ${escapeHtml(f.severity)}</div>
        </div>
      </div>`;
    }).join('\n');
    prioritiesHtml = `<div class="priority-list">${items}</div>`;
  }

  return `<div class="section-heading">Issues by Severity</div>
  <div class="severity-bars">${bars}</div>
  <div class="section-heading">Top Priorities</div>
  ${prioritiesHtml}
</div>`; // closes .page from cover
}

function buildCategoryPage(
  category: string,
  catFindings: Array<AuditFinding & { page_url: string }>,
  score: number | null,
): string {
  const labels = CATEGORY_LABELS[category] || { short: category, full: category };
  const color = CATEGORY_COLORS[category] || '#6366f1';

  // Group by rule_id
  const byRule: Record<string, Array<AuditFinding & { page_url: string }>> = {};
  for (const f of catFindings) {
    if (!byRule[f.rule_id]) byRule[f.rule_id] = [];
    byRule[f.rule_id].push(f);
  }

  // Sort by severity then count
  const sevOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3, info: 4 };
  const sorted = Object.entries(byRule).sort((a, b) => {
    const aS = sevOrder[a[1][0].severity] ?? 5;
    const bS = sevOrder[b[1][0].severity] ?? 5;
    if (aS !== bS) return aS - bS;
    return b[1].length - a[1].length;
  });

  const cards = sorted.map(([ruleId, ruleFindings]) => {
    const first = ruleFindings[0];
    const color = severityColor(first.severity);

    let messageHtml = '';
    if (first.message) {
      messageHtml = `<div class="finding-message">${escapeHtml(first.message)}</div>`;
    }

    let recHtml = '';
    if (first.recommendation) {
      recHtml = `<div class="finding-rec"><strong>Fix:</strong> ${escapeHtml(first.recommendation)}</div>`;
    }

    const urlsToShow = ruleFindings.filter(f => f.page_url);
    let urlsHtml = '';
    if (urlsToShow.length > 0) {
      const lines = urlsToShow.map(f => `&bull; ${escapeHtml(truncateUrl(f.page_url))}`).join('<br>');
      urlsHtml = `<div class="finding-urls">${lines}</div>`;
    }

    return `<div class="finding-card avoid-break">
      <div class="finding-head">
        <span class="sev-badge" style="background:${color}">${escapeHtml(first.severity.toUpperCase())}</span>
        <span class="finding-rule">${escapeHtml(first.rule_name || ruleId)}</span>
        <span class="finding-pages">${ruleFindings.length} page${ruleFindings.length !== 1 ? 's' : ''}</span>
      </div>
      ${messageHtml}
      ${recHtml}
      ${urlsHtml}
    </div>`;
  }).join('\n');

  const scoreDisplay = score !== null ? `${score}` : '—';

  return `<div class="page page-break">
  <div class="cat-header" style="background:${color}">
    <div class="cat-subtitle">${escapeHtml(labels.full.toUpperCase())}</div>
    <div class="cat-title">${escapeHtml(labels.short)} Findings</div>
    <div class="cat-score-badge">${scoreDisplay}</div>
    <div class="cat-issue-count">${catFindings.length} issue${catFindings.length !== 1 ? 's' : ''} found</div>
  </div>
  ${cards}
</div>`;
}

function buildBrokenLinksPage(brokenLinks: Array<{
  broken_url: string;
  source_url: string;
  status_code: number | null;
}>): string {
  const linksToShow = brokenLinks.slice(0, 40);

  const rows = linksToShow.map(link => {
    const code = link.status_code ?? 0;
    const color = code >= 500 ? '#ef4444' : code >= 400 ? '#f97316' : '#f59e0b';
    const statusLabel = link.status_code?.toString() || 'ERR';

    return `<tr class="avoid-break">
      <td><span class="status-badge" style="background:${color}">${statusLabel}</span></td>
      <td class="bl-url">${escapeHtml(truncateUrl(link.broken_url, 55))}</td>
      <td class="bl-url">${escapeHtml(truncateUrl(link.source_url, 45))}</td>
    </tr>`;
  }).join('\n');

  const overflow = brokenLinks.length > 40
    ? `<p style="font-size:11px;color:var(--text-muted);margin-top:12px;">+ ${brokenLinks.length - 40} more broken links (export CSV for complete list)</p>`
    : '';

  return `<div class="page page-break">
  <div class="cat-header" style="background:#ef4444">
    <div class="cat-subtitle">LINK CHECKER</div>
    <div class="cat-title">Broken Links</div>
    <div class="cat-issue-count">${brokenLinks.length} broken link${brokenLinks.length !== 1 ? 's' : ''} found</div>
  </div>
  <table class="bl-table">
    <thead>
      <tr>
        <th style="width:60px">Status</th>
        <th>Broken URL</th>
        <th>Found On Page</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  ${overflow}
</div>`;
}

// ── Markdown builder ────────────────────────────────────────────────

export function buildReportMarkdown(data: PdfReportData): string {
  const { audit, findings, brokenLinks, branding } = data;

  // Compute stats
  const severityCounts: Record<string, number> = { critical: 0, serious: 0, moderate: 0, minor: 0, info: 0 };
  const findingsByCategory: Record<string, Array<AuditFinding & { page_url: string }>> = {};

  for (const f of findings) {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
    if (!findingsByCategory[f.category]) findingsByCategory[f.category] = [];
    findingsByCategory[f.category].push(f);
  }

  const scoreMap: Record<string, number | null> = {
    seo: audit.seo_score,
    accessibility: audit.accessibility_score,
    security: audit.security_score,
    performance: audit.performance_score,
    content: audit.content_score,
    'structured-data': audit.structured_data_score,
  };

  const validScores = Object.entries(scoreMap).filter(([, s]) => s != null) as [string, number][];
  const overallScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, [, s]) => sum + s, 0) / validScores.length)
    : null;

  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const lines: string[] = [];

  // Title
  lines.push(`# Website Audit Report — ${audit.target_domain}`);
  lines.push(`Generated: ${dateStr} | By: ${branding.companyName}`);
  lines.push('');

  // Overall Score
  if (overallScore !== null) {
    lines.push(`## Overall Score: ${overallScore}/100`);
    lines.push('');
  }

  // Category Scores
  if (validScores.length > 0) {
    lines.push('## Category Scores');
    lines.push('');
    lines.push('| Category | Score | Rating |');
    lines.push('|----------|-------|--------|');
    for (const [key, score] of validScores) {
      const label = CATEGORY_LABELS[key]?.short || key;
      const rating = getScoreLabel(score);
      lines.push(`| ${label} | ${score} | ${rating} |`);
    }
    lines.push('');
  }

  // Key Stats
  lines.push('## Key Stats');
  lines.push('');
  lines.push(`- Pages Crawled: ${audit.pages_crawled || 0} of ${audit.pages_found || 0}`);
  lines.push(`- Total Issues: ${findings.length} (${audit.critical_issues || 0} critical)`);
  lines.push(`- Broken Links: ${brokenLinks.length}`);
  lines.push('');

  // Issues by Severity
  lines.push('## Issues by Severity');
  lines.push('');
  for (const sev of ['critical', 'serious', 'moderate', 'minor', 'info']) {
    const count = severityCounts[sev] || 0;
    if (count > 0) {
      lines.push(`- ${sev.charAt(0).toUpperCase() + sev.slice(1)}: ${count}`);
    }
  }
  lines.push('');

  // Top Priorities (max 10)
  const topFindings = findings.slice(0, 10);
  if (topFindings.length > 0) {
    lines.push('## Top Priorities');
    lines.push('');
    topFindings.forEach((f, i) => {
      const catLabel = CATEGORY_LABELS[f.category]?.short || f.category;
      lines.push(`${i + 1}. **${f.rule_name || f.rule_id}** — ${catLabel} · ${f.severity}`);
    });
    lines.push('');
  }

  // Category Detail Sections
  const categoryOrder = [
    'seo', 'accessibility', 'security', 'performance',
    'content', 'content-eeat', 'content-aeo', 'structured-data',
  ];
  const orderedCategories = [
    ...categoryOrder.filter(c => findingsByCategory[c]?.length),
    ...Object.keys(findingsByCategory).filter(c => !categoryOrder.includes(c) && findingsByCategory[c]?.length),
  ];

  for (const category of orderedCategories) {
    const catFindings = findingsByCategory[category];
    const labels = CATEGORY_LABELS[category] || { short: category, full: category };
    const score = scoreMap[category];
    const scoreStr = score !== null && score !== undefined ? ` (score: ${score})` : '';

    lines.push(`## ${labels.short} Findings${scoreStr}`);
    lines.push('');

    // Group by rule_id
    const byRule: Record<string, Array<AuditFinding & { page_url: string }>> = {};
    for (const f of catFindings) {
      if (!byRule[f.rule_id]) byRule[f.rule_id] = [];
      byRule[f.rule_id].push(f);
    }

    const sevOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3, info: 4 };
    const sorted = Object.entries(byRule).sort((a, b) => {
      const aS = sevOrder[a[1][0].severity] ?? 5;
      const bS = sevOrder[b[1][0].severity] ?? 5;
      if (aS !== bS) return aS - bS;
      return b[1].length - a[1].length;
    });

    for (const [, ruleFindings] of sorted) {
      const first = ruleFindings[0];
      lines.push(`### ${first.rule_name || first.rule_id} [${first.severity.toUpperCase()}] — ${ruleFindings.length} page${ruleFindings.length !== 1 ? 's' : ''}`);
      lines.push('');

      if (first.message) {
        lines.push(first.message);
        lines.push('');
      }

      if (first.recommendation) {
        lines.push(`> **Fix:** ${first.recommendation}`);
        lines.push('');
      }

      const urlsToShow = ruleFindings.filter(f => f.page_url);
      if (urlsToShow.length > 0) {
        lines.push('Affected pages:');
        for (const f of urlsToShow) {
          lines.push(`- ${f.page_url}`);
        }
        lines.push('');
      }
    }
  }

  // Broken Links
  if (brokenLinks.length > 0) {
    lines.push('## Broken Links');
    lines.push('');
    lines.push('| Status | Broken URL | Found On |');
    lines.push('|--------|-----------|----------|');
    for (const link of brokenLinks) {
      const status = link.status_code?.toString() || 'ERR';
      lines.push(`| ${status} | ${link.broken_url} | ${link.source_url} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
