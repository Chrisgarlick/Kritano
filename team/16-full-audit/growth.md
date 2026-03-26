# Growth Audit

**Overall Assessment:** STRONG
**Score:** 8/10

## What's Working Well

1. **Comprehensive lead scoring and lifecycle tracking.** The lead scoring service (`lead-scoring.service.ts`) has a well-thought-out scoring model with 10+ behavioral signals (email verified, first audit, domain verified, team members, exports, tier limit hits) and intelligent inactivity decay. The status derivation (new -> activated -> engaged -> power_user -> upgrade_prospect -> churning -> churned) maps cleanly to a real SaaS lifecycle and automatically identifies upgrade prospects (score >= 50 on free tier).

2. **Behavioral trigger system is genuinely sophisticated.** The CRM trigger service fires automated emails on meaningful events -- first audit completion, stalled domain verification (48h+), low AEO/content scores, security alerts, upgrade nudges on limit hits, churn risk, and score improvement celebrations. The 30-day deduplication prevents spam. Auto-send is configurable per trigger type. This is a real retention engine, not just a CRM dashboard.

3. **Early access funnel is well-designed.** The 200-spot founding member mechanic with scarcity ("X of 200 spots remaining"), source tracking (?ea=email vs ?ea=social), automatic waitlist fallback when full, and the strong post-signup success page (30-day Agency trial + 50% lifetime discount) are solid conversion tactics. The coming-soon page is clean with name + email capture.

4. **Referral program has proper mechanics.** Two-sided reward (both referrer and referee get bonus audits), clear qualification criteria (email verified + first audit completed), milestone tiers (5 referrals = free Starter, 10 = free Pro), email invite capability (up to 5 at a time), and a dedicated dashboard with progress tracking. The qualification bar is sensibly high enough to prevent gaming.

5. **Cold prospect pipeline is LIA-compliant and well-engineered.** NRD feed ingestion from WhoisDS, TLD filtering, keyword exclusion, quality scoring, generic-email-only outreach (no personal addresses), one-touch unsubscribe with JWT tokens, max 1 email per domain, daily send limits, 6-month data retention purge. This is thorough compliance work that would survive a regulatory review.

## Issues Found

### No In-App Onboarding Flow
**Severity:** HIGH
**Location:** `client/src/pages/dashboard/Dashboard.tsx`
**Finding:** There is no structured onboarding experience after registration. New users land on the dashboard with no guided flow to their first audit. The funnel page tracks "Registered -> Verified Email -> First Audit -> Domain Verified -> Paid" but there is no in-product mechanism to drive users through those steps (checklist, wizard, progress indicator, empty states with CTAs).
**Impact:** The biggest drop-off in any SaaS funnel is between registration and activation. Without onboarding, users who signed up via early access or referral may never complete their first audit, wasting acquisition spend.
**Recommendation:** Add a first-run onboarding checklist to the dashboard (verify email, add first site, run first audit, verify domain) that persists until completed. This single change typically improves activation rates by 20-40%.

### Referral Program Lacks Social Sharing
**Severity:** MEDIUM
**Location:** `client/src/pages/referrals/ReferralDashboard.tsx`
**Finding:** The referral dashboard only offers copy-link and email invite (max 5). There are no one-click social sharing buttons (Twitter/X, LinkedIn, WhatsApp) or pre-written share messages. The referral link is displayed in a monospace box with no context about what the recipient will see.
**Impact:** Social sharing is the highest-leverage referral channel for B2B SaaS. Making users manually compose messages significantly reduces sharing frequency.
**Recommendation:** Add social share buttons with pre-written messages like "I found X accessibility issues on my site in 30 seconds with PagePulser -- try it free: [link]". Include Open Graph metadata so the shared link previews well.

### Cold Outreach Contradicts CLAUDE.md Instructions
**Severity:** MEDIUM
**Location:** `server/src/services/cold-prospect/outreach.service.ts`
**Finding:** The outreach service has a full automated email sending pipeline (`processOutreachQueue`, `sendColdEmail`) that sends programmatically via SMTP/Resend. However, CLAUDE.md states: "All cold outreach emails will be sent manually by hand to ensure personalisation is kept high. It will be sent externally through my mailbox rather than through the app."
**Impact:** The automated pipeline may send emails that lack the personal touch intended by the business owner. If both systems are active, prospects could receive duplicate outreach.
**Recommendation:** Clarify the intended workflow. If manual sending is the goal, the automated send pipeline should be disabled or repurposed as a "draft queue" that surfaces prospects and pre-written templates for manual sending, rather than sending autonomously.

