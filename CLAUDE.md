# Claude Code Instructions

## CI/CD
We do NOT use GitHub Actions or any CI/CD pipeline. We don't want automated workflows running on every push. Tests and linting are run locally as needed. Do NOT create `.github/workflows/` files or suggest adding CI pipelines.

## Competitors
Competitors should NEVER be brought back into the application. A user would be able to scan their competitors and only have it on a small amount of domains. We do NOT want to promote scanning of websites that are NOT verified, even though users may still do it. 

## Cold Outreach 
All cold outreach emails will be sent manually by hand to ensure personalisation is kept high. It will be sent externally through my mailbox rather than through the app. 

## Tiers 
Whenever there is a new feature added, always update the tiers.md file and the front end to reflect new changes. 

## Audit Exports
Whenever anything is added to an audit, it should always appear on any export, whether it's PDF, CSV or anything new. New features should always be added to replicate this.

## Security
Security is a must. This app needs to be as secure as possible - we don't want users to be able to edit their plans for example in the front end. 

## Audit Issues
Please always use the unique amount of issues rather than the total issues.

## Free Resources Library — Cross-linking from blog content

Kritano publishes a free, email-gated resource library at `/resources`. Every published blog post in a supported category already gets an automatic end-of-post anchor card pointing at the most relevant resource (this is wired in `blog-ssr.service.ts`, no action needed).

**Additionally**, whenever a blog post is written by the `/blog` skill, the `/trend` skill, or any other content-generation flow, the author should look for natural in-body opportunities to reference a relevant resource. Mid-post references convert better than end-of-post cards and reinforce internal linking for SEO and AEO.

### Current published resources

| Slug | Topic | When to reference |
|---|---|---|
| `website-health-checklist` | 85-check pre-launch audit across all 6 pillars | Any post about site quality, multi-pillar audits, launch readiness, or "what should I check" |
| `website-launch-checklist` | 65-check launch timeline (T-7 to T+7) | Any post about launching, migrations, DNS, pre/post-launch process |
| `eaa-compliance-guide` | European Accessibility Act / EN 301 549 deep dive | Any post about EAA, accessibility law, EU compliance, accessibility statements |
| `wcag-quick-reference-card` | 20 most-common WCAG 2.2 failures with fixes | Any post about WCAG, screen readers, keyboard navigation, contrast, ARIA, accessibility fixes |
| `aeo-optimisation-guide` | How to get cited by ChatGPT/Claude/Perplexity/Gemini | Any post about AEO, AI search, citation, LLM crawlers, content frontloading |

### Rules

1. **Only reference a resource if it genuinely adds value at that point in the post.** Forced links read as spammy and devalue both the post and the resource.
2. **Reference URL is always** `/resources/<slug>` (relative, no domain) — works in dev, staging, and prod identically.
3. **Phrase it as a useful tip, not a CTA**: prefer "We've packaged the 20 most-common WCAG failures and their fixes into a one-page reference card (`/resources/wcag-quick-reference-card`)" over "Download our free WCAG checklist!"
4. **At most one resource link per blog post body**, ideally placed after a relevant H2 where a reader who just read that section would benefit. The auto-injected end-of-post anchor card handles the redundant top-of-funnel CTA.
5. **Skip the cross-link entirely if no resource is a strong match** for the post's topic. The end-of-post anchor still appears via category mapping; the body stays clean.

## Database Migrations

Migration files live in `server/src/db/migrations/`. The runner (`server/src/db/migrate.ts`) automatically wraps each migration in a transaction. If a migration uses `CREATE INDEX CONCURRENTLY` (or any other `CONCURRENTLY` operation), it **must not** be wrapped in `BEGIN`/`COMMIT` — the runner detects `CONCURRENTLY` and skips the transaction automatically. Never add explicit `BEGIN`/`COMMIT` to migration files that use `CONCURRENTLY`.

## Project Context

This is **Kritano**, a web accessibility auditing SaaS platform built with:
- **Backend**: Node.js, Express, PostgreSQL, BullMQ
- **Frontend**: React, TypeScript, Tailwind CSS
- **Infrastructure**: Docker, Redis

## Brand Guidelines (IMPORTANT)

When implementing any UI changes, **always reference the brand guidelines** at `/docs/BRAND_GUIDELINES.md`.

This includes:
- **Colors**: Use the indigo primary palette (`indigo-600` as primary brand color) and amber accent palette
- **Typography**: Instrument Serif for display, Outfit for body, JetBrains Mono for code
- **Spacing**: 4px base unit with 8px primary scale
- **Components**: Follow button, card, and input patterns defined in the guidelines
- **Semantic Colors**: Use defined colors for status states (pending, processing, completed, failed) and severity levels (critical, serious, moderate, minor, info)

Quick reference:
- Primary buttons: `bg-indigo-600 hover:bg-indigo-700 text-white`
- Secondary buttons: `bg-white border-slate-200 text-slate-700 hover:bg-slate-50`
- Cards: `bg-white border border-slate-200 rounded-lg shadow-sm p-6`
- Focus states: `ring-2 ring-indigo-500/20 border-indigo-500`

## Project Documentation Requirements

### Ultrathink Plans

Every `ultrathink` plan must be stored in the `/docs` folder with a descriptive filename.

When asked to create an "ultrathink" plan (a comprehensive, in-depth implementation plan), you must:

1. Create the plan document in `/docs/<feature-name>.md`
2. Include the following sections:
   - Overview/Summary
   - Key Decisions
   - Database Changes (if applicable)
   - Backend Changes (if applicable)
   - Frontend Changes (if applicable)
   - Critical Files Summary
   - Testing Plan
   - Implementation Order

This ensures all major architectural decisions and implementation details are documented and accessible for future reference. After a plan has been implemented, add 'DONE_' to the front of the file name.

### Example

If asked to "ultrathink plan" a feature called "user notifications", create:
- `/docs/user-notifications.md`

## Key Documentation

- `/docs/BRAND_GUIDELINES.md` - Brand identity, color system, typography, and component patterns
- `/docs/liability-protection-system.md` - Domain verification, consent logging, and scan restrictions
