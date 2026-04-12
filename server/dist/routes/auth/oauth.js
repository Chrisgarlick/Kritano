"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRouter = void 0;
const express_1 = require("express");
const oauth_service_js_1 = require("../../services/oauth.service.js");
const user_service_js_1 = require("../../services/user.service.js");
const token_service_js_1 = require("../../services/token.service.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const rateLimit_middleware_js_1 = require("../../middleware/rateLimit.middleware.js");
const ip_utils_js_1 = require("../../utils/ip.utils.js");
const auth_config_js_1 = require("../../config/auth.config.js");
const oauth_config_js_1 = require("../../config/oauth.config.js");
const router = (0, express_1.Router)();
const VALID_PROVIDERS = ['google', 'facebook'];
function isValidProvider(provider) {
    return VALID_PROVIDERS.includes(provider);
}
/**
 * GET /api/auth/oauth/:provider/url
 * Generate authorization URL for OAuth provider
 */
router.get('/:provider/url', rateLimit_middleware_js_1.oauthRateLimiter, async (req, res) => {
    try {
        const { provider } = req.params;
        if (!isValidProvider(provider)) {
            res.status(400).json({ error: 'Invalid provider', code: 'INVALID_PROVIDER' });
            return;
        }
        const mode = req.query.mode === 'link' ? 'link' : 'login';
        const { url, state, codeVerifier } = oauth_service_js_1.oauthService.generateAuthUrl(provider, mode);
        // Store state + codeVerifier in httpOnly cookie
        res.cookie(oauth_config_js_1.OAUTH_CONFIG.state.cookieName, JSON.stringify({ state, codeVerifier }), {
            ...auth_config_js_1.OAUTH_STATE_COOKIE_CONFIG,
            maxAge: oauth_config_js_1.OAUTH_CONFIG.state.maxAgeMs,
        });
        res.json({ url });
    }
    catch (error) {
        console.error('OAuth URL generation error:', error);
        res.status(500).json({ error: 'Failed to generate authorization URL', code: 'OAUTH_URL_FAILED' });
    }
});
/**
 * POST /api/auth/oauth/:provider/callback
 * Exchange authorization code for login/register
 */
router.post('/:provider/callback', rateLimit_middleware_js_1.oauthRateLimiter, async (req, res) => {
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
        const stateCookie = req.cookies?.[oauth_config_js_1.OAUTH_CONFIG.state.cookieName];
        if (!stateCookie) {
            res.status(400).json({ error: 'OAuth session expired. Please try again.', code: 'STATE_EXPIRED' });
            return;
        }
        let storedData;
        try {
            storedData = JSON.parse(stateCookie);
        }
        catch {
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
        res.clearCookie(oauth_config_js_1.OAUTH_CONFIG.state.cookieName, { path: auth_config_js_1.OAUTH_STATE_COOKIE_CONFIG.path });
        // Exchange code for profile
        const { profile, tokens } = await oauth_service_js_1.oauthService.exchangeCode(provider, code, storedData.codeVerifier);
        // Handle login/register
        const { user, isNewUser } = await oauth_service_js_1.oauthService.handleOAuthLogin(profile, tokens);
        // Record login success
        const ipAddress = (0, ip_utils_js_1.getClientIp)(req);
        await user_service_js_1.userService.recordLoginSuccess(user.id, ipAddress);
        // Generate tokens
        const deviceInfo = (0, ip_utils_js_1.getDeviceInfo)(req);
        const accessToken = token_service_js_1.tokenService.generateAccessToken(user);
        const { token: refreshToken } = await token_service_js_1.tokenService.createRefreshToken(user.id, deviceInfo);
        // Set cookies
        res.cookie('access_token', accessToken, {
            ...auth_config_js_1.COOKIE_CONFIG,
            maxAge: auth_config_js_1.JWT_CONFIG.accessTokenExpiry * 1000,
        });
        res.cookie('refresh_token', refreshToken, {
            ...auth_config_js_1.COOKIE_CONFIG,
            maxAge: auth_config_js_1.REFRESH_TOKEN_CONFIG.expiryMs,
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
            expiresIn: auth_config_js_1.JWT_CONFIG.accessTokenExpiry,
        });
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        // Clear state cookie on error
        res.clearCookie(oauth_config_js_1.OAUTH_CONFIG.state.cookieName, { path: auth_config_js_1.OAUTH_STATE_COOKIE_CONFIG.path });
        if (error instanceof oauth_service_js_1.OAuthError) {
            const statusMap = {
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
router.get('/providers', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const providers = await oauth_service_js_1.oauthService.getLinkedProviders(req.user.id);
        const hasPassword = await user_service_js_1.userService.hasPassword(req.user.id);
        res.json({ providers, hasPassword });
    }
    catch (error) {
        console.error('Get providers error:', error);
        res.status(500).json({ error: 'Failed to get linked providers', code: 'GET_PROVIDERS_FAILED' });
    }
});
/**
 * POST /api/auth/oauth/:provider/link
 * Link a provider to the authenticated user
 */
router.post('/:provider/link', auth_middleware_js_1.authenticate, rateLimit_middleware_js_1.oauthRateLimiter, async (req, res) => {
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
        const stateCookie = req.cookies?.[oauth_config_js_1.OAUTH_CONFIG.state.cookieName];
        if (!stateCookie) {
            res.status(400).json({ error: 'OAuth session expired. Please try again.', code: 'STATE_EXPIRED' });
            return;
        }
        let storedData;
        try {
            storedData = JSON.parse(stateCookie);
        }
        catch {
            res.status(400).json({ error: 'Invalid OAuth session.', code: 'STATE_INVALID' });
            return;
        }
        const [stateValue] = state.split(':');
        if (stateValue !== storedData.state) {
            res.status(400).json({ error: 'State mismatch.', code: 'STATE_MISMATCH' });
            return;
        }
        res.clearCookie(oauth_config_js_1.OAUTH_CONFIG.state.cookieName, { path: auth_config_js_1.OAUTH_STATE_COOKIE_CONFIG.path });
        // Exchange code
        const { profile, tokens } = await oauth_service_js_1.oauthService.exchangeCode(provider, code, storedData.codeVerifier);
        // Check if this provider account is already linked to another user
        const existingLink = await oauth_service_js_1.oauthService.findOAuthLink(provider, profile.providerUserId);
        if (existingLink && existingLink.user_id !== req.user.id) {
            res.status(409).json({
                error: `This ${provider === 'google' ? 'Google' : 'Facebook'} account is already linked to another user.`,
                code: 'PROVIDER_ALREADY_LINKED',
            });
            return;
        }
        // Link provider
        await oauth_service_js_1.oauthService.linkProvider(req.user.id, provider, profile, tokens);
        res.json({ message: `${provider === 'google' ? 'Google' : 'Facebook'} account linked successfully` });
    }
    catch (error) {
        console.error('Link provider error:', error);
        res.clearCookie(oauth_config_js_1.OAUTH_CONFIG.state.cookieName, { path: auth_config_js_1.OAUTH_STATE_COOKIE_CONFIG.path });
        res.status(500).json({ error: 'Failed to link provider', code: 'LINK_FAILED' });
    }
});
/**
 * DELETE /api/auth/oauth/:provider
 * Unlink a provider from the authenticated user
 */
router.delete('/:provider', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const { provider } = req.params;
        if (!isValidProvider(provider)) {
            res.status(400).json({ error: 'Invalid provider', code: 'INVALID_PROVIDER' });
            return;
        }
        const userId = req.user.id;
        // Enforce at least one auth method remains
        const hasPassword = await user_service_js_1.userService.hasPassword(userId);
        const providerCount = await oauth_service_js_1.oauthService.countLinkedProviders(userId);
        if (!hasPassword && providerCount <= 1) {
            res.status(400).json({
                error: 'Cannot remove your only sign-in method. Set a password first or link another provider.',
                code: 'LAST_AUTH_METHOD',
            });
            return;
        }
        await oauth_service_js_1.oauthService.unlinkProvider(userId, provider);
        res.json({ message: `${provider === 'google' ? 'Google' : 'Facebook'} account unlinked successfully` });
    }
    catch (error) {
        console.error('Unlink provider error:', error);
        res.status(500).json({ error: 'Failed to unlink provider', code: 'UNLINK_FAILED' });
    }
});
exports.oauthRouter = router;
//# sourceMappingURL=oauth.js.map