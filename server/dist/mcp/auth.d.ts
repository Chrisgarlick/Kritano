import type { Pool } from 'pg';
import { RATE_LIMIT_TIERS, type ApiScope, type RateLimitTier } from '../services/apiKey.service.js';
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
export declare function authenticateMcp(pool: Pool, explicitKey?: string): Promise<McpContext>;
/**
 * Check if the MCP context has a required scope
 */
export declare function hasScope(ctx: McpContext, scope: ApiScope): boolean;
/**
 * Throw if the context doesn't have the required scope
 */
export declare function requireScope(ctx: McpContext, scope: ApiScope): void;
//# sourceMappingURL=auth.d.ts.map