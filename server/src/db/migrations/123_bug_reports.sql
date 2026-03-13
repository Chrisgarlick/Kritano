-- Migration: 123_bug_reports
-- Description: Create bug reports and comments tables for user bug reporting feature

-- Bug Reports table
CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reporter info
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Report content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'trivial')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('ui', 'functionality', 'performance', 'data', 'security', 'other')),

    -- Context (auto-captured)
    page_url TEXT,
    user_agent TEXT,
    screen_size VARCHAR(20),
    browser_info JSONB,

    -- Screenshot (optional)
    screenshot_url TEXT,
    screenshot_key TEXT,

    -- Admin management
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    resolution_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Bug Report Comments table
CREATE TABLE IF NOT EXISTS bug_report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin_comment BOOLEAN NOT NULL DEFAULT FALSE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for bug_reports
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);

-- Indexes for bug_report_comments
CREATE INDEX IF NOT EXISTS idx_bug_report_comments_report ON bug_report_comments(bug_report_id, created_at);

-- Updated timestamp trigger (reuse existing function if available)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bug_reports_updated_at') THEN
        CREATE TRIGGER update_bug_reports_updated_at
            BEFORE UPDATE ON bug_reports
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
