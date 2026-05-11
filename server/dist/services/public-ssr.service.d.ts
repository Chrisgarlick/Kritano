/**
 * Public Pages SSR Service
 *
 * Renders public marketing pages as complete HTML documents server-side.
 * This ensures search engines, AI crawlers, and fetch tools see full content
 * without needing JavaScript execution.
 */
export declare function renderHomepage(): string;
export declare function renderAboutPage(): string;
export declare function renderServicesPage(): string;
export declare function renderServiceDetailPage(slug: string): string | null;
export declare function renderPricingPage(): string;
export declare function renderContactPage(): string;
export declare function renderFaqPage(): string;
export declare function renderAuthorPage(): string;
//# sourceMappingURL=public-ssr.service.d.ts.map