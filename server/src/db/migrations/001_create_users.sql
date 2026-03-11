-- Migration: 001_create_users
-- Description: Core users table with comprehensive security fields

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core identity
    email CITEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,

    -- Password (hashed with Argon2id)
    password_hash TEXT NOT NULL,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Profile
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company_name TEXT,

    -- Account status
    status TEXT DEFAULT 'pending_verification'
        CHECK (status IN ('pending_verification', 'active', 'suspended', 'deleted')),
    role TEXT DEFAULT 'user'
        CHECK (role IN ('user', 'admin', 'super_admin')),

    -- Security tracking
    failed_login_attempts INT DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_lockout ON users(lockout_until) WHERE lockout_until IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
