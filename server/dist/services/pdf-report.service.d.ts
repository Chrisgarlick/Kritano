import type { ResolvedBranding } from './pdf-branding.service.js';
import type { AuditJob } from '../types/audit.types.js';
import type { AuditFinding } from '../types/finding.types.js';
export interface ResolvedFixSnippetForPdf {
    fixType: string;
    language: string;
    code: string;
    explanation: string;
    effort: string;
    learnMoreUrl: string;
}
export interface ComplianceDataForPdf {
    status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
    standard: string;
    summary: {
        totalClauses: number;
        passing: number;
        failing: number;
        manualReview: number;
        notTested: number;
    };
    clauses: Array<{
        clause: string;
        title: string;
        wcagCriteria: string;
        status: 'pass' | 'fail' | 'manual_review' | 'not_tested';
        issueCount: number;
    }>;
    domain: string;
    pagesAudited: number;
}
export interface UnverifiableLink {
    url: string;
    source_url: string;
}
export interface PdfReportData {
    audit: AuditJob;
    findings: Array<AuditFinding & {
        page_url: string;
    }>;
    brokenLinks: Array<{
        broken_url: string;
        source_url: string;
        status_code: number | null;
    }>;
    unverifiableLinks?: UnverifiableLink[];
    branding: ResolvedBranding;
    fixSnippets?: Record<string, ResolvedFixSnippetForPdf>;
    compliance?: ComplianceDataForPdf;
}
export declare function shutdownPdfBrowser(): Promise<void>;
export declare function generateAuditPdf(data: PdfReportData): Promise<Buffer>;
export declare function buildReportHtml(data: PdfReportData, logoDataUri: string | null): string;
export declare function buildReportMarkdown(data: PdfReportData): string;
//# sourceMappingURL=pdf-report.service.d.ts.map