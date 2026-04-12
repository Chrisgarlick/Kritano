export type Severity = 'critical' | 'serious' | 'moderate' | 'minor' | 'info';
export type FindingCategory = 'seo' | 'accessibility' | 'security' | 'performance' | 'content' | 'structured-data';
export type FindingDeviceType = 'desktop' | 'mobile' | 'both';
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
    deviceType?: FindingDeviceType;
}
export interface SeoFinding extends BaseFinding {
    category: 'seo';
}
export interface AccessibilityFinding extends BaseFinding {
    category: 'accessibility';
    impact?: string;
    wcagCriteria?: string[];
}
export interface SecurityFinding extends BaseFinding {
    category: 'security';
}
export interface PerformanceFinding extends BaseFinding {
    category: 'performance';
    metricValue?: number;
    threshold?: number;
}
export interface ContentFinding extends BaseFinding {
    category: 'content';
}
export interface StructuredDataFinding extends BaseFinding {
    category: 'structured-data';
    schemaType?: string;
    property?: string;
}
export type Finding = SeoFinding | AccessibilityFinding | SecurityFinding | PerformanceFinding | ContentFinding | StructuredDataFinding;
export type FindingStatus = 'active' | 'dismissed' | 'acknowledged';
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
    device_type: FindingDeviceType;
    status: FindingStatus;
    created_at: Date;
}
export interface FindingsFilter {
    category?: FindingCategory;
    severity?: Severity;
    ruleId?: string;
    pageId?: string;
    deviceType?: FindingDeviceType;
    page?: number;
    limit?: number;
}
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
export interface AuditRule<T = BaseFinding> {
    id: string;
    name: string;
    description: string;
    category: FindingCategory;
    severity: Severity;
    helpUrl?: string;
    check: RuleCheckFunction<T>;
}
export type RuleCheckFunction<T> = (context: RuleContext) => T | T[] | null | Promise<T | T[] | null>;
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
declare namespace cheerio {
    interface CheerioAPI {
        (selector: string): any;
        html(): string;
        load(html: string): CheerioAPI;
    }
}
export {};
//# sourceMappingURL=finding.types.d.ts.map