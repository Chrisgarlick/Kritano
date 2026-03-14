-- Migration: 015_create_api_keys
-- Description: API key management for public API access

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Key identification
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(12) NOT NULL,      -- e.g., "pp_live_abc1" for identification
    key_hash VARCHAR(255) NOT NULL,        -- SHA-256 hash of full key

    -- Permissions & limits
    scopes TEXT[] DEFAULT ARRAY['audits:read', 'audits:write'],
    rate_limit_tier VARCHAR(20) DEFAULT 'free',  -- free, starter, pro, enterprise

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    last_used_ip INET,
    request_count INTEGER DEFAULT 0,

    -- Lifecycle
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,               -- NULL = never expires
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast key lookup during authentication
CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Index for listing user's keys
CREATE INDEX idx_api_keys_user ON api_keys(user_id, created_at DESC);

-- Index for finding keys by prefix (for support/debugging)
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- API request logging for usage analytics and rate limiting
CREATE TABLE api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,

    -- Request details
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,

    -- Context
    ip_address INET,
    user_agent VARCHAR(500),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rate limiting checks (recent requests by key)
CREATE INDEX idx_api_requests_key_time ON api_requests(api_key_id, created_at DESC);

-- Index for analytics queries
CREATE INDEX idx_api_requests_created ON api_requests(created_at DESC);

-- Partitioning hint: Consider partitioning api_requests by month for large scale
COMMENT ON TABLE api_requests IS 'Consider partitioning by created_at for production scale';

-- Rate limit tiers configuration
COMMENT ON COLUMN api_keys.rate_limit_tier IS 'Tier limits:
  free: 10 req/min, 100 req/day, 1 concurrent audit
  starter: 60 req/min, 1000 req/day, 3 concurrent audits
  pro: 300 req/min, 10000 req/day, 10 concurrent audits
  enterprise: 1000 req/min, unlimited, 50 concurrent audits';

-- Available scopes
COMMENT ON COLUMN api_keys.scopes IS 'Available scopes:
  audits:read - List and view audits
  audits:write - Create and manage audits
  findings:read - View findings
  findings:write - Dismiss/manage findings
  exports:read - Export audit data';
