import type { SecurityFinding } from '../../types/finding.types';
import type { CrawlResult } from '../../types/spider.types';
export declare class SecurityEngine {
    private rules;
    /**
     * Analyze a page for security issues
     */
    analyze(crawlResult: CrawlResult): Promise<SecurityFinding[]>;
    /**
     * Probe for exposed sensitive files
     * Note: This should be called once per audit, not per page
     */
    probeExposedFiles(baseUrl: string, timeoutMs?: number): Promise<SecurityFinding[]>;
    /**
     * Check for security.txt presence (#21)
     */
    private checkSecurityTxt;
    /**
     * Check SSL/TLS certificate (#24)
     */
    private checkSslCertificate;
    /**
     * Create a standardized finding
     */
    private createFinding;
}
/**
 * Create a security engine instance
 */
export declare function createSecurityEngine(): SecurityEngine;
//# sourceMappingURL=security.engine.d.ts.map