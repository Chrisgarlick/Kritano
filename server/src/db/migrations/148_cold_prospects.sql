-- Cold Prospects: Newly registered domain discovery & outreach pipeline

CREATE TABLE cold_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL,
  tld VARCHAR(20) NOT NULL,
  registered_at DATE,

  -- Status pipeline: pending → checking → live → extracting → qualified → contacted → converted → dead
  status VARCHAR(30) NOT NULL DEFAULT 'pending',

  -- Site check results
  is_live BOOLEAN DEFAULT FALSE,
  http_status INTEGER,
  has_ssl BOOLEAN,
  title VARCHAR(500),
  meta_description TEXT,
  technology_stack JSONB DEFAULT '[]',
  page_count_estimate INTEGER,

  -- Contact info (email + domain required for outreach, name captured when found)
  contact_email VARCHAR(255),
  contact_name VARCHAR(255),
  contact_role VARCHAR(100),
  emails JSONB DEFAULT '[]',
  contact_page_url VARCHAR(500),
  has_contact_form BOOLEAN DEFAULT FALSE,
  social_links JSONB DEFAULT '{}',

  -- Qualification
  quality_score INTEGER DEFAULT 0,
  business_type VARCHAR(50),
  country VARCHAR(5),
  language VARCHAR(10),

  -- Outreach tracking
  campaign_id UUID,
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  converted_user_id UUID,

  -- Feed metadata
  batch_date DATE NOT NULL,
  source VARCHAR(50) DEFAULT 'whoisds',

  -- Exclusions
  is_excluded BOOLEAN DEFAULT FALSE,
  exclusion_reason VARCHAR(100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_cold_prospects_domain UNIQUE(domain)
);

CREATE INDEX idx_cold_prospects_status ON cold_prospects(status);
CREATE INDEX idx_cold_prospects_batch ON cold_prospects(batch_date);
CREATE INDEX idx_cold_prospects_quality ON cold_prospects(quality_score DESC) WHERE status = 'qualified';
CREATE INDEX idx_cold_prospects_tld ON cold_prospects(tld);
CREATE INDEX idx_cold_prospects_contact_email ON cold_prospects(contact_email) WHERE contact_email IS NOT NULL;

-- Settings table for pipeline configuration
CREATE TABLE cold_prospect_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cold_prospect_settings (key, value) VALUES
  ('target_tlds', '["com", "co.uk", "org.uk", "uk", "io", "co", "net"]'),
  ('excluded_keywords', '["casino", "poker", "xxx", "porn", "gambling", "crypto", "nft", "loan", "pills", "viagra"]'),
  ('min_quality_score', '30'),
  ('daily_check_limit', '5000'),
  ('daily_email_limit', '50'),
  ('auto_outreach_enabled', 'false'),
  ('last_feed_date', 'null');
