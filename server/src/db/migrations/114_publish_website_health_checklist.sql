-- Migration: 114_publish_website_health_checklist.sql
-- Publishes the Website Health Checklist with the real, finalised content.
-- Updates the content_hash to match the source MD at
-- server/src/data/resources/website-health-checklist/source.md
-- and refreshes the public preview to sell the full download.

UPDATE gated_resources
SET
  content_hash = '1e96a58fe47af8c8782420b0d1b85201505f9da9f50527ae1532c501cf62337a',
  page_count = 7,
  subtitle = 'The 85 checks every website should pass before launch',
  preview_md = E'## A preview of what is inside\n\nEvery check is either a binary pass/fail or a "review this and decide" prompt. Items marked **[critical]** mean the site should not ship without them. Here are a few examples from each pillar.\n\n### SEO\n- Confirm `robots.txt` does not block production routes that should be indexed.\n- Every page has a unique meta description between 120 and 160 characters.\n- Homepage carries `Organization` JSON-LD with `name`, `url`, and `logo`.\n\n### Accessibility\n- Every interactive element is reachable and operable by keyboard alone.\n- Text contrast meets 4.5:1 for body, 3:1 for large text.\n- Skip-to-content link is the first focusable element on every page.\n\n### Security\n- HSTS header is set with a year-long max-age and the preload flag.\n- Session cookies have `Secure`, `HttpOnly`, and `SameSite=Lax` or stricter.\n- Admin paths return `404` or `403` from the public site.\n\n### Performance\n- Largest Contentful Paint is under 2.5s on mobile.\n- Images are served in WebP or AVIF with explicit width and height.\n- Static assets have a 1-year `Cache-Control` with hashed filenames.\n\n### Content quality\n- Articles show `datePublished` and `dateModified` prominently.\n- No broken internal links anywhere on the site.\n- Author pages exist for every named byline, with verified profile links.\n\n### AI readiness (AEO)\n- Key facts appear in the first 100 words of any page that should be cited.\n- `Person` and `Organization` schema link out via `sameAs` to verified profiles.\n- The site is reachable by `GPTBot`, `ClaudeBot`, `PerplexityBot` and friends.\n\nGet the full 85-check version, including 16 critical items and a post-launch quarterly review, below.',
  updated_at = NOW(),
  published = true
WHERE slug = 'website-health-checklist';
