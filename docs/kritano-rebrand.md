# Kritano Rebrand: Full Implementation Plan

**Scope:** Rename every reference from "PagePulser" / "pagepulser" to "Kritano" / "kritano" across the entire codebase.
**Scale:** ~2,080 occurrences across ~298 files.
**Prepared:** 27 March 2026

---

## Overview

This plan covers the complete rebrand from PagePulser to Kritano. The visual identity (indigo palette, Instrument Serif, Outfit, JetBrains Mono, component patterns) is **unchanged** -- only the name, taglines, bot identity, and verbal identity change.

### Brand Identity (from Strategy)

- **Name:** Kritano (capital K, lowercase remainder)
- **Pronunciation:** kri-TAH-no (stress on second syllable, rhymes with Milano)
- **Origin:** Greek *krites* meaning judge/evaluator
- **Primary tagline:** "Every page, fully judged."
- **Secondary tagline:** "Six audits. One clear score."
- **Bot user agent:** `KritanoBot/1.0 (+https://kritano.com/bot)`
- **Domain:** kritano.com (to be registered)

---

## Key Decisions

1. **Domain verification tokens change:** `pagepulser-verify=` becomes `kritano-verify=`, `.well-known/pagepulser-verify.txt` becomes `.well-known/kritano-verify.txt`, DNS subdomain `_pagepulser` becomes `_kritano`. **Existing verified domains will need re-verification or a migration that preserves old tokens.**
2. **Docker containers rename:** `pagepulser-db`, `pagepulser-redis`, `pagepulser-mailpit` become `kritano-db`, `kritano-redis`, `kritano-mailpit`. Database name changes from `pagepulser` to `kritano`.
3. **Email templates in DB:** Seeded via migrations. Need a NEW migration to update all template content containing "PagePulser" to "Kritano".
4. **Blog content:** All published blog posts referencing "PagePulser" need updating. New migration for any DB-stored posts.
5. **Backward compatibility for verification:** Add a migration that keeps old verification tokens working alongside new ones (grace period).

---

## Implementation Order

### Phase 1: Brand Foundation (Do First)

These files define the brand for everything else. Update them first so all downstream work references the correct name.

#### 1.1 Brand Guidelines & Strategy Docs

| File | Occurrences | Type | Notes |
|------|-------------|------|-------|
| `/docs/BRAND_GUIDELINES.md` | 10 | Brand definition | Update name, tagline, origin story, usage rules |
| `/CLAUDE.md` | 2 | Project instructions | Update project name references |
| `/README.md` | 3 | Project readme | Title, description |
| `/PROJECT.md` | Multiple | Project overview | |
| `/DEVELOPMENT.md` | 25 | Dev docs | |

#### 1.2 Skill Templates (Draw, Video, Blog)

| File | Occurrences | Type | Notes |
|------|-------------|------|-------|
| `.claude/skills/draw/SKILL.md` | 11 | Draw skill config | Brand name in skill instructions |
| `.claude/skills/draw/brand-style.md` | Multiple | Draw brand style | |
| `.claude/skills/draw/templates.md` | Multiple | Draw templates | |
| `.claude/skills/video/SKILL.md` | 9 | Video skill config | |
| `.claude/skills/video/brand-motion.md` | Multiple | Video brand motion | |
| `.claude/skills/video/templates.md` | Multiple | Video templates | |
| `.claude/skills/blog/SKILL.md` | Multiple | Blog skill config | |
| `.claude/skills/blog/tone-of-voice.md` | Multiple | Blog tone of voice | |

---

### Phase 2: Configuration & Infrastructure

#### 2.1 Package Files

| File | Occurrences | Action |
|------|-------------|--------|
| `/package.json` | 2 | Change name + description |
| `/server/package.json` | 2 | Change name + description |
| `/client/package.json` | 1 | Change name |

#### 2.2 Docker

| File | Occurrences | Action |
|------|-------------|--------|
| `/docker-compose.yml` | 7 | Rename containers: `pagepulser-db` -> `kritano-db`, `pagepulser-redis` -> `kritano-redis`, `pagepulser-mailpit` -> `kritano-mailpit`. Change postgres user/db name. |

**Post-change:** Existing Docker volumes will need migration or recreation. Document: `docker-compose down -v && docker-compose up -d` to recreate.

#### 2.3 Environment Variables

