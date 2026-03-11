-- Add unique constraint to prevent duplicate findings for the same rule on the same page
-- This prevents duplicate findings if a page is accidentally audited multiple times

-- First, remove any existing duplicates (keep the first one)
DELETE FROM audit_findings a USING audit_findings b
WHERE a.id > b.id
  AND a.audit_job_id = b.audit_job_id
  AND COALESCE(a.audit_page_id::text, '') = COALESCE(b.audit_page_id::text, '')
  AND a.rule_id = b.rule_id
  AND COALESCE(a.selector, '') = COALESCE(b.selector, '');

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_findings_unique
ON audit_findings (audit_job_id, COALESCE(audit_page_id, '00000000-0000-0000-0000-000000000000'::uuid), rule_id, COALESCE(selector, ''));
