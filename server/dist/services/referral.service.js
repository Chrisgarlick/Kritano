"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
exports.getOrCreateReferralCode = getOrCreateReferralCode;
exports.resolveReferralCode = resolveReferralCode;
exports.createReferral = createReferral;
exports.checkAndQualifyReferral = checkAndQualifyReferral;
exports.consumeBonusAudit = consumeBonusAudit;
exports.getReferralStats = getReferralStats;
exports.getUserReferrals = getUserReferrals;
exports.sendInviteEmails = sendInviteEmails;
exports.adminGetStats = adminGetStats;
exports.adminListReferrals = adminListReferrals;
exports.adminVoidReferral = adminVoidReferral;
const crypto_1 = __importDefault(require("crypto"));
const email_template_service_js_1 = require("./email-template.service.js");
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
function generateCode() {
    return 'REF-' + crypto_1.default.randomBytes(4).toString('hex');
}
// ─── Config ────────────────────────────────────────────
async function getConfig() {
    const result = await pool.query('SELECT key, value FROM referral_config');
    const configMap = {};
    for (const row of result.rows) {
        configMap[row.key] = row.value;
    }
    return {
        enabled: configMap.enabled === true || configMap.enabled === 'true',
        maxReferralsPerMonth: Number(configMap.max_referrals_per_month) || 50,
        rewards: configMap.rewards || {
            referrer: { free: 5, starter: 5, pro: 8, agency: 12, enterprise: 12 },
            referred: 3,
            milestones: { '5': { tier: 'starter', days: 30 }, '10': { tier: 'pro', days: 30 } },
        },
    };
}
async function updateConfig(key, value) {
    await pool.query(`INSERT INTO referral_config (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`, [key, JSON.stringify(value)]);
}
// ─── Referral Code ─────────────────────────────────────
async function getOrCreateReferralCode(userId) {
    const existing = await pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
    if (existing.rows[0]?.referral_code) {
        return existing.rows[0].referral_code;
    }
    const code = generateCode();
    await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, userId]);
    return code;
}
async function resolveReferralCode(code) {
    const result = await pool.query('SELECT id, email FROM users WHERE referral_code = $1 AND status != $2', [code, 'deleted']);
    if (result.rows.length === 0)
        return null;
    return { userId: result.rows[0].id, email: result.rows[0].email };
}
// ─── Create Referral ───────────────────────────────────
async function createReferral(referrerId, referredId, code, referredIp) {
    const config = await getConfig();
    if (!config.enabled)
        return null;
    // Block self-referral
    if (referrerId === referredId)
        return null;
    // Check same email (shouldn't happen since referred user was just created with different email, but guard)
    const users = await pool.query('SELECT email FROM users WHERE id = ANY($1)', [[referrerId, referredId]]);
    const emails = users.rows.map((r) => r.email.toLowerCase());
    if (emails.length === 2 && emails[0] === emails[1])
        return null;
    // Check monthly limit
    const monthCount = await pool.query(`SELECT COUNT(*) as cnt FROM referrals
     WHERE referrer_id = $1
       AND created_at >= date_trunc('month', NOW())`, [referrerId]);
    if (parseInt(monthCount.rows[0].cnt, 10) >= config.maxReferralsPerMonth)
        return null;
    // Get referrer tier
    const tierResult = await pool.query(`SELECT COALESCE(s.tier, 'free') as tier
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
     WHERE u.id = $1
     ORDER BY s.created_at DESC LIMIT 1`, [referrerId]);
    const referrerTier = tierResult.rows[0]?.tier || 'free';
    // Get referrer IP from their last login
    const referrerIpResult = await pool.query('SELECT last_login_ip FROM users WHERE id = $1', [referrerId]);
    const result = await pool.query(`INSERT INTO referrals (referrer_id, referred_id, referral_code, referrer_ip, referred_ip, referrer_tier)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (referred_id) DO NOTHING
     RETURNING *`, [referrerId, referredId, code, referrerIpResult.rows[0]?.last_login_ip || null, referredIp || null, referrerTier]);
    if (result.rows.length === 0)
        return null;
    // Store referral info on the user
    await pool.query('UPDATE users SET referred_by_code = $1, referred_by_user_id = $2 WHERE id = $3', [code, referrerId, referredId]);
    return result.rows[0];
}
// ─── Qualification ─────────────────────────────────────
async function checkAndQualifyReferral(referredUserId) {
    // Find pending referral for this user
    const refResult = await pool.query(`SELECT r.*, u.email_verified, u.first_name, u.last_name, u.email as referred_email
     FROM referrals r
     JOIN users u ON u.id = r.referred_id
     WHERE r.referred_id = $1 AND r.status = 'pending'`, [referredUserId]);
    if (refResult.rows.length === 0)
        return;
    const referral = refResult.rows[0];
    // Check email verified
    if (!referral.email_verified) {
        return;
    }
    // Update email_verified_at if not set
    if (!referral.email_verified_at) {
        await pool.query('UPDATE referrals SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1', [referral.id]);
    }
    // Check first audit completed
    const auditResult = await pool.query(`SELECT id FROM audit_jobs
     WHERE user_id = $1 AND status = 'completed'
     ORDER BY completed_at ASC LIMIT 1`, [referredUserId]);
    if (auditResult.rows.length === 0)
        return;
    // Update first_audit_completed_at
    await pool.query(`UPDATE referrals
     SET first_audit_completed_at = NOW(), qualified_at = NOW(), status = 'qualified', updated_at = NOW()
     WHERE id = $1`, [referral.id]);
    // Apply rewards
    await applyRewards(referral.id);
}
// ─── Rewards ───────────────────────────────────────────
async function applyRewards(referralId) {
    const refResult = await pool.query('SELECT * FROM referrals WHERE id = $1', [referralId]);
    if (refResult.rows.length === 0)
        return;
    const referral = refResult.rows[0];
    if (referral.status !== 'qualified')
        return;
    const config = await getConfig();
    const tier = referral.referrer_tier || 'free';
    const referrerBonus = config.rewards.referrer[tier] || 5;
    const referredBonus = config.rewards.referred || 3;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Credit referrer
        await client.query('UPDATE users SET referral_bonus_audits = referral_bonus_audits + $1 WHERE id = $2', [referrerBonus, referral.referrer_id]);
        const referrerBalance = await client.query('SELECT referral_bonus_audits FROM users WHERE id = $1', [referral.referrer_id]);
        await client.query(`INSERT INTO referral_rewards (user_id, referral_id, type, amount, balance_after, description)
       VALUES ($1, $2, 'bonus_audits', $3, $4, $5)`, [referral.referrer_id, referralId, referrerBonus, referrerBalance.rows[0].referral_bonus_audits,
            `Referral reward: ${referrerBonus} bonus audits`]);
        // Credit referred user
        await client.query('UPDATE users SET referral_bonus_audits = referral_bonus_audits + $1 WHERE id = $2', [referredBonus, referral.referred_id]);
        const referredBalance = await client.query('SELECT referral_bonus_audits FROM users WHERE id = $1', [referral.referred_id]);
        await client.query(`INSERT INTO referral_rewards (user_id, referral_id, type, amount, balance_after, description)
       VALUES ($1, $2, 'bonus_audits', $3, $4, $5)`, [referral.referred_id, referralId, referredBonus, referredBalance.rows[0].referral_bonus_audits,
            `Welcome bonus: ${referredBonus} bonus audits`]);
        // Update referral as rewarded
        await client.query(`UPDATE referrals SET
         status = 'rewarded',
         rewarded_at = NOW(),
         referrer_reward_type = 'bonus_audits',
         referrer_reward_value = $1,
         referred_reward_type = 'bonus_audits',
         referred_reward_value = $2,
         updated_at = NOW()
       WHERE id = $3`, [referrerBonus, referredBonus, referralId]);
        await client.query('COMMIT');
        // Send notification emails (non-blocking)
        sendReferralEmails(referral, referrerBonus, referredBonus).catch(err => console.error('Failed to send referral emails:', err));
        // Check milestones
        checkMilestones(referral.referrer_id, config).catch(err => console.error('Failed to check referral milestones:', err));
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
async function sendReferralEmails(referral, referrerBonus, referredBonus) {
    // Get referrer info
    const referrerResult = await pool.query('SELECT first_name, email, referral_bonus_audits FROM users WHERE id = $1', [referral.referrer_id]);
    const referrer = referrerResult.rows[0];
    // Get referred info
    const referredResult = await pool.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [referral.referred_id]);
    const referred = referredResult.rows[0];
    // Email to referrer
    try {
        await (0, email_template_service_js_1.sendTemplate)({
            templateSlug: 'referral_qualified',
            to: { userId: referral.referrer_id, email: referrer.email, firstName: referrer.first_name },
            variables: {
                firstName: referrer.first_name,
                referredName: `${referred.first_name} ${referred.last_name}`,
                bonusAudits: String(referrerBonus),
                totalBonusAudits: String(referrer.referral_bonus_audits),
                referralsUrl: `${APP_URL}/app/referrals`,
            },
        });
    }
    catch (err) {
        console.error('Failed to send referral_qualified email:', err);
    }
    // Email to referred user
    try {
        await (0, email_template_service_js_1.sendTemplate)({
            templateSlug: 'referral_welcome_bonus',
            to: { userId: referral.referred_id, email: referred.email, firstName: referred.first_name },
            variables: {
                firstName: referred.first_name,
                referrerName: referrer.first_name,
                bonusAudits: String(referredBonus),
                dashboardUrl: `${APP_URL}/app/dashboard`,
            },
        });
    }
    catch (err) {
        console.error('Failed to send referral_welcome_bonus email:', err);
    }
}
async function checkMilestones(referrerId, config) {
    const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM referrals
     WHERE referrer_id = $1 AND status = 'rewarded'`, [referrerId]);
    const count = parseInt(countResult.rows[0].cnt, 10);
    const milestones = config.rewards.milestones;
    const milestoneKey = String(count);
    if (!milestones[milestoneKey])
        return;
    const milestone = milestones[milestoneKey];
    // Check if already awarded this milestone
    const existing = await pool.query(`SELECT id FROM referral_rewards
     WHERE user_id = $1 AND type = 'tier_upgrade' AND description LIKE $2`, [referrerId, `%${milestoneKey} referral milestone%`]);
    if (existing.rows.length > 0)
        return;
    // Award milestone: create/extend subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + milestone.days);
    await pool.query(`INSERT INTO subscriptions (user_id, tier, status, trial_start, trial_end)
     VALUES ($1, $2, 'trialing', NOW(), $3)
     ON CONFLICT (user_id) WHERE organization_id IS NULL
     DO UPDATE SET
       tier = EXCLUDED.tier,
       status = 'trialing',
       trial_start = NOW(),
       trial_end = EXCLUDED.trial_end`, [referrerId, milestone.tier, trialEnd.toISOString()]);
    // Log reward
    const balance = await pool.query('SELECT referral_bonus_audits FROM users WHERE id = $1', [referrerId]);
    await pool.query(`INSERT INTO referral_rewards (user_id, type, amount, balance_after, description)
     VALUES ($1, 'tier_upgrade', 0, $2, $3)`, [referrerId, balance.rows[0].referral_bonus_audits,
        `${milestoneKey} referral milestone: Free ${milestone.tier} for ${milestone.days} days`]);
    // Send milestone email
    const userResult = await pool.query('SELECT first_name, email FROM users WHERE id = $1', [referrerId]);
    const user = userResult.rows[0];
    try {
        await (0, email_template_service_js_1.sendTemplate)({
            templateSlug: 'referral_milestone',
            to: { userId: referrerId, email: user.email, firstName: user.first_name },
            variables: {
                firstName: user.first_name,
                milestoneCount: milestoneKey,
                rewardTier: milestone.tier.charAt(0).toUpperCase() + milestone.tier.slice(1),
                rewardDays: String(milestone.days),
                referralsUrl: `${APP_URL}/app/referrals`,
            },
        });
    }
    catch (err) {
        console.error('Failed to send referral_milestone email:', err);
    }
}
// ─── Consume Bonus Audits ──────────────────────────────
async function consumeBonusAudit(userId) {
    const result = await pool.query(`UPDATE users SET referral_bonus_audits = referral_bonus_audits - 1
     WHERE id = $1 AND referral_bonus_audits > 0
     RETURNING referral_bonus_audits`, [userId]);
    if (result.rows.length === 0)
        return false;
    await pool.query(`INSERT INTO referral_rewards (user_id, type, amount, balance_after, description)
     VALUES ($1, 'consumed', -1, $2, 'Bonus audit consumed')`, [userId, result.rows[0].referral_bonus_audits]);
    return true;
}
// ─── User Dashboard ────────────────────────────────────
async function getReferralStats(userId) {
    const code = await getOrCreateReferralCode(userId);
    const stats = await pool.query(`SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
       COUNT(*) FILTER (WHERE status = 'rewarded') as rewarded,
       COUNT(*) FILTER (WHERE status = 'voided') as voided,
       COALESCE(SUM(referrer_reward_value) FILTER (WHERE status = 'rewarded'), 0) as total_earned
     FROM referrals WHERE referrer_id = $1`, [userId]);
    const bonusResult = await pool.query('SELECT referral_bonus_audits FROM users WHERE id = $1', [userId]);
    const s = stats.rows[0];
    return {
        totalReferred: parseInt(s.total, 10),
        pendingCount: parseInt(s.pending, 10),
        qualifiedCount: parseInt(s.qualified, 10),
        rewardedCount: parseInt(s.rewarded, 10),
        voidedCount: parseInt(s.voided, 10),
        totalBonusAuditsEarned: parseInt(s.total_earned, 10),
        bonusAuditsRemaining: bonusResult.rows[0]?.referral_bonus_audits || 0,
        referralCode: code,
        referralLink: `${APP_URL}/register?ref=${code}`,
    };
}
async function getUserReferrals(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) as cnt FROM referrals WHERE referrer_id = $1', [userId]);
    const result = await pool.query(`SELECT r.*, u.email as referred_email, u.first_name || ' ' || u.last_name as referred_name
     FROM referrals r
     JOIN users u ON u.id = r.referred_id
     WHERE r.referrer_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`, [userId, limit, offset]);
    return {
        referrals: result.rows,
        total: parseInt(countResult.rows[0].cnt, 10),
    };
}
// ─── Email Invites ─────────────────────────────────────
async function sendInviteEmails(userId, emails) {
    const userResult = await pool.query('SELECT first_name, last_name, email, referral_code FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    if (!user?.referral_code) {
        throw Object.assign(new Error('No referral code found'), { statusCode: 400 });
    }
    const referralUrl = `${APP_URL}/register?ref=${user.referral_code}`;
    let sent = 0;
    const errors = [];
    for (const email of emails) {
        // Don't send to yourself
        if (email.toLowerCase() === user.email.toLowerCase()) {
            errors.push(`${email}: cannot invite yourself`);
            continue;
        }
        // Check if already a user
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            errors.push(`${email}: already registered`);
            continue;
        }
        try {
            await (0, email_template_service_js_1.sendTemplate)({
                templateSlug: 'referral_invite',
                to: { userId: userId, email, firstName: '' },
                variables: {
                    referrerName: `${user.first_name} ${user.last_name}`,
                    referrerEmail: user.email,
                    referralUrl,
                },
            });
            sent++;
        }
        catch (err) {
            errors.push(`${email}: failed to send`);
        }
    }
    return { sent, errors };
}
// ─── Admin Functions ───────────────────────────────────
async function adminGetStats() {
    const stats = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
      COUNT(*) FILTER (WHERE status = 'rewarded') as rewarded,
      COUNT(*) FILTER (WHERE status = 'voided') as voided
    FROM referrals
  `);
    const s = stats.rows[0];
    const total = parseInt(s.total, 10);
    const rewarded = parseInt(s.rewarded, 10);
    const totalBonusResult = await pool.query(`SELECT COALESCE(SUM(amount), 0) as total
     FROM referral_rewards WHERE type = 'bonus_audits' AND amount > 0`);
    const topReferrers = await pool.query(`
    SELECT r.referrer_id as user_id, u.email, u.first_name || ' ' || u.last_name as name,
           COUNT(*) as referral_count
    FROM referrals r
    JOIN users u ON u.id = r.referrer_id
    WHERE r.status IN ('qualified', 'rewarded')
    GROUP BY r.referrer_id, u.email, u.first_name, u.last_name
    ORDER BY referral_count DESC
    LIMIT 10
  `);
    return {
        totalReferrals: total,
        pendingCount: parseInt(s.pending, 10),
        qualifiedCount: parseInt(s.qualified, 10),
        rewardedCount: rewarded,
        voidedCount: parseInt(s.voided, 10),
        conversionRate: total > 0 ? Math.round((rewarded / total) * 100) : 0,
        totalBonusAuditsAwarded: parseInt(totalBonusResult.rows[0].total, 10),
        topReferrers: topReferrers.rows,
    };
}
async function adminListReferrals(page = 1, limit = 25, status, search) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    if (status) {
        conditions.push(`r.status = $${paramIndex++}`);
        params.push(status);
    }
    if (search) {
        conditions.push(`(u_referrer.email ILIKE $${paramIndex} OR u_referred.email ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
    }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM referrals r
     JOIN users u_referrer ON u_referrer.id = r.referrer_id
     JOIN users u_referred ON u_referred.id = r.referred_id
     ${where}`, params);
    const result = await pool.query(`SELECT r.*,
       u_referrer.email as referrer_email,
       u_referrer.first_name || ' ' || u_referrer.last_name as referrer_name,
       u_referred.email as referred_email,
       u_referred.first_name || ' ' || u_referred.last_name as referred_name
     FROM referrals r
     JOIN users u_referrer ON u_referrer.id = r.referrer_id
     JOIN users u_referred ON u_referred.id = r.referred_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limit, offset]);
    return {
        referrals: result.rows,
        total: parseInt(countResult.rows[0].cnt, 10),
    };
}
async function adminVoidReferral(referralId, reason, adminId) {
    const refResult = await pool.query('SELECT * FROM referrals WHERE id = $1', [referralId]);
    if (refResult.rows.length === 0) {
        throw Object.assign(new Error('Referral not found'), { statusCode: 404 });
    }
    const referral = refResult.rows[0];
    if (referral.status === 'voided') {
        throw Object.assign(new Error('Referral already voided'), { statusCode: 400 });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Reverse rewards if they were applied
        if (referral.status === 'rewarded') {
            // Reverse referrer bonus
            if (referral.referrer_reward_value) {
                await client.query('UPDATE users SET referral_bonus_audits = GREATEST(0, referral_bonus_audits - $1) WHERE id = $2', [referral.referrer_reward_value, referral.referrer_id]);
                const referrerBalance = await client.query('SELECT referral_bonus_audits FROM users WHERE id = $1', [referral.referrer_id]);
                await client.query(`INSERT INTO referral_rewards (user_id, referral_id, type, amount, balance_after, description)
           VALUES ($1, $2, 'admin_adjustment', $3, $4, $5)`, [referral.referrer_id, referralId, -referral.referrer_reward_value,
                    referrerBalance.rows[0].referral_bonus_audits, `Voided: ${reason}`]);
            }
            // Reverse referred bonus
            if (referral.referred_reward_value) {
                await client.query('UPDATE users SET referral_bonus_audits = GREATEST(0, referral_bonus_audits - $1) WHERE id = $2', [referral.referred_reward_value, referral.referred_id]);
                const referredBalance = await client.query('SELECT referral_bonus_audits FROM users WHERE id = $1', [referral.referred_id]);
                await client.query(`INSERT INTO referral_rewards (user_id, referral_id, type, amount, balance_after, description)
           VALUES ($1, $2, 'admin_adjustment', $3, $4, $5)`, [referral.referred_id, referralId, -referral.referred_reward_value,
                    referredBalance.rows[0].referral_bonus_audits, `Voided: ${reason}`]);
            }
        }
        // Void the referral
        const updated = await client.query(`UPDATE referrals SET status = 'voided', voided_at = NOW(), void_reason = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`, [reason, referralId]);
        await client.query('COMMIT');
        return updated.rows[0];
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=referral.service.js.map