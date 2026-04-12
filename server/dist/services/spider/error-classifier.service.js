"use strict";
/**
 * Error Classifier Service
 *
 * Classifies crawl errors into specific types with user-friendly messages
 * and actionable suggestions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlErrorType = void 0;
exports.classifyError = classifyError;
exports.getErrorTypeLabel = getErrorTypeLabel;
exports.hasSecurityBlockingErrors = hasSecurityBlockingErrors;
exports.getSecurityBlockingSummary = getSecurityBlockingSummary;
/**
 * Error type enumeration for crawl failures
 */
var CrawlErrorType;
(function (CrawlErrorType) {
    // Network Errors
    CrawlErrorType["TIMEOUT"] = "TIMEOUT";
    CrawlErrorType["CONNECTION_REFUSED"] = "CONNECTION_REFUSED";
    CrawlErrorType["CONNECTION_RESET"] = "CONNECTION_RESET";
    CrawlErrorType["DNS_FAILURE"] = "DNS_FAILURE";
    CrawlErrorType["SSL_ERROR"] = "SSL_ERROR";
    CrawlErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    // Bot Detection
    CrawlErrorType["CLOUDFLARE_CHALLENGE"] = "CLOUDFLARE_CHALLENGE";
    CrawlErrorType["CAPTCHA_REQUIRED"] = "CAPTCHA_REQUIRED";
    CrawlErrorType["BOT_DETECTED"] = "BOT_DETECTED";
    CrawlErrorType["ACCESS_DENIED"] = "ACCESS_DENIED";
    CrawlErrorType["WAF_BLOCKED"] = "WAF_BLOCKED";
    // Rate Limiting
    CrawlErrorType["RATE_LIMITED"] = "RATE_LIMITED";
    CrawlErrorType["IP_BLOCKED"] = "IP_BLOCKED";
    // HTTP Errors
    CrawlErrorType["PAGE_NOT_FOUND"] = "PAGE_NOT_FOUND";
    CrawlErrorType["SERVER_ERROR"] = "SERVER_ERROR";
    CrawlErrorType["BAD_GATEWAY"] = "BAD_GATEWAY";
    CrawlErrorType["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    CrawlErrorType["REDIRECT_LOOP"] = "REDIRECT_LOOP";
    // Content Issues
    CrawlErrorType["EMPTY_RESPONSE"] = "EMPTY_RESPONSE";
    CrawlErrorType["INVALID_CONTENT"] = "INVALID_CONTENT";
    CrawlErrorType["PAGE_TOO_LARGE"] = "PAGE_TOO_LARGE";
    // Auth Required
    CrawlErrorType["LOGIN_REQUIRED"] = "LOGIN_REQUIRED";
    CrawlErrorType["PAYWALL"] = "PAYWALL";
    CrawlErrorType["SUBSCRIPTION_REQUIRED"] = "SUBSCRIPTION_REQUIRED";
    // Geographic
    CrawlErrorType["GEO_BLOCKED"] = "GEO_BLOCKED";
    // Unknown
    CrawlErrorType["UNKNOWN"] = "UNKNOWN";
})(CrawlErrorType || (exports.CrawlErrorType = CrawlErrorType = {}));
/**
 * Patterns for detecting various types of blocking
 */
const CLOUDFLARE_PATTERNS = [
    /cf-browser-verification/i,
    /cloudflare/i,
    /cf-challenge/i,
    /cf_chl_opt/i,
    /challenge-platform/i,
    /ray id:/i,
    /checking your browser/i,
    /please wait while we verify/i,
    /ddos-guard/i,
    /cdn-cgi\/challenge-platform/i,
];
const CAPTCHA_PATTERNS = [
    /captcha/i,
    /recaptcha/i,
    /hcaptcha/i,
    /g-recaptcha/i,
    /h-captcha/i,
    /funcaptcha/i,
    /arkose/i,
    /verify you're human/i,
    /prove you're not a robot/i,
];
const BOT_DETECTION_PATTERNS = [
    /access denied/i,
    /access blocked/i,
    /suspicious activity/i,
    /automated access/i,
    /bot detected/i,
    /unusual traffic/i,
    /security check/i,
    /blocked for security/i,
    /your ip has been blocked/i,
    /too many requests/i,
    /request blocked/i,
    /forbidden/i,
    /not allowed/i,
];
const LOGIN_PATTERNS = [
    /login.*password/i,
    /sign in.*password/i,
    /log in.*password/i,
    /enter your password/i,
    /authentication required/i,
    /please log in/i,
    /please sign in/i,
    /members only/i,
];
const PAYWALL_PATTERNS = [
    /subscribe to read/i,
    /subscription required/i,
    /premium content/i,
    /become a member/i,
    /upgrade to access/i,
    /paywall/i,
    /unlock this article/i,
    /free trial/i,
];
const GEO_BLOCK_PATTERNS = [
    /not available in your (country|region|location)/i,
    /geo.?restrict/i,
    /access.*your (country|region|location)/i,
    /unavailable.*your (country|region|location)/i,
    /content.*blocked/i,
];
/**
 * Classify an error based on the error object, HTML content, and HTTP status
 */
function classifyError(error, html, statusCode) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorLower = errorMessage.toLowerCase();
    const htmlLower = html?.toLowerCase() || '';
    // ===========================================
    // 1. Check error message patterns
    // ===========================================
    // Timeout errors
    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
        return {
            type: CrawlErrorType.TIMEOUT,
            category: 'network',
            message: errorMessage,
            userMessage: 'The page took too long to respond',
            suggestion: 'The website may be slow, overloaded, or blocking automated access. Try again later or check if the website is accessible in a regular browser.',
            retryable: true,
            isSecurityRelated: false,
        };
    }
    // Connection refused
    if (errorLower.includes('econnrefused') || errorLower.includes('connection refused')) {
        return {
            type: CrawlErrorType.CONNECTION_REFUSED,
            category: 'network',
            message: errorMessage,
            userMessage: 'Connection refused by the server',
            suggestion: 'The website is not accepting connections. This could mean the site is down, or our IP address has been blocked.',
            retryable: true,
            isSecurityRelated: true,
        };
    }
    // Connection reset
    if (errorLower.includes('econnreset') || errorLower.includes('connection reset')) {
        return {
            type: CrawlErrorType.CONNECTION_RESET,
            category: 'network',
            message: errorMessage,
            userMessage: 'Connection was reset by the server',
            suggestion: 'The website terminated the connection unexpectedly. This may indicate aggressive bot protection.',
            retryable: true,
            isSecurityRelated: true,
        };
    }
    // DNS failure
    if (errorLower.includes('getaddrinfo') || errorLower.includes('enotfound') ||
        errorLower.includes('dns') || errorLower.includes('name resolution')) {
        return {
            type: CrawlErrorType.DNS_FAILURE,
            category: 'network',
            message: errorMessage,
            userMessage: 'Website address could not be found',
            suggestion: 'Please check that the URL is correct. The domain may not exist or DNS servers may be unreachable.',
            retryable: false,
            isSecurityRelated: false,
        };
    }
    // SSL/TLS errors
    if (errorLower.includes('ssl') || errorLower.includes('certificate') ||
        errorLower.includes('cert_') || errorLower.includes('tls')) {
        return {
            type: CrawlErrorType.SSL_ERROR,
            category: 'network',
            message: errorMessage,
            userMessage: 'SSL/Security certificate error',
            suggestion: 'The website has an invalid, expired, or misconfigured security certificate.',
            retryable: false,
            isSecurityRelated: false,
        };
    }
    // Bot verification from error message
    if (errorLower.includes('bot verification') || errorLower.includes('cloudflare')) {
        return {
            type: CrawlErrorType.CLOUDFLARE_CHALLENGE,
            category: 'security',
            message: errorMessage,
            userMessage: 'Website protected by Cloudflare security',
            suggestion: 'This website uses Cloudflare\'s advanced bot protection. To audit this site, the website owner would need to either whitelist our crawler IP address or temporarily disable "Bot Fight Mode" in their Cloudflare dashboard.',
            retryable: false,
            isSecurityRelated: true,
        };
    }
    // Page too large
    if (errorLower.includes('too large') || errorLower.includes('size limit')) {
        return {
            type: CrawlErrorType.PAGE_TOO_LARGE,
            category: 'content',
            message: errorMessage,
            userMessage: 'Page is too large to process',
            suggestion: 'This page exceeds our size limit (5MB). Large pages may indicate generated content or data dumps.',
            retryable: false,
            isSecurityRelated: false,
        };
    }
    // ===========================================
    // 2. Check HTTP status codes
    // ===========================================
    if (statusCode) {
        switch (statusCode) {
            case 401:
                return {
                    type: CrawlErrorType.LOGIN_REQUIRED,
                    category: 'content',
                    message: `HTTP ${statusCode} Unauthorized`,
                    userMessage: 'Authentication required',
                    suggestion: 'This page requires login credentials to access.',
                    retryable: false,
                    statusCode,
                    isSecurityRelated: false,
                };
            case 403:
                return {
                    type: CrawlErrorType.ACCESS_DENIED,
                    category: 'security',
                    message: `HTTP ${statusCode} Forbidden`,
                    userMessage: 'Access denied by the website',
                    suggestion: 'The website is blocking access. This is often due to bot detection or IP-based blocking. Try again later or contact the website owner.',
                    retryable: false,
                    statusCode,
                    isSecurityRelated: true,
                };
            case 404:
                return {
                    type: CrawlErrorType.PAGE_NOT_FOUND,
                    category: 'server',
                    message: `HTTP ${statusCode} Not Found`,
                    userMessage: 'Page not found',
                    suggestion: 'This page does not exist. Check that the URL is correct.',
                    retryable: false,
                    statusCode,
                    isSecurityRelated: false,
                };
            case 429:
                return {
                    type: CrawlErrorType.RATE_LIMITED,
                    category: 'network',
                    message: `HTTP ${statusCode} Too Many Requests`,
                    userMessage: 'Rate limited by the website',
                    suggestion: 'We\'re being rate limited. The crawler will automatically slow down and retry.',
                    retryable: true,
                    statusCode,
                    isSecurityRelated: false,
                };
            case 451:
                return {
                    type: CrawlErrorType.GEO_BLOCKED,
                    category: 'content',
                    message: `HTTP ${statusCode} Unavailable For Legal Reasons`,
                    userMessage: 'Content unavailable in this region',
                    suggestion: 'This content is blocked in the region where our servers are located.',
                    retryable: false,
                    statusCode,
                    isSecurityRelated: false,
                };
            case 500:
                return {
                    type: CrawlErrorType.SERVER_ERROR,
                    category: 'server',
                    message: `HTTP ${statusCode} Internal Server Error`,
                    userMessage: 'Website server error',
                    suggestion: 'The website is experiencing technical difficulties. Try again later.',
                    retryable: true,
                    statusCode,
                    isSecurityRelated: false,
                };
            case 502:
                return {
                    type: CrawlErrorType.BAD_GATEWAY,
                    category: 'server',
                    message: `HTTP ${statusCode} Bad Gateway`,
                    userMessage: 'Bad gateway error',
                    suggestion: 'The website\'s server or proxy is not responding correctly. Try again later.',
                    retryable: true,
                    statusCode,
                    isSecurityRelated: false,
                };
            case 503:
                return {
                    type: CrawlErrorType.SERVICE_UNAVAILABLE,
                    category: 'server',
                    message: `HTTP ${statusCode} Service Unavailable`,
                    userMessage: 'Service temporarily unavailable',
                    suggestion: 'The website is temporarily unavailable, possibly for maintenance. Try again later.',
                    retryable: true,
                    statusCode,
                    isSecurityRelated: false,
                };
            case 520:
            case 521:
            case 522:
            case 523:
            case 524:
                // Cloudflare-specific error codes
                return {
                    type: CrawlErrorType.CLOUDFLARE_CHALLENGE,
                    category: 'security',
                    message: `HTTP ${statusCode} Cloudflare Error`,
                    userMessage: 'Cloudflare connection error',
                    suggestion: `Cloudflare returned error ${statusCode}. This often indicates the origin server is unreachable or blocking connections.`,
                    retryable: true,
                    statusCode,
                    isSecurityRelated: true,
                };
        }
    }
    // ===========================================
    // 3. Check HTML content patterns
    // ===========================================
    if (html) {
        // Cloudflare detection
        for (const pattern of CLOUDFLARE_PATTERNS) {
            if (pattern.test(html)) {
                return {
                    type: CrawlErrorType.CLOUDFLARE_CHALLENGE,
                    category: 'security',
                    message: 'Cloudflare challenge page detected',
                    userMessage: 'Website protected by Cloudflare security',
                    suggestion: 'This website uses Cloudflare\'s bot protection which requires browser verification that cannot be automated. The website owner would need to whitelist our crawler or disable "Bot Fight Mode".',
                    retryable: false,
                    isSecurityRelated: true,
                };
            }
        }
        // CAPTCHA detection
        for (const pattern of CAPTCHA_PATTERNS) {
            if (pattern.test(html)) {
                return {
                    type: CrawlErrorType.CAPTCHA_REQUIRED,
                    category: 'security',
                    message: 'CAPTCHA challenge detected',
                    userMessage: 'Website requires CAPTCHA verification',
                    suggestion: 'This website requires human verification (CAPTCHA) that cannot be solved automatically.',
                    retryable: false,
                    isSecurityRelated: true,
                };
            }
        }
        // Generic bot detection
        for (const pattern of BOT_DETECTION_PATTERNS) {
            if (pattern.test(html)) {
                return {
                    type: CrawlErrorType.BOT_DETECTED,
                    category: 'security',
                    message: 'Bot detection triggered',
                    userMessage: 'Website detected automated access',
                    suggestion: 'The website\'s security system detected our crawler as a bot. Try again later or contact the website owner to whitelist automated auditing.',
                    retryable: false,
                    isSecurityRelated: true,
                };
            }
        }
        // Login detection
        for (const pattern of LOGIN_PATTERNS) {
            if (pattern.test(html)) {
                return {
                    type: CrawlErrorType.LOGIN_REQUIRED,
                    category: 'content',
                    message: 'Login page detected',
                    userMessage: 'Content requires login',
                    suggestion: 'This content is behind a login wall and requires authentication to access.',
                    retryable: false,
                    isSecurityRelated: false,
                };
            }
        }
        // Paywall detection
        for (const pattern of PAYWALL_PATTERNS) {
            if (pattern.test(html)) {
                return {
                    type: CrawlErrorType.PAYWALL,
                    category: 'content',
                    message: 'Paywall detected',
                    userMessage: 'Content behind paywall',
                    suggestion: 'This content requires a paid subscription to access.',
                    retryable: false,
                    isSecurityRelated: false,
                };
            }
        }
        // Geo-blocking detection
        for (const pattern of GEO_BLOCK_PATTERNS) {
            if (pattern.test(html)) {
                return {
                    type: CrawlErrorType.GEO_BLOCKED,
                    category: 'content',
                    message: 'Geographic restriction detected',
                    userMessage: 'Content not available in this region',
                    suggestion: 'This content is restricted based on geographic location and is not available from our server\'s location.',
                    retryable: false,
                    isSecurityRelated: false,
                };
            }
        }
    }
    // ===========================================
    // 4. Default unknown error
    // ===========================================
    return {
        type: CrawlErrorType.UNKNOWN,
        category: 'unknown',
        message: errorMessage,
        userMessage: 'An unexpected error occurred while crawling this page',
        suggestion: 'Please try again. If the problem persists, there may be an issue with the website.',
        retryable: true,
        statusCode,
        isSecurityRelated: false,
    };
}
/**
 * Get a human-readable label for an error type
 */
