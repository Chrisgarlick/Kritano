"use strict";
/**
 * Early Access Service
 *
 * Manages the founding members early access campaign:
 * - 250 founding member spots (single consolidated link)
 * - Claim a spot on registration, activate all at once later
 * - 30-day Agency trial + lifetime discount for founding members
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEarlyAccessEnabled = isEarlyAccessEnabled;
exports.getEarlyAccessStatus = getEarlyAccessStatus;
exports.canClaimSpot = canClaimSpot;
exports.claimSpot = claimSpot;
exports.getChannelBreakdown = getChannelBreakdown;
exports.getEarlyAccessUsers = getEarlyAccessUsers;
exports.activateAll = activateAll;
const index_js_1 = require("../db/index.js");
const system_settings_service_js_1 = require("./system-settings.service.js");
const trial_service_js_1 = require("./trial.service.js");
const email_template_service_js_1 = require("./email-template.service.js");
async function isEarlyAccessEnabled() {
    // Check site mode first (new system), fall back to legacy toggle
    const mode = await (0, system_settings_service_js_1.getSiteMode)();
    if (mode === 'early_access')
        return true;
    const val = await (0, system_settings_service_js_1.getSetting)('early_access_enabled');
    return val === true || val === 'true';
}
async function getEarlyAccessStatus() {
    const [enabled, maxSpots, activated] = await Promise.all([
        isEarlyAccessEnabled(),
        (0, system_settings_service_js_1.getSetting)('early_access_max_spots'),
        (0, system_settings_service_js_1.getSetting)('early_access_activated'),
    ]);
    const max = Number(maxSpots) || 250;
    const result = await index_js_1.pool.query(`SELECT COUNT(*)::int AS claimed FROM users WHERE early_access = true`);
    const claimed = result.rows[0].claimed;
    return {
        enabled,
        maxSpots: max,
        claimed,
        remaining: Math.max(0, max - claimed),
        activated: activated === true || activated === 'true',
    };
}
async function canClaimSpot() {
    const status = await getEarlyAccessStatus();
    return status.enabled && status.remaining > 0;
}
/**
 * Claim an early access spot for a user.
 * Uses a CTE count check to prevent race conditions.
 */
async function claimSpot(userId, channel = 'founding') {
    const maxSpots = Number(await (0, system_settings_service_js_1.getSetting)('early_access_max_spots')) || 250;
    const discountPercent = Number(await (0, system_settings_service_js_1.getSetting)('early_access_discount_percent')) || 50;
    const result = await index_js_1.pool.query(`WITH spot_check AS (
       SELECT COUNT(*)::int AS claimed FROM users WHERE early_access = true
     )
     UPDATE users
     SET early_access = true,
         early_access_channel = $2,
         discount_percent = $3
     FROM spot_check
     WHERE users.id = $1
       AND users.early_access = false
       AND spot_check.claimed < $4
     RETURNING users.id`, [userId, channel, discountPercent, maxSpots]);
    return result.rows.length > 0;
}
async function getChannelBreakdown() {
    const result = await index_js_1.pool.query(`SELECT
       COALESCE(SUM(CASE WHEN early_access_channel = 'email' THEN 1 ELSE 0 END), 0)::int AS email,
       COALESCE(SUM(CASE WHEN early_access_channel = 'social' THEN 1 ELSE 0 END), 0)::int AS social,
       COUNT(*)::int AS total
     FROM users
     WHERE early_access = true`);
    return result.rows[0];
}
async function getEarlyAccessUsers(page = 1, limit = 25, search) {
    const offset = (page - 1) * limit;
    const params = [limit, offset];
    let whereClause = 'WHERE u.early_access = true';
    if (search) {
        params.push(`%${search}%`);
        whereClause += ` AND (u.email ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`;
    }
    const [usersResult, countResult] = await Promise.all([
        index_js_1.pool.query(`SELECT u.id, u.email, u.first_name, u.last_name, u.early_access_channel,
              u.email_verified, u.early_access_activated_at, u.created_at
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`, params),
        index_js_1.pool.query(`SELECT COUNT(*)::int AS total FROM users u ${whereClause}`, search ? [`%${search}%`] : []),
    ]);
    return {
        users: usersResult.rows.map((r) => ({
            id: r.id,
            email: r.email,
            firstName: r.first_name,
            lastName: r.last_name,
            channel: r.early_access_channel,
            emailVerified: r.email_verified,
            activatedAt: r.early_access_activated_at,
            createdAt: r.created_at,
        })),
        total: countResult.rows[0].total,
    };
}
/**
 * Activate all early access users: start 30-day Agency trial for each.
 * Idempotent — skips already-activated users.
 */
async function activateAll(adminId) {
    const result = await index_js_1.pool.query(`SELECT id, email, first_name, discount_percent
     FROM users
     WHERE early_access = true AND early_access_activated_at IS NULL`);
    let activated = 0;
    let skipped = 0;
    const appUrl = process.env.APP_URL || 'https://kritano.com';
    for (const user of result.rows) {
        try {
            await (0, trial_service_js_1.startTrial)(user.id, 'agency', 30);
            await index_js_1.pool.query(`UPDATE users SET early_access_activated_at = NOW() WHERE id = $1`, [user.id]);
            // Send activation email
            try {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 30);
                const trialEndDate = trialEnd.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                await (0, email_template_service_js_1.sendTemplate)({
                    templateSlug: 'early_access_activated',
                    to: {
                        userId: user.id,
                        email: user.email,
                        firstName: user.first_name || 'there',
                    },
                    variables: {
                        firstName: user.first_name || 'there',
                        tierName: 'Agency',
                        trialEndDate,
                        discountPercent: String(user.discount_percent || 50),
                        loginUrl: `${appUrl}/login`,
                    },
                });
            }
            catch (emailErr) {
                console.error(`Failed to send early_access_activated email to ${user.email}:`, emailErr);
            }
            activated++;
        }
        catch (err) {
            console.error(`Failed to activate early access for user ${user.id}:`, err);
            skipped++;
        }
    }
    // Mark campaign as activated
    if (activated > 0) {
        await (0, system_settings_service_js_1.setSetting)('early_access_activated', true, adminId);
    }
    return { activated, skipped };
}
//# sourceMappingURL=early-access.service.js.map