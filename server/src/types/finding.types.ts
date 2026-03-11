// Finding severity levels (aligned with axe-core)
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor' | 'info';

// Finding category
export type FindingCategory = 'seo' | 'accessibility' | 'security' | 'performance' | 'content' | 'structured-data';

// Base finding interface
export interface BaseFinding {
  ruleId: string;
  ruleName: string;
  category: FindingCategory;
  severity: Severity;
  message: string;
  description?: string;
  recommendation?: string;
  selector?: string;
  lineNumber?: number;
  columnNumber?: number;
  snippet?: string;
  helpUrl?: string;
}

// SEO finding
export interface SeoFinding extends BaseFinding {
  category: 'seo';
}

// Accessibility finding (with axe-core fields)
export interface AccessibilityFinding extends BaseFinding {
  category: 'accessibility';
  impact?: string;
  wcagCriteria?: string[];
}

// Security finding
export interface SecurityFinding extends BaseFinding {
  category: 'security';
}

// Performance finding
export interface PerformanceFinding extends BaseFinding {
  category: 'performance';
  metricValue?: number;
  threshold?: number;
}

// Content finding
export interface ContentFinding extends BaseFinding {
  category: 'content';
}

// Structured data finding
export interface StructuredDataFinding extends BaseFinding {
  category: 'structured-data';
  schemaType?: string;  // e.g., "Organization", "Article", "Product"
  property?: string;    // property that had the issue
}

// Union type for all findings
export type Finding = SeoFinding | AccessibilityFinding | SecurityFinding | PerformanceFinding | ContentFinding | StructuredDataFinding;

// Finding status for dismiss/acknowledge functionality
export type FindingStatus = 'active' | 'dismissed' | 'acknowledged';

// Database record for findings
export interface AuditFinding {
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
  line_number: number | null;
  column_number: number | null;
  snippet: string | null;
  impact: string | null;
  wcag_criteria: string[] | null;
  help_url: string | null;
  status: FindingStatus;
  created_at: Date;
}

// Findings filter for API
export interface FindingsFilter {
  category?: FindingCategory;
  severity?: Severity;
  ruleId?: string;
  pageId?: string;
  page?: number;
  limit?: number;
}

// Findings summary
export interface FindingsSummary {
  total: number;
  bySeverity: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    info: number;
  };
  byCategory: {
    seo: number;
    accessibility: number;
    security: number;
    performance: number;
    content: number;
    'structured-data': number;
  };
}

// Rule definition for engines
export interface AuditRule<T = BaseFinding> {
  id: string;
  name: string;
  description: string;
  category: FindingCategory;
  severity: Severity;
  helpUrl?: string;
  check: RuleCheckFunction<T>;
}

// Rule check function signature
export type RuleCheckFunction<T> = (
  context: RuleContext
) => T | T[] | null | Promise<T | T[] | null>;

// Context passed to rule checks
export interface RuleContext {
  url: string;
  html: string;
  $: cheerio.CheerioAPI;
  headers: Record<string, string>;
  statusCode: number;
  responseTimeMs: number;
  cookies: Array<{
    name: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: string | null;
  }>;
  resources: Array<{
    url: string;
    type: string;
    size: number;
    loadTimeMs: number;
  }>;
}

// Type import declaration for cheerio
declare namespace cheerio {
  interface CheerioAPI {
    // Minimal type declaration
    (selector: string): any;
    html(): string;
    load(html: string): CheerioAPI;
  }
}