function getErrorTypeLabel(type) {
    const labels = {
        [CrawlErrorType.TIMEOUT]: 'Page Timeout',
        [CrawlErrorType.CONNECTION_REFUSED]: 'Connection Refused',
        [CrawlErrorType.CONNECTION_RESET]: 'Connection Reset',
        [CrawlErrorType.DNS_FAILURE]: 'DNS Failure',
        [CrawlErrorType.SSL_ERROR]: 'SSL Error',
        [CrawlErrorType.NETWORK_ERROR]: 'Network Error',
        [CrawlErrorType.CLOUDFLARE_CHALLENGE]: 'Cloudflare Protection',
        [CrawlErrorType.CAPTCHA_REQUIRED]: 'CAPTCHA Required',
        [CrawlErrorType.BOT_DETECTED]: 'Bot Detected',
        [CrawlErrorType.ACCESS_DENIED]: 'Access Denied',
        [CrawlErrorType.WAF_BLOCKED]: 'WAF Blocked',
        [CrawlErrorType.RATE_LIMITED]: 'Rate Limited',
        [CrawlErrorType.IP_BLOCKED]: 'IP Blocked',
        [CrawlErrorType.PAGE_NOT_FOUND]: 'Page Not Found',
        [CrawlErrorType.SERVER_ERROR]: 'Server Error',
        [CrawlErrorType.BAD_GATEWAY]: 'Bad Gateway',
        [CrawlErrorType.SERVICE_UNAVAILABLE]: 'Service Unavailable',
        [CrawlErrorType.REDIRECT_LOOP]: 'Redirect Loop',
        [CrawlErrorType.EMPTY_RESPONSE]: 'Empty Response',
        [CrawlErrorType.INVALID_CONTENT]: 'Invalid Content',
        [CrawlErrorType.PAGE_TOO_LARGE]: 'Page Too Large',
        [CrawlErrorType.LOGIN_REQUIRED]: 'Login Required',
        [CrawlErrorType.PAYWALL]: 'Paywall',
        [CrawlErrorType.SUBSCRIPTION_REQUIRED]: 'Subscription Required',
        [CrawlErrorType.GEO_BLOCKED]: 'Geographic Restriction',
        [CrawlErrorType.UNKNOWN]: 'Unknown Error',
    };
    return labels[type] || 'Unknown Error';
}
/**
 * Check if any errors in a collection are security-related
 */
function hasSecurityBlockingErrors(errors) {
    return errors.some(e => e.isSecurityRelated);
}
/**
 * Get a summary message for security blocking
 */
function getSecurityBlockingSummary(errors) {
    const securityErrors = errors.filter(e => e.isSecurityRelated);
    if (securityErrors.length === 0)
        return null;
    const errorTypes = [...new Set(securityErrors.map(e => e.type))];
    if (errorTypes.includes(CrawlErrorType.CLOUDFLARE_CHALLENGE)) {
        return 'This website uses Cloudflare\'s advanced security protection which prevents automated scanning. To audit this site, ask the website owner to whitelist our crawler or temporarily disable bot protection.';
    }
    if (errorTypes.includes(CrawlErrorType.CAPTCHA_REQUIRED)) {
        return 'This website requires CAPTCHA verification which cannot be completed automatically.';
    }
    if (errorTypes.includes(CrawlErrorType.BOT_DETECTED)) {
        return 'This website has detected and blocked our automated crawler. The site may need to whitelist our IP address.';
    }
    return 'This website has security measures that prevent automated scanning. Some or all pages could not be audited.';
}
//# sourceMappingURL=error-classifier.service.js.map