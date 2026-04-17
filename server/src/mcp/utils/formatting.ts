/**
 * Format a score as "82/100" or "N/A" if null
 */
export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return 'N/A';
  return `${Math.round(score)}/100`;
}

/**
 * Format severity with brackets: [CRITICAL], [SERIOUS], etc.
 */
export function formatSeverity(severity: string): string {
  return `[${severity.toUpperCase()}]`;
}

/**
 * Format a date as "2026-04-17 10:30"
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').substring(0, 16);
}

/**
 * Format an audit status for display
 */
export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    discovering: 'Discovering pages...',
    ready: 'Ready to process',
    processing: 'Processing...',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
}

/**
 * Format a scores block for an audit
 */
export function formatScoresBlock(audit: {
  seo_score: number | null;
  accessibility_score: number | null;
  security_score: number | null;
  performance_score: number | null;
  content_score: number | null;
  structured_data_score?: number | null;
  cqs_score?: number | null;
}): string {
  const lines = [
    `  SEO:            ${formatScore(audit.seo_score)}`,
    `  Accessibility:  ${formatScore(audit.accessibility_score)}`,
    `  Security:       ${formatScore(audit.security_score)}`,
    `  Performance:    ${formatScore(audit.performance_score)}`,
    `  Content:        ${formatScore(audit.content_score)}`,
  ];

  if (audit.structured_data_score !== null && audit.structured_data_score !== undefined) {
    lines.push(`  Structured Data: ${formatScore(audit.structured_data_score)}`);
  }

  return lines.join('\n');
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string | null, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a number with commas
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-GB');
}
