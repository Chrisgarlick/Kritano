-- Migration: 027_add_content_category
-- Description: Add 'content' to audit_findings category check constraint

-- Drop the old constraint
ALTER TABLE audit_findings DROP CONSTRAINT IF EXISTS audit_findings_category_check;

-- Add the new constraint with 'content' included
ALTER TABLE audit_findings ADD CONSTRAINT audit_findings_category_check
    CHECK (category IN ('seo', 'accessibility', 'security', 'performance', 'content'));
