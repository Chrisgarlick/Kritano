-- Google Search Console integration tables

-- GSC connections (one per site/domain)
CREATE TABLE IF NOT EXISTS gsc_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  gsc_property TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'complete', 'error')),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id)
);

CREATE INDEX idx_gsc_connections_user ON gsc_connections(user_id);
CREATE INDEX idx_gsc_connections_sync ON gsc_connections(sync_status);

-- GSC query data (synced daily)
CREATE TABLE IF NOT EXISTS gsc_query_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES gsc_connections(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  page_url TEXT,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  position NUMERIC(6,2) DEFAULT 0,
  device TEXT CHECK (device IN ('desktop', 'mobile', 'tablet')),
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gsc_query_conn_date ON gsc_query_data(connection_id, date);
CREATE INDEX idx_gsc_query_query ON gsc_query_data(connection_id, query);
CREATE INDEX idx_gsc_query_page ON gsc_query_data(connection_id, page_url);
CREATE INDEX idx_gsc_query_date ON gsc_query_data(date);

-- Add GSC limits to tier_limits
ALTER TABLE tier_limits
  ADD COLUMN IF NOT EXISTS gsc_properties INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gsc_data_retention_days INTEGER DEFAULT 0;

-- Set tier-specific GSC limits
UPDATE tier_limits SET gsc_properties = 0, gsc_data_retention_days = 0 WHERE tier = 'free';
UPDATE tier_limits SET gsc_properties = 1, gsc_data_retention_days = 30 WHERE tier = 'starter';
UPDATE tier_limits SET gsc_properties = 3, gsc_data_retention_days = 90 WHERE tier = 'pro';
UPDATE tier_limits SET gsc_properties = 50, gsc_data_retention_days = 365 WHERE tier = 'agency';
UPDATE tier_limits SET gsc_properties = NULL, gsc_data_retention_days = NULL WHERE tier = 'enterprise';
