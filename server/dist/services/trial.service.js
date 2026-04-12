"use strict";
/**
 * Trial Service
 *
 * Handles free trial activation, expiry checks, and lifecycle emails.
 * One trial per user, ever. Trial grants paid-tier features for 14 days.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTrial = startTrial;
exports.checkTrialExpiry = checkTrialExpiry;
const index_js_1 = require("../db/index.js");
const email_template_service_js_1 = require("./email-template.service.js");
const crm_trigger_service_js_1 = require("./crm-trigger.service.js");
const TRIAL_DURATION_DAYS = 14;
const WARNING_DAYS_BEFORE = 3;
const TIER_FEATURES = {
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
async function startTrial(userId, tier, durationDays) {
    // Validate tier
    if (!TIER_FEATURES[tier]) {
        throw Object.assign(new Error('Invalid tier for trial'), { statusCode: 400 });
    }
    // Check if user already used trial
    const userResult = await index_js_1.pool.query(`SELECT has_used_trial, email, first_name FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length === 0) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    const user = userResult.rows[0];
    if (user.has_used_trial) {
        throw Object.assign(new Error('You have already used your free trial'), { statusCode: 409 });
    }
    // Check for existing active/trialing paid subscription
    const existingSub = await index_js_1.pool.query(`SELECT id, tier, status FROM subscriptions
     WHERE user_id = $1 AND status IN ('active', 'trialing') AND tier != 'free'
     ORDER BY created_at DESC LIMIT 1`, [userId]);
    if (existingSub.rows.length > 0) {
        throw Object.assign(new Error('You already have an active paid subscription'), { statusCode: 409 });
    }
    // Create or update user-level subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + (durationDays ?? TRIAL_DURATION_DAYS));
    // Get user's organization
    const orgResult = await index_js_1.pool.query(`SELECT organization_id FROM organization_members WHERE user_id = $1 AND role = 'owner' LIMIT 1`, [userId]);
    const organizationId = orgResult.rows[0]?.organization_id;
    if (!organizationId) {
        throw Object.assign(new Error('No organization found for user'), { statusCode: 400 });
    }
    // Try to update existing subscription first, then insert if none exists
    let subscriptionId;
    let finalTrialEnd;
    const existingFreeSub = await index_js_1.pool.query(`UPDATE subscriptions
     SET tier = $1, status = 'trialing', trial_start = NOW(), trial_end = $2, trial_warning_sent = false, user_id = $3, updated_at = NOW()
     WHERE organization_id = $4 AND (tier = 'free' OR status = 'active')
     RETURNING id, trial_end`, [tier, trialEnd.toISOString(), userId, organizationId]);
    if (existingFreeSub.rows.length > 0) {
        subscriptionId = existingFreeSub.rows[0].id;
        finalTrialEnd = existingFreeSub.rows[0].trial_end;
    }
    else {
        // Create new subscription
        const newSub = await index_js_1.pool.query(`INSERT INTO subscriptions (user_id, organization_id, tier, status, trial_start, trial_end, trial_warning_sent)
       VALUES ($1, $2, $3, 'trialing', NOW(), $4, false)
       RETURNING id, trial_end`, [userId, organizationId, tier, trialEnd.toISOString()]);
        subscriptionId = newSub.rows[0].id;
        finalTrialEnd = newSub.rows[0].trial_end;
    }
    // Mark user as having used trial
    await index_js_1.pool.query(`UPDATE users SET has_used_trial = true WHERE id = $1`, [userId]);
    // Send trial_started email
    const tierInfo = TIER_FEATURES[tier];
    const trialEndDate = new Date(finalTrialEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    try {
        await (0, email_template_service_js_1.sendTemplate)({
            templateSlug: 'trial_started',
            to: {
                userId,
                email: user.email,
                firstName: user.first_name || 'there',
            },
            variables: {
                firstName: user.first_name || 'there',
                tierName: tierInfo.name,
                trialEndDate,
                featureHighlight1: tierInfo.highlights[0],
                featureHighlight2: tierInfo.highlights[1],
                featureHighlight3: tierInfo.highlights[2],
            },
        });
    }
    catch (err) {
        console.error('Failed to send trial_started email:', err);
    }
    // Fire CRM trigger
    try {
        await (0, crm_trigger_service_js_1.fireTrigger)(userId, 'trial_started', { tier, trialEnd: finalTrialEnd });
    }
    catch (err) {
        console.error('Failed to fire trial_started trigger:', err);
    }
    return { subscriptionId, trialEnd: finalTrialEnd };
}
/**
 * Check for expiring and expired trials.
 * Called by the trial worker every 5 minutes. Idempotent.
 */
async function checkTrialExpiry() {
    // 1. Send 3-day warning emails
    const warningResult = await index_js_1.pool.query(`SELECT s.id, s.user_id, s.tier, s.trial_end,
            u.email, u.first_name
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE s.status = 'trialing'
       AND s.trial_end <= NOW() + make_interval(days => $1)
       AND s.trial_end > NOW()
       AND s.trial_warning_sent = false`, [WARNING_DAYS_BEFORE]);
    for (const row of warningResult.rows) {
        try {
            const trialEndDate = new Date(row.trial_end).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            const tierInfo = TIER_FEATURES[row.tier] || { name: row.tier };
            await (0, email_template_service_js_1.sendTemplate)({
                templateSlug: 'trial_expiring',
                to: {
                    userId: row.user_id,
                    email: row.email,
                    firstName: row.first_name || 'there',
                },
                variables: {
                    firstName: row.first_name || 'there',
                    tierName: tierInfo.name,
                    trialEndDate,
                },
            });
            // Mark warning as sent
            await index_js_1.pool.query(`UPDATE subscriptions SET trial_warning_sent = true WHERE id = $1`, [row.id]);
            await (0, crm_trigger_service_js_1.fireTrigger)(row.user_id, 'trial_expiring', {
                tier: row.tier,
                trialEnd: row.trial_end,
            });
            console.log(`⏳ Trial expiry warning sent to ${row.email}`);
        }
        catch (err) {
            console.error(`Failed to send trial warning for subscription ${row.id}:`, err);
        }
    }
    // 2. Expire trials that have passed their end date
    const expiredResult = await index_js_1.pool.query(`SELECT s.id, s.user_id, s.tier, s.trial_end,
            u.email, u.first_name
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE s.status = 'trialing'
       AND s.trial_end < NOW()`);
    for (const row of expiredResult.rows) {
        try {
            const originalTier = row.tier;
            const tierInfo = TIER_FEATURES[originalTier] || { name: originalTier };
            // Downgrade to free
            await index_js_1.pool.query(`UPDATE subscriptions
         SET tier = 'free', status = 'active', updated_at = NOW()
         WHERE id = $1`, [row.id]);
            await (0, email_template_service_js_1.sendTemplate)({
                templateSlug: 'trial_expired',
                to: {
                    userId: row.user_id,
                    email: row.email,
                    firstName: row.first_name || 'there',
                },
                variables: {
                    firstName: row.first_name || 'there',
                    tierName: tierInfo.name,
                },
            });
            await (0, crm_trigger_service_js_1.fireTrigger)(row.user_id, 'trial_expired', {
                tier: originalTier,
                trialEnd: row.trial_end,
            });
            console.log(`🔻 Trial expired for ${row.email} — downgraded from ${originalTier} to free`);
        }
        catch (err) {
            console.error(`Failed to process trial expiry for subscription ${row.id}:`, err);
        }
    }
}
//# sourceMappingURL=trial.service.js.map