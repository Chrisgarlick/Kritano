import { chromium, Browser } from 'playwright';
import type { ResolvedBranding } from './pdf-branding.service.js';
import type { AuditJob } from '../types/audit.types.js';
import type { AuditFinding } from '../types/finding.types.js';

// ── Types ──────────────────────────────────────────────────────────

export interface ResolvedFixSnippetForPdf {
  fixType: string;
  language: string;
  code: string;
  explanation: string;
  effort: string;
  learnMoreUrl: string;
}

export interface ComplianceDataForPdf {
  status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
  standard: string;
  summary: {
    totalClauses: number;
    passing: number;
    failing: number;
    manualReview: number;
    notTested: number;
  };
  clauses: Array<{
    clause: string;
    title: string;
    wcagCriteria: string;
    status: 'pass' | 'fail' | 'manual_review' | 'not_tested';
    issueCount: number;
  }>;
  domain: string;
  pagesAudited: number;
}

export interface UnverifiableLink {
  url: string;
  source_url: string;
}

export interface PdfReportData {
  audit: AuditJob;
  findings: Array<AuditFinding & { page_url: string }>;
  brokenLinks: Array<{
    broken_url: string;
    source_url: string;
    status_code: number | null;
  }>;
  unverifiableLinks?: UnverifiableLink[];
  branding: ResolvedBranding;
  fixSnippets?: Record<string, ResolvedFixSnippetForPdf>;
  compliance?: ComplianceDataForPdf;
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
    await browser.close().catch(err => console.error('PDF browser close failed:', err));
    browser = null;
  }
}

// ── Main export ────────────────────────────────────────────────────

