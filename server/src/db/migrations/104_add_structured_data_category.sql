-- Migration: 104_add_structured_data_category
-- Description: Add 'structured-data' to audit_findings category check constraint.
-- The structured data engine creates findings with category 'structured-data'
-- but the constraint only allowed up to 'content'.

-- Drop the old constraint
ALTER TABLE audit_findings DROP CONSTRAINT IF EXISTS audit_findings_category_check;

-- Add the new constraint with 'structured-data' included
ALTER TABLE audit_findings ADD CONSTRAINT audit_findings_category_check
    CHECK (category IN ('seo', 'accessibility', 'security', 'performance', 'content', 'structured-data'));
