"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const apiKey_service_js_1 = require("../../services/apiKey.service.js");
const router = (0, express_1.Router)();
// Validation schemas
const createKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long'),
    scopes: zod_1.z
        .array(zod_1.z.enum(apiKey_service_js_1.API_SCOPES))
        .optional()
        .default(['audits:read', 'audits:write', 'findings:read', 'findings:write', 'exports:read']),
    expiresInDays: zod_1.z.number().int().min(1).max(365).optional(),
});
const updateKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    scopes: zod_1.z.array(zod_1.z.enum(apiKey_service_js_1.API_SCOPES)).optional(),
});
/**
 * GET /api/api-keys
 * List user's API keys
 */
router.get('/', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const keys = await apiKey_service_js_1.apiKeyService.getUserKeys(userId);
        res.json({
            keys: keys.map((key) => ({
                id: key.id,
                name: key.name,
                keyPrefix: key.key_prefix,
                scopes: key.scopes,
                rateLimitTier: key.rate_limit_tier,
                lastUsedAt: key.last_used_at,
                requestCount: key.request_count,
                isActive: key.is_active,
                expiresAt: key.expires_at,
                revokedAt: key.revoked_at,
                createdAt: key.created_at,
            })),
        });
    }
    catch (error) {
        console.error('List API keys error:', error);
        res.status(500).json({
            error: 'Failed to list API keys',
            code: 'LIST_KEYS_FAILED',
        });
    }
});
/**
 * POST /api/api-keys
 * Create a new API key
 */
router.post('/', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validateBody)(createKeySchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, scopes, expiresInDays } = req.body;
        // Calculate expiration date if specified
        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }
        // Check existing key count (limit to 10 per user for free tier)
        const existingKeys = await apiKey_service_js_1.apiKeyService.getUserKeys(userId);
        const activeKeys = existingKeys.filter((k) => k.is_active && !k.revoked_at);
        if (activeKeys.length >= 10) {
            res.status(400).json({
                error: 'Maximum API keys reached',
                code: 'MAX_KEYS_REACHED',
                message: 'You can have a maximum of 10 active API keys. Revoke an existing key to create a new one.',
            });
            return;
        }
        const { apiKey, secretKey } = await apiKey_service_js_1.apiKeyService.createKey({
            userId,
            name,
            scopes: scopes,
            expiresAt,
        });
        res.status(201).json({
            message: 'API key created successfully',
            key: {
                id: apiKey.id,
                name: apiKey.name,
                keyPrefix: apiKey.key_prefix,
                scopes: apiKey.scopes,
                rateLimitTier: apiKey.rate_limit_tier,
                lastUsedAt: apiKey.last_used_at,
                requestCount: apiKey.request_count,
                isActive: apiKey.is_active,
                expiresAt: apiKey.expires_at,
                revokedAt: apiKey.revoked_at,
                createdAt: apiKey.created_at,
            },
            // IMPORTANT: This is the only time the full key is returned!
            secretKey,
            warning: 'Save this key now! It will not be shown again.',
        });
    }
    catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({
            error: 'Failed to create API key',
            code: 'CREATE_KEY_FAILED',
        });
    }
});
/**
 * GET /api/api-keys/:keyId
 * Get a specific API key
 */
router.get('/:keyId', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { keyId } = req.params;
        const key = await apiKey_service_js_1.apiKeyService.getKey(keyId, userId);
        if (!key) {
            res.status(404).json({
                error: 'API key not found',
                code: 'KEY_NOT_FOUND',
            });
            return;
        }
        res.json({
            key: {
                id: key.id,
                name: key.name,
                keyPrefix: key.key_prefix,
                scopes: key.scopes,
                rateLimitTier: key.rate_limit_tier,
                lastUsedAt: key.last_used_at,
                lastUsedIp: key.last_used_ip,
                requestCount: key.request_count,
                isActive: key.is_active,
                expiresAt: key.expires_at,
                revokedAt: key.revoked_at,
                revokedReason: key.revoked_reason,
                createdAt: key.created_at,
                updatedAt: key.updated_at,
            },
        });
    }
    catch (error) {
        console.error('Get API key error:', error);
        res.status(500).json({
            error: 'Failed to get API key',
            code: 'GET_KEY_FAILED',
        });
    }
});
/**
 * GET /api/api-keys/:keyId/stats
 * Get usage statistics for an API key
 */
