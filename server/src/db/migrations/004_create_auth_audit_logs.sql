-- Migration: 004_create_auth_audit_logs
-- Description: Security event tracking for authentication actions

CREATE TABLE auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Event details
    event_type TEXT NOT NULL,
    event_status TEXT NOT NULL
        CHECK (event_status IN ('success', 'failure', 'blocked')),

    -- Context
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,

    -- Additional details (event-specific data)
    details JSONB,
    failure_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event types documentation
COMMENT ON TABLE auth_audit_logs IS 'Event types:
    login_attempt, login_success, login_failure, login_blocked,
    logout, logout_all_devices,
    register, email_verified, email_verification_failed,
    password_reset_requested, password_reset_completed, password_changed,
    token_refresh, token_refresh_failed, token_revoked,
    account_locked, account_unlocked,
    suspicious_activity';

-- Indexes for querying
CREATE INDEX idx_audit_logs_user_id ON auth_audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON auth_audit_logs(event_type);
CREATE INDEX idx_audit_logs_status ON auth_audit_logs(event_status);
CREATE INDEX idx_audit_logs_created_at ON auth_audit_logs(created_at);
CREATE INDEX idx_audit_logs_ip ON auth_audit_logs(ip_address);

-- Composite index for security analysis queries
CREATE INDEX idx_audit_logs_security ON auth_audit_logs(user_id, event_type, created_at DESC);

-- Index for finding recent failures by IP (brute force detection)
CREATE INDEX idx_audit_logs_ip_failures ON auth_audit_logs(ip_address, created_at DESC)
    WHERE event_status = 'failure';
