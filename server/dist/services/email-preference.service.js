"use strict";
/**
 * Email Preference Service
 *
 * Manages user-level email opt-in/opt-out preferences and
 * generates signed unsubscribe tokens for CAN-SPAM/GDPR compliance.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreferences = getPreferences;
exports.updatePreferences = updatePreferences;
exports.unsubscribeAll = unsubscribeAll;
exports.canSendCategory = canSendCategory;
exports.generateUnsubscribeToken = generateUnsubscribeToken;
exports.verifyUnsubscribeToken = verifyUnsubscribeToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../db/index.js");
const email_template_types_js_1 = require("../types/email-template.types.js");
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;
/**
 * Get email preferences for a user. Returns defaults if no row exists.
 */
async function getPreferences(userId) {
    const result = await index_js_1.pool.query(`SELECT * FROM email_preferences WHERE user_id = $1`, [userId]);
    if (result.rows.length > 0) {
        return result.rows[0];
    }
    // Return defaults
    return {
        user_id: userId,
        transactional: true,
        audit_notifications: true,
        product_updates: true,
        educational: true,
        marketing: true,
        unsubscribed_all: false,
        updated_at: new Date().toISOString(),
    };
}
/**
 * Update email preferences for a user. Creates the row if it doesn't exist.
 */
async function updatePreferences(userId, prefs) {
    const fields = [];
    const values = [userId];
    let paramIndex = 2;
    const allowedKeys = [
        'transactional', 'audit_notifications', 'product_updates',
        'educational', 'marketing', 'unsubscribed_all',
    ];
    for (const key of allowedKeys) {
        if (key in prefs) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(prefs[key]);
            paramIndex++;
        }
    }
    if (fields.length === 0) {
        return getPreferences(userId);
    }
    const result = await index_js_1.pool.query(`INSERT INTO email_preferences (user_id, ${allowedKeys.filter(k => k in prefs).join(', ')}, updated_at)
     VALUES ($1, ${allowedKeys.filter(k => k in prefs).map((_, i) => `$${i + 2}`).join(', ')}, NOW())
     ON CONFLICT (user_id) DO UPDATE SET ${fields.join(', ')}, updated_at = NOW()
     RETURNING *`, values);
    return result.rows[0];
}
/**
 * One-click unsubscribe — sets unsubscribed_all = true.
 */
async function unsubscribeAll(userId) {
    await index_js_1.pool.query(`INSERT INTO email_preferences (user_id, unsubscribed_all, updated_at)
     VALUES ($1, true, NOW())
     ON CONFLICT (user_id) DO UPDATE SET unsubscribed_all = true, updated_at = NOW()`, [userId]);
}
/**
 * Check if a specific email category can be sent to a user.
 * Transactional emails always send (except if the category itself is opted out).
 */
async function canSendCategory(userId, category) {
    // Transactional and security emails always send
    if (category === 'transactional' || category === 'security') {
        return true;
    }
    const prefs = await getPreferences(userId);
    // Master kill switch blocks all non-transactional
    if (prefs.unsubscribed_all) {
        return false;
    }
    // Map category to preference column
    const prefKey = email_template_types_js_1.CATEGORY_TO_PREFERENCE[category];
    if (!prefKey || prefKey === 'transactional') {
        return true;
    }
    return prefs[prefKey];
}
/**
 * Generate a signed, non-expiring JWT token for unsubscribe links.
 */
function generateUnsubscribeToken(userId) {
    return jsonwebtoken_1.default.sign({ userId, purpose: 'unsubscribe' }, JWT_SECRET);
}
/**
 * Verify an unsubscribe token.
 */
function verifyUnsubscribeToken(token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (payload.purpose !== 'unsubscribe') {
            return { valid: false };
        }
        return { valid: true, userId: payload.userId };
    }
    catch {
        return { valid: false };
    }
}
//# sourceMappingURL=email-preference.service.js.map