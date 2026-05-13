-- Migration: 111_create_gated_resources.sql
-- Gated resource library: catalogue, anonymous email leads, download tokens, download log.
-- See /docs/gated-resources.md for the full feature plan.

-- ── Catalogue ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gated_resources (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              VARCHAR(120) UNIQUE NOT NULL,
  title             VARCHAR(200) NOT NULL,
  subtitle          VARCHAR(300),
  hook              VARCHAR(400) NOT NULL,
  category          VARCHAR(30) NOT NULL
    CHECK (category IN (
      'seo', 'accessibility', 'security', 'performance',
      'content-quality', 'structured-data', 'eeat', 'aeo',
      'guides', 'case-studies', 'product-updates'
    )),
  audience          VARCHAR(200),
  description       TEXT NOT NULL,
  preview_md        TEXT NOT NULL,
  source_md_path    VARCHAR(400) NOT NULL,
  formats           TEXT[] NOT NULL DEFAULT ARRAY['md','pdf','html']
    CHECK (formats <@ ARRAY['md','pdf','html','docx']),
  content_hash      VARCHAR(64) NOT NULL,
  page_count        INTEGER,
  published         BOOLEAN NOT NULL DEFAULT false,
  download_count    INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gated_resources_published_category
  ON gated_resources (published, category);

-- ── Anonymous email leads ────────────────────────────────────────────
-- One row per (resource, normalised email). User registration links these
-- back to a user_id via the auth flow.
CREATE TABLE IF NOT EXISTS gated_resource_leads (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id        UUID NOT NULL REFERENCES gated_resources(id) ON DELETE CASCADE,
  email              VARCHAR(320) NOT NULL,
  email_normalised   VARCHAR(320) NOT NULL,
  consent_newsletter BOOLEAN NOT NULL DEFAULT false,
  referer            VARCHAR(2000),
  utm_source         VARCHAR(200),
  utm_medium         VARCHAR(200),
  utm_campaign       VARCHAR(200),
  ip_hash            VARCHAR(64),
  user_agent         VARCHAR(500),
  user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resource_id, email_normalised)
);

CREATE INDEX idx_gated_resource_leads_email
  ON gated_resource_leads (email_normalised);
CREATE INDEX idx_gated_resource_leads_user
  ON gated_resource_leads (user_id) WHERE user_id IS NOT NULL;

-- ── Download tokens ──────────────────────────────────────────────────
-- One token unlocks every format of one resource for 7 days. Reusable.
-- Token itself is the primary key (32-byte base64url string).
CREATE TABLE IF NOT EXISTS gated_resource_tokens (
  token         VARCHAR(64) PRIMARY KEY,
  resource_id   UUID NOT NULL REFERENCES gated_resources(id) ON DELETE CASCADE,
  lead_id       UUID REFERENCES gated_resource_leads(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  uses_count    INTEGER NOT NULL DEFAULT 0,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (lead_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX idx_gated_resource_tokens_expires
  ON gated_resource_tokens (expires_at);
CREATE INDEX idx_gated_resource_tokens_resource
  ON gated_resource_tokens (resource_id);

-- ── Per-download audit log ──────────────────────────────────────────
-- Records every download for analytics, lead scoring, and abuse tracking.
CREATE TABLE IF NOT EXISTS gated_resource_downloads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id   UUID NOT NULL REFERENCES gated_resources(id) ON DELETE CASCADE,
  format        VARCHAR(10) NOT NULL CHECK (format IN ('md','pdf','html','docx')),
  lead_id       UUID REFERENCES gated_resource_leads(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  token_id      VARCHAR(64) REFERENCES gated_resource_tokens(token) ON DELETE SET NULL,
  ip_hash       VARCHAR(64),
  referer       VARCHAR(2000),
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gated_resource_downloads_resource
  ON gated_resource_downloads (resource_id, downloaded_at DESC);
CREATE INDEX idx_gated_resource_downloads_user
  ON gated_resource_downloads (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_gated_resource_downloads_lead
  ON gated_resource_downloads (lead_id) WHERE lead_id IS NOT NULL;
