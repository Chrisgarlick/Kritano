/**
 * Shared SSR Service
 *
 * Common functions used by all SSR renderers (blog, public pages).
 * Provides the HTML shell, navigation, footer, author bio, and utilities.
 */
import type { Response } from 'express';
export declare const VITE_CSS_PATH: string | null;
export declare const BASE_URL: string;
export declare function escapeHtml(text: string): string;
export declare function setSsrHeaders(res: Response): void;
export declare function htmlShell(opts: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImage: string;
    ogType: string;
    extraHead: string;
    body: string;
    activePath?: string;
}): string;
export declare function renderNav(activePath?: string): string;
export declare function renderFooter(): string;
export declare function renderAuthorBio(): string;
//# sourceMappingURL=ssr-shared.service.d.ts.map