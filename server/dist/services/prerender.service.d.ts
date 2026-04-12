/**
 * Pre-rendering service for SEO/bot user agents.
 *
 * Renders SPA pages with headless Chrome via Puppeteer and caches the
 * resulting HTML so that crawlers (Googlebot, GPTBot, Bingbot, etc.)
 * see fully rendered content including structured data, meta tags,
 * and semantic HTML.
 *
 * - In-memory LRU cache with configurable TTL
 * - Single browser instance reused across requests
 * - Only renders public pages (not /dashboard, /admin, etc.)
 */
export declare function clearPrerenderCache(): void;
export declare function shutdownPrerenderBrowser(): Promise<void>;
export declare function shouldPrerender(path: string): boolean;
export declare function renderPage(urlPath: string): Promise<string | null>;
//# sourceMappingURL=prerender.service.d.ts.map