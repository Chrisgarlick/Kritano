-- Migration 021: Liability Protection System
-- Adds domain verification tracking, audit consent logging, and ToS acceptance

-- =============================================
-- AUDIT CONSENT LOG TABLE
-- Logs every consent acceptance for unverified domain scans
-- =============================================

CREATE TABLE IF NOT EXISTS audit_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Target details
  target_url TEXT NOT NULL,
  target_domain VARCHAR(255) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Acceptance tracking
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET NOT NULL,
  user_agent TEXT,

  -- Consent versioning (hash of the consent text they agreed to)
  consent_text_hash VARCHAR(64) NOT NULL,
  consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',

  -- User preference (still logs even if true)
  dont_show_again BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_log_audit ON audit_consent_log(audit_job_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_user ON audit_consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_org ON audit_consent_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_domain ON audit_consent_log(target_domain);
CREATE INDEX IF NOT EXISTS idx_consent_log_date ON audit_consent_log(accepted_at DESC);

-- =============================================
-- USER CONSENTS TABLE
-- Tracks ToS, privacy policy, and other consent acceptances
-- =============================================

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Consent type and version
  consent_type VARCHAR(50) NOT NULL, -- 'terms_of_service', 'privacy_policy', etc.
  consent_version VARCHAR(20) NOT NULL,
  consent_text_hash VARCHAR(64) NOT NULL,

  -- Acceptance details
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET NOT NULL,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only accept a specific version once
  UNIQUE(user_id, consent_type, consent_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);

-- =============================================
-- MODIFY organization_domains TABLE
-- Add verification method tracking
-- =============================================

ALTER TABLE organization_domains
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20), -- 'dns', 'file', null
  ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMPTZ;

-- =============================================
-- MODIFY users TABLE
-- Add ToS acceptance tracking and settings
-- =============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tos_version VARCHAR(20),
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Settings structure: { "skipUnverifiedDomainWarning": boolean }

-- =============================================
-- MODIFY audit_jobs TABLE
-- Add unverified mode flag for scan limit enforcement
-- =============================================

ALTER TABLE audit_jobs
  ADD COLUMN IF NOT EXISTS unverified_mode BOOLEAN DEFAULT FALSE;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE audit_consent_log IS 'Logs every consent acceptance when users scan unverified domains. Required for liability protection.';
COMMENT ON TABLE user_consents IS 'Tracks user acceptance of Terms of Service, privacy policy, and other legal documents.';
COMMENT ON COLUMN organization_domains.verification_method IS 'Method used to verify domain ownership: dns (TXT record), file (.well-known), or null (not verified)';
COMMENT ON COLUMN audit_jobs.unverified_mode IS 'When true, audit runs with restricted limits (3 pages max, slower crawl, mandatory robots.txt)';
COMMENT ON COLUMN users.settings IS 'JSON settings including skipUnverifiedDomainWarning preference';
