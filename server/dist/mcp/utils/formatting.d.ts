/**
 * Format a score as "82/100" or "N/A" if null
 */
export declare function formatScore(score: number | null): string;
/**
 * Format severity with brackets: [CRITICAL], [SERIOUS], etc.
 */
export declare function formatSeverity(severity: string): string;
/**
 * Format a date as "2026-04-17 10:30"
 */
export declare function formatDate(date: Date | string | null): string;
/**
 * Format an audit status for display
 */
export declare function formatStatus(status: string): string;
/**
 * Format a scores block for an audit
 */
export declare function formatScoresBlock(audit: {
    seo_score: number | null;
    accessibility_score: number | null;
    security_score: number | null;
    performance_score: number | null;
    content_score: number | null;
    structured_data_score?: number | null;
    cqs_score?: number | null;
}): string;
/**
 * Truncate text to a max length with ellipsis
 */
export declare function truncate(text: string | null, maxLength?: number): string;
/**
 * Format a number with commas
 */
export declare function formatNumber(n: number): string;
//# sourceMappingURL=formatting.d.ts.map