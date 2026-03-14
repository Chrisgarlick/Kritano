-- Referral system tables and user fields

-- Add referral fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS referral_bonus_audits INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID NOT NULL REFERENCES users(id),
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending → qualified → rewarded → voided
  email_verified_at TIMESTAMPTZ,
  first_audit_completed_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  referrer_reward_type VARCHAR(30),
  referrer_reward_value INTEGER,
  referred_reward_type VARCHAR(30),
  referred_reward_value INTEGER,
  referrer_ip INET,
  referred_ip INET,
  referrer_tier VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Rewards ledger (audit trail)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  referral_id UUID REFERENCES referrals(id),
  type VARCHAR(30) NOT NULL,  -- bonus_audits, tier_upgrade, admin_adjustment, consumed
  amount INTEGER NOT NULL,     -- positive = credit, negative = consumed
  balance_after INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);

-- Config table
CREATE TABLE IF NOT EXISTS referral_config (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO referral_config (key, value) VALUES
  ('enabled', 'true'),
  ('max_referrals_per_month', '50'),
  ('rewards', '{"referrer":{"free":5,"starter":5,"pro":8,"agency":12,"enterprise":12},"referred":3,"milestones":{"5":{"tier":"starter","days":30},"10":{"tier":"pro","days":30}}}')
ON CONFLICT (key) DO NOTHING;
