"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateMcp = authenticateMcp;
exports.hasScope = hasScope;
exports.requireScope = requireScope;
const crypto_1 = __importDefault(require("crypto"));
const apiKey_service_js_1 = require("../services/apiKey.service.js");
/**
 * Validate the API key and resolve user context.
 * Accepts an explicit key (for HTTP transport) or falls back to KRITANO_API_KEY env var (for stdio).
 */
async function authenticateMcp(pool, explicitKey) {
    const apiKey = explicitKey || process.env.KRITANO_API_KEY;
    if (!apiKey) {
        throw new Error('KRITANO_API_KEY environment variable is required. Generate one at Settings > API Keys in the Kritano dashboard.');
    }
    if (!apiKey.startsWith('kt_live_') && !apiKey.startsWith('pp_live_')) {
        throw new Error('Invalid API key format. Keys start with kt_live_ or pp_live_. Check your KRITANO_API_KEY environment variable.');
    }
    const hash = crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
    const result = await pool.query(`SELECT id, user_id, name, key_prefix, scopes, rate_limit_tier,
            is_active, expires_at, revoked_at
     FROM api_keys
     WHERE key_hash = $1`, [hash]);
    if (result.rows.length === 0) {
        throw new Error('Invalid API key. The key was not found. Generate a new one at Settings > API Keys.');
    }
    const key = result.rows[0];
    if (!key.is_active) {
        throw new Error('API key is inactive. Reactivate it or generate a new one at Settings > API Keys.');
    }
    if (key.revoked_at) {
        throw new Error('API key has been revoked. Generate a new one at Settings > API Keys.');
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
        throw new Error('API key has expired. Generate a new one at Settings > API Keys.');
    }
    const tier = key.rate_limit_tier;
    const rateLimits = apiKey_service_js_1.RATE_LIMIT_TIERS[tier] || apiKey_service_js_1.RATE_LIMIT_TIERS.free;
    // Record usage
    await pool.query(`UPDATE api_keys SET last_used_at = NOW(), request_count = request_count + 1 WHERE id = $1`, [key.id]);
    return {
        userId: key.user_id,
        apiKeyId: key.id,
        scopes: key.scopes,
        tier,
        rateLimits,
    };
}
/**
 * Check if the MCP context has a required scope
 */
function hasScope(ctx, scope) {
    return ctx.scopes.includes(scope);
}
/**
 * Throw if the context doesn't have the required scope
 */
function requireScope(ctx, scope) {
    if (!hasScope(ctx, scope)) {
        throw new Error(`Your API key doesn't have the '${scope}' scope. Update it at Settings > API Keys.`);
    }
}
//# sourceMappingURL=auth.js.map