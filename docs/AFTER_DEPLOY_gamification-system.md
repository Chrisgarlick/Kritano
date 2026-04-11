# Gamification System - Ultrathink Plan

## Overview

Turn Kritano from a "run an audit and leave" tool into a habit-forming platform that rewards users for consistently improving their websites. The system introduces XP, levels, streaks, badges, and -- critically -- tangible discount rewards that tie improvement directly to cost savings.

The core loop: **Audit > Fix > Re-audit > See improvement > Earn rewards > Keep going.**

## Key Decisions

1. **XP is the universal currency.** Every meaningful action earns XP. XP determines your level. Levels unlock badges and perks. This keeps the system simple -- one number to care about.
2. **Streaks are weekly, not daily.** A website audit tool isn't used daily. Weekly streaks (run at least one audit per week) are realistic and don't punish users for having a life.
3. **Discount rewards are real Stripe coupons.** Not fake gamification -- actual money off your next bill. This is the hook that converts free users and retains paid ones.
4. **Badges are shareable.** Each badge generates an embeddable SVG (reusing the existing public badge infrastructure) and an OG image for social sharing.
5. **Leaderboards are opt-in and scoped.** Agency teams can compete internally. No public shame boards.
6. **No pay-to-win.** XP is earned through genuine improvement, not by having a higher tier. Free users can earn XP at the same rate as Enterprise users (within their audit limits).
7. **Discount rewards cap at 25%.** Generous enough to motivate, bounded enough to protect revenue. Stacks with early access discount up to a combined max of 50%.

---

## XP System

### XP-Earning Actions

| Action | XP | Frequency Cap | Notes |
|---|---|---|---|
| Complete an audit | 10 | Per audit | Base reward for using the product |
| Fix a finding (detected on re-audit) | 5 | Per unique finding fixed | Core improvement loop |
| Improve a category score by 5+ points | 25 | Per category per audit | Rewards meaningful progress |
| Improve a category score by 10+ points | 50 | Per category per audit | Replaces the 5-point reward |
| Reach score 90+ in any category | 100 | Once per category per site | "Excellence" milestone |
| Reach score 90+ in ALL categories | 500 | Once per site | "Perfect site" achievement |
| Complete weekly streak | 15 | Once per week | Consistency reward |
| Refer a user (who completes first audit) | 50 | Per referral | Ties into existing referral system |
| First audit ever | 50 | Once | Onboarding bonus |
| Add a new site | 10 | Per site | Encourages portfolio growth |
| Enable public audit badge | 10 | Once per site | Encourages transparency |
| Share an audit report | 10 | Once per audit | Drives viral distribution |
| Fix all critical findings on a site | 75 | Per audit where criticals go to zero | High-value action |
| Mobile audit pass improvement 5+ points | 25 | Per category per audit | Rewards mobile-specific fixes |
| Achieve EAA compliance (all green) | 200 | Once per site | Compliance milestone |

### XP Decay

- **No decay.** XP is cumulative and never lost. Streaks can break, but earned XP stays. Losing progress feels terrible and drives churn, not retention.

### Levels

| Level | XP Required | Title | Perk |
|---|---|---|---|
| 1 | 0 | Newcomer | -- |
| 2 | 100 | Scout | Profile badge |
| 3 | 300 | Inspector | -- |
| 4 | 600 | Analyst | 5% discount coupon (one-time) |
| 5 | 1,000 | Specialist | -- |
| 6 | 1,500 | Expert | 10% discount coupon (one-time) |
| 7 | 2,500 | Master | -- |
| 8 | 4,000 | Authority | 15% discount coupon (one-time) |
| 9 | 6,000 | Champion | -- |
| 10 | 10,000 | Legend | 25% discount coupon (one-time) + "Legend" profile badge |

Discount coupons are applied as one-time Stripe coupons on the next invoice. They do not recur -- you earn one, you use it, then you aim for the next level. This creates a steady drip of rewards rather than a permanent discount that devalues the product.

---

## Streaks

### Weekly Streak

