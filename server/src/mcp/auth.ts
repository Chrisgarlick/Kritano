import crypto from 'crypto';
import type { Pool } from 'pg';
import { RATE_LIMIT_TIERS, type ApiScope, type RateLimitTier, type ValidatedApiKey } from '../services/apiKey.service.js';

export interface McpContext {
  userId: string;
  apiKeyId: string;
  scopes: ApiScope[];
  tier: RateLimitTier;
  rateLimits: (typeof RATE_LIMIT_TIERS)[RateLimitTier];
}

/**
 * Validate the API key and resolve user context.
 * Accepts an explicit key (for HTTP transport) or falls back to KRITANO_API_KEY env var (for stdio).
 */
export async function authenticateMcp(pool: Pool, explicitKey?: string): Promise<McpContext> {
  const apiKey = explicitKey || process.env.KRITANO_API_KEY;

  if (!apiKey) {
    throw new Error(
      'KRITANO_API_KEY environment variable is required. Generate one at Settings > API Keys in the Kritano dashboard.'
    );
  }

  if (!apiKey.startsWith('kt_live_') && !apiKey.startsWith('pp_live_')) {
    throw new Error(
      'Invalid API key format. Keys start with kt_live_ or pp_live_. Check your KRITANO_API_KEY environment variable.'
    );
  }

  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const result = await pool.query<ValidatedApiKey>(
    `SELECT id, user_id, name, key_prefix, scopes, rate_limit_tier,
            is_active, expires_at, revoked_at
     FROM api_keys
     WHERE key_hash = $1`,
    [hash]
  );

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

  const tier = key.rate_limit_tier as RateLimitTier;
  const rateLimits = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.free;

  // Record usage
  await pool.query(
    `UPDATE api_keys SET last_used_at = NOW(), request_count = request_count + 1 WHERE id = $1`,
    [key.id]
  );

  return {
    userId: key.user_id,
    apiKeyId: key.id,
    scopes: key.scopes as ApiScope[],
    tier,
    rateLimits,
  };
}

/**
 * Check if the MCP context has a required scope
 */
export function hasScope(ctx: McpContext, scope: ApiScope): boolean {
  return ctx.scopes.includes(scope);
}

/**
 * Throw if the context doesn't have the required scope
 */
export function requireScope(ctx: McpContext, scope: ApiScope): void {
  if (!hasScope(ctx, scope)) {
    throw new Error(
      `Your API key doesn't have the '${scope}' scope. Update it at Settings > API Keys.`
    );
  }
}
