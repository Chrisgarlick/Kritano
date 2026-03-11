-- Migration: 003_create_email_tokens
-- Description: Tokens for email verification and password reset

CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Token (stored as hash for security)
    token_hash TEXT UNIQUE NOT NULL,
    token_type TEXT NOT NULL
        CHECK (token_type IN ('email_verification', 'password_reset')),

    -- Security tracking
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    used_ip INET,

    -- Validity
    expires_at TIMESTAMPTZ NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_tokens_hash ON email_verification_tokens(token_hash);
CREATE INDEX idx_email_tokens_type ON email_verification_tokens(token_type);
CREATE INDEX idx_email_tokens_expires ON email_verification_tokens(expires_at)
    WHERE is_used = FALSE;
