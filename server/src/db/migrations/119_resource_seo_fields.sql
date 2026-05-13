-- Migration: 119_resource_seo_fields.sql
-- Bring gated_resources to parity with blog_posts on SEO scaffolding.
-- Adds focus_keyword, secondary_keywords, seo_title, seo_description, tags.
-- Backfills hand-tuned values for the five live resources so they ship
-- search-ready, not blank.

ALTER TABLE gated_resources
  ADD COLUMN IF NOT EXISTS focus_keyword      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_title          VARCHAR(200),
  ADD COLUMN IF NOT EXISTS seo_description    VARCHAR(400),
  ADD COLUMN IF NOT EXISTS tags               TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_gated_resources_focus_keyword
  ON gated_resources (focus_keyword) WHERE focus_keyword IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gated_resources_tags
  ON gated_resources USING GIN (tags);

-- ── Backfill ─────────────────────────────────────────────────────────

UPDATE gated_resources SET
  focus_keyword = 'website health checklist',
  secondary_keywords = ARRAY[
    'website audit checklist',
    'site quality checks',
    'pre-launch audit',
    'website launch checklist',
    'web audit 6 pillars'
  ],
  seo_title = 'Website Health Checklist (85 Free Checks) | Kritano',
  seo_description = 'A printable 85-check website audit covering accessibility, SEO, security, performance, content quality, and AI readiness. Free, by Kritano.',
  tags = ARRAY['website-audit', 'pre-launch', 'performance', 'accessibility', 'seo'],
  updated_at = NOW()
WHERE slug = 'website-health-checklist';

UPDATE gated_resources SET
  focus_keyword = 'European Accessibility Act compliance',
  secondary_keywords = ARRAY[
    'EAA compliance guide',
    'EN 301 549',
    'EU accessibility law',
    'accessibility statement',
    'WCAG 2.1 AA audit',
    'EAA deadline 2025'
  ],
  seo_title = 'European Accessibility Act Compliance Guide | Kritano',
  seo_description = 'What the EAA requires, who it applies to, and a 60-item clause-by-clause audit mapped to EN 301 549 v3.2.1. Free, by Kritano.',
  tags = ARRAY['eaa', 'accessibility', 'compliance', 'wcag', 'eu-law'],
  updated_at = NOW()
WHERE slug = 'eaa-compliance-guide';

UPDATE gated_resources SET
  focus_keyword = 'WCAG 2.2 quick reference',
  secondary_keywords = ARRAY[
    'WCAG 2.2 cheat sheet',
    'WCAG 2.2 AA failures',
    'accessibility quick reference',
    'common WCAG failures',
    'focus indicator',
    'alt text best practices'
  ],
  seo_title = 'WCAG 2.2 Quick Reference: 20 Common Failures | Kritano',
  seo_description = 'A one-page cheat sheet of the 20 most commonly failed WCAG 2.2 checks, with a pass example, a fail example, and a code fix for each.',
  tags = ARRAY['wcag', 'accessibility', 'frontend', 'cheat-sheet'],
  updated_at = NOW()
WHERE slug = 'wcag-quick-reference-card';

UPDATE gated_resources SET
  focus_keyword = 'AEO optimisation',
  secondary_keywords = ARRAY[
    'answer engine optimisation',
    'AI citation SEO',
    'how to get cited by AI',
    'ChatGPT SEO',
    'Perplexity citation',
    'content frontloading'
  ],
  seo_title = 'The AEO Optimisation Guide: AI Citation Playbook | Kritano',
  seo_description = 'How to structure content so ChatGPT, Claude, Perplexity, and Gemini cite your pages. Five pillars, a 60-point audit, and a six-week programme.',
  tags = ARRAY['aeo', 'ai-search', 'seo', 'content-strategy'],
  updated_at = NOW()
WHERE slug = 'aeo-optimisation-guide';

UPDATE gated_resources SET
  focus_keyword = 'website launch checklist',
  secondary_keywords = ARRAY[
    'pre-launch checklist',
    'launch day checks',
    'DNS migration checklist',
    'post-launch audit',
    'site launch process'
  ],
  seo_title = 'Website Launch Checklist: 65 Pre-Launch Checks | Kritano',
  seo_description = 'A 65-check timeline-organised audit for shipping a new site: T minus 7 days, launch day, T plus 24 hours, T plus 7 days. Free, by Kritano.',
  tags = ARRAY['launch', 'website-audit', 'pre-launch', 'agency'],
  updated_at = NOW()
WHERE slug = 'website-launch-checklist';