export async function generateAuditPdf(data: PdfReportData): Promise<Buffer> {
  const b = await getBrowser();
  const context = await b.newContext();
  try {
    const page = await context.newPage();

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
        <div style="width:100%;font-size:8px;font-family:Outfit,Helvetica,sans-serif;color:#94a3b8;padding:0 40px;display:flex;justify-content:space-between;align-items:center;">
          <span>${footerLeft}</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
      margin: { top: '10mm', bottom: '14mm', left: '16mm', right: '16mm' },
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
  return url.length > max ? url.substring(0, max) + '\u2026' : url;
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
  if (score >= 50) return 'Needs Work';
  return 'Critical';
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
  'mobile-accessibility': '#059669',
  'mobile-performance': '#0284c7',
};

const CATEGORY_LABELS: Record<string, { short: string; full: string }> = {
  seo: { short: 'SEO', full: 'Search Engine Optimisation' },
  accessibility: { short: 'Accessibility', full: 'Web Accessibility' },
  security: { short: 'Security', full: 'Security & Best Practices' },
  performance: { short: 'Performance', full: 'Performance Optimisation' },
  content: { short: 'Content', full: 'Content Quality' },
  'structured-data': { short: 'Schema', full: 'Structured Data' },
  'content-eeat': { short: 'E-E-A-T', full: 'Experience, Expertise, Authoritativeness & Trust' },
  'content-aeo': { short: 'AEO', full: 'Answer Engine Optimisation (AI Citability)' },
  'mobile-accessibility': { short: 'Mobile A11y', full: 'Mobile Accessibility' },
  'mobile-performance': { short: 'Mobile Perf', full: 'Mobile Performance' },
};

function svgGauge(score: number | null, size: number = 80, strokeWidth: number = 8): string {
  const val = score ?? 0;
  const color = getScoreColor(score);
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (val / 100) * circumference;
  const display = score !== null ? `${score}` : 'N/A';
  const fontSize = score !== null ? Math.round(size * 0.28) : Math.round(size * 0.18);
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
      stroke-linecap="round" transform="rotate(-90 50 50)"/>
    <text x="50" y="55" text-anchor="middle" font-size="${fontSize}" font-weight="700" fill="${color}" font-family="Outfit,sans-serif">${display}</text>
  </svg>`;
}

/** Lighter version of a color for backgrounds */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── HTML builder ───────────────────────────────────────────────────

export function buildReportHtml(data: PdfReportData, logoDataUri: string | null): string {
  const { audit, findings, brokenLinks, unverifiableLinks = [], branding, fixSnippets, compliance } = data;

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
    cqs: audit.cqs_score,
    ...(audit.mobile_accessibility_score != null ? { 'mobile-accessibility': audit.mobile_accessibility_score } : {}),
    ...(audit.mobile_performance_score != null ? { 'mobile-performance': audit.mobile_performance_score } : {}),
  };
  for (const [key, score] of Object.entries(scoreMap)) {
    if (score != null) validScores.push({ key, score });
  }
  const overallScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length)
    : null;

  const totalFindings = findings.length;
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const sections: string[] = [];
  sections.push(buildCoverPage(audit, branding, logoDataUri, overallScore, dateStr, validScores, totalFindings, brokenLinks.length));
  sections.push(buildScoreOverview(validScores, scoreMap));
  sections.push(buildExecutiveSummary(severityCounts, findings, audit, totalFindings, brokenLinks.length));

  const categoryOrder = [
    'seo', 'accessibility', 'security', 'performance',
    'content', 'content-eeat', 'content-aeo', 'structured-data',
  ];
  const orderedCategories = [
    ...categoryOrder.filter(c => findingsByCategory[c]?.length),
    ...Object.keys(findingsByCategory).filter(c => !categoryOrder.includes(c) && findingsByCategory[c]?.length),
  ];
  for (const category of orderedCategories) {
    sections.push(buildCategoryPage(category, findingsByCategory[category], scoreMap[category] ?? null, fixSnippets));
  }

  if (brokenLinks.length > 0) {
    sections.push(buildBrokenLinksPage(brokenLinks));
  }

  if (unverifiableLinks.length > 0) {
    sections.push(buildUnverifiableLinksSection(unverifiableLinks));
  }

  if (compliance && compliance.status !== 'not_assessed') {
    sections.push(buildCompliancePage(compliance));
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: ${branding.primaryColor};
    --secondary: ${branding.secondaryColor};
    --accent: ${branding.accentColor};
    --text: #0f172a;
    --text-secondary: #334155;
    --text-muted: #64748b;
    --text-light: #94a3b8;
    --bg: #ffffff;
    --bg-subtle: #f8fafc;
    --bg-muted: #f1f5f9;
    --border: #e2e8f0;
    --border-light: #f1f5f9;
  }

  @page { margin: 10mm 16mm 14mm 16mm; }
  @page:first { margin: 0; }

  body {
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
  }

  .page { padding: 0; }
  .page-break { break-before: page; }
  .avoid-break { break-inside: avoid; }

  /* ── Cover Page ──────────────────────── */
  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background: var(--primary);
    color: #fff;
    margin: 0;
    padding: 0;
  }
  .cover-accent-1 {
    position: absolute;
    top: -120px;
    right: -80px;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }
  .cover-accent-2 {
    position: absolute;
    bottom: -60px;
    left: -40px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
  .cover-accent-3 {
    position: absolute;
    top: 40%;
    right: 10%;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: rgba(255,255,255,0.03);
  }
  .cover-top {
    padding: 48px 50px;
    position: relative;
    z-index: 1;
  }
  .cover-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cover-brand img { height: 32px; }
  .cover-brand-name {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.04em;
    opacity: 0.9;
  }
  .cover-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 50px;
    position: relative;
    z-index: 1;
  }
  .cover-eyebrow {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.6;
    margin-bottom: 16px;
  }
  .cover-title {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 52px;
    font-weight: 400;
    line-height: 1.1;
    margin-bottom: 12px;
  }
  .cover-domain {
    font-size: 20px;
    font-weight: 300;
    opacity: 0.8;
    margin-bottom: 40px;
  }
  .cover-score-row {
    display: flex;
    align-items: center;
    gap: 28px;
  }
  .cover-score-gauge { flex-shrink: 0; }
  .cover-score-info {}
  .cover-score-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.6;
    margin-bottom: 4px;
  }
  .cover-score-rating {
    font-size: 24px;
    font-weight: 600;
  }
  .cover-bottom {
    padding: 0 50px 48px;
    position: relative;
    z-index: 1;
  }
  .cover-meta {
    display: flex;
    gap: 32px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.15);
  }
  .cover-meta-item {}
  .cover-meta-label {
    font-size: 9px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.5;
    margin-bottom: 2px;
  }
  .cover-meta-value {
    font-size: 14px;
    font-weight: 600;
  }

  /* ── Section Headers ─────────────────── */
  .section-title {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 22px;
    color: var(--text);
    margin-bottom: 4px;
  }
  .section-subtitle {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 20px;
  }
  .section-divider {
    width: 40px;
    height: 3px;
    background: var(--primary);
    border-radius: 2px;
    margin-bottom: 20px;
  }
  .section-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 12px;
  }

  /* ── Score Grid ──────────────────────── */
  .score-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 32px;
  }
  .score-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px 16px 16px;
    text-align: center;
    position: relative;
  }
  .score-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 10px 10px 0 0;
  }
  .score-card .cat-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
  }
  .score-card .score-value {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 6px;
  }

  /* ── Stats Row ───────────────────────── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 32px;
  }
  .stat-card {
    background: var(--bg-subtle);
    border: 1px solid var(--border-light);
    border-radius: 10px;
    padding: 20px;
  }
  .stat-card .stat-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .stat-card .stat-value {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--text);
  }
  .stat-card .stat-sub {
    font-size: 11px;
    color: var(--text-light);
    margin-top: 4px;
  }

  /* ── Severity Bars ───────────────────── */
  .severity-bars { margin-bottom: 32px; }
  .sev-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .sev-indicator {
    width: 4px;
    height: 22px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .sev-label {
    width: 72px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
  .sev-bar-bg {
    flex: 1;
    height: 18px;
    background: var(--bg-muted);
    border-radius: 4px;
    overflow: hidden;
  }
  .sev-bar-fill {
    height: 100%;
    border-radius: 4px;
    min-width: 4px;
    transition: width 0.3s;
  }
  .sev-count {
    width: 36px;
    text-align: right;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
  }

  /* ── Top Priorities ──────────────────── */
  .priority-list { margin-bottom: 32px; }
  .priority-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-light);
  }
  .priority-item:last-child { border-bottom: none; }
  .priority-num {
    width: 26px;
    height: 26px;
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
    color: var(--text);
    margin-bottom: 2px;
  }
  .priority-meta {
    font-size: 10px;
    color: var(--text-muted);
  }

  /* ── Category Page ───────────────────── */
  .cat-header {
    padding: 28px 28px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    color: #fff;
  }
  .cat-content {
    padding: 0;
  }
  .cat-header-bg {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    opacity: 1;
  }
  .cat-header-accent {
    position: absolute;
    top: -60px;
    right: -40px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
  }
  .cat-header-accent-2 {
    position: absolute;
    bottom: -80px;
    right: 30%;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  .cat-header-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cat-header-left {}
  .cat-eyebrow {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 6px;
    color: rgba(255,255,255,0.7);
  }
  .cat-title {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 26px;
    font-weight: 400;
    color: #fff;
  }
  .cat-issue-count {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    margin-top: 4px;
  }
  .cat-header-right {
    text-align: center;
  }
  .cat-score-num {
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
    color: #fff !important;
  }
  .cat-score-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.6);
    margin-top: 4px;
  }

  /* ── Finding Cards ───────────────────── */
  .finding-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
    margin-bottom: 10px;
    break-inside: avoid;
    border-left: 3px solid var(--border);
  }
  .finding-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .sev-badge {
    font-size: 8px;
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
    color: var(--text);
  }
  .finding-pages {
    font-size: 10px;
    color: var(--text-light);
    flex-shrink: 0;
    background: var(--bg-muted);
    padding: 2px 8px;
    border-radius: 10px;
  }
  .finding-message {
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 6px;
    line-height: 1.5;
  }
  .finding-rec {
    background: ${hexToRgba(branding.primaryColor, 0.04)};
    border-left: 2px solid ${hexToRgba(branding.primaryColor, 0.3)};
    padding: 8px 12px;
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 6px;
    line-height: 1.5;
  }
  .finding-rec strong { color: var(--primary); }
  .finding-urls {
    font-size: 9px;
    color: var(--text-light);
    font-family: 'JetBrains Mono', monospace;
    line-height: 1.8;
  }

  /* ── Broken Links Table ──────────────── */
  .bl-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 11px;
  }
  .bl-table th {
    background: var(--bg-muted);
    padding: 10px 12px;
    text-align: left;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    border-bottom: 2px solid var(--border);
  }
  .bl-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-light);
    vertical-align: top;
  }
  .bl-table tr:last-child td { border-bottom: none; }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
  }
  .bl-url {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    word-break: break-all;
    color: var(--text-secondary);
  }

  /* ── Empty state ─────────────────────── */
  .empty-state {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    padding: 24px;
    text-align: center;
    color: #15803d;
    font-size: 13px;
    font-weight: 500;
  }

  /* ── Fix Snippets ────────────────────── */
  .fix-snippet {
    margin-top: 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .fix-snippet-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--bg-subtle);
    font-size: 10px;
    font-weight: 600;
    color: var(--primary);
    border-bottom: 1px solid var(--border-light);
  }
  .fix-effort-badge {
    font-size: 9px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .fix-effort-small { background: #d1fae5; color: #065f46; }
  .fix-effort-medium { background: #fef3c7; color: #92400e; }
  .fix-effort-large { background: #fee2e2; color: #991b1b; }
  .fix-explanation {
    padding: 8px 12px;
    font-size: 10px;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  .fix-code-block {
    background: #0f172a;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    padding: 12px 14px;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
  }

  /* ── Compliance Section ──────────────── */
  .compliance-header {
    background: var(--primary);
    color: #fff;
    padding: 24px 28px;
    border-radius: 10px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .compliance-header::after {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }
  .compliance-status {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    margin-top: 8px;
  }
  .compliance-status-compliant { background: #d1fae5; color: #065f46; }
  .compliance-status-partially_compliant { background: #fef3c7; color: #92400e; }
  .compliance-status-non_compliant { background: #fee2e2; color: #991b1b; }
  .compliance-status-not_assessed { background: #f1f5f9; color: #475569; }
  .compliance-summary-grid {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }
  .compliance-stat {
    flex: 1;
    text-align: center;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
  }
  .compliance-stat-value {
    font-size: 24px;
    font-weight: 700;
  }
  .compliance-stat-label {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .compliance-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 10px;
    margin-bottom: 16px;
  }
  .compliance-table th {
    background: var(--bg-muted);
    padding: 10px 12px;
    text-align: left;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    border-bottom: 2px solid var(--border);
  }
  .compliance-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-light);
    vertical-align: top;
  }
  .clause-status {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
  }
  .clause-pass { background: #d1fae5; color: #065f46; }
  .clause-fail { background: #fee2e2; color: #991b1b; }
  .clause-manual_review { background: #fef3c7; color: #92400e; }
  .clause-not_tested { background: #f1f5f9; color: #475569; }
  .compliance-disclaimer {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 14px 18px;
    font-size: 10px;
    color: #92400e;
    line-height: 1.5;
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
  validScores: Array<{ key: string; score: number }>,
  totalFindings: number,
  brokenLinkCount: number,
): string {
  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="">`
    : '';

  const scoreColor = getScoreColor(overallScore);
  const scoreLabel = getScoreLabel(overallScore);
  const scoreDisplay = overallScore !== null ? `${overallScore}` : 'N/A';

  // Cover score gauge — white ring on primary background
  const val = overallScore ?? 0;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (val / 100) * circumference;
  const coverGauge = `<svg viewBox="0 0 100 100" width="120" height="120">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="7"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="#fff" stroke-width="7"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
      stroke-linecap="round" transform="rotate(-90 50 50)"/>
    <text x="50" y="53" text-anchor="middle" font-size="28" font-weight="700" fill="#fff" font-family="Outfit,sans-serif">${scoreDisplay}</text>
  </svg>`;

  // Mini score pills for the bottom
  const scorePills = validScores.slice(0, 6).map(s => {
    const label = CATEGORY_LABELS[s.key]?.short || s.key;
    return `<div class="cover-meta-item">
      <div class="cover-meta-label">${escapeHtml(label)}</div>
      <div class="cover-meta-value">${s.score}</div>
    </div>`;
  }).join('');

  return `<div class="cover">
  <div class="cover-accent-1"></div>
  <div class="cover-accent-2"></div>
  <div class="cover-accent-3"></div>

  <div class="cover-top">
    <div class="cover-brand">
      ${logoHtml}
      <span class="cover-brand-name">${escapeHtml(branding.companyName)}</span>
    </div>
  </div>

  <div class="cover-main">
    <div class="cover-eyebrow">Website Audit Report</div>
    <div class="cover-title">${escapeHtml(audit.target_domain)}</div>
    <div class="cover-domain">${escapeHtml(audit.target_url)}</div>

    <div class="cover-score-row">
      <div class="cover-score-gauge">${coverGauge}</div>
      <div class="cover-score-info">
        <div class="cover-score-label">Overall Health Score</div>
        <div class="cover-score-rating">${escapeHtml(scoreLabel)}</div>
      </div>
    </div>
  </div>

  <div class="cover-bottom">
    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">Report Date</div>
        <div class="cover-meta-value">${escapeHtml(dateStr)}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Pages Audited</div>
        <div class="cover-meta-value">${audit.pages_crawled || 0}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Total Issues</div>
        <div class="cover-meta-value">${totalFindings}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Critical Issues</div>
        <div class="cover-meta-value">${audit.critical_issues || 0}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Broken Links</div>
        <div class="cover-meta-value">${brokenLinkCount}</div>
      </div>
    </div>
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
      const label = getScoreLabel(score);
      return `<div class="score-card avoid-break" style="border-top: 3px solid ${color}">
        <div class="cat-label">${escapeHtml(labels.short)}</div>
        ${svgGauge(score, 60, 7)}
        <div class="score-value">${escapeHtml(label)}</div>
      </div>`;
    })
    .join('\n');

  return `<div class="page page-break" style="padding-top: 36px;">
  <div class="section-title">Score Overview</div>
  <div class="section-subtitle">Performance across all audit categories</div>
  <div class="section-divider"></div>
  <div class="score-grid">${cards}</div>
</div>`;
}

function buildExecutiveSummary(
  severityCounts: Record<string, number>,
  findings: Array<AuditFinding & { page_url: string }>,
  audit: AuditJob,
  totalFindings: number,
  brokenLinkCount: number,
): string {
  // Stats row
  const statsHtml = `<div class="stats-row">
    <div class="stat-card avoid-break">
      <div class="stat-label">Pages Crawled</div>
      <div class="stat-value">${audit.pages_crawled || 0}</div>
      <div class="stat-sub">of ${audit.pages_found || 0} discovered</div>
    </div>
    <div class="stat-card avoid-break">
      <div class="stat-label">Issues Found</div>
      <div class="stat-value">${totalFindings}</div>
      <div class="stat-sub">${audit.critical_issues || 0} critical</div>
    </div>
    <div class="stat-card avoid-break">
      <div class="stat-label">Broken Links</div>
      <div class="stat-value">${brokenLinkCount}</div>
      <div class="stat-sub">detected</div>
    </div>
  </div>`;

  // Severity bars
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
      <div class="sev-count" style="color:${s.color}">${count}</div>
    </div>`;
  }).join('\n');

  // Top priorities (max 10)
  const top = findings.slice(0, 10);
  let prioritiesHtml: string;
  if (top.length === 0) {
    prioritiesHtml = '<div class="empty-state">No issues found — your website is in great shape!</div>';
  } else {
    const items = top.map((f, i) => {
      const color = severityColor(f.severity);
      const catLabel = CATEGORY_LABELS[f.category]?.short || f.category;
      return `<div class="priority-item avoid-break">
        <div class="priority-num" style="background:${color}">${i + 1}</div>
        <div class="priority-info">
          <div class="priority-name">${escapeHtml(f.rule_name || f.rule_id)}</div>
          <div class="priority-meta">${escapeHtml(catLabel)} &middot; ${escapeHtml(f.severity)}${f.device_type && f.device_type !== 'desktop' ? ` &middot; ${f.device_type === 'mobile' ? 'Mobile' : 'Both'}` : ''}</div>
        </div>
      </div>`;
    }).join('\n');
    prioritiesHtml = `<div class="priority-list">${items}</div>`;
  }

  return `<div class="page">
  ${statsHtml}
  <div class="section-label">Issues by Severity</div>
  <div class="severity-bars">${bars}</div>
  <div class="section-label">Top Priorities</div>
  ${prioritiesHtml}
</div>`;
}