| File | Occurrences | Action |
|------|-------------|--------|
| `/server/.env.example` | 2 | Update DATABASE_URL, EMAIL_FROM |
| `/server/.env` | 3 | Update DATABASE_URL, EMAIL_FROM, seed email |
| `/.env` | 3 | Update DATABASE_URL, seed email |

**DATABASE_URL change:** `postgresql://pagepulser:...@.../pagepulser` -> `postgresql://kritano:...@.../kritano`

#### 2.4 Web Manifest & Meta

| File | Occurrences | Action |
|------|-------------|--------|
| `/client/index.html` | 9 | Update title, og:site_name, og:title, og:description, twitter tags |
| `/client/public/site.webmanifest` | 3 | Update name, short_name, description |
| `/client/public/robots.txt` | 1 | Update domain reference |
| `/client/public/sitemap.xml` | 6 | Update all domain references |

---

### Phase 3: Backend (Server)

#### 3.1 Scanner/Bot Identity (CRITICAL)

| File | Occurrences | Action |
|------|-------------|--------|
| `/server/src/constants/consent.constants.ts` | 8 | **Most critical file.** Update: user agent `PagePulser-Scanner/1.0` -> `KritanoBot/1.0`, bot URL, verification header `X-PagePulser-Token` -> `X-Kritano-Token`, verify prefix `pagepulser-verify=` -> `kritano-verify=`, well-known path `/.well-known/pagepulser-verify.txt` -> `/.well-known/kritano-verify.txt`, DNS subdomain `_pagepulser` -> `_kritano`, consent text, cookie description |

**WARNING:** Changing verification constants will break existing domain verifications. Need backward-compat migration (see Phase 5).

#### 3.2 Core Server Files

| File | Occurrences | Action |
|------|-------------|--------|
| `/server/src/index.ts` | 3 | Service name, startup message |
| `/server/src/worker.ts` | 2 | Worker name |
| `/server/src/config/auth.config.ts` | Multiple | Auth config references |

#### 3.3 Services

| File | Action |
|------|--------|
| `/server/src/services/email.service.ts` | Email subjects, from addresses (8 occurrences) |
| `/server/src/services/email-template.service.ts` | Template rendering |
| `/server/src/services/email-branding.service.ts` | Email branding/footer |
| `/server/src/services/pdf-branding.service.ts` | PDF export branding |
| `/server/src/services/site.service.ts` | Site-related text |
| `/server/src/services/domain-verification.service.ts` | Verification text |
| `/server/src/services/gdpr.service.ts` | GDPR export/deletion text |
| `/server/src/services/early-access.service.ts` | Early access text |
| `/server/src/services/webhook.service.ts` | Webhook references |
| `/server/src/services/cold-prospect/outreach.service.ts` | Outreach email text |
| `/server/src/services/cold-prospect/nrd-feed.service.ts` | NRD feed references |
| `/server/src/services/spider/coordinator.service.ts` | Crawler identification |
| `/server/src/services/spider/robots-parser.service.ts` | Bot identification |
| `/server/src/services/audit-engines/security.engine.ts` | Security audit text |

#### 3.4 Routes

| File | Action |
|------|--------|
| `/server/src/routes/index.ts` | API text |
| `/server/src/routes/sites/index.ts` | 7 occurrences |
| `/server/src/routes/audits/index.ts` | Audit-related text |
| `/server/src/routes/blog.ts` | Blog references |

---

### Phase 4: Frontend (Client)

#### 4.1 Public Pages (Customer-Facing)

| File | Occurrences | Priority |
|------|-------------|----------|
| `/client/src/pages/public/About.tsx` | 10 | HIGH |
| `/client/src/pages/public/Terms.tsx` | 10 | HIGH |
| `/client/src/pages/public/Privacy.tsx` | 5 | HIGH |
| `/client/src/pages/public/Pricing.tsx` | 2 | HIGH |
| `/client/src/pages/public/Services.tsx` | Multiple | HIGH |
| `/client/src/pages/public/Contact.tsx` | Multiple | HIGH |
| `/client/src/pages/public/SharedReport.tsx` | 7 | HIGH |
| `/client/src/pages/public/services/serviceData.ts` | Multiple | HIGH |
| `/client/src/pages/public/services/ServiceDetailPage.tsx` | Multiple | HIGH |

#### 4.2 Auth Pages

