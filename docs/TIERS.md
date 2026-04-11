# Kritano Tier Capabilities

## Audit & Crawl Limits

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| Max pages per audit | 50 | 250 | 1,000 | 5,000 | 10,000 |
| Max crawl depth | 3 | 5 | 10 | 10 | 10 |
| Audits per month | 5 | 10 | Unlimited | Unlimited | Unlimited |
| Concurrent audits | 1 | 3 | 10 | 50 | 100 |

## Available Checks

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| SEO | Yes | Yes | Yes | Yes | Yes |
| Security | Yes | Yes | Yes | Yes | Yes |
| Content | Yes | Yes | Yes | Yes | Yes |
| Accessibility | - | Yes | Yes | Yes | Yes |
| Performance | - | Yes | Yes | Yes | Yes |
| File Extraction | - | Yes | Yes | Yes | Yes |
| Structured Data | - | - | - | Yes | Yes |
| Google Dorking | - | - | Yes | Yes | Yes |
| E-E-A-T Analysis | - | - | Yes | Yes | Yes |
| AEO Analysis | - | - | Yes | Yes | Yes |
| Mobile Audit Pass | - | Yes | Yes | Yes | Yes |

## Google Search Console

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| GSC connections | - | 1 | 3 | 50 | Unlimited |
| GSC data retention | - | 30 days | 90 days | 1 year | Unlimited |
| Top queries & pages | - | Yes | Yes | Yes | Yes |
| CTR opportunity finder | - | Yes | Yes | Yes | Yes |
| Cannibalisation detection | - | Yes | Yes | Yes | Yes |

## Sites & Sharing

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| Max sites | 1 | 3 | 10 | 50 | Unlimited |
| Members per site | 0 | 1 | 3 | 10 | Unlimited |
| Domain locking | Yes | - | - | - | - |

## Scheduling

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| Scheduled audits | - | Yes | Yes | Yes | Yes |
| Min schedule interval | - | 7 days | 1 day | 1 hour | 15 minutes |

## Exports & Sharing

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| PDF export | - | Yes | Yes | Yes | Yes |
| PDF branding | - | Site colors/name | Site colors/name | Full white-label | Full white-label |
| CSV export | - | - | Yes | Yes | Yes |
| JSON export | - | - | Yes | Yes | Yes |
| White-label | - | - | - | Yes | Yes |
| Shareable audit reports | - | - | Yes (48h links) | Yes (48h links) | Yes (48h links) |
| Accessibility statement generator | - | - | Yes | Yes | Yes |
| Public audit badge | - | Yes | Yes | Yes | Yes |
| Fix snippets (code) | - | Yes | Yes | Yes | Yes |
| Fix explanations (text) | Yes | Yes | Yes | Yes | Yes |
| EAA compliance status | Yes | Yes | Yes | Yes | Yes |
| EAA compliance full report | - | - | Yes | Yes | Yes |
| EAA compliance PDF export | - | - | Yes | Yes | Yes |
| Content Quality Score (number) | Yes | Yes | Yes | Yes | Yes |
| CQS breakdown (5 sub-scores) | - | Yes | Yes | Yes | Yes |
| CQS per-page detail + trends | - | - | Yes | Yes | Yes |

## AI Generate (SEO & Content)

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| AI Generate access | - | - | Yes | Yes | Yes |
| Generations per day | - | - | 20 | 50 | Unlimited |
| Generations per month | - | - | 200 | 500 | Unlimited |
| Keyword suggestions | - | - | Yes | Yes | Yes |
| Meta description rewrites | - | - | Yes | Yes | Yes |
| Title tag suggestions | - | - | Yes | Yes | Yes |
| Content improvement plan | - | - | Yes | Yes | Yes |
| Opening hook rewrites | - | - | Yes | Yes | Yes |
| Alt text suggestions | - | - | Yes | Yes | Yes |

## API & Data

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| API requests/day | 100 | 1,000 | 10,000 | 100,000 | Unlimited |
| API requests/minute | 10 | 60 | 300 | 1,000 | 2,000 |
| Data retention | 30 days | 90 days | 1 year | 2 years | Unlimited |

## Teams

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| Max seats | 1 | 1 | 5 | Unlimited | Unlimited |

## Referrals

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| Bonus audits per referral | 5 | 5 | 8 | 12 | 12 |
| Referred user bonus | 3 | 3 | 3 | 3 | 3 |
| Max referrals/month | 50 | 50 | 50 | 50 | 50 |
| Milestone: 5 referrals | Starter features (30d) | Starter features (30d) | Starter features (30d) | Starter features (30d) | Starter features (30d) |
| Milestone: 10 referrals | Pro features (30d) | Pro features (30d) | Pro features (30d) | Pro features (30d) | Pro features (30d) |

## Admin Features (not tier-gated)

| Feature | Description |
|---|---|
| SEO Manager | Admin can manage meta tags, OG data, and structured data for all app routes |

## Early Access (Founding Members)

| Feature | Details |
|---|---|
| Total spots | 200 (shared across email & social channels) |
| Trial duration | 30 days (Agency tier) |
| Lifetime discount | 50% (stored on user record for Stripe) |
| Tracking channels | `?ea=email` and `?ea=social` |
| Activation | Admin triggers all at once from admin panel |

## Pricing

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| Monthly | $0 | $19/mo | $49/mo | $99/mo | Custom |
| Annual | $0 | $190/yr | $490/yr | $990/yr | Custom |
| Annual saving | - | $38 (2 months free) | $98 (2 months free) | $198 (2 months free) | - |

## Notes

- **Site owner's tier determines feature availability** for all users on that site (not the running user's tier).
- **Concurrent audit limits are per-user**, not per-site — prevents shared users from monopolizing the queue.
- **"Unlimited"** is represented as `NULL` in the database.
- **Domain locking** (Free tier) means the user's single domain can only be changed once per month.
- **Competitor comparison** columns exist in the database but are currently disabled across all tiers.
- **Shareable audit reports** generate time-limited (48h) public URLs for sharing results externally.
- **Accessibility statement generator** creates a WCAG-conformant accessibility statement from audit findings (template-based).
- **Public audit badge** is an embeddable SVG showing the site's latest overall score, hosted at `/api/public/badges/:siteId.svg`.
- **Annual billing** offers 2 months free (10 months charged for 12 months of service). Stripe price IDs must be configured manually.
- **Content Quality Score (CQS)** is a weighted average of 5 content sub-scores: quality (25%), E-E-A-T (25%), readability (20%), engagement (15%), structure (15%).
- **Fix snippets** provide template-based code fixes for the top 50 most common findings. Templates are code-side, not database-stored.
- **EAA Compliance Passport** maps WCAG findings to EN 301 549 clauses and derives compliance status. Automated testing only — disclaimer required.
- **Mobile audit pass** re-visits crawled pages with a mobile viewport and user agent. Runs accessibility (axe-core) and performance engines only — catches touch target issues, reflow problems, mobile CLS, and responsive layout bugs. Findings are tagged with `device_type` (desktop/mobile/both). Desktop crawl discovers pages; mobile pass audits them.
