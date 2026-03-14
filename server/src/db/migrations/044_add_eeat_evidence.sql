-- Add JSONB column for E-E-A-T evidence (positive signals found on the page)
ALTER TABLE audit_pages
  ADD COLUMN IF NOT EXISTS eeat_evidence JSONB;
