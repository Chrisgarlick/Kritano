-- Migration 061: Create audit_advice_templates table
-- Allows admins to edit the "Actionable Advice" text shown in audit findings
-- without deploying code. Custom rows override engine defaults.

CREATE TABLE IF NOT EXISTS audit_advice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id VARCHAR(100) UNIQUE NOT NULL,
  rule_name VARCHAR(200) NOT NULL,
  category VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  learn_more_url VARCHAR(500),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_audit_advice_rule_id ON audit_advice_templates (rule_id);
CREATE INDEX idx_audit_advice_category ON audit_advice_templates (category);
CREATE INDEX idx_audit_advice_custom ON audit_advice_templates (is_custom) WHERE is_custom = true;
