-- Enhance audit_schedules for full scheduled audits feature
-- Adds site association, frequency presets, run tracking, auto-pause, and notifications

-- New columns on audit_schedules
ALTER TABLE audit_schedules
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS frequency VARCHAR(50) DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS last_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS last_audit_id UUID REFERENCES audit_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS run_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_consecutive_failures INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS paused_reason TEXT,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notify_on_completion BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_failure BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) NOT NULL DEFAULT 'UTC';

-- Add schedule_id FK on audit_jobs so we can track which audit came from a schedule
ALTER TABLE audit_jobs
  ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES audit_schedules(id) ON DELETE SET NULL;

-- Indexes for the poller and lookups
CREATE INDEX IF NOT EXISTS idx_audit_schedules_site ON audit_schedules(site_id);
CREATE INDEX IF NOT EXISTS idx_audit_schedules_poller ON audit_schedules(next_run_at)
  WHERE enabled = true AND paused_reason IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_jobs_schedule ON audit_jobs(schedule_id)
  WHERE schedule_id IS NOT NULL;

-- Backfill site_id from existing rows using target_domain → sites.domain match
UPDATE audit_schedules AS s
SET site_id = sub.site_id
FROM (
  SELECT DISTINCT ON (sch.id) sch.id AS schedule_id, si.id AS site_id
  FROM audit_schedules sch
  JOIN sites si ON si.domain = sch.target_domain
    AND (si.owner_id = sch.user_id OR si.created_by = sch.user_id)
  WHERE sch.site_id IS NULL
  ORDER BY sch.id, si.created_at ASC
) sub
WHERE s.id = sub.schedule_id;
