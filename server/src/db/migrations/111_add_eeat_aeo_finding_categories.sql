-- Migration: 111_add_eeat_aeo_finding_categories
-- Description: Add 'content-eeat' and 'content-aeo' to audit_findings category check constraint.
-- The EEAT and AEO engines create findings with these sub-categories but the constraint
-- only allowed up to 'structured-data', causing all findings for the page to fail to insert.

-- Drop the old constraint
ALTER TABLE audit_findings DROP CONSTRAINT IF EXISTS audit_findings_category_check;

-- Add the new constraint with 'content-eeat' and 'content-aeo' included
ALTER TABLE audit_findings ADD CONSTRAINT audit_findings_category_check
    CHECK (category IN ('seo', 'accessibility', 'security', 'performance', 'content', 'structured-data', 'content-eeat', 'content-aeo'));
