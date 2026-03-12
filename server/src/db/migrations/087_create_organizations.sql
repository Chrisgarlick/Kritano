-- Migration: Create Organizations and Team Workspaces
-- Description: Adds support for team workspaces, subscriptions, and multi-tenant architecture

-- =============================================
-- ENUM TYPES
-- =============================================

CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'agency', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'paused');
CREATE TYPE domain_status AS ENUM ('active', 'pending', 'locked', 'pending_change');

-- =============================================
-- ORGANIZATIONS TABLE
-- =============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  logo_url TEXT,

  -- Ownership
  owner_id UUID NOT NULL REFERENCES users(id),

  -- Settings (JSON for flexibility)
  settings JSONB DEFAULT '{
    "defaultAuditChecks": ["seo", "accessibility", "security", "performance"],
    "requireDomainVerification": false,
    "allowMemberInvites": false,
    "auditNotifications": true
  }'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- =============================================
-- ORGANIZATION MEMBERS TABLE
-- =============================================

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',

  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);

-- =============================================
-- ORGANIZATION INVITATIONS TABLE
-- =============================================

CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role org_role NOT NULL DEFAULT 'member',

  invited_by UUID NOT NULL REFERENCES users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  status invite_status DEFAULT 'pending',

  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_org_invites_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invites_email ON organization_invitations(email);
CREATE INDEX idx_org_invites_token ON organization_invitations(token);
CREATE INDEX idx_org_invites_status ON organization_invitations(status);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tier and Status
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',

  -- Stripe Integration
  stripe_customer_id VARCHAR(50),
  stripe_subscription_id VARCHAR(50),
  stripe_price_id VARCHAR(50),

  -- Billing Cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Seats (for PRO+)
  included_seats INTEGER NOT NULL DEFAULT 1,
  extra_seats INTEGER DEFAULT 0,

  -- Add-ons (JSON for flexibility)
  addons JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- =============================================
-- ORGANIZATION DOMAINS TABLE
-- =============================================

CREATE TABLE organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  domain VARCHAR(255) NOT NULL,
  include_subdomains BOOLEAN DEFAULT TRUE,

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(64),
  verified_at TIMESTAMPTZ,

  -- Status (for FREE tier locking)
  status domain_status DEFAULT 'active',
  locked_until TIMESTAMPTZ,
  pending_domain VARCHAR(255),

  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, domain)
);

CREATE INDEX idx_org_domains_org ON organization_domains(organization_id);
CREATE INDEX idx_org_domains_domain ON organization_domains(domain);
CREATE INDEX idx_org_domains_status ON organization_domains(status);

-- =============================================
-- USAGE RECORDS TABLE
-- =============================================

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Counters
  audits_count INTEGER DEFAULT 0,
  pages_crawled INTEGER DEFAULT 0,
  api_requests INTEGER DEFAULT 0,
  exports_count INTEGER DEFAULT 0,

  -- Snapshots (for billing reconciliation)
  domains_snapshot INTEGER DEFAULT 0,
  seats_snapshot INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, period_start)
);

CREATE INDEX idx_usage_org ON usage_records(organization_id);
CREATE INDEX idx_usage_period ON usage_records(period_start, period_end);

-- =============================================
-- ORGANIZATION AUDIT LOG TABLE
-- =============================================

CREATE TABLE organization_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,

  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org ON organization_audit_log(organization_id);
CREATE INDEX idx_audit_log_user ON organization_audit_log(user_id);
CREATE INDEX idx_audit_log_action ON organization_audit_log(action);
CREATE INDEX idx_audit_log_created ON organization_audit_log(created_at DESC);

-- =============================================
-- TIER LIMITS REFERENCE TABLE
-- =============================================

CREATE TABLE tier_limits (
  tier subscription_tier PRIMARY KEY,

  -- Team
  max_seats INTEGER,

  -- Domains
  max_domains INTEGER,
  domain_locking BOOLEAN DEFAULT FALSE,

  -- Audits
  max_audits_per_month INTEGER,
  max_pages_per_audit INTEGER NOT NULL,
  max_audit_depth INTEGER NOT NULL,

  -- Features
  available_checks TEXT[] NOT NULL,
  scheduled_audits BOOLEAN DEFAULT FALSE,
  min_schedule_interval INTERVAL,

  -- Data
  data_retention_days INTEGER,

  -- API
  api_requests_per_day INTEGER,
  api_requests_per_minute INTEGER NOT NULL,
  concurrent_audits INTEGER NOT NULL,

  -- Exports
  export_pdf BOOLEAN DEFAULT FALSE,
  export_csv BOOLEAN DEFAULT FALSE,
  export_json BOOLEAN DEFAULT FALSE,
  white_label BOOLEAN DEFAULT FALSE
);

-- Insert tier configurations (matching TEAM.md)
INSERT INTO tier_limits VALUES
  ('free', 1, 1, TRUE, 5, 50, 3,
   ARRAY['seo', 'accessibility'], FALSE, NULL, 30,
   100, 10, 1, FALSE, FALSE, FALSE, FALSE),

  ('starter', 1, 3, FALSE, 10, 250, 5,
   ARRAY['seo', 'accessibility', 'security', 'performance'], TRUE, '7 days', 90,
   1000, 60, 3, TRUE, FALSE, FALSE, FALSE),

  ('pro', 5, 10, FALSE, NULL, 1000, 10,
   ARRAY['seo', 'accessibility', 'security', 'performance'], TRUE, '1 day', 365,
   10000, 300, 10, TRUE, TRUE, TRUE, FALSE),

  ('agency', NULL, NULL, FALSE, NULL, 5000, 10,
   ARRAY['seo', 'accessibility', 'security', 'performance'], TRUE, '1 hour', 730,
   100000, 1000, 50, TRUE, TRUE, TRUE, TRUE),

  ('enterprise', NULL, NULL, FALSE, NULL, 10000, 10,
   ARRAY['seo', 'accessibility', 'security', 'performance'], TRUE, '15 minutes', NULL,
   NULL, 2000, 100, TRUE, TRUE, TRUE, TRUE);

