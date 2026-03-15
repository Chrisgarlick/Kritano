-- Make password_hash nullable for SSO-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add avatar_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- OAuth providers link table
CREATE TABLE user_oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_user_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    raw_profile JSONB,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (provider, provider_user_id),
    UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX idx_user_oauth_providers_lookup ON user_oauth_providers(provider, provider_user_id);

CREATE TRIGGER update_user_oauth_providers_updated_at
    BEFORE UPDATE ON user_oauth_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