### No UTM/Attribution Tracking Beyond Early Access
**Severity:** MEDIUM
**Location:** `client/src/pages/auth/Register.tsx`
**Finding:** The registration page only tracks `?ea=email` and `?ea=social` for early access source attribution. Standard UTM parameters (utm_source, utm_medium, utm_campaign) from blog posts, social media, paid ads, or other campaigns are not captured and stored with the user record. There is no attribution tracking for referral-sourced registrations beyond the referral code.
**Impact:** Without attribution data, it is impossible to measure which of the 15+ blog posts, social channels, or campaigns are actually driving signups. Growth decisions are made blind.
**Recommendation:** Capture and persist UTM parameters at registration (and store them in a `user_attribution` table or JSON column). Surface this data in the CRM lead detail view alongside the existing lead scoring.

### Milestone Rewards Cap at 10 Referrals
**Severity:** LOW
**Location:** `client/src/pages/referrals/ReferralDashboard.tsx`, line 97
**Finding:** The milestone progress bar shows "5 referrals = free Starter, 10 referrals = free Pro" but after reaching 10, `nextMilestone` becomes `null` and the entire progress section disappears. There is no further incentive for power referrers.
**Impact:** The most valuable referrers -- those who have already proven they can bring in 10+ users -- are given no further motivation. These are exactly the people who should be rewarded most generously.
**Recommendation:** Add higher milestone tiers (e.g., 25 referrals = free Agency, 50 = lifetime Pro) or switch to an ongoing reward model (permanent +1 bonus audit per referral) for users past the 10-referral mark.

## Opportunities

1. **Add a "time to first value" metric to the admin funnel page.** The funnel tracks conversion counts but not speed. Measuring median time from registration to first completed audit would reveal onboarding friction and let you A/B test improvements. The data is already in `audit_jobs.created_at` vs `users.created_at`.

2. **Implement win-back email sequences for churned users.** The `churn_risk` trigger fires when status hits "churning," but there is no trigger for "churned" (60+ days inactive). A graduated sequence -- day 14 (churning nudge, already exists), day 30 (what you're missing), day 60 (last chance offer, e.g., 1 free audit) -- would recover some percentage of lost users at nearly zero cost.

3. **Leverage audit results as a viral loop.** When users complete an audit, there is no prompt to share their score or report. Adding a "Share your accessibility score" card with a branded, public-facing score page (e.g., pagepulser.com/score/abc123) would create organic social proof and drive inbound signups from people who see others using the tool.

4. **Blog post -> registration conversion tracking.** With 15+ SEO posts driving organic traffic, adding inline CTAs (e.g., "Run a free audit on your site") within blog content and tracking which posts drive the most registrations would let you double down on what works. Currently the blog and registration funnel are disconnected.

5. **Implement a free trial upgrade path with urgency.** Early access users get a 30-day Agency trial, but the CRM trigger system has `trial_expiring` and `trial_expired` trigger types that are in `SKIP_AUTO_SEND`. Enabling these auto-send triggers with well-crafted "your trial ends in 3 days" and "your trial has ended -- here's what you'll lose" emails would significantly improve trial-to-paid conversion.

## Summary

PagePulser's growth infrastructure is remarkably mature for an early-stage product. The lead scoring, behavioral trigger system, and CRM are genuinely best-in-class implementations that most startups do not build until much later. The referral program and early access funnel have solid mechanics. The biggest gap is the absence of in-product onboarding -- the system excels at identifying where users are in their lifecycle but does not actively guide them through the critical first steps. Fixing the onboarding experience, adding attribution tracking, enabling the trial expiry auto-sends, and adding social sharing to the referral program would meaningfully improve conversion at every stage of the funnel. The cold prospect pipeline is well-built but should be reconciled with the stated preference for manual outreach.
