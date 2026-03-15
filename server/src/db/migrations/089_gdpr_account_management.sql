-- Migration 089: GDPR Self-Service Account Management
-- Adds deletion tracking columns to users, creates account_data_exports and archived_consents tables,
-- seeds email templates for account lifecycle events, and updates the category constraint.

-- 1. Add deletion tracking to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ;

-- 2. Track data export requests
CREATE TABLE IF NOT EXISTS account_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','expired')),
  file_path TEXT,
  file_size_bytes BIGINT,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_data_exports_user ON account_data_exports (user_id);
CREATE INDEX IF NOT EXISTS idx_account_data_exports_status ON account_data_exports (status);

-- 3. Archive consent records before user deletion (legal: 3 years)
CREATE TABLE IF NOT EXISTS archived_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id_hash TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  consent_version TEXT,
  accepted_at TIMESTAMPTZ,
  ip_address INET,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archived_consents_hash ON archived_consents (original_user_id_hash);

-- 4. Update email template category constraint to add 'account'
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_category_check;
ALTER TABLE email_templates ADD CONSTRAINT email_templates_category_check
  CHECK (category IN (
    'transactional', 'onboarding', 'engagement',
    'upgrade', 'security', 'win_back', 'educational',
    'announcement', 'digest', 'cold_outreach', 'account'
  ));

-- 5. Seed account lifecycle email templates
INSERT INTO email_templates (slug, name, description, subject, preview_text, blocks, category, variables, is_system, branding_mode)
VALUES
  (
    'deletion_requested',
    'Account Deletion Requested',
    'Sent when a user requests account deletion.',
    'Your PagePulser account is scheduled for deletion',
    'Your account will be permanently deleted in 30 days.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"We''ve received your request to delete your PagePulser account. Your account and all associated data will be permanently deleted on <strong>{{deletionDate}}</strong>."},
      {"type":"text","content":"If you change your mind, you can cancel the deletion at any time before that date by logging in and visiting your account settings."},
      {"type":"button","label":"Cancel Deletion","href":"{{settingsUrl}}","align":"center"},
      {"type":"text","content":"After deletion, the following data will be permanently removed:"},
      {"type":"text","content":"&bull; All audit reports and findings<br>&bull; Site configurations and schedules<br>&bull; API keys and preferences<br>&bull; Your account profile"},
      {"type":"divider"},
      {"type":"footer","text":"If you did not request this deletion, please secure your account immediately.","includeUnsubscribe":false}
    ]'::jsonb,
    'account',
    '["firstName", "deletionDate", "settingsUrl"]'::jsonb,
    true,
    'platform'
  ),
  (
    'deletion_cancelled',
    'Account Deletion Cancelled',
    'Sent when a user cancels a pending account deletion.',
    'Your account deletion has been cancelled',
    'Your PagePulser account is safe and active again.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"Good news — your account deletion request has been cancelled. Your PagePulser account is fully active again with all your data intact."},
      {"type":"button","label":"Go to Dashboard","href":"{{dashboardUrl}}","align":"center"},
      {"type":"divider"},
      {"type":"footer","text":"If you did not cancel this deletion, please secure your account immediately.","includeUnsubscribe":false}
    ]'::jsonb,
    'account',
    '["firstName", "dashboardUrl"]'::jsonb,
    true,
    'platform'
  ),
  (
    'deletion_completed',
    'Account Deletion Completed',
    'Sent to the user email after account has been permanently deleted.',
    'Your PagePulser account has been deleted',
    'Your account and data have been permanently removed.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"Your PagePulser account and all associated data have been permanently deleted as requested."},
      {"type":"text","content":"Certain anonymised records (consent logs) are retained for legal compliance as described in our privacy policy."},
      {"type":"text","content":"If you ever want to use PagePulser again, you are welcome to create a new account at any time."},
      {"type":"divider"},
      {"type":"footer","text":"This is the final email you will receive from PagePulser regarding this account.","includeUnsubscribe":false}
    ]'::jsonb,
    'account',
    '["firstName"]'::jsonb,
    true,
    'platform'
  ),
  (
    'data_export_ready',
    'Data Export Ready',
    'Sent when a user data export has been completed and is ready for download.',
    'Your data export is ready to download',
    'Your PagePulser data export is ready. Download it within 24 hours.',
    '[
      {"type":"header"},
      {"type":"text","content":"Hi {{firstName}},","fontSize":"lg"},
      {"type":"text","content":"Your data export is ready! You can download it from your account settings."},
      {"type":"text","content":"<strong>Important:</strong> This download link expires in 24 hours for security reasons."},
      {"type":"button","label":"Download My Data","href":"{{settingsUrl}}","align":"center"},
      {"type":"divider"},
      {"type":"footer","text":"If you did not request this export, please secure your account immediately.","includeUnsubscribe":false}
    ]'::jsonb,
    'account',
    '["firstName", "settingsUrl"]'::jsonb,
    true,
    'platform'
  )
ON CONFLICT (slug) DO NOTHING;