function buildCategoryPage(
  category: string,
  catFindings: Array<AuditFinding & { page_url: string }>,
  score: number | null,
  fixSnippets?: Record<string, ResolvedFixSnippetForPdf>,
): string {
  const labels = CATEGORY_LABELS[category] || { short: category, full: category };
  const color = CATEGORY_COLORS[category] || '#6366f1';

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

  const cards = sorted.map(([ruleId, ruleFindings]) => {
    const first = ruleFindings[0];
    const sColor = severityColor(first.severity);

    let messageHtml = '';
    if (first.message) {
      messageHtml = `<div class="finding-message">${escapeHtml(first.message)}</div>`;
    }

    let recHtml = '';
    if (first.recommendation) {
      recHtml = `<div class="finding-rec"><strong>Fix:</strong> ${escapeHtml(first.recommendation)}</div>`;
    }

    const urlsToShow = ruleFindings.filter(f => f.page_url).slice(0, 5);
    let urlsHtml = '';
    if (urlsToShow.length > 0) {
      const lines = urlsToShow.map(f => `&bull; ${escapeHtml(truncateUrl(f.page_url))}`).join('<br>');
      const overflow = ruleFindings.length > 5 ? `<br><span style="color:var(--text-light)">+ ${ruleFindings.length - 5} more</span>` : '';
      urlsHtml = `<div class="finding-urls">${lines}${overflow}</div>`;
    }

    let snippetHtml = '';
    const snippet = fixSnippets?.[ruleId];
    if (snippet) {
      const effortClass = `fix-effort-${snippet.effort}`;
      const effortLabel = snippet.effort === 'small' ? 'Quick fix' : snippet.effort === 'medium' ? 'Medium effort' : 'Significant effort';
      snippetHtml = `<div class="fix-snippet">
        <div class="fix-snippet-header">
          How to Fix
          <span class="fix-effort-badge ${effortClass}">${effortLabel}</span>
        </div>
        <div class="fix-explanation">${escapeHtml(snippet.explanation)}</div>
        ${snippet.code ? `<div class="fix-code-block">${escapeHtml(snippet.code)}</div>` : ''}
      </div>`;
    }

    return `<div class="finding-card avoid-break" style="border-left-color:${sColor}">
      <div class="finding-head">
        <span class="sev-badge" style="background:${sColor}">${escapeHtml(first.severity.toUpperCase())}</span>
        <span class="finding-rule">${escapeHtml(first.rule_name || ruleId)}</span>
        <span class="finding-pages">${ruleFindings.length} page${ruleFindings.length !== 1 ? 's' : ''}</span>
      </div>
      ${messageHtml}
      ${recHtml}
      ${urlsHtml}
      ${snippetHtml}
    </div>`;
  }).join('\n');

  const scoreDisplay = score !== null ? `${score}` : '\u2014';
  const scoreColorVal = getScoreColor(score);

  return `<div class="page page-break">
  <div class="cat-header">
    <div class="cat-header-bg" style="background:${color}"></div>
    <div class="cat-header-accent"></div>
    <div class="cat-header-accent-2"></div>
    <div class="cat-header-content">
      <div class="cat-header-left">
        <div class="cat-eyebrow">${escapeHtml(labels.full.toUpperCase())}</div>
        <div class="cat-title">${escapeHtml(labels.short)} Findings</div>
        <div class="cat-issue-count">${catFindings.length} unique issue${catFindings.length !== 1 ? 's' : ''} found</div>
      </div>
      <div class="cat-header-right">
        <div class="cat-score-num">${scoreDisplay}</div>
        <div class="cat-score-label">Score</div>
      </div>
    </div>
  </div>
  ${cards.length === 0 ? '<div class="empty-state">No issues found in this category.</div>' : cards}
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
  <div class="cat-header">
    <div class="cat-header-bg" style="background:#ef4444"></div>
    <div class="cat-header-accent"></div>
    <div class="cat-header-accent-2"></div>
    <div class="cat-header-content">
      <div class="cat-header-left">
        <div class="cat-eyebrow">LINK CHECKER</div>
        <div class="cat-title">Broken Links</div>
        <div class="cat-issue-count">${brokenLinks.length} broken link${brokenLinks.length !== 1 ? 's' : ''} found</div>
      </div>
    </div>
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

function buildUnverifiableLinksSection(links: UnverifiableLink[]): string {
  const linksToShow = links.slice(0, 20);

  const rows = linksToShow.map(link => {
    return `<tr class="avoid-break">
      <td class="bl-url">${escapeHtml(truncateUrl(link.url, 60))}</td>
      <td class="bl-url">${escapeHtml(truncateUrl(link.source_url, 45))}</td>
    </tr>`;
  }).join('\n');

  const overflow = links.length > 20
    ? `<p style="font-size:11px;color:var(--text-muted);margin-top:12px;">+ ${links.length - 20} more unverifiable links</p>`
    : '';

  return `<div class="page page-break">
  <div class="cat-header">
    <div class="cat-header-bg" style="background:#f59e0b"></div>
    <div class="cat-header-accent"></div>
    <div class="cat-header-accent-2"></div>
    <div class="cat-header-content">
      <div class="cat-header-left">
        <div class="cat-eyebrow">LINK CHECKER</div>
        <div class="cat-title">Unverifiable Links</div>
        <div class="cat-issue-count">${links.length} link${links.length !== 1 ? 's' : ''} could not be verified</div>
      </div>
    </div>
  </div>
  <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">These links go to domains that block automated requests (e.g. LinkedIn, Facebook, Instagram). They may be valid but cannot be checked programmatically. Please verify manually.</p>
  <table class="bl-table">
    <thead>
      <tr>
        <th>URL</th>
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

function buildCompliancePage(compliance: ComplianceDataForPdf): string {
  const statusLabels: Record<string, string> = {
    compliant: 'Compliant',
    partially_compliant: 'Partially Compliant',
    non_compliant: 'Non-Compliant',
    not_assessed: 'Not Assessed',
  };

  const { summary, clauses, status } = compliance;
  const statusLabel = statusLabels[status] || status;

  const statCards = [
    { value: summary.passing, label: 'Passing', color: '#065f46', bg: '#d1fae5' },
    { value: summary.failing, label: 'Failing', color: '#991b1b', bg: '#fee2e2' },
    { value: summary.manualReview, label: 'Manual Review', color: '#92400e', bg: '#fef3c7' },
    { value: summary.notTested, label: 'Not Tested', color: '#475569', bg: '#f1f5f9' },
  ];

  const statsHtml = statCards.map(s =>
    `<div class="compliance-stat" style="background:${s.bg}">
      <div class="compliance-stat-value" style="color:${s.color}">${s.value}</div>
      <div class="compliance-stat-label">${s.label}</div>
    </div>`
  ).join('\n');

  const sortedClauses = [...clauses].sort((a, b) => {
    const order: Record<string, number> = { fail: 0, manual_review: 1, not_tested: 2, pass: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });
  const clausesToShow = sortedClauses.slice(0, 50);

  const clauseRows = clausesToShow.map(c =>
    `<tr class="avoid-break">
      <td style="font-family:'JetBrains Mono',monospace;font-weight:600;font-size:9px">${escapeHtml(c.clause)}</td>
      <td>${escapeHtml(c.title)}</td>
      <td style="font-size:9px;color:var(--text-muted)">${escapeHtml(c.wcagCriteria)}</td>
      <td><span class="clause-status clause-${c.status}">${escapeHtml(c.status.replace('_', ' ').toUpperCase())}</span></td>
      <td style="text-align:right;font-weight:600">${c.issueCount > 0 ? c.issueCount : '\u2014'}</td>
    </tr>`
  ).join('\n');

  const overflow = clauses.length > 50
    ? `<p style="font-size:10px;color:var(--text-muted);margin-top:8px;">+ ${clauses.length - 50} more clauses (see full report in app)</p>`
    : '';

  return `<div class="page page-break">
  <div class="compliance-header">
    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;opacity:0.7">EAA Compliance Passport</div>
    <div style="font-family:'Instrument Serif',Georgia,serif;font-size:22px;margin-top:6px;">${escapeHtml(compliance.standard)}</div>
    <span class="compliance-status compliance-status-${status}">${escapeHtml(statusLabel)}</span>
    <div style="font-size:10px;opacity:0.6;margin-top:10px">${escapeHtml(compliance.domain)} &bull; ${compliance.pagesAudited} page${compliance.pagesAudited !== 1 ? 's' : ''} audited</div>
  </div>

  <div class="compliance-summary-grid">${statsHtml}</div>

  <table class="compliance-table">
    <thead>
      <tr>
        <th style="width:80px">Clause</th>
        <th>Title</th>
        <th style="width:80px">WCAG</th>
        <th style="width:80px">Status</th>
        <th style="width:50px;text-align:right">Issues</th>
      </tr>
    </thead>
    <tbody>${clauseRows}</tbody>
  </table>
  ${overflow}

  <div class="compliance-disclaimer">
    <strong>Important disclaimer:</strong> This report is generated by automated testing tools and does not constitute a formal conformance assessment or legal advice. Automated testing can detect approximately 30\u201340% of WCAG issues. Clauses marked \u201cManual Review\u201d require human evaluation. For a complete EN 301 549 assessment, consult a qualified accessibility specialist.
  </div>
</div>`;
}

// ── Markdown builder ────────────────────────────────────────────────

export function buildReportMarkdown(data: PdfReportData): string {
  const { audit, findings, brokenLinks, unverifiableLinks = [], branding } = data;

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
    cqs: audit.cqs_score,
  };

  const validScores = Object.entries(scoreMap).filter(([, s]) => s != null) as [string, number][];
  const overallScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, [, s]) => sum + s, 0) / validScores.length)
    : null;

  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const lines: string[] = [];

  lines.push(`# Website Audit Report — ${audit.target_domain}`);
  lines.push(`Generated: ${dateStr} | By: ${branding.companyName}`);
  lines.push('');

  if (overallScore !== null) {
    lines.push(`## Overall Score: ${overallScore}/100`);
    lines.push('');
  }

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

  lines.push('## Key Stats');
  lines.push('');
  lines.push(`- Pages Crawled: ${audit.pages_crawled || 0} of ${audit.pages_found || 0}`);
  lines.push(`- Total Issues: ${findings.length} (${audit.critical_issues || 0} critical)`);
  lines.push(`- Broken Links: ${brokenLinks.length}`);
  lines.push('');

  lines.push('## Issues by Severity');
  lines.push('');
  for (const sev of ['critical', 'serious', 'moderate', 'minor', 'info']) {
    const count = severityCounts[sev] || 0;
    if (count > 0) {
      lines.push(`- ${sev.charAt(0).toUpperCase() + sev.slice(1)}: ${count}`);
    }
  }
  lines.push('');

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

  if (unverifiableLinks.length > 0) {
    lines.push('## Unverifiable Links');
    lines.push('');
    lines.push('These links go to domains that block automated requests (e.g. LinkedIn, Facebook, Instagram). They may be valid but cannot be checked programmatically.');
    lines.push('');
    lines.push('| URL | Found On |');
    lines.push('|-----|----------|');
    for (const link of unverifiableLinks) {
      lines.push(`| ${link.url} | ${link.source_url} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
