-- Migration: 002_create_refresh_tokens
-- Description: Refresh tokens with rotation tracking for security

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Token identification (store hash, not plaintext)
    token_hash TEXT UNIQUE NOT NULL,
    family_id UUID NOT NULL,

    -- Device/session info
    device_fingerprint TEXT,
    user_agent TEXT,
    ip_address INET,

    -- Validity
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    absolute_expires_at TIMESTAMPTZ NOT NULL,

    -- Rotation tracking (for reuse detection)
    replaced_by_token_id UUID REFERENCES refresh_tokens(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Index for cleanup queries (find expired/revoked tokens)
CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(expires_at)
    WHERE is_revoked = FALSE;
