import { Router } from 'express';
import type { Request, Response } from 'express';
import { oauthService, OAuthError } from '../../services/oauth.service.js';
import { userService } from '../../services/user.service.js';
import { tokenService } from '../../services/token.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { oauthRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { getDeviceInfo, getClientIp } from '../../utils/ip.utils.js';
import { COOKIE_CONFIG, JWT_CONFIG, REFRESH_TOKEN_CONFIG, OAUTH_STATE_COOKIE_CONFIG } from '../../config/auth.config.js';
import { OAUTH_CONFIG } from '../../config/oauth.config.js';
import type { OAuthProvider } from '../../types/auth.types.js';

const router = Router();

const VALID_PROVIDERS: OAuthProvider[] = ['google', 'facebook'];

function isValidProvider(provider: string): provider is OAuthProvider {
  return VALID_PROVIDERS.includes(provider as OAuthProvider);
}

/**
 * GET /api/auth/oauth/:provider/url
 * Generate authorization URL for OAuth provider
 */
router.get('/:provider/url', oauthRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    if (!isValidProvider(provider)) {
      res.status(400).json({ error: 'Invalid provider', code: 'INVALID_PROVIDER' });
      return;
    }

    const mode = req.query.mode === 'link' ? 'link' : 'login';
    const { url, state, codeVerifier } = oauthService.generateAuthUrl(provider, mode as 'login' | 'link');

    // Store state + codeVerifier in httpOnly cookie
    res.cookie(OAUTH_CONFIG.state.cookieName, JSON.stringify({ state, codeVerifier }), {
      ...OAUTH_STATE_COOKIE_CONFIG,
      maxAge: OAUTH_CONFIG.state.maxAgeMs,
    });

    res.json({ url });
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL', code: 'OAUTH_URL_FAILED' });
  }
});

/**
 * POST /api/auth/oauth/:provider/callback
 * Exchange authorization code for login/register
 */
router.post('/:provider/callback', oauthRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    if (!isValidProvider(provider)) {
      res.status(400).json({ error: 'Invalid provider', code: 'INVALID_PROVIDER' });
      return;
    }

    const { code, state } = req.body;
    if (!code || !state) {
      res.status(400).json({ error: 'Code and state are required', code: 'MISSING_PARAMS' });
      return;
    }

    // Validate state from cookie
    const stateCookie = req.cookies?.[OAUTH_CONFIG.state.cookieName];
    if (!stateCookie) {
      res.status(400).json({ error: 'OAuth session expired. Please try again.', code: 'STATE_EXPIRED' });
      return;
    }

    let storedData: { state: string; codeVerifier: string };
    try {
      storedData = JSON.parse(stateCookie);
    } catch {
      res.status(400).json({ error: 'Invalid OAuth session. Please try again.', code: 'STATE_INVALID' });
      return;
    }

    // Parse state: format is "randomhex:mode"
    const [stateValue] = state.split(':');
    if (stateValue !== storedData.state) {
      res.status(400).json({ error: 'State mismatch. Please try again.', code: 'STATE_MISMATCH' });
      return;
    }

    // Clear state cookie
    res.clearCookie(OAUTH_CONFIG.state.cookieName, { path: OAUTH_STATE_COOKIE_CONFIG.path });

    // Exchange code for profile
    const { profile, tokens } = await oauthService.exchangeCode(provider, code, storedData.codeVerifier);

    // Handle login/register
    const { user, isNewUser } = await oauthService.handleOAuthLogin(profile, tokens);

    // Record login success
    const ipAddress = getClientIp(req);
    await userService.recordLoginSuccess(user.id, ipAddress);

    // Generate tokens
    const deviceInfo = getDeviceInfo(req);
    const accessToken = tokenService.generateAccessToken(user);
    const { token: refreshToken } = await tokenService.createRefreshToken(user.id, deviceInfo);

    // Set cookies
    res.cookie('access_token', accessToken, {
      ...COOKIE_CONFIG,
      maxAge: JWT_CONFIG.accessTokenExpiry * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: REFRESH_TOKEN_CONFIG.expiryMs,
    });

    res.json({
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified,
        role: user.role,
      },
      isNewUser,
      expiresIn: JWT_CONFIG.accessTokenExpiry,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);

    // Clear state cookie on error
    res.clearCookie(OAUTH_CONFIG.state.cookieName, { path: OAUTH_STATE_COOKIE_CONFIG.path });

    if (error instanceof OAuthError) {
      const statusMap: Record<string, number> = {
        OAUTH_EMAIL_NOT_VERIFIED: 400,
        OAUTH_NO_EMAIL: 400,
        ACCOUNT_SUSPENDED: 403,
        INVALID_CREDENTIALS: 401,
      };
      res.status(statusMap[error.code] || 400).json({ error: error.message, code: error.code });
      return;
    }

    res.status(500).json({ error: 'OAuth authentication failed. Please try again.', code: 'OAUTH_FAILED' });
  }
});

