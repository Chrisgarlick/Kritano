"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthService = exports.OAuthError = exports.OAuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const google_auth_library_1 = require("google-auth-library");
const index_js_1 = require("../db/index.js");
const oauth_config_js_1 = require("../config/oauth.config.js");
const user_service_js_1 = require("./user.service.js");
const googleClient = new google_auth_library_1.OAuth2Client(oauth_config_js_1.OAUTH_CONFIG.google.clientId, oauth_config_js_1.OAUTH_CONFIG.google.clientSecret, oauth_config_js_1.OAUTH_CONFIG.google.redirectUri);
class OAuthService {
    /**
     * Generate authorization URL for a provider
     */
    generateAuthUrl(provider, mode = 'login') {
        const state = crypto_1.default.randomBytes(32).toString('hex');
        const codeVerifier = crypto_1.default.randomBytes(32).toString('base64url');
        if (provider === 'google') {
            const codeChallenge = crypto_1.default
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');
            const params = new URLSearchParams({
                client_id: oauth_config_js_1.OAUTH_CONFIG.google.clientId,
                redirect_uri: oauth_config_js_1.OAUTH_CONFIG.google.redirectUri,
                response_type: 'code',
                scope: oauth_config_js_1.OAUTH_CONFIG.google.scopes.join(' '),
                state: `${state}:${mode}`,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                access_type: 'offline',
                prompt: 'consent',
            });
            return {
                url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
                state,
                codeVerifier,
            };
        }
        // Facebook
        const params = new URLSearchParams({
            client_id: oauth_config_js_1.OAUTH_CONFIG.facebook.appId,
            redirect_uri: oauth_config_js_1.OAUTH_CONFIG.facebook.redirectUri,
            response_type: 'code',
            scope: oauth_config_js_1.OAUTH_CONFIG.facebook.scopes.join(','),
            state: `${state}:${mode}`,
        });
        return {
            url: `https://www.facebook.com/${oauth_config_js_1.OAUTH_CONFIG.facebook.graphApiVersion}/dialog/oauth?${params.toString()}`,
            state,
            codeVerifier,
        };
    }
    /**
     * Exchange authorization code for profile + tokens
     */
    async exchangeCode(provider, code, codeVerifier) {
        if (provider === 'google') {
            return this.exchangeGoogleCode(code, codeVerifier);
        }
        return this.exchangeFacebookCode(code);
    }
    async exchangeGoogleCode(code, codeVerifier) {
        const { tokens } = await googleClient.getToken({
            code,
            codeVerifier,
        });
        if (!tokens.id_token) {
            throw new Error('No ID token received from Google');
        }
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: oauth_config_js_1.OAUTH_CONFIG.google.clientId,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Invalid Google ID token payload');
        }
        return {
            profile: {
                provider: 'google',
                providerUserId: payload.sub,
                email: payload.email || null,
                emailVerified: payload.email_verified || false,
                firstName: payload.given_name || null,
                lastName: payload.family_name || null,
                name: payload.name || null,
                avatarUrl: payload.picture || null,
                rawProfile: payload,
            },
            tokens: {
                accessToken: tokens.access_token || '',
                refreshToken: tokens.refresh_token || null,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            },
        };
    }
    async exchangeFacebookCode(code) {
        const { graphApiVersion, appId, appSecret, redirectUri } = oauth_config_js_1.OAUTH_CONFIG.facebook;
        // Exchange code for token
        const tokenUrl = new URL(`https://graph.facebook.com/${graphApiVersion}/oauth/access_token`);
        tokenUrl.searchParams.set('client_id', appId);
        tokenUrl.searchParams.set('client_secret', appSecret);
        tokenUrl.searchParams.set('redirect_uri', redirectUri);
        tokenUrl.searchParams.set('code', code);
        const tokenRes = await fetch(tokenUrl.toString());
        if (!tokenRes.ok) {
            const err = await tokenRes.json();
            throw new Error(`Facebook token exchange failed: ${err.error?.message || 'Unknown error'}`);
        }
        const tokenData = await tokenRes.json();
        // Fetch user profile
        const profileUrl = new URL(`https://graph.facebook.com/${graphApiVersion}/me`);
        profileUrl.searchParams.set('fields', 'id,email,first_name,last_name,name,picture.type(large)');
        profileUrl.searchParams.set('access_token', tokenData.access_token);
        const profileRes = await fetch(profileUrl.toString());
        if (!profileRes.ok) {
            throw new Error('Failed to fetch Facebook profile');
        }
        const fbProfile = await profileRes.json();
        return {
            profile: {
                provider: 'facebook',
                providerUserId: fbProfile.id,
                email: fbProfile.email || null,
                emailVerified: !!fbProfile.email, // Facebook only returns verified emails
                firstName: fbProfile.first_name || null,
                lastName: fbProfile.last_name || null,
                name: fbProfile.name || null,
                avatarUrl: fbProfile.picture?.data?.url || null,
                rawProfile: fbProfile,
            },
            tokens: {
                accessToken: tokenData.access_token,
                refreshToken: null,
                expiresAt: tokenData.expires_in
                    ? new Date(Date.now() + tokenData.expires_in * 1000)
                    : null,
            },
        };
    }
    /**
     * Find existing OAuth link
     */
    async findOAuthLink(provider, providerUserId) {
        const result = await index_js_1.pool.query(`SELECT * FROM user_oauth_providers WHERE provider = $1 AND provider_user_id = $2`, [provider, providerUserId]);
        return result.rows[0] || null;
    }
    /**
     * Link a provider to a user
     */
    async linkProvider(userId, provider, profile, tokens) {
        await index_js_1.pool.query(`INSERT INTO user_oauth_providers (user_id, provider, provider_user_id, email, name, avatar_url, access_token, refresh_token, token_expires_at, raw_profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         provider_user_id = EXCLUDED.provider_user_id,
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         avatar_url = EXCLUDED.avatar_url,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         token_expires_at = EXCLUDED.token_expires_at,
         raw_profile = EXCLUDED.raw_profile`, [
            userId,
            provider,
            profile.providerUserId,
            profile.email,
            profile.name,
            profile.avatarUrl,
            tokens.accessToken,
            tokens.refreshToken,
            tokens.expiresAt,
            JSON.stringify(profile.rawProfile),
        ]);
    }
    /**
     * Unlink a provider from a user
     */
    async unlinkProvider(userId, provider) {
        await index_js_1.pool.query(`DELETE FROM user_oauth_providers WHERE user_id = $1 AND provider = $2`, [userId, provider]);
    }
    /**
     * Get linked providers for a user
     */
    async getLinkedProviders(userId) {
        const result = await index_js_1.pool.query(`SELECT * FROM user_oauth_providers WHERE user_id = $1 ORDER BY linked_at`, [userId]);
        return result.rows.map((row) => ({
            provider: row.provider,
            email: row.email,
            name: row.name,
            avatarUrl: row.avatar_url,
            linkedAt: row.linked_at,
        }));
    }
    /**
     * Count linked providers for a user
     */
    async countLinkedProviders(userId) {
        const result = await index_js_1.pool.query(`SELECT COUNT(*) as count FROM user_oauth_providers WHERE user_id = $1`, [userId]);
        return parseInt(result.rows[0].count, 10);
    }
    /**
     * Main OAuth login/register orchestration
     */
    async handleOAuthLogin(profile, tokens) {
        // 1. Check if OAuth link already exists
        const existingLink = await this.findOAuthLink(profile.provider, profile.providerUserId);
        if (existingLink) {
            const user = await user_service_js_1.userService.findSafeById(existingLink.user_id);
            if (!user) {
                throw new Error('Linked user account not found');
            }
            // Update tokens
            await this.linkProvider(existingLink.user_id, profile.provider, profile, tokens);
            return { user, isNewUser: false };
        }
        // 2. Check if user exists with same email
        if (profile.email) {
            const existingUser = await user_service_js_1.userService.findByEmail(profile.email);
            if (existingUser) {
                if (!profile.emailVerified) {
                    throw new OAuthError('OAUTH_EMAIL_NOT_VERIFIED', `Your ${profile.provider === 'google' ? 'Google' : 'Facebook'} email is not verified. Please verify your email with ${profile.provider === 'google' ? 'Google' : 'Facebook'} first, or sign in with your password.`);
                }
                if (existingUser.status === 'suspended') {
                    throw new OAuthError('ACCOUNT_SUSPENDED', 'Account has been suspended');
                }
                if (existingUser.status === 'deleted' || existingUser.deleted_at) {
                    throw new OAuthError('INVALID_CREDENTIALS', 'Account not found');
                }
                // Auto-link
                await this.linkProvider(existingUser.id, profile.provider, profile, tokens);
                // Auto-verify email if not already verified
                if (!existingUser.email_verified) {
                    await user_service_js_1.userService.verifyEmail(existingUser.id);
                }
                return { user: user_service_js_1.userService.toSafeUser(existingUser), isNewUser: false };
            }
        }
        // 3. Create new user
        if (!profile.email) {
            throw new OAuthError('OAUTH_NO_EMAIL', `No email address provided by ${profile.provider === 'google' ? 'Google' : 'Facebook'}. Please ensure your email is visible in your social account settings.`);
        }
        const newUser = await user_service_js_1.userService.createOAuthUser(profile);
        await this.linkProvider(newUser.id, profile.provider, profile, tokens);
        return { user: newUser, isNewUser: true };
    }
}
exports.OAuthService = OAuthService;
class OAuthError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'OAuthError';
    }
}
exports.OAuthError = OAuthError;
exports.oauthService = new OAuthService();
//# sourceMappingURL=oauth.service.js.map