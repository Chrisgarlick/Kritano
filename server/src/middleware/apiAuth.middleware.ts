import type { Request, Response, NextFunction } from 'express';
import { apiKeyService, type ValidatedApiKey, type ApiScope } from '../services/apiKey.service.js';

/**
 * Extended request with API key data
 */
export interface ApiAuthenticatedRequest extends Request {
  apiKey: ValidatedApiKey;
  apiKeyId: string;
  apiUserId: string;
}

/**
 * Middleware to authenticate API requests using API keys.
 * Checks for key in Authorization header (Bearer) or X-API-Key header.
 */
export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();

  try {
    // Get API key from headers
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];

    let key: string | undefined;

    if (authHeader?.startsWith('Bearer kt_live_') || authHeader?.startsWith('Bearer pp_live_')) {
      key = authHeader.replace('Bearer ', '');
    } else if (typeof apiKeyHeader === 'string' && (apiKeyHeader.startsWith('kt_live_') || apiKeyHeader.startsWith('pp_live_'))) {
      key = apiKeyHeader;
    }

    if (!key) {
      res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_REQUIRED',
        message: 'Provide API key via Authorization header (Bearer kt_live_xxx) or X-API-Key header',
      });
      return;
    }

    // Validate the key
    const validatedKey = await apiKeyService.validateKey(key);

    if (!validatedKey) {
      res.status(401).json({
        error: 'Invalid API key',
        code: 'API_KEY_INVALID',
        message: 'The provided API key is invalid, expired, or revoked',
      });
      return;
    }

    // Check rate limits
    const rateLimit = await apiKeyService.checkRateLimit(validatedKey.id, validatedKey.rate_limit_tier);

    if (!rateLimit.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimit.retryAfter,
        message: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
      });

      // Still log the rejected request
      await apiKeyService.logRequest(
        validatedKey.id,
        req.method,
        req.path,
        429,
        Date.now() - startTime,
        req.ip,
        req.get('user-agent')
      );
      return;
    }

    // Attach API key data to request
    (req as ApiAuthenticatedRequest).apiKey = validatedKey;
    (req as ApiAuthenticatedRequest).apiKeyId = validatedKey.id;
    (req as ApiAuthenticatedRequest).apiUserId = validatedKey.user_id;

    // Also set req.user for compatibility with existing routes
    req.user = {
      id: validatedKey.user_id,
      email: '', // Not available from API key
      role: 'user', // API keys don't have roles, default to user
    };

    // Record usage after response is sent
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;

      // Update key usage
      apiKeyService.recordUsage(validatedKey.id, req.ip).catch((err) => {
        console.error('Failed to record API key usage:', err);
      });

      // Log the request
      apiKeyService
        .logRequest(
          validatedKey.id,
          req.method,
          req.path,
          res.statusCode,
          responseTime,
          req.ip,
          req.get('user-agent')
        )
        .catch((err) => {
          console.error('Failed to log API request:', err);
        });
    });

    next();
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Middleware factory for scope-based authorization.
 * Requires authenticateApiKey middleware to run first.
 */
export function requireScope(...requiredScopes: ApiScope[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiReq = req as ApiAuthenticatedRequest;

    if (!apiReq.apiKey) {
      res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_REQUIRED',
      });
      return;
    }

    const hasScope = requiredScopes.some((scope) => apiReq.apiKey.scopes.includes(scope));

    if (!hasScope) {
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'SCOPE_REQUIRED',
        requiredScopes,
        yourScopes: apiReq.apiKey.scopes,
        message: `This endpoint requires one of these scopes: ${requiredScopes.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware that accepts either session auth OR API key auth
 * Useful for endpoints that should work with both web UI and API
 */
export async function authenticateAny(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Check if already authenticated via session (cookie)
  if (req.cookies?.access_token) {
    // Let the regular auth middleware handle it
    const { authenticate } = await import('./auth.middleware.js');
    return authenticate(req, res, next);
  }

  // Check for API key
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];

  if (
    (authHeader && (authHeader.startsWith('Bearer kt_live_') || authHeader.startsWith('Bearer pp_live_'))) ||
    (typeof apiKeyHeader === 'string' && (apiKeyHeader.startsWith('kt_live_') || apiKeyHeader.startsWith('pp_live_')))
  ) {
    return authenticateApiKey(req, res, next);
  }

  // Check for JWT in Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const { authenticate } = await import('./auth.middleware.js');
    return authenticate(req, res, next);
  }

  // No auth provided
  res.status(401).json({
    error: 'Authentication required',
    code: 'AUTH_REQUIRED',
    message: 'Provide session cookie, JWT token, or API key',
  });
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  res: Response,
  apiKey: ValidatedApiKey,
  requestsRemaining: number
): void {
  const limits = apiKey.rateLimits;

  res.setHeader('X-RateLimit-Limit', limits.requestsPerMinute);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, requestsRemaining));
  res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 60);
}
