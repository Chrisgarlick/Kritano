# Data Audit

**Overall Assessment:** ADEQUATE
**Score:** 6/10

## What's Working Well

1. **Solid user-facing analytics stack**: The `analytics.service.ts` provides comprehensive score history, issue trends, audit comparison, site comparison, and URL-level analytics. Users get meaningful data about their sites over time with trend calculations and severity breakdowns.

2. **Well-structured admin funnel**: The conversion funnel (Registered > Verified Email > First Audit > Domain Verified > Paid Subscriber) tracks the exact stages that matter for a SaaS product. The stage-to-stage drop-off visualization on the frontend is actionable and well-designed.

3. **Good query authorization patterns**: Every analytics route verifies that the requesting user has access to the requested sites/audits via ownership or shared access checks before returning data. This prevents data leakage between tenants.

4. **Revenue dashboard has the basics**: MRR, ARR, ARPU, per-tier breakdown, churn count, and net MRR change are all present. The config-driven pricing approach is pragmatic pre-Stripe and the code acknowledges this is temporary.

5. **Score distribution with percentiles**: The global trends page shows P10/median/P90 distributions per category, which is genuinely useful for understanding platform health rather than just averages.

## Issues Found

### SQL Injection Risk in Score Distribution Query
**Severity:** HIGH
**Location:** `/Users/chris/Herd/pagepulser/server/src/services/admin-analytics.service.ts` (lines 226-234)
**Finding:** The `getGlobalTrends` function interpolates the column name directly into SQL using template literals (`${col}`). While the `categories` array is hardcoded so this is not exploitable via user input today, it violates the principle of defense in depth and is a maintenance hazard. If someone refactors the categories to come from a parameter, it becomes a direct SQL injection vector.
**Impact:** Not currently exploitable, but a dangerous pattern that could become a vulnerability during future refactoring.
**Recommendation:** Use a whitelist validation function and/or a `CASE` expression in SQL rather than string interpolation. Alternatively, add a runtime check that `col` matches `/^[a-z_]+_score$/`.

### No Caching on Analytics Queries
**Severity:** HIGH
**Location:** `/Users/chris/Herd/pagepulser/server/src/services/analytics.service.ts`, `/Users/chris/Herd/pagepulser/server/src/services/admin-analytics.service.ts`
**Finding:** Every analytics request executes fresh database queries -- many of them expensive (aggregations, percentile calculations, multi-table joins). Redis is available in the infrastructure but is not used for analytics caching. The `getGlobalTrends` function runs 8+ sequential queries (one per score category plus totals, top issues, and tier breakdown) on every request.
**Impact:** As the platform scales, analytics endpoints will become a performance bottleneck and put unnecessary load on the database. Admin pages that are viewed frequently will repeatedly compute the same expensive aggregates.
**Recommendation:** Add Redis caching with short TTLs (60-300 seconds) for admin analytics endpoints. Consider materialized views or a periodic aggregation job for global trends data.

### N+1 Query Pattern in Global Trends
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/pagepulser/server/src/services/admin-analytics.service.ts` (lines 225-244)
**Finding:** The score distribution calculation loops through 6 categories and runs a separate `PERCENTILE_CONT` query for each one. This is 6 sequential round-trips to the database that could be a single query.
**Impact:** Adds unnecessary latency to every global trends request (6 round-trips instead of 1).
**Recommendation:** Combine into a single query that computes percentiles for all categories at once using conditional aggregation, or use `LATERAL JOIN` patterns.

### No User Behavior / Product Analytics
**Severity:** MEDIUM
**Location:** System-wide
**Finding:** There is no user behavior tracking at all -- no page views, feature usage, session tracking, or event logging. The analytics are purely about audit data (scores, issues). There is no way to answer questions like: "Which features do users engage with most?", "What is the average time to first audit?", "How many users view the analytics dashboard?", "What is the user retention curve?"
**Impact:** Significant blind spot for product decisions. Without product analytics, growth optimization is based on guesswork rather than data.
**Recommendation:** Implement a lightweight event tracking system (even a simple `user_events` table with `user_id, event_name, properties, created_at`) or integrate PostHog/Plausible for privacy-respecting product analytics.

### Revenue Metrics Are Estimated, Not Real
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/pagepulser/server/src/services/admin-analytics.service.ts` (lines 21-27, 292-364)
**Finding:** Revenue calculations use hardcoded tier prices multiplied by subscription counts. This does not account for discounts, failed payments, prorated charges, refunds, or currency differences. The churn detection relies on `updated_at` on cancelled subscriptions rather than actual payment events.
**Impact:** Revenue numbers shown in the admin dashboard may diverge significantly from actual revenue once real payments are flowing. Churn figures may be inaccurate if subscriptions are updated for other reasons.
**Recommendation:** Once Stripe is live, replace with actual Stripe revenue data via webhook events. Track real payment events (invoice.paid, charge.refunded, etc.) in a dedicated table for accurate MRR calculation.