| File | Action |
|------|--------|
| `/client/src/pages/auth/Register.tsx` | Brand references |
| `/client/src/pages/auth/Login.tsx` | Brand references |
| `/client/src/pages/auth/ResetPassword.tsx` | Brand references |
| `/client/src/pages/auth/ForgotPassword.tsx` | Brand references |
| `/client/src/pages/auth/VerifyEmail.tsx` | Brand references |
| `/client/src/pages/auth/EarlyAccessSuccess.tsx` | Brand references |
| `/client/src/pages/auth/RegisterSuccess.tsx` | Brand references |
| `/client/src/pages/auth/OAuthCallback.tsx` | Brand references |

#### 4.3 Dashboard & App Pages

| File | Action |
|------|--------|
| `/client/src/pages/dashboard/Dashboard.tsx` | 1 occurrence |
| `/client/src/pages/sites/SiteDetail.tsx` | 11 occurrences |
| `/client/src/pages/audits/*` | Multiple files |
| `/client/src/pages/analytics/*` | Multiple files |
| `/client/src/pages/settings/*` | Multiple files |
| `/client/src/pages/docs/DocsOverviewPage.tsx` | 7 occurrences |
| `/client/src/pages/docs/DocsEndpointsPage.tsx` | 9 occurrences |
| `/client/src/pages/errors/ServerError.tsx` | Error page text |
| `/client/src/pages/errors/NotFound.tsx` | Error page text |
| `/client/src/pages/blog/PostListPage.tsx` | Blog page text |
| `/client/src/pages/blog/PostDetailPage.tsx` | Blog page text |

#### 4.4 Admin Pages (~51 occurrences across all admin files)

All files in `/client/src/pages/admin/` need updating:
- AdminDashboard, AdminUsers, AdminOrganizations, AdminSchedules
- AdminEarlyAccess, AdminBugReports, AdminFeatureRequests, AdminActivity
- CMS, Email, Marketing, SEO, Analytics, Cold Prospects, CRM sub-pages

#### 4.5 Layout & Components

| File | Action |
|------|--------|
| `/client/src/components/layout/PublicLayout.tsx` | Logo text, footer |
| `/client/src/components/layout/AdminLayout.tsx` | Admin header/footer |
| `/client/src/components/onboarding/OnboardingChecklist.tsx` | Onboarding text |
| `/client/src/components/onboarding/OnboardingChecklist.test.tsx` | Test assertions |
| `/client/src/components/seo/PageSeo.tsx` | SEO meta defaults |
| `/client/src/components/cookies/CookieBanner.tsx` | Cookie text |
| `/client/src/components/cookies/CookiePreferencesModal.tsx` | Cookie preferences |
| `/client/src/components/ComingSoonGuard.tsx` | Guard text |

#### 4.6 Config & Types

| File | Action |
|------|--------|
| `/client/src/config/routeRegistry.ts` | 17 occurrences — route metadata |
| `/client/src/contexts/ThemeContext.tsx` | Theme references |
| `/client/src/types/analytics.types.ts` | Type comments |

#### 4.7 Static Assets

| File | Action |
|------|--------|
| `/client/public/landing-showcase.html` | 17 occurrences |
| `/client/public/logo-showcase.html` | Multiple |

---

### Phase 5: Database Migration (CRITICAL)

Create a NEW migration file that:

#### 5.1 Update Email Templates in DB
```sql
UPDATE email_templates SET subject = REPLACE(subject, 'PagePulser', 'Kritano'),
  body_html = REPLACE(body_html, 'PagePulser', 'Kritano'),
  body_text = REPLACE(body_text, 'PagePulser', 'Kritano')
WHERE subject LIKE '%PagePulser%' OR body_html LIKE '%PagePulser%';
```

Also replace lowercase `pagepulser.com` with `kritano.com` in template URLs.

#### 5.2 Update Blog Posts in DB
```sql
UPDATE blog_posts SET title = REPLACE(title, 'PagePulser', 'Kritano'),
  content = REPLACE(content, 'PagePulser', 'Kritano'),
  slug = REPLACE(slug, 'pagepulser', 'kritano')
WHERE title LIKE '%PagePulser%' OR content LIKE '%PagePulser%';
```

