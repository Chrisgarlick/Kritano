import type { SecurityFinding, Severity } from '../types/finding.types';
import type { RobotsParserService } from './spider/robots-parser.service';
interface GoogleSearchItem {
    title: string;
    link: string;
    snippet: string;
    displayLink: string;
}
type ExposureCategory = 'config-file' | 'env-file' | 'database' | 'git' | 'log-file' | 'admin-panel' | 'login-page' | 'phpinfo' | 'staging' | 'dev-environment' | 'backup' | 'debug' | 'unknown';
interface ClassifiedResult {
    url: string;
    title: string;
    snippet: string;
    category: ExposureCategory;
    severity: Severity;
}
export declare class GoogleIndexExposureService {
    private apiKey;
    private cseId;
    constructor();
    /**
     * Check if the service is configured with valid API credentials
     */
    isConfigured(): boolean;
    /**
     * Scan a domain for indexed sensitive URLs via Google Custom Search API
     * Uses 2 queries to cover all dork categories
     */
    scanDomain(domain: string): Promise<GoogleSearchItem[]>;
    /**
     * Execute a single Google Custom Search query scoped to a domain
     */
    private executeQuery;
    /**
     * Classify a search result URL into a category and severity
     */
    classifyResult(url: string, title: string): ClassifiedResult & {
        url: string;
    };
    /**
     * Explain why a URL may have been indexed, using robots.txt data
     */
    explainWithRobots(url: string, robotsParser: RobotsParserService | null): string;
    /**
     * Convert Google search results into SecurityFinding objects
     */
    convertToFindings(items: GoogleSearchItem[], robotsParser: RobotsParserService | null): SecurityFinding[];
}
export declare function createGoogleIndexExposureService(): GoogleIndexExposureService;
export {};
//# sourceMappingURL=google-index-exposure.service.d.ts.map