### SiteCard Trend Always Shows "Stable"
**Severity:** LOW
**Location:** `/Users/chris/Herd/pagepulser/client/src/pages/analytics/AnalyticsDashboard.tsx` (line 67)
**Finding:** The `SiteCard` component hardcodes `const trend: 'improving' | 'declining' | 'stable' = 'stable'` with a comment saying "Determine trend based on score history if available". The trend is never actually calculated. Every site always shows "Stable" regardless of actual performance.
**Impact:** Misleading UI -- users see a trend badge that conveys no real information. Reduces trust in the analytics dashboard.
**Recommendation:** Pass trend data from the API (the backend `getUserOverview` already calculates trends for sites) and use it in the component.

### No Historical Revenue Tracking
**Severity:** LOW
**Location:** `/Users/chris/Herd/pagepulser/server/src/services/admin-analytics.service.ts`
**Finding:** Revenue analytics only show a current snapshot (current MRR, current tier counts). There is no time-series data for revenue -- no MRR over time chart, no month-over-month growth rate, no historical churn rate tracking.
**Impact:** Cannot visualize revenue growth trajectory, spot trends, or measure the impact of pricing changes over time.
**Recommendation:** Create a `revenue_snapshots` table that stores daily MRR snapshots (a simple cron job). This enables historical revenue charts with minimal effort.

## Opportunities

1. **Add a lightweight event tracking table**: A simple `analytics_events(id, user_id, event_name, properties jsonb, created_at)` table would unlock feature usage tracking, activation analysis, and retention cohorts without any external dependency.

2. **Implement cohort analysis for admin**: Track weekly/monthly cohorts showing retention (% of users who return to run audits in subsequent weeks). This is the single most important growth metric missing from the admin dashboard.

3. **Add export/download for admin analytics**: The admin analytics pages have no data export capability. Adding CSV export for funnel data, trends, and revenue would enable offline analysis and reporting.

4. **Pre-compute expensive aggregates**: Use BullMQ (already in the stack) to run a periodic job that materializes global trends, score distributions, and funnel counts into a cache or summary table. This eliminates the performance concern and enables instant page loads for admin analytics.

5. **Track audit-to-action metrics**: Measure whether users take action after viewing audit results (e.g., re-audit within X days, score improvement rate). This would demonstrate product value and could be surfaced to users as a motivational metric.

## Summary

PagePulser's analytics infrastructure has a solid foundation for its core use case -- tracking audit scores, issue trends, and site health over time. The user-facing analytics are well-thought-out with score history, comparisons, and trend detection. The admin funnel and revenue dashboards cover the essential SaaS metrics. However, there are meaningful gaps: no product analytics or user behavior tracking exists, revenue figures are estimates rather than real payment data, expensive queries run uncached on every request, and the admin dashboard lacks historical time-series for key business metrics. The hardcoded "Stable" trend badge on the analytics dashboard is a small but telling example of unfinished work. The SQL interpolation pattern in admin-analytics, while not currently exploitable, should be cleaned up. With caching, a simple event tracking system, and revenue snapshot storage, the data layer would move from adequate to strong.
