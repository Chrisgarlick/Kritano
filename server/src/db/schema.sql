-- PagePulser Database Schema

-- Leads: Businesses found by the bot
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_url TEXT UNIQUE NOT NULL,
    contact_email TEXT,
    discovery_source TEXT,
    status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'emailed', 'converted')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audits: Summary of a scan
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    seo_score INT CHECK (seo_score >= 0 AND seo_score <= 100),
    accessibility_score INT CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
    security_score INT CHECK (security_score >= 0 AND security_score <= 100),
    report_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_audits_lead_id ON audits(lead_id);
CREATE INDEX idx_audits_created_at ON audits(created_at);
