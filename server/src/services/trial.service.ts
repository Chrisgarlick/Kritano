/**
 * Trial Service
 *
 * Handles free trial activation, expiry checks, and lifecycle emails.
 * One trial per user, ever. Trial grants paid-tier features for 14 days.
 */

import { pool } from '../db/index.js';

const TRIAL_DURATION_DAYS = 14;
const WARNING_DAYS_BEFORE = 3;

const TIER_FEATURES: Record<string, { highlights: string[]; name: string }> = {
  starter: {
    name: 'Starter',
    highlights: [
      '3 sites with 250 pages per audit',
      'Scheduled audits & PDF exports',
      'Accessibility & Performance checks',
    ],
  },
  pro: {
    name: 'Pro',
    highlights: [
      '10 sites with 1,000 pages per audit',
      'Unlimited audits & all export formats',
      'E-E-A-T, AEO & Google Dorking checks',
    ],
  },
  agency: {
    name: 'Agency',
    highlights: [
      '50 sites with 5,000 pages per audit',
      'White-label reports & hourly scheduling',
      'Structured Data checks & unlimited seats',
    ],
  },
};

/**
 * Start a free trial for a user on a paid tier.
 */
export async function startTrial(
  userId: string,
  tier: 'starter' | 'pro' | 'agency',
  durationDays?: number
): Promise<{ subscriptionId: string; trialEnd: string }> {
  // Validate tier
  if (!TIER_FEATURES[tier]) {
    throw Object.assign(new Error('Invalid tier for trial'), { statusCode: 400 });
  }

  // Check if user already used trial
  const userResult = await pool.query(
    `SELECT has_used_trial, email, first_name FROM users WHERE id = $1`,
    [userId]
  );
  if (userResult.rows.length === 0) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  const user = userResult.rows[0];

  if (user.has_used_trial) {
    throw Object.assign(new Error('You have already used your free trial'), { statusCode: 409 });
  }

  // Check for existing active/trialing paid subscription
  const existingSub = await pool.query(
    `SELECT id, tier, status FROM subscriptions
     WHERE user_id = $1 AND status IN ('active', 'trialing') AND tier != 'free'
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (existingSub.rows.length > 0) {
    throw Object.assign(
      new Error('You already have an active paid subscription'),
      { statusCode: 409 }
    );
  }

  // Create or update user-level subscription
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + (durationDays ?? TRIAL_DURATION_DAYS));

  const subResult = await pool.query(
    `INSERT INTO subscriptions (user_id, tier, status, trial_start, trial_end, trial_warning_sent)
     VALUES ($1, $2, 'trialing', NOW(), $3, false)
     ON CONFLICT (user_id) WHERE organization_id IS NULL
     DO UPDATE SET
       tier = EXCLUDED.tier,
       status = 'trialing',
       trial_start = NOW(),
       trial_end = EXCLUDED.trial_end,
       trial_warning_sent = false,
       updated_at = NOW()
     RETURNING id, trial_end`,
    [userId, tier, trialEnd.toISOString()]
  );

  let subscriptionId: string;
  let finalTrialEnd: string;

  if (subResult.rows.length > 0) {
    subscriptionId = subResult.rows[0].id;
    finalTrialEnd = subResult.rows[0].trial_end;
  } else {
    // Check if there's an existing free sub to update
    const freeSub = await pool.query(
      `UPDATE subscriptions
       SET tier = $2, status = 'trialing', trial_start = NOW(), trial_end = $3, trial_warning_sent = false, updated_at = NOW()
       WHERE user_id = $1 AND tier = 'free'
       RETURNING id, trial_end`,
      [userId, tier, trialEnd.toISOString()]
    );
    if (freeSub.rows.length > 0) {
      subscriptionId = freeSub.rows[0].id;
      finalTrialEnd = freeSub.rows[0].trial_end;
    } else {
      // Create new subscription
      const newSub = await pool.query(
        `INSERT INTO subscriptions (user_id, tier, status, trial_start, trial_end, trial_warning_sent)
         VALUES ($1, $2, 'trialing', NOW(), $3, false)
         RETURNING id, trial_end`,
        [userId, tier, trialEnd.toISOString()]
      );
      subscriptionId = newSub.rows[0].id;
      finalTrialEnd = newSub.rows[0].trial_end;
    }
  }

  // Mark user as having used trial
  await pool.query(
    `UPDATE users SET has_used_trial = true WHERE id = $1`,
    [userId]
  );

  // [Phase 10] Send trial_started email via sendTemplate
  const tierInfo = TIER_FEATURES[tier];
  const trialEndDate = new Date(finalTrialEnd).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  console.log(`[Phase 10] Would send trial_started email to ${user.email} for ${tierInfo.name} tier, ends ${trialEndDate}`);

  // [Phase 10] Fire CRM trigger: trial_started
  console.log(`[Phase 10] Would fire CRM trigger trial_started for user ${userId}, tier=${tier}`);

  return { subscriptionId, trialEnd: finalTrialEnd };
}

/**
 * Check for expiring and expired trials.
 * Called by the trial worker every 5 minutes. Idempotent.
 */
export async function checkTrialExpiry(): Promise<void> {
  // 1. Send 3-day warning emails
  const warningResult = await pool.query(
    `SELECT s.id, s.user_id, s.tier, s.trial_end,
            u.email, u.first_name
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE s.status = 'trialing'
       AND s.trial_end <= NOW() + make_interval(days => $1)
       AND s.trial_end > NOW()
       AND s.trial_warning_sent = false`,
    [WARNING_DAYS_BEFORE]
  );

  for (const row of warningResult.rows) {
    try {
      const trialEndDate = new Date(row.trial_end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const tierInfo = TIER_FEATURES[row.tier] || { name: row.tier };

      // [Phase 10] Would send trial_expiring email
      console.log(`[Phase 10] Would send trial_expiring email to ${row.email} for ${tierInfo.name} tier, ends ${trialEndDate}`);

      // Mark warning as sent
      await pool.query(
        `UPDATE subscriptions SET trial_warning_sent = true WHERE id = $1`,
        [row.id]
      );

      // [Phase 10] Would fire CRM trigger: trial_expiring
      console.log(`[Phase 10] Would fire CRM trigger trial_expiring for user ${row.user_id}`);

      console.log(`Trial expiry warning processed for ${row.email}`);
    } catch (err) {
      console.error(`Failed to process trial warning for subscription ${row.id}:`, err);
    }
  }

  // 2. Expire trials that have passed their end date
  const expiredResult = await pool.query(
    `SELECT s.id, s.user_id, s.tier, s.trial_end,
            u.email, u.first_name
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE s.status = 'trialing'
       AND s.trial_end < NOW()`
  );

  for (const row of expiredResult.rows) {
    try {
      const originalTier = row.tier;
      const tierInfo = TIER_FEATURES[originalTier] || { name: originalTier };

      // Downgrade to free
      await pool.query(
        `UPDATE subscriptions
         SET tier = 'free', status = 'active', updated_at = NOW()
         WHERE id = $1`,
        [row.id]
      );

      // [Phase 10] Would send trial_expired email
      console.log(`[Phase 10] Would send trial_expired email to ${row.email} for ${tierInfo.name} tier`);

      // [Phase 10] Would fire CRM trigger: trial_expired
      console.log(`[Phase 10] Would fire CRM trigger trial_expired for user ${row.user_id}`);

      console.log(`Trial expired for ${row.email} — downgraded from ${originalTier} to free`);
    } catch (err) {
      console.error(`Failed to process trial expiry for subscription ${row.id}:`, err);
    }
  }
}
