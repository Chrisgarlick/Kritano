-- Migration: 064_feature_requests
-- Description: Create feature requests and comments tables for user feature request system

-- Feature Requests table
CREATE TABLE IF NOT EXISTS feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Requester info
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Request content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    impact VARCHAR(30) NOT NULL CHECK (impact IN ('nice_to_have', 'would_be_helpful', 'important', 'critical_for_workflow')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('accessibility', 'reporting', 'ui_ux', 'integrations', 'performance', 'other')),

    -- Context (auto-captured)
    page_url TEXT,
    user_agent TEXT,
    screen_size VARCHAR(20),
    browser_info JSONB,

    -- Admin management
    status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined')),
    priority VARCHAR(20) CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    resolution_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Feature Request Comments table
CREATE TABLE IF NOT EXISTS feature_request_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin_comment BOOLEAN NOT NULL DEFAULT FALSE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feature_requests
CREATE INDEX IF NOT EXISTS idx_feature_requests_user_id ON feature_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_requests_impact ON feature_requests(impact) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);

-- Indexes for feature_request_comments
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_request ON feature_request_comments(feature_request_id, created_at);

-- Updated timestamp trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_feature_requests_updated_at') THEN
        CREATE TRIGGER update_feature_requests_updated_at
            BEFORE UPDATE ON feature_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Comments for documentation
COMMENT ON TABLE feature_requests IS 'User-submitted feature requests for the application';
COMMENT ON TABLE feature_request_comments IS 'Comments/communication on feature requests between users and admins';
COMMENT ON COLUMN feature_requests.impact IS 'User-reported impact: nice_to_have, would_be_helpful, important, critical_for_workflow';
COMMENT ON COLUMN feature_requests.priority IS 'Admin-assigned priority: urgent, high, medium, low';
COMMENT ON COLUMN feature_requests.status IS 'Request status: submitted, under_review, planned, in_progress, completed, declined';
