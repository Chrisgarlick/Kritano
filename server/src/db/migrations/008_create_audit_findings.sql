-- Migration: 008_create_audit_findings
-- Description: Individual issues found during audit

CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
    audit_page_id UUID REFERENCES audit_pages(id) ON DELETE CASCADE,

    -- Finding classification
    category TEXT NOT NULL
        CHECK (category IN ('seo', 'accessibility', 'security', 'performance')),
    rule_id TEXT NOT NULL,           -- e.g., 'missing-alt-text', 'no-https'
    rule_name TEXT NOT NULL,         -- Human readable name

    -- Severity levels aligned with axe-core
    severity TEXT NOT NULL
        CHECK (severity IN ('critical', 'serious', 'moderate', 'minor', 'info')),

    -- Details
    message TEXT NOT NULL,
    description TEXT,                 -- Longer explanation
    recommendation TEXT,              -- How to fix

    -- Location info
    selector TEXT,                    -- CSS selector if applicable
    line_number INT,
    column_number INT,
    snippet TEXT,                     -- Code snippet showing the issue (limited to 500 chars)

    -- For accessibility (axe-core compatibility)
    impact TEXT,
    wcag_criteria TEXT[],             -- e.g., ARRAY['1.1.1', '4.1.2']

    -- Metadata
    help_url TEXT,                    -- Link to documentation

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying and filtering
CREATE INDEX idx_audit_findings_job_id ON audit_findings(audit_job_id);
CREATE INDEX idx_audit_findings_page_id ON audit_findings(audit_page_id);
CREATE INDEX idx_audit_findings_category ON audit_findings(audit_job_id, category);
CREATE INDEX idx_audit_findings_severity ON audit_findings(audit_job_id, severity);
CREATE INDEX idx_audit_findings_rule ON audit_findings(audit_job_id, rule_id);
CREATE INDEX idx_audit_findings_category_severity ON audit_findings(audit_job_id, category, severity);

-- Note: For ordering by severity, use application-level ORDER BY with CASE expression
-- PostgreSQL doesn't support CASE in index definitions directly