- **Condition:** Run at least one completed audit in each calendar week (Mon-Sun).
- **Visual:** Fire icon with streak count (e.g. "5 week streak") displayed on the dashboard.
- **Rewards:**
  - 15 XP per week maintained
  - **4-week streak:** "Consistent" badge
  - **8-week streak:** "Dedicated" badge
  - **12-week streak:** "Unstoppable" badge + 5% one-time discount
  - **26-week streak (6 months):** "Half-Year Hero" badge + 10% one-time discount
  - **52-week streak (1 year):** "Year-Round Champion" badge + 15% one-time discount
- **Streak freeze:** Users get 1 free "freeze" per month (Pro+). If they miss a week, the streak is paused rather than broken. Freeze must be activated manually before the week ends (not retroactive).
- **Streak recovery (grace):** If a streak breaks, the user has until Tuesday midnight to retroactively complete an audit and save the streak. This accounts for Monday bank holidays etc.

### Fix Streak

- **Condition:** Each audit shows fewer unique issues than the previous audit for the same site.
- **Visual:** Downward trend arrow with streak count.
- **Rewards:**
  - **3 consecutive improving audits:** "On the Mend" badge
  - **5 consecutive improving audits:** "Relentless Fixer" badge + 25 bonus XP
  - **10 consecutive improving audits:** "Perfectionist" badge + 100 bonus XP

---

## Badges

### Badge Categories

**Getting Started**
| Badge | Condition | Icon Concept |
|---|---|---|
| First Scan | Complete your first audit | Magnifying glass |
| Site Owner | Add your first site | House with checkmark |
| Public Face | Enable public audit badge | Globe with shield |
| Team Player | Invite a team member | People group |
| Referral Star | Refer your first user | Star with arrow |

**Score Milestones**
| Badge | Condition | Icon Concept |
|---|---|---|
| SEO Pro | Reach 90+ SEO score | Magnifying glass with star |
| Fort Knox | Reach 90+ Security score | Lock with star |
| Accessibility Champion | Reach 90+ Accessibility score | Universal access with star |
| Speed Demon | Reach 90+ Performance score | Lightning bolt |
| Wordsmith | Reach 90+ Content score | Pen with star |
| Perfect 100 | Reach 100 in any category | Diamond |
| Clean Sweep | Reach 90+ in all categories on one site | Trophy |
| Flawless | Reach 100 in all categories on one site | Crown |

**Improvement**
| Badge | Condition | Icon Concept |
|---|---|---|
| Quick Fix | Fix 10 findings | Wrench |
| Bug Crusher | Fix 50 findings | Hammer |
| Issue Eliminator | Fix 200 findings | Broom |
| Zero Critical | Clear all critical findings on a site | Shield with zero |
| Comeback Kid | Improve any score by 30+ points | Rocket |
| Turnaround | Improve all scores by 20+ points on one site | Circular arrows |

**Consistency**
| Badge | Condition | Icon Concept |
|---|---|---|
| Consistent | 4-week audit streak | Flame (small) |
| Dedicated | 8-week audit streak | Flame (medium) |
| Unstoppable | 12-week audit streak | Flame (large) |
| Half-Year Hero | 26-week streak | Calendar with flame |
| Year-Round Champion | 52-week streak | Trophy with flame |

**Compliance**
| Badge | Condition | Icon Concept |
|---|---|---|
| EAA Ready | Achieve EAA compliance on one site | EU flag with checkmark |
| Compliance Portfolio | Achieve EAA compliance on 3+ sites | Folder with EU flag |

**Volume (Agency-oriented)**
| Badge | Condition | Icon Concept |
|---|---|---|
| Portfolio Manager | Audit 10 different sites | Grid of sites |
| Agency Power | Audit 25 different sites | Building |
| Enterprise Scale | Audit 50+ different sites | Skyscraper |
| Audit Machine | Complete 100 total audits | Gear with number |
| Thousand Scans | Complete 1,000 total audits | Gear with star |

### Badge Rarity

Each badge has a rarity tier based on the percentage of users who have earned it:
- **Common** (>25% of users): Grey border
- **Uncommon** (10-25%): Green border (indigo-400)
- **Rare** (2-10%): Indigo border (indigo-600)
- **Epic** (<2%): Amber border (amber-500)
- **Legendary** (<0.5%): Animated gradient border (indigo to amber)

Rarity is recalculated weekly via a background job. This creates social proof and aspiration.

