/**
 * Scan limits for unverified domains
 * These are enforced to protect both the target site and our liability
 */
export declare const UNVERIFIED_DOMAIN_LIMITS: {
    /** Maximum pages that can be crawled */
    readonly MAX_PAGES: 3;
    /** Minimum delay between requests in milliseconds */
    readonly MIN_DELAY_MS: 2500;
    /** Maximum delay between requests in milliseconds */
    readonly MAX_DELAY_MS: 5000;
    /** Requests per second limit */
    readonly REQUESTS_PER_SECOND: 0.4;
    /** Number of concurrent pages (1 = sequential only) */
    readonly CONCURRENT_PAGES: 1;
    /** Whether robots.txt must be respected (always true for unverified) */
    readonly RESPECT_ROBOTS_TXT: true;
    /** Whether crawl-delay directive must be honored */
    readonly HONOR_CRAWL_DELAY: true;
};
/**
 * Default scan limits for verified domains
 */
export declare const VERIFIED_DOMAIN_DEFAULTS: {
    readonly MAX_PAGES: 100;
    readonly MIN_DELAY_MS: 500;
    readonly CONCURRENT_PAGES: 3;
};
/**
 * Current consent text version
 * Increment when consent text changes significantly
 */
export declare const CONSENT_VERSION = "1.0";
/**
 * Current Terms of Service version
 * Increment when ToS changes
 */
export declare const TOS_VERSION = "1.0";
/**
 * Consent text for unverified domain scanning
 * This text is shown to users before they scan an unverified domain
 */
export declare const UNVERIFIED_DOMAIN_CONSENT_TEXT: string;
/**
 * Brief consent text for the modal checkboxes
 */
export declare const CONSENT_CHECKBOX_TEXTS: {
    readonly AUTHORIZATION: "I have explicit authorization from the domain owner to scan this website";
    readonly LIABILITY: "I accept full responsibility for any consequences of this scan";
    readonly PERFORMANCE: "I understand this scan may impact the target website's performance";
};
/**
 * Generate a hash of the consent text for version tracking
 * This allows us to know exactly what text a user agreed to
 */
export declare function getConsentTextHash(version?: string): string;
/**
 * URLs for legal pages
 */
export declare const LEGAL_URLS: {
    readonly TERMS_OF_SERVICE: "/terms";
    readonly PRIVACY_POLICY: "/privacy";
};
/**
 * Domain verification token prefix
 */
export declare const VERIFICATION_TOKEN_PREFIX = "kritano-verify=";
/**
 * Well-known path for file-based verification
 */
export declare const VERIFICATION_FILE_PATH = "/.well-known/kritano-verify.txt";
/**
 * DNS TXT record subdomain for verification (alternative to root domain)
 */
export declare const VERIFICATION_DNS_SUBDOMAIN = "_kritano";
/**
 * Verification attempt limits
 */
export declare const VERIFICATION_LIMITS: {
    /** Maximum verification attempts before cooldown */
    readonly MAX_ATTEMPTS: 10;
    /** Cooldown period in milliseconds (1 hour) */
    readonly COOLDOWN_MS: number;
    /** Timeout for file verification fetch in milliseconds */
    readonly FILE_FETCH_TIMEOUT_MS: 5000;
    /** DNS query timeout in milliseconds */
    readonly DNS_TIMEOUT_MS: 10000;
};
/**
 * Scanner identification information
 * Users can whitelist these in their WAF/firewall
 */
export declare const SCANNER_INFO: {
    /** User-Agent string used by the scanner */
    readonly USER_AGENT: "KritanoBot/1.0 (+https://kritano.com/bot)";
    /** Scanner bot info URL */
    readonly BOT_INFO_URL: "https://kritano.com/bot";
    /**
     * Outbound IP addresses used by the scanner
     * Configure via SCANNER_IPS environment variable (comma-separated)
     * Falls back to these defaults if not set
     */
    readonly IPS: string[];
    /** Header name for verification token */
    readonly VERIFICATION_HEADER: "X-Kritano-Token";
};
/**
 * Rate limit profiles for verified domains
 * Domain owners can choose based on their server capacity
 */
export declare const RATE_LIMIT_PROFILES: {
    /** Conservative - safest option, minimal server impact */
    readonly conservative: {
        readonly label: "Conservative";
        readonly description: "Safest option - minimal impact on your server";
        readonly minDelayMs: 1500;
        readonly maxDelayMs: 3000;
        readonly requestsPerSecond: 0.7;
        readonly concurrentPages: 1;
    };
    /** Normal - balanced speed and safety */
    readonly normal: {
        readonly label: "Normal";
        readonly description: "Balanced speed - suitable for most servers";
        readonly minDelayMs: 500;
        readonly maxDelayMs: 1500;
        readonly requestsPerSecond: 2;
        readonly concurrentPages: 2;
    };
    /** Aggressive - faster crawling for robust servers */
    readonly aggressive: {
        readonly label: "Aggressive";
        readonly description: "Faster crawling - only for robust servers";
        readonly minDelayMs: 100;
        readonly maxDelayMs: 500;
        readonly requestsPerSecond: 5;
        readonly concurrentPages: 4;
    };
};
export type RateLimitProfile = keyof typeof RATE_LIMIT_PROFILES;
/**
 * Cookie consent version
 * Increment when consent categories or text change to re-prompt users
 */
export declare const COOKIE_CONSENT_VERSION = "1.0";
/**
 * Cookie category definitions for the consent banner
 */
export declare const COOKIE_CATEGORIES: {
    readonly necessary: {
        readonly label: "Strictly Necessary";
        readonly description: "Essential for the website to function. These cookies enable core features like security, authentication, and accessibility. They cannot be disabled.";
        readonly required: true;
        readonly cookies: readonly ["access_token", "refresh_token", "csrf_token"];
    };
    readonly analytics: {
        readonly label: "Analytics";
        readonly description: "Help us understand how visitors interact with our website by collecting anonymous usage data. This helps us improve Kritano for everyone.";
        readonly required: false;
        readonly cookies: readonly ["_ga", "_gid", "_gat"];
    };
    readonly marketing: {
        readonly label: "Marketing";
        readonly description: "Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns. These cookies may be set by third-party advertising partners.";
        readonly required: false;
        readonly cookies: readonly ["_fbp", "_gcl_au"];
    };
};
export type CookieCategory = keyof typeof COOKIE_CATEGORIES;
//# sourceMappingURL=consent.constants.d.ts.map