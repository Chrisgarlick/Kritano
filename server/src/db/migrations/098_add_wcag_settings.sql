-- Migration: 098_add_wcag_settings
-- Description: Add WCAG version and level settings to audit_jobs

-- Add WCAG version column (2.1 or 2.2)
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS wcag_version TEXT DEFAULT '2.2'
    CHECK (wcag_version IN ('2.1', '2.2'));

-- Add WCAG conformance level column (A, AA, or AAA)
ALTER TABLE audit_jobs ADD COLUMN IF NOT EXISTS wcag_level TEXT DEFAULT 'AA'
    CHECK (wcag_level IN ('A', 'AA', 'AAA'));