### Badge Display

- **Profile page:** Grid of all earned badges with timestamps. Unearned badges shown as greyed-out silhouettes with progress bars.
- **Dashboard widget:** "Latest badge" highlight with animation on first view.
- **Embeddable badge showcase:** Users can embed a strip of their top badges on their own website (similar to existing public audit badge SVGs).
- **Shareable cards:** Each badge generates a 1200x630 OG image for social sharing. "I just earned the Clean Sweep badge on Kritano!"

---

## Discount Rewards

### How Discounts Work

1. User reaches a level or streak milestone that grants a discount.
2. System creates a one-time Stripe coupon scoped to that user's customer ID.
3. Coupon is displayed in the dashboard: "You've earned a 10% discount! It will be applied to your next invoice."
4. On next Stripe invoice, coupon is auto-applied.
5. Coupon is single-use -- once applied, it's consumed.
6. Multiple earned-but-unused coupons do NOT stack. The highest available coupon is applied. Lower coupons are voided.

### Discount Caps

- **Max gamification discount:** 25% (from reaching Level 10)
- **No combined cap.** Gamification discounts stack fully with the early access lifetime discount. An early access user at Level 10 could get 75% off one invoice (50% lifetime + 25% one-time). They've earned it through genuine long-term usage -- rewarding that loyalty is worth more than protecting one month of revenue.
- **Free tier users:** Discounts are banked and applied when they upgrade. "You've earned a 10% discount -- upgrade now to use it!" This is an upsell mechanism.

### Revenue Protection

- Discounts are one-time per milestone, not recurring.
- Users can't farm XP by repeatedly scanning the same site in a loop -- XP for fixing findings requires the finding to actually be resolved (detected as fixed on re-audit).
- Score improvement XP is per-category per audit, so you can't game it by deliberately breaking and fixing things (the net score must be higher than the previous audit's score).
- Admin panel shows total discount liability and per-user reward history.

---

## Leaderboards

### Scope Options

1. **Personal:** Your own progress over time (always visible).
2. **Team:** Members of the same organization (opt-in per org, visible to org members).
3. **Global:** All Kritano users (opt-in per user, anonymised by default -- users can choose to show their name/company).

### Leaderboard Metrics

- **XP earned this month** (resets monthly to keep it competitive)
- **Longest active streak**
- **Most findings fixed this month**
- **Highest score improvement this month**

### Anti-Gaming

- Leaderboards use monthly XP, not all-time XP, so new users can compete.
- Minimum 3 different sites audited to appear on global leaderboard (prevents single-site farming).
- Admin can flag and exclude suspicious accounts.

---

## Database Changes

### New Tables

```sql
-- Migration: 105_gamification_system.sql

-- XP ledger: every XP transaction is logged
CREATE TABLE user_xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,          -- e.g. 'audit_complete', 'finding_fixed', 'score_improve_5'
    xp_amount INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',          -- e.g. { "audit_id": "...", "site_id": "...", "category": "seo", "from_score": 72, "to_score": 83 }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_events_user ON user_xp_events(user_id);
CREATE INDEX idx_xp_events_user_action ON user_xp_events(user_id, action);
CREATE INDEX idx_xp_events_created ON user_xp_events(created_at);

-- User gamification summary (materialised for fast reads)
ALTER TABLE users ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN current_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN weekly_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_weekly_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_streak_week DATE;              -- ISO week start date of last qualifying audit
ALTER TABLE users ADD COLUMN streak_freeze_available INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN leaderboard_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN leaderboard_display_name VARCHAR(100);

-- Badges
CREATE TABLE badges (
    id VARCHAR(50) PRIMARY KEY,            -- e.g. 'first_scan', 'seo_pro', 'clean_sweep'
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(30) NOT NULL,          -- 'getting_started', 'score', 'improvement', 'consistency', 'compliance', 'volume'
    icon_key VARCHAR(50) NOT NULL,          -- maps to frontend icon component
    rarity VARCHAR(20) NOT NULL DEFAULT 'common',  -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badge awards
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    seen BOOLEAN NOT NULL DEFAULT false,    -- for "new badge!" notification
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- Discount rewards
CREATE TABLE gamification_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(30) NOT NULL,       -- 'level_discount', 'streak_discount'
    trigger_key VARCHAR(50) NOT NULL,       -- e.g. 'level_4', 'streak_12'
    discount_percent INTEGER NOT NULL,
    stripe_coupon_id VARCHAR(100),          -- NULL until coupon is created in Stripe
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'applied', 'expired', 'voided'
    applied_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,                 -- optional expiry (e.g. 90 days to use it)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, trigger_key)            -- each milestone reward earned once
);

CREATE INDEX idx_gamification_rewards_user ON gamification_rewards(user_id);
CREATE INDEX idx_gamification_rewards_status ON gamification_rewards(user_id, status);

-- Fix streak tracking (per site)
CREATE TABLE site_fix_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_audit_id UUID REFERENCES audit_jobs(id),
    last_issue_count INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, user_id)
);

-- Leaderboard cache (refreshed by background job)
CREATE TABLE leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period VARCHAR(10) NOT NULL,            -- 'monthly', 'alltime'
    period_key VARCHAR(20) NOT NULL,        -- e.g. '2026-04' or 'alltime'
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    xp_earned INTEGER NOT NULL DEFAULT 0,
    findings_fixed INTEGER NOT NULL DEFAULT 0,
    best_improvement INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period, period_key, user_id)
);

CREATE INDEX idx_leaderboard_period ON leaderboard_cache(period, period_key, rank);
```

