export type AuditJobStatus = 'pending' | 'discovering' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type WcagVersion = '2.1' | '2.2';
export type WcagLevel = 'A' | 'AA' | 'AAA';
export interface AuditJob {
    id: string;
    user_id: string;
    organization_id: string | null;
    site_id: string | null;
    url_id: string | null;
    competitor_profile_id: string | null;
    target_url: string;
    target_domain: string;
    max_pages: number;
    max_depth: number;
    respect_robots_txt: boolean;
    include_subdomains: boolean;
    check_seo: boolean;
    check_accessibility: boolean;
    check_security: boolean;
    check_performance: boolean;
    check_content: boolean;
    check_structured_data: boolean;
    check_file_extraction: boolean;
    wcag_version: WcagVersion;
    wcag_level: WcagLevel;
    include_mobile: boolean;
    status: AuditJobStatus;
    pages_found: number;
    pages_crawled: number;
    pages_audited: number;
    current_url: string | null;
    started_at: Date | null;
    completed_at: Date | null;
    total_issues: number;
    critical_issues: number;
    seo_score: number | null;
    accessibility_score: number | null;
    security_score: number | null;
    performance_score: number | null;
    content_score: number | null;
    structured_data_score: number | null;
    cqs_score: number | null;
    mobile_accessibility_score: number | null;
    mobile_performance_score: number | null;
    error_message: string | null;
    retry_count: number;
    worker_id: string | null;
    locked_at: Date | null;
    unverified_mode: boolean;
    created_at: Date;
    updated_at: Date;
}
export type AuditPageStatus = 'pending' | 'crawling' | 'crawled' | 'failed' | 'skipped';
export interface KeywordData {
    keyword: string;
    density: number;
    occurrences: number;
    inTitle: boolean;
    inH1: boolean;
    inFirstParagraph: boolean;
    inMetaDescription: boolean;
    inUrl: boolean;
    inAltText: boolean;
    inLastParagraph: boolean;
    variationsUsed: string[];
    isStuffed: boolean;
}
export interface AuditPage {
    id: string;
    audit_job_id: string;
    url: string;
    url_hash: string;
    depth: number;
    discovered_from: string | null;
    status_code: number | null;
    content_type: string | null;
    response_time_ms: number | null;
    page_size_bytes: number | null;
    title: string | null;
    meta_description: string | null;
    canonical_url: string | null;
    h1_text: string | null;
    word_count: number | null;
    crawl_status: AuditPageStatus;
    crawled_at: Date | null;
    error_message: string | null;
    seo_score: number | null;
    accessibility_score: number | null;
    security_score: number | null;
    performance_score: number | null;
    content_score: number | null;
    structured_data_score: number | null;
    cqs_score: number | null;
    content_quality_score: number | null;
    content_readability_score: number | null;
    content_structure_score: number | null;
    content_engagement_score: number | null;
    flesch_kincaid_grade: number | null;
    flesch_reading_ease: number | null;
    reading_time_minutes: number | null;
    detected_content_type: string | null;
    keyword_data: KeywordData | null;
    seo_issues: number;
    accessibility_issues: number;
    security_issues: number;
    performance_issues: number;
    content_issues: number;
    structured_data_issues: number;
    json_ld_count: number;
    has_open_graph: boolean;
    has_twitter_card: boolean;
    detected_schema_types: string[] | null;
    detected_page_type: string | null;
    created_at: Date;
}
export interface StartAuditInput {
    targetUrl: string;
    siteId?: string;
    options?: {
        maxPages?: number;
        maxDepth?: number;
        respectRobotsTxt?: boolean;
        includeSubdomains?: boolean;
        checkSeo?: boolean;
        checkAccessibility?: boolean;
        checkSecurity?: boolean;
        checkPerformance?: boolean;
        checkContent?: boolean;
        checkStructuredData?: boolean;
        wcagVersion?: WcagVersion;
        wcagLevel?: WcagLevel;
        targetKeyword?: string;
        includeMobile?: boolean;
    };
}
export interface AuditProgress {
    status: AuditJobStatus;
    pagesFound: number;
    pagesCrawled: number;
    pagesAudited: number;
    currentUrl: string | null;
    totalIssues: number;
    criticalIssues: number;
    seoScore: number | null;
    accessibilityScore: number | null;
    securityScore: number | null;
    performanceScore: number | null;
    contentScore: number | null;
    structuredDataScore: number | null;
    estimatedTimeRemaining: number | null;
}
export interface AuditSummary {
    audit: AuditJob;
    findings: {
        bySeverity: Record<string, number>;
        byCategory: Record<string, number>;
        total: number;
    };
    pages: {
        total: number;
        crawled: number;
        failed: number;
    };
}
export interface ScoreCalculationInput {
    totalChecks: number;
    criticalIssues: number;
    seriousIssues: number;
    moderateIssues: number;
    minorIssues: number;
}
//# sourceMappingURL=audit.types.d.ts.map