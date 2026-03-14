-- Migration 053: Create CRM triggers table
-- Part of CRM Phase 2 - Automated Behavior Triggers

CREATE TABLE IF NOT EXISTS crm_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'dismissed', 'actioned')),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actioned_at TIMESTAMPTZ,
  actioned_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_triggers_status ON crm_triggers (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_triggers_user ON crm_triggers (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_triggers_type ON crm_triggers (trigger_type, status);
CREATE INDEX IF NOT EXISTS idx_crm_triggers_dedup ON crm_triggers (user_id, trigger_type, created_at DESC);
