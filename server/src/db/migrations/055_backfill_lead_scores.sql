-- Migration 055: Backfill lead scores for existing users
-- This is a one-time data migration that sets initial scores based on current state.
-- After this migration, scores are maintained by the lead-scoring service on events.

-- Step 1: Base score for all users (+5 for account creation)
UPDATE users SET lead_score = 5, lead_score_updated_at = NOW()
WHERE status != 'deleted';

-- Step 2: +10 for email verified
UPDATE users SET lead_score = lead_score + 10
WHERE email_verified = true AND status != 'deleted';

-- Step 3: +15 for first completed audit
UPDATE users SET lead_score = lead_score + 15
WHERE id IN (
  SELECT DISTINCT user_id FROM audit_jobs WHERE status = 'completed'
) AND status != 'deleted';

-- Step 4: +20 for 3+ completed audits
UPDATE users SET lead_score = lead_score + 20
WHERE id IN (
  SELECT user_id FROM audit_jobs WHERE status = 'completed'
  GROUP BY user_id HAVING COUNT(*) >= 3
) AND status != 'deleted';

-- Step 5: +30 for 10+ completed audits
UPDATE users SET lead_score = lead_score + 30
WHERE id IN (
  SELECT user_id FROM audit_jobs WHERE status = 'completed'
  GROUP BY user_id HAVING COUNT(*) >= 10
) AND status != 'deleted';

-- Step 6: +25 for 3+ unique URLs (agency signal)
UPDATE users SET lead_score = lead_score + 25
WHERE id IN (
  SELECT user_id FROM audit_jobs
  GROUP BY user_id HAVING COUNT(DISTINCT target_url) >= 3
) AND status != 'deleted';

-- Step 7: +30 for verified domain
UPDATE users SET lead_score = lead_score + 30
WHERE id IN (
  SELECT DISTINCT created_by FROM sites WHERE verified = true AND created_by IS NOT NULL
) AND status != 'deleted';

-- Step 8: +15 for team members
UPDATE users SET lead_score = lead_score + 15
WHERE id IN (
  SELECT DISTINCT s.created_by
  FROM sites s
  JOIN site_shares ss ON ss.site_id = s.id
  WHERE ss.user_id != s.created_by AND s.created_by IS NOT NULL
) AND status != 'deleted';

-- Step 9: Inactivity decay
UPDATE users SET lead_score = GREATEST(0, lead_score - 10)
WHERE last_login_at < NOW() - INTERVAL '7 days'
  AND last_login_at >= NOW() - INTERVAL '14 days'
  AND status != 'deleted';

UPDATE users SET lead_score = GREATEST(0, lead_score - 20)
WHERE last_login_at < NOW() - INTERVAL '14 days'
  AND last_login_at >= NOW() - INTERVAL '30 days'
  AND status != 'deleted';

UPDATE users SET lead_score = GREATEST(0, lead_score - 30)
WHERE last_login_at < NOW() - INTERVAL '30 days'
  AND status != 'deleted';

-- Step 10: Derive statuses
-- Churned: 60+ days inactive
UPDATE users SET lead_status = 'churned'
WHERE last_login_at < NOW() - INTERVAL '60 days'
  AND status != 'deleted';

-- Churning: 14+ days inactive with score > 30
UPDATE users SET lead_status = 'churning'
WHERE last_login_at < NOW() - INTERVAL '14 days'
  AND last_login_at >= NOW() - INTERVAL '60 days'
  AND lead_score > 30
  AND status != 'deleted';

-- Power user: score 70+ and not free tier
UPDATE users SET lead_status = 'power_user'
WHERE lead_score >= 70
  AND lead_status NOT IN ('churning', 'churned')
  AND id IN (
    SELECT DISTINCT s.created_by FROM sites s
    JOIN subscriptions sub ON sub.organization_id = s.organization_id
    WHERE sub.tier != 'free' AND s.created_by IS NOT NULL
  )
  AND status != 'deleted';

-- Upgrade prospect: score 50+ and free tier
UPDATE users SET lead_status = 'upgrade_prospect'
WHERE lead_score >= 50
  AND lead_status NOT IN ('churning', 'churned', 'power_user')
  AND (
    id NOT IN (
      SELECT DISTINCT s.created_by FROM sites s
      JOIN subscriptions sub ON sub.organization_id = s.organization_id
      WHERE sub.tier != 'free' AND s.created_by IS NOT NULL
    )
    OR id NOT IN (SELECT DISTINCT created_by FROM sites WHERE created_by IS NOT NULL)
  )
  AND status != 'deleted';

-- Engaged: score 40-69
UPDATE users SET lead_status = 'engaged'
WHERE lead_score >= 40 AND lead_score < 70
  AND lead_status NOT IN ('churning', 'churned', 'power_user', 'upgrade_prospect')
  AND status != 'deleted';

-- Activated: score 15-39
UPDATE users SET lead_status = 'activated'
WHERE lead_score >= 15 AND lead_score < 40
  AND lead_status NOT IN ('churning', 'churned', 'power_user', 'upgrade_prospect', 'engaged')
  AND status != 'deleted';

-- New: score < 15 (already default)
