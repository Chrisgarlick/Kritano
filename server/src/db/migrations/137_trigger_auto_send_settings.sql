-- Migration 081: Seed per-trigger auto-send settings
-- Each trigger type gets its own toggle so admins can enable/disable auto-sending individually.

INSERT INTO system_settings (key, value) VALUES
  ('trigger_auto_send_first_audit_complete', 'true'),
  ('trigger_auto_send_stalled_verification', 'true'),
  ('trigger_auto_send_security_alert', 'true'),
  ('trigger_auto_send_upgrade_nudge', 'true'),
  ('trigger_auto_send_low_aeo_score', 'true'),
  ('trigger_auto_send_low_content_score', 'true'),
  ('trigger_auto_send_churn_risk', 'true'),
  ('trigger_auto_send_score_improvement', 'true')
ON CONFLICT (key) DO NOTHING;