### Seed Data

```sql
-- Migration: 106_seed_badges.sql

INSERT INTO badges (id, name, description, category, icon_key, sort_order) VALUES
-- Getting Started
('first_scan', 'First Scan', 'Complete your first audit', 'getting_started', 'magnifying-glass', 1),
('site_owner', 'Site Owner', 'Add your first site', 'getting_started', 'house-check', 2),
('public_face', 'Public Face', 'Enable a public audit badge', 'getting_started', 'globe-shield', 3),
('team_player', 'Team Player', 'Invite a team member to your organization', 'getting_started', 'people-group', 4),
('referral_star', 'Referral Star', 'Refer your first user', 'getting_started', 'star-arrow', 5),

-- Score Milestones
('seo_pro', 'SEO Pro', 'Reach 90+ SEO score on any site', 'score', 'magnifying-glass-star', 10),
('fort_knox', 'Fort Knox', 'Reach 90+ Security score on any site', 'score', 'lock-star', 11),
('a11y_champion', 'Accessibility Champion', 'Reach 90+ Accessibility score on any site', 'score', 'universal-access-star', 12),
('speed_demon', 'Speed Demon', 'Reach 90+ Performance score on any site', 'score', 'lightning-star', 13),
('wordsmith', 'Wordsmith', 'Reach 90+ Content score on any site', 'score', 'pen-star', 14),
('perfect_100', 'Perfect 100', 'Reach a perfect 100 in any category', 'score', 'diamond', 15),
('clean_sweep', 'Clean Sweep', 'Reach 90+ in all categories on one site', 'score', 'trophy', 16),
('flawless', 'Flawless', 'Reach 100 in all categories on one site', 'score', 'crown', 17),

-- Improvement
('quick_fix', 'Quick Fix', 'Fix 10 findings across all audits', 'improvement', 'wrench', 20),
('bug_crusher', 'Bug Crusher', 'Fix 50 findings across all audits', 'improvement', 'hammer', 21),
('issue_eliminator', 'Issue Eliminator', 'Fix 200 findings across all audits', 'improvement', 'broom', 22),
('zero_critical', 'Zero Critical', 'Clear all critical findings on a site', 'improvement', 'shield-zero', 23),
('comeback_kid', 'Comeback Kid', 'Improve any score by 30+ points in a single audit', 'improvement', 'rocket', 24),
('turnaround', 'Turnaround', 'Improve all scores by 20+ points on one site', 'improvement', 'circular-arrows', 25),

-- Consistency
('consistent', 'Consistent', 'Maintain a 4-week audit streak', 'consistency', 'flame-sm', 30),
('dedicated', 'Dedicated', 'Maintain an 8-week audit streak', 'consistency', 'flame-md', 31),
('unstoppable', 'Unstoppable', 'Maintain a 12-week audit streak', 'consistency', 'flame-lg', 32),
('half_year_hero', 'Half-Year Hero', 'Maintain a 26-week audit streak', 'consistency', 'calendar-flame', 33),
('year_round_champion', 'Year-Round Champion', 'Maintain a 52-week audit streak', 'consistency', 'trophy-flame', 34),

-- Compliance
('eaa_ready', 'EAA Ready', 'Achieve EAA compliance on one site', 'compliance', 'eu-check', 40),
('compliance_portfolio', 'Compliance Portfolio', 'Achieve EAA compliance on 3+ sites', 'compliance', 'folder-eu', 41),

-- Volume
('portfolio_manager', 'Portfolio Manager', 'Audit 10 different sites', 'volume', 'grid-sites', 50),
('agency_power', 'Agency Power', 'Audit 25 different sites', 'volume', 'building', 51),
('enterprise_scale', 'Enterprise Scale', 'Audit 50+ different sites', 'volume', 'skyscraper', 52),
('audit_machine', 'Audit Machine', 'Complete 100 total audits', 'volume', 'gear-number', 53),
('thousand_scans', 'Thousand Scans', 'Complete 1,000 total audits', 'volume', 'gear-star', 54);
```

