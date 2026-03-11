# PagePulser Tier Capabilities

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

## Exports

| | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| PDF export | - | Yes | Yes | Yes | Yes |
| PDF branding | - | Site colors/name | Site colors/name | Full white-label | Full white-label |
| CSV export | - | - | Yes | Yes | Yes |
| JSON export | - | - | Yes | Yes | Yes |
| White-label | - | - | - | Yes | Yes |

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
| Milestone: 5 referrals | Free Starter (30d) | Free Starter (30d) | Free Starter (30d) | Free Starter (30d) | Free Starter (30d) |
| Milestone: 10 referrals | Free Pro (30d) | Free Pro (30d) | Free Pro (30d) | Free Pro (30d) | Free Pro (30d) |

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

## Notes

- **Site owner's tier determines feature availability** for all users on that site (not the running user's tier).
- **Concurrent audit limits are per-user**, not per-site — prevents shared users from monopolizing the queue.
- **"Unlimited"** is represented as `NULL` in the database.
- **Domain locking** (Free tier) means the user's single domain can only be changed once per month.
- **Competitor comparison** columns exist in the database but are currently disabled across all tiers.