#### 5.3 Update SEO Metadata in DB
```sql
UPDATE site_seo_settings SET
  meta_title = REPLACE(meta_title, 'PagePulser', 'Kritano'),
  meta_description = REPLACE(meta_description, 'PagePulser', 'Kritano'),
  og_title = REPLACE(og_title, 'PagePulser', 'Kritano'),
  og_description = REPLACE(og_description, 'PagePulser', 'Kritano')
WHERE meta_title LIKE '%PagePulser%' OR meta_description LIKE '%PagePulser%';
```

#### 5.4 Backward Compatibility for Domain Verification

Existing users have verified domains using `pagepulser-verify=` tokens, `/.well-known/pagepulser-verify.txt` files, and `_pagepulser` DNS records. The verification check logic must accept BOTH old and new formats during a transition period.

```sql
-- Add a comment documenting the transition
COMMENT ON TABLE domain_verifications IS 'Accepts both pagepulser-verify and kritano-verify tokens during rebrand transition';
```

The **code change** is in `domain-verification.service.ts` — check for both `pagepulser-verify=` AND `kritano-verify=` prefixes, both well-known paths, and both DNS subdomains.

#### 5.5 Update Marketing Content in DB
```sql
UPDATE marketing_content SET
  content = REPLACE(content, 'PagePulser', 'Kritano'),
  content = REPLACE(content, 'pagepulser.com', 'kritano.com')
WHERE content LIKE '%PagePulser%' OR content LIKE '%pagepulser%';
```

#### 5.6 Update Cold Prospect Templates
```sql
UPDATE cold_prospect_templates SET
  subject = REPLACE(subject, 'PagePulser', 'Kritano'),
  body = REPLACE(body, 'PagePulser', 'Kritano'),
  body = REPLACE(body, 'pagepulser.com', 'kritano.com')
WHERE subject LIKE '%PagePulser%' OR body LIKE '%PagePulser%';
```

---

### Phase 6: Content & Marketing Assets

#### 6.1 Blog Posts (docs/blog/)

21 blog post files need updating. All references to "PagePulser" become "Kritano". File names containing "pagepulser" should be renamed:
- `pagepulser-is-live-everything-you-need-to-know.md` -> rename with "kritano"
- `accessibility-testing-cicd-pipeline-pagepulser.md` -> rename with "kritano"

#### 6.2 Draw Skill Outputs (docs/draw/)

All existing draw outputs reference "PagePulser" in captions and HTML:
- `docs/draw/introducing-pagepulser/` — rename folder + update content
- `docs/draw/what-makes-pagepulser-different/` — rename folder + update content
- `docs/draw/how-pagepulser-prioritises-your-fixes/` — rename folder + update content

#### 6.3 Video Outputs (docs/video/)

Video captions reference "PagePulser":
- `docs/video/speed-demo/captions.md`
- `docs/video/keyboard-navigation-reel/captions.md`
- `docs/video/join-the-waitlist/captions.md`
- `docs/video/how-many-scripts/captions.md`

#### 6.4 Marketing Seed Data (Migrations)

These migration files contain marketing content with "PagePulser":
- `069_seed_marketing_month1.sql` (69 occurrences)
- `070_seed_marketing_month2.sql` (163 occurrences)
- `071_seed_marketing_month3.sql` (49 occurrences)

**Do NOT modify existing migration files.** Create a new migration that updates the content in-place (see Phase 5).

---

### Phase 7: Documentation

| File | Occurrences | Action |
|------|-------------|--------|
| `/docs/deploy.md` | 62 | Update all deployment references |
| `/docs/stripe_integration.md` | 15 | Update Stripe product names |
| `/docs/API_DOCS.md` | 7 | Update API documentation |
| `/docs/privacy_policy.md` | 6 | Update legal text |
| `/docs/cold-prospects-LIA.md` | 7 | Update LIA document |
| `/docs/resend.md` | 7 | Update email docs |
| `/docs/postgres.md` | 12 | Update DB docs |
| `/docs/test.md` | 12 | Update test docs |
| `/docs/local-email-testing.md` | Multiple | Update email testing docs |
| `/docs/brand-voice-analysis.md` | Multiple | Update brand analysis |
| `/docs/blog-ideas.md` | 8 | Update blog idea references |
| `/docs/INNOVATION.md` | 21 | Update innovation doc |
| `/COMPETITIVE_LANDSCAPE.md` | 21 | Update competitive analysis |

---

### Phase 8: Team Artifacts