---

## Backend Changes

### New Service: `gamification.service.ts`

**Core methods:**

```
awardXP(userId, action, xpAmount, metadata)
  - Insert into user_xp_events
  - Update users.total_xp
  - Check for level-up, trigger handleLevelUp() if needed
  - Check for badge eligibility, trigger awardBadge() if earned

handleLevelUp(userId, newLevel)
  - Update users.current_level
  - If level grants discount, create gamification_rewards record
  - Create Stripe coupon and attach to customer
  - Send level-up notification (in-app + email)

awardBadge(userId, badgeId)
  - Insert into user_badges (ignore if duplicate)
  - Send badge notification (in-app)
  - Return badge details for celebration UI

checkBadgeEligibility(userId, context)
  - Called after every XP-earning event
  - Context contains: audit results, site scores, finding counts, etc.
  - Checks all unearned badges against current state
  - Awards any newly qualified badges

updateWeeklyStreak(userId)
  - Called when audit completes
  - Calculate current ISO week start
  - If last_streak_week is previous week: increment streak
  - If last_streak_week is current week: no-op
  - If gap > 1 week: check freeze, apply or reset
  - Update streak-related badges

updateFixStreak(siteId, userId, auditId, uniqueIssueCount)
  - Compare to last_issue_count in site_fix_streaks
  - If fewer issues: increment streak
  - If more issues: reset streak to 0
  - Award fix streak badges

getProfile(userId)
  - Return: total_xp, level, streak, badges, available rewards, next level progress

getLeaderboard(scope, period)
  - Read from leaderboard_cache
  - Scope: 'personal', 'team', 'global'
  - Period: current month or all-time

claimReward(userId, rewardId)
  - Validate reward exists and is status='active'
  - Apply Stripe coupon to customer
  - Update status to 'applied'
```

### Integration Points

**After audit completion** (`worker.ts` or audit completion handler):
```
1. awardXP(userId, 'audit_complete', 10, { auditId, siteId })
2. Compare scores to previous audit for same site:
   - For each category with 5+ point improvement: awardXP(userId, 'score_improve_5', 25, ...)
   - For each category with 10+ point improvement: awardXP(userId, 'score_improve_10', 50, ...) (instead of the 5-point reward)
3. Compare findings to previous audit:
   - Count unique findings that no longer appear: awardXP per finding fixed
   - If critical count went from >0 to 0: awardXP(userId, 'zero_critical', 75, ...)
4. updateWeeklyStreak(userId)
5. updateFixStreak(siteId, userId, auditId, uniqueIssueCount)
6. checkBadgeEligibility(userId, { auditResults, siteScores, ... })
```

**After referral qualified** (`referral.service.ts`):
```
awardXP(referrerId, 'referral_complete', 50, { referredUserId })
```

**After site created:**
```
awardXP(userId, 'site_added', 10, { siteId })
```

**After badge enabled:**
```
awardXP(userId, 'badge_enabled', 10, { siteId })
```

### New Routes

