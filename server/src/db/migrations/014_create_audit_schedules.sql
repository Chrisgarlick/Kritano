-- Audit scheduling table
CREATE TABLE IF NOT EXISTS audit_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  cron_expression VARCHAR(100) NOT NULL DEFAULT '0 0 * * 1',
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_schedules_user ON audit_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_schedules_next_run ON audit_schedules(next_run_at) WHERE enabled = true;