| File | Occurrences | Action |
|------|-------------|--------|
| `/team/business-plan.md` | 64 | Update entire business plan |
| `/team/rebrand-names.md` | Multiple | Mark Kritano as chosen |
| `/team/01-strategy/*` | 22+ | Update strategy docs |
| `/team/02-product/*` | 7+ | Update product docs |
| `/team/03-marketing/*` | 24+ | Update marketing docs |
| `/team/04-design/*` | Multiple | Update design docs |
| `/team/05-software/*` | Multiple | Update architecture docs |
| `/team/16-full-audit/*` | Multiple | Update audit docs |
| `/team/00-project-manifest.json` | 1 | Update project name |

---

### Phase 9: Misc & Cleanup

| File | Action |
|------|--------|
| `/SPIDER_PLAN.md` | Update spider/crawler references |
| `/docs/DONE_*.md` | Update all completed plan docs |
| `/.claude/settings.local.json` | Update any brand references |
| `/.claude/commands/blog.md` | Update blog command |
| `/client/dist/*` | Will be regenerated by build — no manual update needed |

---

## Execution Strategy

### Approach: Scripted Find-and-Replace + Manual Review

The most efficient approach is:

1. **Automated replacement** for straightforward swaps:
   - `PagePulser` -> `Kritano` (all contexts)
   - `pagepulser` -> `kritano` (URLs, configs, Docker, etc.)
   - `PAGEPULSER` -> `KRITANO` (if any)
   - `pagepulser.com` -> `kritano.com` (domain references)
   - `PagePulser-Scanner/1.0` -> `KritanoBot/1.0`

2. **Manual review** for:
   - Legal documents (Terms, Privacy) — need careful wording review
   - Consent constants — verification token backward compatibility
   - Database migration — write new migration file
   - Docker compose — verify volume names
   - Blog post filenames — rename files
   - Draw/video output folders — rename folders

### Estimated Effort

| Phase | Files | Effort |
|-------|-------|--------|
| Phase 1: Brand Foundation | ~13 | 30 min |
| Phase 2: Config & Infrastructure | ~10 | 30 min |
| Phase 3: Backend | ~20 | 1 hour |
| Phase 4: Frontend | ~100+ | 2 hours (mostly automated) |
| Phase 5: Database Migration | 1 new file | 1 hour (careful) |
| Phase 6: Content Assets | ~50 | 1 hour (mostly automated) |
| Phase 7: Documentation | ~15 | 30 min |
| Phase 8: Team Artifacts | ~20 | 30 min |
| Phase 9: Misc & Cleanup | ~10 | 15 min |
| **Total** | **~298** | **~7-8 hours** |

---

## Testing Plan

After all changes:

1. **Build check:** `npm run build` in both client and server — no compile errors
2. **Docker:** `docker-compose down -v && docker-compose up -d` — containers start with new names
3. **Migration:** Run migrations — new migration applies cleanly
4. **Search audit:** `grep -ri "pagepulser" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.yml" --include="*.md" --include="*.sql" --include="*.html"` — should return zero results (excluding git history and node_modules)
5. **Visual check:** Load every public page, check title tags, meta tags, footer text, header logo text
6. **Email check:** Trigger a test email — verify sender name and body text say "Kritano"
7. **PDF export:** Run an audit and export PDF — verify branding says "Kritano"
8. **Domain verification:** Test both old (`pagepulser-verify=`) and new (`kritano-verify=`) tokens work
9. **Bot identity:** Run a crawl and check the user agent string in server logs

---

## What NOT to Change

- **Visual identity:** Colors, fonts, spacing, component patterns — all stay the same
- **Existing migration files:** Never modify committed migrations. Use new migrations to update DB content.
- **Git history:** The old name will remain in git history. That's fine.
- **Animation class names:** `pulse-glow`, `heartbeat` etc. are CSS animation names, not brand references.
- **External Stripe product names:** Update these manually in the Stripe dashboard separately.

---

## Pre-Implementation Checklist

- [ ] Register kritano.com domain
- [ ] Register @kritano on X/Twitter, LinkedIn, Instagram, GitHub
- [ ] Set up kritano.com email (Zoho or similar)
- [ ] Update Stripe product/price names in Stripe dashboard
- [ ] File UKIPO trademark for "Kritano" (Classes 9 + 42, GBP 220)