router.get('/:keyId/stats', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { keyId } = req.params;
        const stats = await apiKey_service_js_1.apiKeyService.getKeyStats(keyId, userId);
        if (!stats) {
            res.status(404).json({
                error: 'API key not found',
                code: 'KEY_NOT_FOUND',
            });
            return;
        }
        res.json({ stats });
    }
    catch (error) {
        console.error('Get API key stats error:', error);
        res.status(500).json({
            error: 'Failed to get key statistics',
            code: 'GET_STATS_FAILED',
        });
    }
});
/**
 * PATCH /api/api-keys/:keyId
 * Update an API key (name or scopes)
 */
router.patch('/:keyId', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validateBody)(updateKeySchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { keyId } = req.params;
        const updates = req.body;
        const updatedKey = await apiKey_service_js_1.apiKeyService.updateKey(keyId, userId, {
            name: updates.name,
            scopes: updates.scopes,
        });
        if (!updatedKey) {
            res.status(404).json({
                error: 'API key not found or already revoked',
                code: 'KEY_NOT_FOUND',
            });
            return;
        }
        res.json({
            message: 'API key updated',
            key: {
                id: updatedKey.id,
                name: updatedKey.name,
                scopes: updatedKey.scopes,
                updatedAt: updatedKey.updated_at,
            },
        });
    }
    catch (error) {
        console.error('Update API key error:', error);
        res.status(500).json({
            error: 'Failed to update API key',
            code: 'UPDATE_KEY_FAILED',
        });
    }
});
/**
 * POST /api/api-keys/:keyId/revoke
 * Revoke an API key (soft delete)
 */
router.post('/:keyId/revoke', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { keyId } = req.params;
        const { reason } = req.body;
        const revoked = await apiKey_service_js_1.apiKeyService.revokeKey(keyId, userId, reason);
        if (!revoked) {
            res.status(404).json({
                error: 'API key not found or already revoked',
                code: 'KEY_NOT_FOUND',
            });
            return;
        }
        res.json({
            message: 'API key revoked',
        });
    }
    catch (error) {
        console.error('Revoke API key error:', error);
        res.status(500).json({
            error: 'Failed to revoke API key',
            code: 'REVOKE_KEY_FAILED',
        });
    }
});
/**
 * DELETE /api/api-keys/:keyId
 * Permanently delete an API key
 */
router.delete('/:keyId', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { keyId } = req.params;
        const deleted = await apiKey_service_js_1.apiKeyService.deleteKey(keyId, userId);
        if (!deleted) {
            res.status(404).json({
                error: 'API key not found',
                code: 'KEY_NOT_FOUND',
            });
            return;
        }
        res.json({
            message: 'API key deleted',
        });
    }
    catch (error) {
        console.error('Delete API key error:', error);
        res.status(500).json({
            error: 'Failed to delete API key',
            code: 'DELETE_KEY_FAILED',
        });
    }
});
/**
 * GET /api/api-keys/scopes/available
 * List available API scopes
 */
router.get('/scopes/available', auth_middleware_js_1.authenticate, async (_req, res) => {
    res.json({
        scopes: apiKey_service_js_1.API_SCOPES.map((scope) => ({
            id: scope,
            name: scope.replace(':', ' ').replace(/^\w/, (c) => c.toUpperCase()),
            description: getScopeDescription(scope),
        })),
    });
});
/**
 * GET /api/api-keys/tiers/info
 * Get rate limit tier information
 */
router.get('/tiers/info', auth_middleware_js_1.authenticate, async (_req, res) => {
    res.json({
        tiers: Object.entries(apiKey_service_js_1.RATE_LIMIT_TIERS).map(([name, limits]) => ({
            name,
            ...limits,
            requestsPerDay: limits.requestsPerDay === -1 ? 'Unlimited' : limits.requestsPerDay,
        })),
    });
});
// Helper function for scope descriptions
function getScopeDescription(scope) {
    const descriptions = {
        'audits:read': 'View and list audits',
        'audits:write': 'Create, cancel, and delete audits',
        'findings:read': 'View audit findings',
        'findings:write': 'Dismiss and manage findings',
        'exports:read': 'Export audit data (CSV, JSON, PDF)',
    };
    return descriptions[scope] || scope;
}
exports.apiKeysRouter = router;
//# sourceMappingURL=index.js.map