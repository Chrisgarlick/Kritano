/**
 * User Agent Rotation Service
 *
 * Provides realistic, rotating user agents to avoid fingerprinting
 * and make requests appear to come from different browsers.
 */
export interface UserAgentConfig {
    userAgent: string;
    platform: string;
    mobile: boolean;
    brands: Array<{
        brand: string;
        version: string;
    }>;
}
/**
 * Common viewport sizes for different device types
 */
export declare const VIEWPORTS: {
    desktop: {
        width: number;
        height: number;
    }[];
    mobile: {
        width: number;
        height: number;
    }[];
};
/**
 * Get a random user agent configuration
 */
export declare function getRandomUserAgent(type?: 'desktop' | 'mobile'): UserAgentConfig;
/**
 * Get a random viewport size
 */
export declare function getRandomViewport(type?: 'desktop' | 'mobile'): {
    width: number;
    height: number;
};
/**
 * Get random accept-language header
 */
export declare function getRandomAcceptLanguage(): string;
/**
 * Get randomized HTTP headers for a request
 */
export declare function getRandomHeaders(userAgentConfig: UserAgentConfig): Record<string, string>;
/**
 * Generate a complete browser fingerprint for a session
 */
export interface BrowserFingerprint {
    userAgent: UserAgentConfig;
    viewport: {
        width: number;
        height: number;
    };
    headers: Record<string, string>;
    locale: string;
    timezone: string;
}
/**
 * Generate a complete, consistent browser fingerprint
 */
export declare function generateFingerprint(type?: 'desktop' | 'mobile'): BrowserFingerprint;
//# sourceMappingURL=user-agents.service.d.ts.map