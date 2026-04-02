// Audit job status
export type AuditStatus = 'pending' | 'discovering' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Severity levels
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor' | 'info';

// Finding category
export type FindingCategory = 'seo' | 'accessibility' | 'security' | 'performance' | 'content' | 'content-eeat' | 'content-aeo' | 'structured-data';

// Error summary from crawl
export interface ErrorSummary {
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

// Audit job from API
export interface Audit {
  id: string;
  target_url: string;
  target_domain: string;
  status: AuditStatus;
  pages_found: number;
  pages_crawled: number;
  pages_audited: number;
  current_url: string | null;
  total_issues: number;
  critical_issues: number;
  seo_score: number | null;
  accessibility_score: number | null;
  security_score: number | null;
  performance_score: number | null;
  content_score: number | null;
  structured_data_score: number | null;
  cqs_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  error_message?: string | null;
  // Error tracking
  pages_blocked?: number;
  pages_timeout?: number;
  pages_server_error?: number;
  error_summary?: ErrorSummary | null;
  // Site/Competitor linking
  site_id?: string | null;
  is_competitor?: boolean;
  competitor_profile_id?: string | null;
  check_file_extraction?: boolean;
  // Mobile audit
  include_mobile?: boolean;
  mobile_accessibility_score?: number | null;
  mobile_performance_score?: number | null;
  // Queue info (from SSE)
  queue_position?: number | null;
  estimated_wait_seconds?: number | null;
}

// Fix snippet attached to findings (Starter+ tiers get code, Free gets explanation only)
export interface FixSnippet {
  fixType: 'code' | 'config' | 'content' | 'manual';
  language: 'html' | 'css' | 'javascript' | 'json' | 'config' | 'text';
  code?: string;
  explanation: string;
  effort: 'small' | 'medium' | 'large';
  learnMoreUrl: string;
}

// Audit finding from API
export interface Finding {
  id: string;
  audit_job_id: string;
  audit_page_id: string | null;
  category: FindingCategory;
  rule_id: string;
  rule_name: string;
  severity: Severity;
  message: string;
  description: string | null;
  recommendation: string | null;
  selector: string | null;
  snippet: string | null;
  impact: string | null;
  wcag_criteria: string[] | null;
  help_url: string | null;
  device_type?: 'desktop' | 'mobile' | 'both';
  status?: 'active' | 'dismissed';
  page_url?: string;
  fixSnippet?: FixSnippet;
  created_at: string;
}

// Audit page from API
export interface AuditPage {
  id: string;
  url: string;
  depth: number;
  status_code: number | null;
  content_type: string | null;
  response_time_ms: number | null;
  page_size_bytes: number | null;
  title: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  h1_text?: string | null;
  word_count?: number | null;
  crawl_status: string;
  error_message?: string | null;
  // Enhanced error tracking
  error_type?: string | null;
  error_category?: string | null;
  error_suggestion?: string | null;
  retry_count?: number;
  seo_score: number | null;
  accessibility_score: number | null;
  security_score: number | null;
  performance_score: number | null;
  content_score: number | null;
  structured_data_score: number | null;
  cqs_score?: number | null;
  // Mobile scores
  mobile_accessibility_score?: number | null;
  mobile_performance_score?: number | null;
  mobile_accessibility_issues?: number;
  mobile_performance_issues?: number;
  // Content subscores
  content_quality_score?: number | null;
  content_readability_score?: number | null;
  content_structure_score?: number | null;
  content_engagement_score?: number | null;
  // E-E-A-T metrics
  eeat_score?: number | null;
  eeat_experience_score?: number | null;
  eeat_expertise_score?: number | null;
  eeat_authoritativeness_score?: number | null;
  eeat_trustworthiness_score?: number | null;
  has_author_bio?: boolean | null;
  has_author_credentials?: boolean | null;
  citation_count?: number | null;
  has_contact_info?: boolean | null;
  has_privacy_policy?: boolean | null;
  has_terms_of_service?: boolean | null;
  eeat_tier?: string | null;
  eeat_evidence?: Array<{ pillar: string; type: string; label: string; text?: string }> | null;
  // AEO metrics
  aeo_score?: number | null;
  aeo_nugget_score?: number | null;
  aeo_factual_density_score?: number | null;
  aeo_source_authority_score?: number | null;
  aeo_tier?: string | null;
  aeo_nuggets?: Array<{ text: string; type: string; wordCount: number }> | null;
  aeo_content_frontloaded?: boolean | null;
  aeo_content_frontloading_ratio?: number | null;
  // Keyword analysis data
  keyword_data?: {
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
  } | null;
  // Content metrics
  flesch_kincaid_grade?: number | null;
  flesch_reading_ease?: number | null;
  reading_time_minutes?: number | null;
  detected_content_type?: string | null;
  seo_issues: number;
  accessibility_issues: number;
  security_issues: number;
  performance_issues: number;
  content_issues: number;
  structured_data_issues: number;
  // Structured data analysis
  json_ld_count?: number;
  has_open_graph?: boolean;
  has_twitter_card?: boolean;
  detected_schema_types?: string[] | null;
  detected_page_type?: string | null;
  crawled_at: string | null;
  created_at: string;
}

// Page detail response from API
export interface PageDetailResponse {
  page: AuditPage;
  findings: Finding[];
  findingsByCategory: Record<FindingCategory, Finding[]>;
  summary: FindingsSummary;
}

// WCAG types
export type WcagVersion = '2.1' | '2.2';
export type WcagLevel = 'A' | 'AA' | 'AAA';

// Start audit input
export interface StartAuditInput {
  targetUrl: string;
  siteId?: string;
  competitorProfileId?: string;
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
    checkFileExtraction?: boolean;
    wcagVersion?: WcagVersion;
    wcagLevel?: WcagLevel;
    targetKeyword?: string;
  };
}

// Activity log entry
export interface ActivityLogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// Audit progress from SSE
export interface AuditProgress {
  status: AuditStatus;
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
  activityLog: ActivityLogEntry[];
  queuePosition: number | null;
  estimatedWaitSeconds: number | null;
}

// Findings summary
export interface FindingsSummary {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}

// Pages summary
export interface PagesSummary {
  total: number;
  byStatus: Record<string, number>;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Asset types for file extraction
export type AssetCategory = 'image' | 'document' | 'video' | 'audio' | 'font' | 'stylesheet' | 'script' | 'other';

export interface AuditAsset {
  id: string;
  url: string;
  url_hash: string;
  asset_type: AssetCategory;
  mime_type: string | null;
  file_extension: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  source: 'network' | 'html' | 'both';
  http_status: number | null;
  page_count: number;
  created_at: string;
  // Page-level fields (from junction table)
  html_element?: string | null;
  html_attribute?: string | null;
}

export interface AssetTypeSummary {
  type: AssetCategory;
  count: number;
  totalSize: number;
}

export interface AssetsResponse {
  assets: AuditAsset[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
  summary: AssetTypeSummary[];
  totalAssets: number;
}

export interface AssetPageRef {
  id: string;
  url: string;
  title: string | null;
  html_element: string | null;
  html_attribute: string | null;
}
