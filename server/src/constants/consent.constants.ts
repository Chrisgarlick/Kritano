import { createHash } from 'crypto';

/**
 * Scan limits for unverified domains
 * These are enforced to protect both the target site and our liability
 */
export const UNVERIFIED_DOMAIN_LIMITS = {
  /** Maximum pages that can be crawled */
  MAX_PAGES: 3,
  /** Minimum delay between requests in milliseconds */
  MIN_DELAY_MS: 2500,
  /** Maximum delay between requests in milliseconds */
  MAX_DELAY_MS: 5000,
  /** Requests per second limit */
  REQUESTS_PER_SECOND: 0.4,
  /** Number of concurrent pages (1 = sequential only) */
  CONCURRENT_PAGES: 1,
  /** Whether robots.txt must be respected (always true for unverified) */
  RESPECT_ROBOTS_TXT: true,
  /** Whether crawl-delay directive must be honored */
  HONOR_CRAWL_DELAY: true,
} as const;

/**
 * Default scan limits for verified domains
 */
export const VERIFIED_DOMAIN_DEFAULTS = {
  MAX_PAGES: 100,
  MIN_DELAY_MS: 500,
  CONCURRENT_PAGES: 3,
} as const;

/**
 * Current consent text version
 * Increment when consent text changes significantly
 */
export const CONSENT_VERSION = '1.0';

/**
 * Current Terms of Service version
 * Increment when ToS changes
 */
export const TOS_VERSION = '1.0';

/**
 * Consent text for unverified domain scanning
 * This text is shown to users before they scan an unverified domain
 */
export const UNVERIFIED_DOMAIN_CONSENT_TEXT = `
IMPORTANT: You are about to scan a domain that is not verified as belonging to your organization.

By proceeding, you acknowledge and agree that:

1. You have explicit authorization from the domain owner to perform this scan.
2. You understand that web scanning may impact the target website's performance or availability.
3. You accept full responsibility for any consequences resulting from this scan.
4. This scan will be limited to ${UNVERIFIED_DOMAIN_LIMITS.MAX_PAGES} pages maximum with reduced crawl speed for safety.

Kritano and its operators are not liable for any damages, downtime, or issues that may arise from scanning domains you do not own or have explicit authorization to scan.

Unauthorized scanning of websites may violate computer access laws in your jurisdiction.
`.trim();

/**
 * Brief consent text for the modal checkboxes
 */
export const CONSENT_CHECKBOX_TEXTS = {
  AUTHORIZATION: 'I have explicit authorization from the domain owner to scan this website',
  LIABILITY: 'I accept full responsibility for any consequences of this scan',
  PERFORMANCE: 'I understand this scan may impact the target website\'s performance',
} as const;

/**
 * Generate a hash of the consent text for version tracking
 * This allows us to know exactly what text a user agreed to
 */
export function getConsentTextHash(version: string = CONSENT_VERSION): string {
  const text = UNVERIFIED_DOMAIN_CONSENT_TEXT + version;
  return createHash('sha256').update(text).digest('hex').substring(0, 64);
}

/**
 * URLs for legal pages
 */
export const LEGAL_URLS = {
  TERMS_OF_SERVICE: '/terms',
  PRIVACY_POLICY: '/privacy',
} as const;

/**
 * Domain verification token prefix
 */
export const VERIFICATION_TOKEN_PREFIX = 'kritano-verify=';

/**
 * Legacy verification token prefix (pre-rebrand)
 * Kept for backward compatibility with existing verified domains
 */
export const LEGACY_VERIFICATION_TOKEN_PREFIX = 'pagepulser-verify=';

/**
 * Well-known path for file-based verification
 */
export const VERIFICATION_FILE_PATH = '/.well-known/kritano-verify.txt';

/**
 * Legacy well-known path (pre-rebrand)
 */
export const LEGACY_VERIFICATION_FILE_PATH = '/.well-known/pagepulser-verify.txt';