-- =============================================
-- MODIFY EXISTING TABLES
-- =============================================

-- Add organization_id to audit_jobs
ALTER TABLE audit_jobs
  ADD COLUMN organization_id UUID REFERENCES organizations(id);

CREATE INDEX idx_audit_jobs_org ON audit_jobs(organization_id);

-- Add organization_id to api_keys (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
  END IF;
END $$;

-- =============================================
-- DATA MIGRATION: Create personal orgs for existing users
-- =============================================

-- Create personal organization for each existing user
INSERT INTO organizations (name, slug, owner_id)
SELECT
  CONCAT(COALESCE(first_name, 'User'), '''s Workspace'),
  CONCAT('user-', REPLACE(id::text, '-', '')),
  id
FROM users
ON CONFLICT DO NOTHING;

-- Create owner membership for each personal org
INSERT INTO organization_members (organization_id, user_id, role, joined_at)
SELECT o.id, o.owner_id, 'owner', NOW()
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.organization_id = o.id AND om.user_id = o.owner_id
);

-- Create free subscription for each organization
INSERT INTO subscriptions (organization_id, tier, status, included_seats, current_period_start, current_period_end)
SELECT
  id,
  'free',
  'active',
  1,
  date_trunc('month', NOW()),
  date_trunc('month', NOW()) + INTERVAL '1 month'
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.organization_id = organizations.id
);

-- Migrate existing audits to personal organizations
UPDATE audit_jobs aj
SET organization_id = o.id
FROM organizations o
WHERE aj.user_id = o.owner_id
  AND aj.organization_id IS NULL;

-- Migrate existing API keys to personal organizations
UPDATE api_keys ak
SET organization_id = o.id
FROM organizations o
WHERE ak.user_id = o.owner_id
  AND ak.organization_id IS NULL;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if org has reached audit limit for current period
CREATE OR REPLACE FUNCTION check_audit_limit(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  tier_val subscription_tier;
  max_audits INTEGER;
  current_count INTEGER;
BEGIN
  -- Get subscription tier
  SELECT tier INTO tier_val FROM subscriptions WHERE organization_id = org_id;

  -- Get tier limit
  SELECT max_audits_per_month INTO max_audits FROM tier_limits WHERE tier = tier_val;

  -- NULL means unlimited
  IF max_audits IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Count audits this period
  SELECT COUNT(*) INTO current_count
  FROM audit_jobs
  WHERE organization_id = org_id
    AND created_at >= date_trunc('month', NOW());

  RETURN current_count < max_audits;
END;
$$ LANGUAGE plpgsql;

-- Function to check domain limit
CREATE OR REPLACE FUNCTION check_domain_limit(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  tier_val subscription_tier;
  max_domains_val INTEGER;
  current_count INTEGER;
BEGIN
  SELECT tier INTO tier_val FROM subscriptions WHERE organization_id = org_id;
  SELECT max_domains INTO max_domains_val FROM tier_limits WHERE tier = tier_val;

  IF max_domains_val IS NULL THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*) INTO current_count FROM organization_domains WHERE organization_id = org_id;

  RETURN current_count < max_domains_val;
END;
$$ LANGUAGE plpgsql;

-- Function to check seat limit
CREATE OR REPLACE FUNCTION check_seat_limit(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  tier_val subscription_tier;
  max_seats_val INTEGER;
  extra_seats_val INTEGER;
  current_count INTEGER;
BEGIN
  SELECT tier, s.extra_seats INTO tier_val, extra_seats_val
  FROM subscriptions s WHERE organization_id = org_id;

  SELECT max_seats INTO max_seats_val FROM tier_limits WHERE tier = tier_val;

  IF max_seats_val IS NULL THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*) INTO current_count FROM organization_members WHERE organization_id = org_id;

  RETURN current_count < (max_seats_val + COALESCE(extra_seats_val, 0));
END;
$$ LANGUAGE plpgsql;

-- Function to get organization's tier limits
CREATE OR REPLACE FUNCTION get_org_limits(org_id UUID)
RETURNS tier_limits AS $$
DECLARE
  tier_val subscription_tier;
  limits tier_limits;
BEGIN
  SELECT tier INTO tier_val FROM subscriptions WHERE organization_id = org_id;
  SELECT * INTO limits FROM tier_limits WHERE tier = tier_val;
  RETURN limits;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organization_domains_updated_at
  BEFORE UPDATE ON organization_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER usage_records_updated_at
  BEFORE UPDATE ON usage_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to create subscription when organization is created
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (organization_id, tier, status, included_seats, current_period_start, current_period_end)
  VALUES (
    NEW.id,
    'free',
    'active',
    1,
    date_trunc('month', NOW()),
    date_trunc('month', NOW()) + INTERVAL '1 month'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_create_subscription
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- Trigger to add owner as member when organization is created
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_add_owner
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION add_owner_as_member();
