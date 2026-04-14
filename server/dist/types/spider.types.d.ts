export interface SpiderConfig {
    maxPages: number;
    maxDepth: number;
    maxConcurrentPages: number;
    requestDelayMs: number;
    timeoutMs: number;
    respectRobotsTxt: boolean;
    includeSubdomains: boolean;
    userAgent: string;
    /** Custom headers to send with each request (e.g., verification tokens) */
    customHeaders?: Record<string, string>;
}
export declare const DEFAULT_SPIDER_CONFIG: SpiderConfig;
export type DeviceType = 'desktop' | 'mobile';
export interface CrawlResult {
    url: string;
    normalizedUrl: string;
    statusCode: number;
    contentType: string;
    responseTimeMs: number;
    /** Time to First Byte - actual server response time from Navigation Timing API */
    ttfbMs: number;
    pageSizeBytes: number;
    html: string;
    title: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    canonicalUrl: string | null;
    h1Text: string | null;
    wordCount: number;
    links: DiscoveredLink[];
    resources: ResourceInfo[];
    headers: Record<string, string>;
    cookies: CookieInfo[];
    redirectChain: RedirectHop[];
    deviceType: DeviceType;
    viewport: {
        width: number;
        height: number;
    };
}
export interface RedirectHop {
    url: string;
    statusCode: number;
}
export interface DiscoveredLink {
    href: string;
    text: string;
    isExternal: boolean;
    isNoFollow: boolean;
    rel: string | null;
}
export interface ResourceInfo {
    url: string;
    type: ResourceType;
    size: number;
    loadTimeMs: number;
    mimeType: string;
    status: number;
}
export type ResourceType = 'script' | 'stylesheet' | 'image' | 'font' | 'media' | 'other';
export interface CookieInfo {
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'Strict' | 'Lax' | 'None' | null;
    expires: Date | null;
}
export interface CrawlQueueItem {
    id: string;
    auditJobId: string;
    url: string;
    urlHash: string;
    depth: number;
    discoveredFrom: string | null;
    priority: number;
    createdAt: Date;
}
export interface RobotsTxtRules {
    allowedPaths: string[];
    disallowedPaths: string[];
    crawlDelay: number | null;
    sitemaps: string[];
}
export interface UrlValidation {
    isValid: boolean;
    normalizedUrl: string | null;
    error?: string;
    isInScope?: boolean;
}
export type SpiderEvent = {
    type: 'sitemap_discovery_started';
} | {
    type: 'sitemap_discovery_completed';
    urlsFound: number;
    sitemapsProcessed: number;
} | {
    type: 'page_discovered';
    url: string;
    depth: number;
} | {
    type: 'page_started';
    url: string;
} | {
    type: 'page_completed';
    url: string;
    statusCode: number;
    responseTimeMs: number;
} | {
    type: 'page_failed';
    url: string;
    error: string;
} | {
    type: 'page_skipped';
    url: string;
    reason: string;
} | {
    type: 'audit_started';
    url: string;
} | {
    type: 'audit_completed';
    url: string;
    findingsCount: number;
} | {
    type: 'spider_completed';
    pagesTotal: number;
    pagesFailed: number;
};
export type ProgressCallback = (event: SpiderEvent) => void;
//# sourceMappingURL=spider.types.d.ts.map