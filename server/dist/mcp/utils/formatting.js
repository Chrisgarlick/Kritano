"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatScore = formatScore;
exports.formatSeverity = formatSeverity;
exports.formatDate = formatDate;
exports.formatStatus = formatStatus;
exports.formatScoresBlock = formatScoresBlock;
exports.truncate = truncate;
exports.formatNumber = formatNumber;
/**
 * Format a score as "82/100" or "N/A" if null
 */
function formatScore(score) {
    if (score === null || score === undefined)
        return 'N/A';
    return `${Math.round(score)}/100`;
}
/**
 * Format severity with brackets: [CRITICAL], [SERIOUS], etc.
 */
function formatSeverity(severity) {
    return `[${severity.toUpperCase()}]`;
}
/**
 * Format a date as "2026-04-17 10:30"
 */
function formatDate(date) {
    if (!date)
        return 'N/A';
    const d = new Date(date);
    return d.toISOString().replace('T', ' ').substring(0, 16);
}
/**
 * Format an audit status for display
 */
function formatStatus(status) {
    const map = {
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
function formatScoresBlock(audit) {
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
function truncate(text, maxLength = 100) {
    if (!text)
        return '';
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
}
/**
 * Format a number with commas
 */
function formatNumber(n) {
    return n.toLocaleString('en-GB');
}
//# sourceMappingURL=formatting.js.map