/**
 * DNS TXT record subdomain for verification (alternative to root domain)
 */
export const VERIFICATION_DNS_SUBDOMAIN = '_kritano';

/**
 * Legacy DNS subdomain (pre-rebrand)
 */
export const LEGACY_VERIFICATION_DNS_SUBDOMAIN = '_pagepulser';

/**
 * Verification attempt limits
 */
export const VERIFICATION_LIMITS = {
  /** Maximum verification attempts before cooldown */
  MAX_ATTEMPTS: 10,
  /** Cooldown period in milliseconds (1 hour) */
  COOLDOWN_MS: 60 * 60 * 1000,
  /** Timeout for file verification fetch in milliseconds */
  FILE_FETCH_TIMEOUT_MS: 5000,
  /** DNS query timeout in milliseconds */
  DNS_TIMEOUT_MS: 10000,
} as const;

/**
 * Scanner identification information
 * Users can whitelist these in their WAF/firewall
 */
export const SCANNER_INFO = {
  /** User-Agent string used by the scanner */
  USER_AGENT: 'KritanoBot/1.0 (+https://kritano.com/bot)',
  /** Scanner bot info URL */
  BOT_INFO_URL: 'https://kritano.com/bot',
  /**
   * Outbound IP addresses used by the scanner
   * Configure via SCANNER_IPS environment variable (comma-separated)
   * Falls back to these defaults if not set
   */
  get IPS(): string[] {
    const envIps = process.env.SCANNER_IPS;
    if (envIps) {
      return envIps.split(',').map(ip => ip.trim()).filter(Boolean);
    }
    // Default/placeholder - update with actual server IPs
    return ['YOUR_SERVER_IP'];
  },
  /** Header name for verification token */
  VERIFICATION_HEADER: 'X-Kritano-Token',
} as const;

/**
 * Rate limit profiles for verified domains
 * Domain owners can choose based on their server capacity
 */
export const RATE_LIMIT_PROFILES = {
  /** Conservative - safest option, minimal server impact */
  conservative: {
    label: 'Conservative',
    description: 'Safest option - minimal impact on your server',
    minDelayMs: 1500,
    maxDelayMs: 3000,
    requestsPerSecond: 0.7,
    concurrentPages: 1,
  },
  /** Normal - balanced speed and safety */
  normal: {
    label: 'Normal',
    description: 'Balanced speed - suitable for most servers',
    minDelayMs: 500,
    maxDelayMs: 1500,
    requestsPerSecond: 2,
    concurrentPages: 2,
  },
  /** Aggressive - faster crawling for robust servers */
  aggressive: {
    label: 'Aggressive',
    description: 'Faster crawling - only for robust servers',
    minDelayMs: 100,
    maxDelayMs: 500,
    requestsPerSecond: 5,
    concurrentPages: 4,
  },
} as const;

export type RateLimitProfile = keyof typeof RATE_LIMIT_PROFILES;

/**
 * Cookie consent version
 * Increment when consent categories or text change to re-prompt users
 */
export const COOKIE_CONSENT_VERSION = '1.0';

/**
 * Cookie category definitions for the consent banner
 */
export const COOKIE_CATEGORIES = {
  necessary: {
    label: 'Strictly Necessary',
    description: 'Essential for the website to function. These cookies enable core features like security, authentication, and accessibility. They cannot be disabled.',
    required: true,
    cookies: ['access_token', 'refresh_token', 'csrf_token'],
  },
  analytics: {
    label: 'Analytics',
    description: 'Help us understand how visitors interact with our website by collecting anonymous usage data. This helps us improve Kritano for everyone.',
    required: false,
    cookies: ['_ga', '_gid', '_gat'],
  },
  marketing: {
    label: 'Marketing',
    description: 'Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns. These cookies may be set by third-party advertising partners.',
    required: false,
    cookies: ['_fbp', '_gcl_au'],
  },
} as const;

export type CookieCategory = keyof typeof COOKIE_CATEGORIES;
