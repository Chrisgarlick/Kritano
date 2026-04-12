/**
 * Wait Strategies Service
 *
 * Smart waiting logic for different types of pages including
 * SPAs, lazy-loaded content, and JavaScript-heavy sites.
 */
import type { Page } from 'playwright';
/**
 * SPA framework detection results
 */
export interface SPADetectionResult {
    isSPA: boolean;
    framework: string | null;
    confidence: 'high' | 'medium' | 'low';
}
/**
 * Detect if page is an SPA
 * Note: Uses simple inline checks to avoid esbuild __name helper issues in browser context
 */
export declare function detectSPA(page: Page): Promise<SPADetectionResult>;
/**
 * Wait for DOM to stabilize (content stops changing)
 * Note: Uses string-based function to avoid esbuild __name helper issues
 */
export declare function waitForDOMStability(page: Page, options?: {
    checkIntervalMs?: number;
    stableChecks?: number;
    maxWaitMs?: number;
}): Promise<void>;
/**
 * Wait for loading indicators to disappear
 */
export declare function waitForLoadingIndicators(page: Page, options?: {
    selectors?: string[];
    timeoutMs?: number;
}): Promise<void>;
/**
 * Wait for images to load
 * Note: Uses string-based function to avoid esbuild __name helper issues
 */
export declare function waitForImages(page: Page, options?: {
    selector?: string;
    timeoutMs?: number;
}): Promise<void>;
/**
 * Wait for lazy-loaded content
 * Note: Uses string-based function to avoid esbuild __name helper issues
 */
export declare function waitForLazyContent(page: Page): Promise<void>;
/**
 * Smart wait - combines multiple strategies
 */
export declare function smartWait(page: Page, options?: {
    waitForNetworkIdle?: boolean;
    waitForDOMStability?: boolean;
    waitForLoadingIndicators?: boolean;
    waitForImages?: boolean;
    detectSPA?: boolean;
    maxWaitMs?: number;
}): Promise<{
    isSPA: boolean;
    framework: string | null;
    waitTimeMs: number;
}>;
/**
 * Wait specifically for SPA content to render
 */
export declare function waitForSPAContent(page: Page, options?: {
    framework?: string;
    maxWaitMs?: number;
}): Promise<void>;
//# sourceMappingURL=wait-strategies.service.d.ts.map