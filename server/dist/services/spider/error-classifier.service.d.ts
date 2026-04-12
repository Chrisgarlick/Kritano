/**
 * Error Classifier Service
 *
 * Classifies crawl errors into specific types with user-friendly messages
 * and actionable suggestions.
 */
/**
 * Error type enumeration for crawl failures
 */
export declare enum CrawlErrorType {
    TIMEOUT = "TIMEOUT",
    CONNECTION_REFUSED = "CONNECTION_REFUSED",
    CONNECTION_RESET = "CONNECTION_RESET",
    DNS_FAILURE = "DNS_FAILURE",
    SSL_ERROR = "SSL_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    CLOUDFLARE_CHALLENGE = "CLOUDFLARE_CHALLENGE",
    CAPTCHA_REQUIRED = "CAPTCHA_REQUIRED",
    BOT_DETECTED = "BOT_DETECTED",
    ACCESS_DENIED = "ACCESS_DENIED",
    WAF_BLOCKED = "WAF_BLOCKED",
    RATE_LIMITED = "RATE_LIMITED",
    IP_BLOCKED = "IP_BLOCKED",
    PAGE_NOT_FOUND = "PAGE_NOT_FOUND",
    SERVER_ERROR = "SERVER_ERROR",
    BAD_GATEWAY = "BAD_GATEWAY",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    REDIRECT_LOOP = "REDIRECT_LOOP",
    EMPTY_RESPONSE = "EMPTY_RESPONSE",
    INVALID_CONTENT = "INVALID_CONTENT",
    PAGE_TOO_LARGE = "PAGE_TOO_LARGE",
    LOGIN_REQUIRED = "LOGIN_REQUIRED",
    PAYWALL = "PAYWALL",
    SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED",
    GEO_BLOCKED = "GEO_BLOCKED",
    UNKNOWN = "UNKNOWN"
}
/**
 * Error category for grouping
 */
export type CrawlErrorCategory = 'network' | 'security' | 'server' | 'content' | 'unknown';
/**
 * Structured crawl error with user-friendly information
 */
export interface CrawlError {
    type: CrawlErrorType;
    category: CrawlErrorCategory;
    message: string;
    userMessage: string;
    suggestion: string;
    retryable: boolean;
    statusCode?: number;
    isSecurityRelated: boolean;
}
/**
 * Classify an error based on the error object, HTML content, and HTTP status
 */
export declare function classifyError(error: Error | string, html?: string, statusCode?: number): CrawlError;
/**
 * Get a human-readable label for an error type
 */
export declare function getErrorTypeLabel(type: CrawlErrorType): string;
/**
 * Check if any errors in a collection are security-related
 */
export declare function hasSecurityBlockingErrors(errors: CrawlError[]): boolean;
/**
 * Get a summary message for security blocking
 */
export declare function getSecurityBlockingSummary(errors: CrawlError[]): string | null;
//# sourceMappingURL=error-classifier.service.d.ts.map