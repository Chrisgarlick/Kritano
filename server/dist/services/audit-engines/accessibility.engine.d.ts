import { Page } from 'playwright';
import type { AccessibilityFinding } from '../../types/finding.types';
import type { WcagVersion, WcagLevel } from '../../types/audit.types';
export interface WcagConfig {
    version: WcagVersion;
    level: WcagLevel;
}
export declare class AccessibilityEngine {
    private wcagConfig;
    constructor(wcagConfig?: WcagConfig);
    /**
     * Analyze a page for accessibility issues using axe-core
     * Note: This requires a Playwright Page object, not just HTML
     */
    analyze(page: Page): Promise<AccessibilityFinding[]>;
    /**
     * Get WCAG tags based on version and level configuration
     */
    private getWcagTags;
    /**
     * Inject axe-core into the page
     */
    private injectAxe;
    /**
     * Run axe-core analysis on the page
     */
    private runAxe;
    /**
     * Map axe-core results to our finding format
     */
    private mapResults;
    /**
     * Create a finding from an axe-core violation
     */
    private createFinding;
    /**
     * Extract contrast ratio data from axe-core node checks (#19)
     */
    private extractContrastData;
    /**
     * Map axe-core impact to our severity levels
     */
    private mapSeverity;
    /**
     * Extract WCAG criteria from axe tags
     */
    private extractWcagCriteria;
    /**
     * Get human-readable recommendation for common violations
     */
    private getRecommendation;
    /**
     * Get statistics about accessibility findings
     */
    static getStats(findings: AccessibilityFinding[]): {
        total: number;
        bySeverity: Record<string, number>;
        byWcagLevel: Record<string, number>;
    };
}
/**
 * Create an accessibility engine instance
 */
export declare function createAccessibilityEngine(wcagConfig?: WcagConfig): AccessibilityEngine;
//# sourceMappingURL=accessibility.engine.d.ts.map