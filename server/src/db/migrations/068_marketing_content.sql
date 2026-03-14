-- Marketing campaigns (labels/tags)
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_campaigns_name ON marketing_campaigns(name);

-- Marketing content items
CREATE TABLE marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL,
  title VARCHAR(200),
  body TEXT NOT NULL,
  preview VARCHAR(300),
  media JSONB DEFAULT '[]',
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  char_count INT DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_content_platform ON marketing_content(platform);
CREATE INDEX idx_marketing_content_campaign ON marketing_content(campaign_id);
CREATE INDEX idx_marketing_content_status ON marketing_content(status);
CREATE INDEX idx_marketing_content_created ON marketing_content(created_at DESC);
