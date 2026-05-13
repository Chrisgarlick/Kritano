-- Migration: 112_seed_gated_resources.sql
-- Seeds the P0 Website Health Checklist as an unpublished placeholder so the
-- catalogue has at least one row to exercise the delivery pipeline end to end.
-- Flip published=true once the source MD is finalised.

INSERT INTO gated_resources (
  slug,
  title,
  subtitle,
  hook,
  category,
  audience,
  description,
  preview_md,
  source_md_path,
  formats,
  content_hash,
  page_count,
  published
)
VALUES (
  'website-health-checklist',
  'The Website Health Checklist',
  'The 80 checks every website should pass before launch',
  'A printable checklist covering all six audit pillars: accessibility, SEO, security, performance, content quality, and AI readiness.',
  'guides',
  'Agency owners, in-house developers, marketing leads',
  'A practical, reusable checklist agencies print and run with clients. Developers run it pre-launch. Marketers use it as a brief for their dev team. Covers the same six pillars Kritano audits automatically, so the manual version doubles as a tour of what the platform does for you.',
  E'## What the checklist covers\n\n- Accessibility: WCAG 2.2 AA fundamentals, keyboard traps, ARIA misuse\n- SEO: crawlability, canonicals, schema, metadata\n- Security: headers, TLS, third-party scripts\n- Performance: Core Web Vitals, caching, render-blocking resources\n- Content quality: readability, freshness, E-E-A-T signals\n- AI readiness: AEO, citation-friendly structures, schema completeness\n\nGet the full 80-check version below.',
  'resources/website-health-checklist/source.md',
  ARRAY['md','pdf'],
  'defdccf46613a213be2d036b52c91f5431e2f90781f30f0a2dbcd56443453cfd',
  6,
  false
)
ON CONFLICT (slug) DO NOTHING;
