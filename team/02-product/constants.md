<!-- Version: 1 | Department: product | Updated: 2026-03-24 -->

# Product Constants — Single Source of Truth

All departments referencing quantitative values must use these numbers. Do not approximate or invent values — read them from here.

## Tier Limits

| Constant | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| **Monthly price** | $0 | $19 | $49 | $99 | Custom |
| **Annual price** | $0 | $190 | $490 | $990 | Custom |
| Max pages per audit | 50 | 250 | 1,000 | 5,000 | 10,000 |
| Max crawl depth | 3 | 5 | 10 | 10 | 10 |
| Audits per month | 5 | 10 | Unlimited | Unlimited | Unlimited |
| Concurrent audits | 1 | 3 | 10 | 50 | 100 |
| Max sites | 1 | 3 | 10 | 50 | Unlimited |
| Members per site | 0 | 1 | 3 | 10 | Unlimited |
| Max seats | 1 | 1 | 5 | Unlimited | Unlimited |
| Data retention | 30 days | 90 days | 1 year | 2 years | Unlimited |
| API requests/day | 100 | 1,000 | 10,000 | 100,000 | Unlimited |
| API requests/minute | 10 | 60 | 300 | 1,000 | 2,000 |

## Available Checks by Tier

| Check | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| SEO | Yes | Yes | Yes | Yes | Yes |
| Security | Yes | Yes | Yes | Yes | Yes |
| Content | Yes | Yes | Yes | Yes | Yes |
| Accessibility | — | Yes | Yes | Yes | Yes |
| Performance | — | Yes | Yes | Yes | Yes |
| File Extraction | — | Yes | Yes | Yes | Yes |
| Structured Data | — | — | — | Yes | Yes |
| Google Dorking | — | — | Yes | Yes | Yes |
| E-E-A-T Analysis | — | — | Yes | Yes | Yes |
| AEO Analysis | — | — | Yes | Yes | Yes |

## Feature Gating (New Features)

| Feature | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| Content Quality Score (single number) | Yes | Yes | Yes | Yes | Yes |
| CQS breakdown (5 sub-scores) | — | Yes | Yes | Yes | Yes |
| CQS per-page detail + trends | — | — | Yes | Yes | Yes |
| Fix snippets (code) | — | Yes | Yes | Yes | Yes |
| Fix explanations (text) | Yes | Yes | Yes | Yes | Yes |
| EAA Compliance status badge | Yes | Yes | Yes | Yes | Yes |
| EAA Compliance full report | — | — | Yes | Yes | Yes |
| EAA Compliance PDF export | — | — | Yes | Yes | Yes |
| Shareable audit reports (48h links) | — | — | Yes | Yes | Yes |
| Accessibility statement generator | — | — | Yes | Yes | Yes |
| Public audit badge | — | Yes | Yes | Yes | Yes |
| Anomaly detection alerts | — | Yes | Yes | Yes | Yes |
| PDF export | — | Yes | Yes | Yes | Yes |
| CSV/JSON export | — | — | Yes | Yes | Yes |
| White-label exports | — | — | — | Yes | Yes |
| Scheduled audits | — | Yes | Yes | Yes | Yes |

## Scheduling Intervals

| Tier | Minimum Interval |
|---|---|
| Free | No scheduling |
| Starter | 7 days |
| Pro | 1 day |
| Agency | 1 hour |
| Enterprise | 15 minutes |

## Content Quality Score Weights

| Sub-Score | Weight | Source Module |
|---|---|---|
| Content Quality (word count, freshness, multimedia) | 25% | content-quality engine |
| E-E-A-T (experience, expertise, authority, trust) | 25% | eeat engine |
| Readability (Flesch-Kincaid, Gunning Fog, ARI) | 20% | readability engine |
| Engagement (hooks, CTAs, power words, transitions) | 15% | engagement engine |
| Content Structure (heading hierarchy, paragraphs) | 15% | content-structure engine |

## EAA Compliance Thresholds

| Status | Criteria |
|---|---|
| Compliant | 0 critical AND 0 serious accessibility findings |
| Partially Compliant | 0 critical AND ≤5 serious accessibility findings |
| Non-Compliant | Any critical findings OR >5 serious findings |
| Not Assessed | Accessibility checks not included in audit |

## Referral Program

| Constant | Value |
|---|---|
| Bonus audits per referral (referrer) | 5 (Free/Starter), 8 (Pro), 12 (Agency/Enterprise) |
| Bonus audits per referral (referee) | 3 (all tiers) |
| Max referrals per month | 50 |
| Milestone: 5 referrals | Free Starter (30 days) |
| Milestone: 10 referrals | Free Pro (30 days) |
| Qualification criteria | Email verified + first audit completed |

## Early Access (Founding Members)

| Constant | Value |
|---|---|
| Total spots | 200 |
| Trial tier | Agency |
| Trial duration | 30 days |
| Lifetime discount | 50% |
| Tracking channels | `?ea=email`, `?ea=social` |