```
GET  /api/gamification/profile          -- XP, level, streak, badges, rewards
GET  /api/gamification/badges           -- All badges with earned status
GET  /api/gamification/xp-history       -- Paginated XP event log
GET  /api/gamification/leaderboard      -- ?scope=team|global&period=2026-04
GET  /api/gamification/rewards          -- Available and used discount rewards
POST /api/gamification/rewards/:id/claim -- Apply a discount
PATCH /api/gamification/leaderboard-opt-in -- Toggle leaderboard visibility

-- Admin
GET  /api/admin/gamification/stats      -- Total XP awarded, badges distributed, discounts issued
GET  /api/admin/gamification/rewards    -- All rewards with financial impact summary
```

### Background Jobs (BullMQ)

1. **`gamification:refresh-leaderboard`** -- Runs hourly. Aggregates monthly XP, findings fixed, and best improvements into `leaderboard_cache`.
2. **`gamification:refresh-badge-rarity`** -- Runs weekly. Recalculates badge rarity tiers based on current award percentages.
3. **`gamification:streak-check`** -- Runs Monday 02:00 UTC. Identifies users whose streak should have broken (no audit in prior week, no freeze). Resets their streak. Sends "streak broken" notification with encouragement.
4. **`gamification:expire-rewards`** -- Runs daily. Expires unclaimed discount rewards older than 90 days.

---

## Frontend Changes

### New Pages

1. **`/achievements`** -- Main gamification hub
   - XP progress bar to next level
   - Current level and title
   - Weekly streak display (flame icon + count)
   - Badge grid (earned badges in colour, unearned greyed out with progress)
   - Active rewards section
   - XP activity feed (recent events)

2. **`/leaderboard`** -- Leaderboard page
   - Tab toggle: Team / Global
   - Monthly period selector
   - Table: Rank, User, XP, Findings Fixed, Best Improvement
   - Current user highlighted

### Dashboard Additions

- **Streak widget:** Small flame icon with number in the dashboard header. Clicking opens achievements page.
- **Level badge:** Next to user avatar in sidebar. Shows level number and progress ring.
- **New badge toast:** When a badge is earned, show a toast notification with badge icon, name, and "View" link.
- **Level-up modal:** Full-screen celebration when levelling up. Shows new title, any discount earned, confetti animation (reuse existing confetti from score celebrations).
- **Reward banner:** When user has an unclaimed discount, show a persistent but dismissible banner: "You've earned a 10% discount! It'll be applied to your next invoice."

### Sidebar Addition

- New nav item: "Achievements" with a trophy icon, positioned after the existing nav items.
- Badge count indicator showing number of unseen badges.

### Profile Enhancements

- Badge showcase section
- XP history timeline
- Streak calendar (similar to GitHub contribution graph but weekly)

---

## Critical Files Summary

| Area | File | Changes |
|---|---|---|
| Migration | `server/src/db/migrations/105_gamification_system.sql` | New tables and columns |
| Migration | `server/src/db/migrations/106_seed_badges.sql` | Badge definitions |
| Service | `server/src/services/gamification.service.ts` | New -- core gamification logic |
| Routes | `server/src/routes/gamification/index.ts` | New -- API endpoints |
| Routes | `server/src/routes/admin/gamification.ts` | New -- admin endpoints |
| Worker | `server/src/worker.ts` | Add gamification jobs to BullMQ |
| Worker | `server/src/services/queue/gamification-worker.service.ts` | New -- background job handlers |
| Integration | `server/src/services/audit.service.ts` | Call gamification hooks after audit completion |
| Integration | `server/src/services/referral.service.ts` | Award XP on referral qualification |
| Stripe | `server/src/services/stripe.service.ts` | Add coupon creation/attachment methods |
| Stripe | `server/src/routes/webhooks/stripe.ts` | Handle coupon application events |
| Frontend | `client/src/pages/achievements/AchievementsPage.tsx` | New -- main gamification page |
| Frontend | `client/src/pages/achievements/LeaderboardPage.tsx` | New -- leaderboard page |
| Frontend | `client/src/components/gamification/StreakWidget.tsx` | New -- dashboard streak display |
| Frontend | `client/src/components/gamification/LevelBadge.tsx` | New -- sidebar level indicator |
| Frontend | `client/src/components/gamification/BadgeToast.tsx` | New -- badge earned notification |
| Frontend | `client/src/components/gamification/LevelUpModal.tsx` | New -- level-up celebration |
| Frontend | `client/src/components/gamification/RewardBanner.tsx` | New -- discount notification |
| Frontend | `client/src/components/gamification/BadgeGrid.tsx` | New -- badge display grid |
| Frontend | `client/src/components/gamification/XpProgressBar.tsx` | New -- XP progress to next level |
| Frontend | `client/src/services/api.ts` | Add gamification API methods |
| Frontend | `client/src/types/gamification.types.ts` | New -- TypeScript interfaces |
| Frontend | `client/src/components/layout/Sidebar.tsx` | Add achievements nav item |
| Frontend | `client/src/App.tsx` | Add achievement routes |
| Tiers | `docs/TIERS.md` | Add gamification row (streak freeze availability) |

