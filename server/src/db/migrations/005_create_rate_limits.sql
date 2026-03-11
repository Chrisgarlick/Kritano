-- Migration: 005_create_rate_limits
-- Description: Rate limiting records for brute force protection

CREATE TABLE rate_limit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identifier (IP address, user ID, or composite key)
    identifier TEXT NOT NULL,
    identifier_type TEXT NOT NULL
        CHECK (identifier_type IN ('ip', 'user', 'email', 'composite')),
    action TEXT NOT NULL,

    -- Tracking
    attempt_count INT DEFAULT 1,
    first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    window_expires_at TIMESTAMPTZ NOT NULL,

    -- Lockout
    is_locked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMPTZ,

    -- Unique constraint for upsert operations
    UNIQUE(identifier, action)
);

-- Indexes
CREATE INDEX idx_rate_limits_identifier ON rate_limit_records(identifier, action);
CREATE INDEX idx_rate_limits_expires ON rate_limit_records(window_expires_at);
CREATE INDEX idx_rate_limits_locked ON rate_limit_records(locked_until)
    WHERE is_locked = TRUE;

-- Cleanup function for expired records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limit_records
    WHERE window_expires_at < NOW()
    AND (is_locked = FALSE OR locked_until < NOW());

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
