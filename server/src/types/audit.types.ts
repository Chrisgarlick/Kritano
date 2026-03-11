// Audit job status
export type AuditJobStatus = 'pending' | 'discovering' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled';

// WCAG types
export type WcagVersion = '2.1' | '2.2';
export type WcagLevel = 'A' | 'AA' | 'AAA';

// Audit job (database record)
export interface AuditJob {
  id: string;
  user_id: string;
  organization_id: string | null;
  site_id: string | null;
  url_id: string | null;
  competitor_profile_id: string | null;
  target_url: string;
  target_domain: string;

  // Crawl settings
  max_pages: number;
  max_depth: number;
  respect_robots_txt: boolean;
  include_subdomains: boolean;

  // Audit settings
  check_seo: boolean;
  check_accessibility: boolean;
  check_security: boolean;
  check_performance: boolean;
  check_content: boolean;
  check_structured_data: boolean;
  check_file_extraction: boolean;

  // WCAG settings
  wcag_version: WcagVersion;
  wcag_level: WcagLevel;

  // Job status
  status: AuditJobStatus;

  // Progress tracking
  pages_found: number;
  pages_crawled: number;
  pages_audited: number;
  current_url: string | null;

  // Timing
  started_at: Date | null;
  completed_at: Date | null;

  // Results summary
  total_issues: number;
  critical_issues: number;
  seo_score: number | null;
  accessibility_score: number | null;
  security_score: number | null;
  performance_score: number | null;
  content_score: number | null;
  structured_data_score: number | null;

  // Error handling
  error_message: string | null;
  retry_count: number;

  // Worker assignment
  worker_id: string | null;
  locked_at: Date | null;

  // Liability protection
  unverified_mode: boolean;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Audit page status
export type AuditPageStatus = 'pending' | 'crawling' | 'crawled' | 'failed' | 'skipped';

// Keyword analysis data (stored as JSONB in audit_pages)
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

// Audit page (database record)
export interface AuditPage {
  id: string;
  audit_job_id: string;
  url: string;
  url_hash: string;
  depth: number;
  discovered_from: string | null;

  // HTTP response info
  status_code: number | null;
  content_type: string | null;
  response_time_ms: number | null;
  page_size_bytes: number | null;

  // Page content
  title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  h1_text: string | null;
  word_count: number | null;

  // Crawl status
  crawl_status: AuditPageStatus;
  crawled_at: Date | null;
  error_message: string | null;

  // Scores for this page
  seo_score: number | null;
  accessibility_score: number | null;
  security_score: number | null;
  performance_score: number | null;
  content_score: number | null;
  structured_data_score: number | null;

  // Content subscores
  content_quality_score: number | null;
  content_readability_score: number | null;
  content_structure_score: number | null;
  content_engagement_score: number | null;

  // Content metrics
  flesch_kincaid_grade: number | null;
  flesch_reading_ease: number | null;
  reading_time_minutes: number | null;
  detected_content_type: string | null;

  // Keyword analysis data
  keyword_data: KeywordData | null;

  // Issue counts
  seo_issues: number;
  accessibility_issues: number;
  security_issues: number;
  performance_issues: number;
  content_issues: number;
  structured_data_issues: number;

  // Structured data analysis
  json_ld_count: number;
  has_open_graph: boolean;
  has_twitter_card: boolean;
  detected_schema_types: string[] | null;
  detected_page_type: string | null;

  // Timestamps
  created_at: Date;
}

// API input for starting an audit
export interface StartAuditInput {
  targetUrl: string;
  siteId?: string; // Link audit to a site
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
    targetKeyword?: string; // For content analysis keyword optimization
  };
}

// Audit progress for SSE
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

// Audit summary for API response
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

// Score calculation input
export interface ScoreCalculationInput {
  totalChecks: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
}