---

## Tier Integration

| Feature | Free | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|---|
| XP earning | Yes | Yes | Yes | Yes | Yes |
| Levels & badges | Yes | Yes | Yes | Yes | Yes |
| Weekly streak | Yes | Yes | Yes | Yes | Yes |
| Streak freezes/month | 0 | 0 | 1 | 2 | 4 |
| Leaderboard (team) | -- | -- | Yes | Yes | Yes |
| Leaderboard (global) | -- | Yes | Yes | Yes | Yes |
| Discount rewards | Banked (apply on upgrade) | Yes | Yes | Yes | Yes |
| Embeddable badge showcase | -- | -- | Yes | Yes | Yes |

---

## Testing Plan

### Unit Tests
- XP calculation for each action type
- Level-up threshold detection
- Streak logic: increment, maintain, break, freeze, recovery grace period
- Badge eligibility checks for every badge
- Discount reward creation and stacking rules
- Score comparison logic (previous audit lookup)

### Integration Tests
- Full audit completion flow triggers correct XP, badges, and streak updates
- Referral flow awards XP to referrer
- Stripe coupon creation and attachment
- Leaderboard refresh job produces correct rankings
- Streak-check job correctly resets broken streaks
- Reward expiry job handles edge cases

### Frontend Tests
- Achievement page renders correct badge states (earned, unearned, progress)
- Level-up modal appears on level change
- Badge toast appears for new badges
- Streak widget shows correct count and state
- Reward banner appears and dismiss works
- Leaderboard pagination and scope switching

---

## Implementation Order

### Phase 1: Foundation (XP + Levels)
1. Database migration: `105_gamification_system.sql` (tables + user columns)
2. `gamification.service.ts` -- XP awarding and level calculation
3. Integration into audit completion flow
4. `/api/gamification/profile` endpoint
5. Frontend: XP progress bar, level badge in sidebar
6. Frontend: Level-up modal with confetti

### Phase 2: Badges
1. Database migration: `106_seed_badges.sql`
2. Badge eligibility engine in gamification service
3. Badge award logic after every XP event
4. `/api/gamification/badges` endpoint
5. Frontend: Achievements page with badge grid
6. Frontend: Badge toast notifications
7. Background job: badge rarity refresh

### Phase 3: Streaks
1. Weekly streak logic in gamification service
2. Fix streak tracking per site
3. Streak-related badge triggers
4. Background job: Monday streak check
5. Frontend: Streak widget on dashboard
6. Frontend: Streak calendar on achievements page

### Phase 4: Discount Rewards
1. Stripe coupon creation methods
2. Reward creation on level-up and streak milestones
3. `/api/gamification/rewards` endpoints
4. Reward claim and Stripe attachment
5. Background job: reward expiry
6. Frontend: Reward banner and rewards section
7. Admin: Reward liability dashboard

### Phase 5: Leaderboards
1. Leaderboard cache table and refresh job
2. `/api/gamification/leaderboard` endpoint
3. Opt-in toggle endpoint
4. Frontend: Leaderboard page with team/global tabs
5. Anti-gaming: minimum site count filter

### Phase 6: Polish
1. Embeddable badge showcase SVGs
2. Social sharing OG images for badges
3. Email notifications for milestones
4. Streak freeze UI (Pro+ only)
5. Admin gamification stats dashboard
6. Update TIERS.md with gamification features