/**
 * GET /api/auth/oauth/providers
 * List linked providers for current user
 */
router.get('/providers', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const providers = await oauthService.getLinkedProviders(req.user!.id);
    const hasPassword = await userService.hasPassword(req.user!.id);

    res.json({ providers, hasPassword });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to get linked providers', code: 'GET_PROVIDERS_FAILED' });
  }
});

/**
 * POST /api/auth/oauth/:provider/link
 * Link a provider to the authenticated user
 */
router.post('/:provider/link', authenticate, oauthRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    if (!isValidProvider(provider)) {
      res.status(400).json({ error: 'Invalid provider', code: 'INVALID_PROVIDER' });
      return;
    }

    const { code, state } = req.body;
    if (!code || !state) {
      res.status(400).json({ error: 'Code and state are required', code: 'MISSING_PARAMS' });
      return;
    }

    // Validate state from cookie
    const stateCookie = req.cookies?.[OAUTH_CONFIG.state.cookieName];
    if (!stateCookie) {
      res.status(400).json({ error: 'OAuth session expired. Please try again.', code: 'STATE_EXPIRED' });
      return;
    }

    let storedData: { state: string; codeVerifier: string };
    try {
      storedData = JSON.parse(stateCookie);
    } catch {
      res.status(400).json({ error: 'Invalid OAuth session.', code: 'STATE_INVALID' });
      return;
    }

    const [stateValue] = state.split(':');
    if (stateValue !== storedData.state) {
      res.status(400).json({ error: 'State mismatch.', code: 'STATE_MISMATCH' });
      return;
    }

    res.clearCookie(OAUTH_CONFIG.state.cookieName, { path: OAUTH_STATE_COOKIE_CONFIG.path });

    // Exchange code
    const { profile, tokens } = await oauthService.exchangeCode(provider, code, storedData.codeVerifier);

    // Check if this provider account is already linked to another user
    const existingLink = await oauthService.findOAuthLink(provider, profile.providerUserId);
    if (existingLink && existingLink.user_id !== req.user!.id) {
      res.status(409).json({
        error: `This ${provider === 'google' ? 'Google' : 'Facebook'} account is already linked to another user.`,
        code: 'PROVIDER_ALREADY_LINKED',
      });
      return;
    }

    // Link provider
    await oauthService.linkProvider(req.user!.id, provider, profile, tokens);

    res.json({ message: `${provider === 'google' ? 'Google' : 'Facebook'} account linked successfully` });
  } catch (error) {
    console.error('Link provider error:', error);
    res.clearCookie(OAUTH_CONFIG.state.cookieName, { path: OAUTH_STATE_COOKIE_CONFIG.path });
    res.status(500).json({ error: 'Failed to link provider', code: 'LINK_FAILED' });
  }
});

/**
 * DELETE /api/auth/oauth/:provider
 * Unlink a provider from the authenticated user
 */
router.delete('/:provider', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    if (!isValidProvider(provider)) {
      res.status(400).json({ error: 'Invalid provider', code: 'INVALID_PROVIDER' });
      return;
    }

    const userId = req.user!.id;

    // Enforce at least one auth method remains
    const hasPassword = await userService.hasPassword(userId);
    const providerCount = await oauthService.countLinkedProviders(userId);

    if (!hasPassword && providerCount <= 1) {
      res.status(400).json({
        error: 'Cannot remove your only sign-in method. Set a password first or link another provider.',
        code: 'LAST_AUTH_METHOD',
      });
      return;
    }

    await oauthService.unlinkProvider(userId, provider);

    res.json({ message: `${provider === 'google' ? 'Google' : 'Facebook'} account unlinked successfully` });
  } catch (error) {
    console.error('Unlink provider error:', error);
    res.status(500).json({ error: 'Failed to unlink provider', code: 'UNLINK_FAILED' });
  }
});

export const oauthRouter = router;
