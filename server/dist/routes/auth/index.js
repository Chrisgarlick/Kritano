"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const user_service_js_1 = require("../../services/user.service.js");
const token_service_js_1 = require("../../services/token.service.js");
const password_service_js_1 = require("../../services/password.service.js");
const email_service_js_1 = require("../../services/email.service.js");
const system_settings_service_js_1 = require("../../services/system-settings.service.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const rateLimit_middleware_js_1 = require("../../middleware/rateLimit.middleware.js");
const auth_schemas_js_1 = require("../../schemas/auth.schemas.js");
const ip_utils_js_1 = require("../../utils/ip.utils.js");
const lead_scoring_service_js_1 = require("../../services/lead-scoring.service.js");
const referral_service_js_1 = require("../../services/referral.service.js");
const early_access_service_js_1 = require("../../services/early-access.service.js");
const email_preference_service_js_1 = require("../../services/email-preference.service.js");
const email_template_service_js_1 = require("../../services/email-template.service.js");
const auth_config_js_1 = require("../../config/auth.config.js");
const index_js_1 = require("../../db/index.js");
const oauth_js_1 = require("./oauth.js");
const oauth_service_js_1 = require("../../services/oauth.service.js");
const consent_service_js_1 = require("../../services/consent.service.js");
const consent_constants_js_1 = require("../../constants/consent.constants.js");
const router = (0, express_1.Router)();
// Register OAuth sub-router
router.use('/oauth', oauth_js_1.oauthRouter);
/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', rateLimit_middleware_js_1.registerRateLimiter, (0, validate_middleware_js_1.validateBody)(auth_schemas_js_1.registerSchema), async (req, res) => {
    try {
        // Block registration based on site mode
        const siteMode = await (0, system_settings_service_js_1.getSiteMode)();
        if (siteMode === 'waitlist') {
            res.status(403).json({
                error: 'Registration is not available during the waitlist phase. Join the waitlist instead.',
                code: 'REGISTRATION_CLOSED',
            });
            return;
        }
        if (siteMode === 'early_access') {
            // Only allow registration with an early access parameter
            const eaParam = req.query.ea || req.body.ea || req.body.earlyAccess;
            if (!eaParam) {
                res.status(403).json({
                    error: 'Registration is currently limited to early access members.',
                    code: 'EARLY_ACCESS_ONLY',
                });
                return;
            }
        }
        const input = req.body;
        // Check if email already exists
        const existingUser = await user_service_js_1.userService.emailExists(input.email);
        if (existingUser) {
            res.status(409).json({
                error: 'An account with this email already exists',
                code: 'EMAIL_EXISTS',
            });
            return;
        }
        // Check password strength
        const strengthCheck = password_service_js_1.passwordService.validateStrength(input.password);
        if (!strengthCheck.valid) {
            res.status(400).json({
                error: 'Password does not meet requirements',
                code: 'WEAK_PASSWORD',
                details: strengthCheck.errors,
            });
            return;
        }
        // Check for common passwords
        if (password_service_js_1.passwordService.isCommonPassword(input.password)) {
            res.status(400).json({
                error: 'This password is too common. Please choose a stronger password.',
                code: 'COMMON_PASSWORD',
            });
            return;
        }
        // Create user
        const user = await user_service_js_1.userService.create(input);
        // Record ToS acceptance
        try {
            await (0, consent_service_js_1.recordTosAcceptance)(user.id, (0, ip_utils_js_1.getClientIp)(req), req.get('user-agent'), consent_constants_js_1.TOS_VERSION);
        }
        catch (tosError) {
            console.error('Failed to record ToS acceptance:', tosError);
            // Don't fail registration if ToS recording fails
        }
        // Set email preferences based on marketing opt-in (GDPR)
        try {
            const optedIn = input.marketingOptIn === true;
            await (0, email_preference_service_js_1.updatePreferences)(user.id, {
                marketing: optedIn,
                educational: optedIn,
                product_updates: optedIn,
                audit_notifications: true,
            });
        }
        catch (prefError) {
            console.error('Failed to set email preferences:', prefError);
        }
        // Send verification email
        try {
            const verificationToken = await email_service_js_1.emailService.createVerificationToken(user.id);
            await email_service_js_1.emailService.sendVerificationEmail(user.email, user.first_name, verificationToken, user.id);
        }
        catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails - user can resend later
        }
        // Store UTM attribution if provided
        if (input.utmSource || input.utmMedium || input.utmCampaign) {
            try {
                await index_js_1.pool.query(`UPDATE users SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object('utm', $1::jsonb) WHERE id = $2`, [JSON.stringify({
                        source: input.utmSource || null,
                        medium: input.utmMedium || null,
                        campaign: input.utmCampaign || null,
                    }), user.id]);
            }
            catch (utmError) {
                console.error('Failed to store UTM data:', utmError);
            }
        }
        // CRM: Recalculate lead score on registration
        (0, lead_scoring_service_js_1.recalculateScore)(user.id).catch(err => console.error('CRM score recalc failed:', err));
        // Handle early access claim if flag set
        let earlyAccess = false;
        if (input.earlyAccess) {
            try {
                const eaEnabled = await (0, early_access_service_js_1.isEarlyAccessEnabled)();
                if (eaEnabled) {
                    const eaChannel = req.query.ea || req.body.ea || 'email';
                    const claimed = await (0, early_access_service_js_1.claimSpot)(user.id, eaChannel);
                    earlyAccess = claimed;
                    if (claimed) {
                        // Send confirmation email (non-blocking)
                        const { getSetting } = await import('../../services/system-settings.service.js');
                        const discountPercent = Number(await getSetting('early_access_discount_percent')) || 50;
                        (0, email_template_service_js_1.sendTemplate)({
                            templateSlug: 'early_access_confirmed',
                            to: {
                                userId: user.id,
                                email: user.email,
                                firstName: user.first_name || 'there',
                            },
                            variables: {
                                firstName: user.first_name || 'there',
                                tierName: 'Agency',
                                discountPercent: String(discountPercent),
                            },
                        }).catch((err) => console.error('Failed to send early_access_confirmed email:', err));
                    }
                }
            }
            catch (eaErr) {
                console.error('Early access processing error:', eaErr);
                // Don't fail registration if early access fails
            }
        }
        // Handle referral code if provided
        if (input.referralCode) {
            try {
                const referrer = await (0, referral_service_js_1.resolveReferralCode)(input.referralCode);
                if (referrer && referrer.userId !== user.id) {
                    await (0, referral_service_js_1.createReferral)(referrer.userId, user.id, input.referralCode, (0, ip_utils_js_1.getClientIp)(req));
                }
            }
            catch (refErr) {
                console.error('Referral processing error:', refErr);
                // Don't fail registration if referral fails
            }
        }
        res.status(201).json({
            message: 'Account created. Please check your email to verify your account.',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            },
            earlyAccess,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed. Please try again.',
            code: 'REGISTRATION_FAILED',
        });
    }
});
/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', rateLimit_middleware_js_1.loginRateLimiter, (0, validate_middleware_js_1.validateBody)(auth_schemas_js_1.loginSchema), async (req, res) => {
    const startTime = Date.now();
    const timings = {};
    try {
        const input = req.body;
        const deviceInfo = (0, ip_utils_js_1.getDeviceInfo)(req);
        const ipAddress = (0, ip_utils_js_1.getClientIp)(req);
        // Find user by email
        let t = Date.now();
        const user = await user_service_js_1.userService.findByEmail(input.email);
        timings.findUser = Date.now() - t;
        if (!user) {
            res.status(401).json({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
            });
            return;
        }
        // Check if account is locked
        t = Date.now();
        const lockStatus = await user_service_js_1.userService.isLocked(user.id);
        timings.checkLock = Date.now() - t;
        if (lockStatus.locked) {
            const retryAfter = lockStatus.until
                ? Math.ceil((new Date(lockStatus.until).getTime() - Date.now()) / 1000)
                : 900;
            res.status(423).json({
                error: 'Account temporarily locked due to too many failed attempts',
                code: 'ACCOUNT_LOCKED',
                retryAfter,
            });
            return;
        }
        // Check if account is active
        if (user.status === 'suspended') {
            res.status(403).json({
                error: 'Account has been suspended',
                code: 'ACCOUNT_SUSPENDED',
            });
            return;
        }
        if (user.status === 'deleted') {
            res.status(401).json({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
            });
            return;
        }
        // Check if user has a password (SSO-only accounts don't)
        if (!user.password_hash) {
            res.status(400).json({
                error: 'This account uses social sign-in. Please sign in with Google or Facebook, or set a password from your account settings.',
                code: 'SSO_ONLY_ACCOUNT',
            });
            return;
        }
        // Verify password
        t = Date.now();
        const passwordValid = await password_service_js_1.passwordService.verify(input.password, user.password_hash);
        timings.verifyPassword = Date.now() - t;
        if (!passwordValid) {
            // Record failed attempt
            const failureResult = await user_service_js_1.userService.recordLoginFailure(user.id);
            if (failureResult.locked) {
                res.status(423).json({
                    error: 'Account temporarily locked due to too many failed attempts',
                    code: 'ACCOUNT_LOCKED',
                    retryAfter: Math.ceil(auth_config_js_1.REFRESH_TOKEN_CONFIG.expiryMs / 1000),
                });
                return;
            }
            res.status(401).json({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
            });
            return;
        }
        // Check if email is verified (optional - can be enforced or not)
        if (user.status === 'pending_verification' && !user.email_verified) {
            // Allow login but include warning
            // Alternatively, you could block login until verified
        }
        // Record successful login
        t = Date.now();
        await user_service_js_1.userService.recordLoginSuccess(user.id, ipAddress);
        timings.recordSuccess = Date.now() - t;
        // Reset rate limit on successful login
        t = Date.now();
        await (0, rateLimit_middleware_js_1.resetRateLimit)(ipAddress, `POST:/api/auth/login`);
        timings.resetRateLimit = Date.now() - t;
        // Generate tokens
        t = Date.now();
        const safeUser = user_service_js_1.userService.toSafeUser(user);
        const accessToken = token_service_js_1.tokenService.generateAccessToken(safeUser);
        const { token: refreshToken } = await token_service_js_1.tokenService.createRefreshToken(user.id, deviceInfo);
        timings.generateTokens = Date.now() - t;
        // Check if password needs rehash (config changed) - do in background
        password_service_js_1.passwordService.needsRehash(user.password_hash).then(async (needsRehash) => {
            if (needsRehash) {
                await user_service_js_1.userService.updatePassword(user.id, input.password);
            }
        }).catch(err => console.error('Password rehash failed:', err));
        // Set cookies
        res.cookie('access_token', accessToken, {
            ...auth_config_js_1.COOKIE_CONFIG,
            maxAge: auth_config_js_1.JWT_CONFIG.accessTokenExpiry * 1000,
        });
        res.cookie('refresh_token', refreshToken, {
            ...auth_config_js_1.COOKIE_CONFIG,
            maxAge: auth_config_js_1.REFRESH_TOKEN_CONFIG.expiryMs,
        });
        console.log(`[auth] Login completed in ${Date.now() - startTime}ms`, timings);
        res.json({
            message: 'Login successful',
            user: {
                id: safeUser.id,
                email: safeUser.email,
                firstName: safeUser.first_name,
                lastName: safeUser.last_name,
                emailVerified: safeUser.email_verified,
                role: safeUser.role,
                createdAt: safeUser.created_at,
            },
            expiresIn: auth_config_js_1.JWT_CONFIG.accessTokenExpiry,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed. Please try again.',
            code: 'LOGIN_FAILED',
        });
    }
});
/**
 * POST /api/auth/logout
 * Logout current session (revoke refresh token)
 */
router.post('/logout', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;
        if (refreshToken) {
            const tokenHash = token_service_js_1.tokenService.hashToken(refreshToken);
            await token_service_js_1.tokenService.revokeToken(tokenHash, 'logout');
        }
        // Clear cookies
        res.clearCookie('access_token', { path: auth_config_js_1.COOKIE_CONFIG.path });
        res.clearCookie('refresh_token', { path: auth_config_js_1.COOKIE_CONFIG.path });
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        // Still clear cookies even if revocation fails
        res.clearCookie('access_token', { path: auth_config_js_1.COOKIE_CONFIG.path });
        res.clearCookie('refresh_token', { path: auth_config_js_1.COOKIE_CONFIG.path });
        res.json({ message: 'Logged out' });
    }
});
/**
 * POST /api/auth/logout-all
 * Logout from all devices (revoke all refresh tokens)
 */
router.post('/logout-all', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        // Revoke all user tokens
        const revokedCount = await token_service_js_1.tokenService.revokeAllUserTokens(userId, 'logout_all_devices');
        // Clear current session cookies
        res.clearCookie('access_token', { path: auth_config_js_1.COOKIE_CONFIG.path });
        res.clearCookie('refresh_token', { path: auth_config_js_1.COOKIE_CONFIG.path });
        res.json({
            message: 'Logged out from all devices',
            sessionsRevoked: revokedCount,
        });
    }
    catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            error: 'Failed to logout from all devices',
            code: 'LOGOUT_FAILED',
        });
    }
});
/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken) {
            res.status(401).json({
                error: 'Refresh token required',
                code: 'REFRESH_TOKEN_MISSING',
            });
            return;
        }
        const deviceInfo = (0, ip_utils_js_1.getDeviceInfo)(req);
        const result = await token_service_js_1.tokenService.rotateRefreshToken(refreshToken, deviceInfo);
        if (!result) {
            // Clear invalid cookies
            res.clearCookie('access_token', { path: auth_config_js_1.COOKIE_CONFIG.path });
            res.clearCookie('refresh_token', { path: auth_config_js_1.COOKIE_CONFIG.path });
            res.status(401).json({
                error: 'Invalid or expired refresh token',
                code: 'REFRESH_TOKEN_INVALID',
            });
            return;
        }
        const { tokenPair, user } = result;
        // Set new cookies
        res.cookie('access_token', tokenPair.accessToken, {
            ...auth_config_js_1.COOKIE_CONFIG,
            maxAge: auth_config_js_1.JWT_CONFIG.accessTokenExpiry * 1000, // Convert seconds to ms
        });
        res.cookie('refresh_token', tokenPair.refreshToken, {
            ...auth_config_js_1.COOKIE_CONFIG,
            maxAge: auth_config_js_1.REFRESH_TOKEN_CONFIG.expiryMs,
        });
        res.json({
            message: 'Token refreshed',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                emailVerified: user.email_verified,
                role: user.role,
            },
            expiresIn: tokenPair.expiresIn,
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Token refresh failed',
            code: 'REFRESH_FAILED',
        });
    }
});
/**
 * GET /api/auth/config
 * Public auth configuration (which login methods are available)
 */
router.get('/config', (_req, res) => {
    res.json({
        oauth: {
            google: !!process.env.GOOGLE_CLIENT_ID,
            facebook: !!process.env.FACEBOOK_APP_ID,
        },
    });
});
/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const user = await user_service_js_1.userService.findSafeById(req.user.id);
        if (!user) {
            res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND',
            });
            return;
        }
        // Get OAuth info
        const [hasPassword, linkedProviders] = await Promise.all([
            user_service_js_1.userService.hasPassword(user.id),
            oauth_service_js_1.oauthService.getLinkedProviders(user.id),
        ]);
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                companyName: user.company_name,
                emailVerified: user.email_verified,
                role: user.role,
                createdAt: user.created_at,
                betaAccess: user.beta_access,
                hasPassword,
                linkedProviders,
            },
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            code: 'GET_USER_FAILED',
        });
    }
});
/**
 * GET /api/auth/sessions
 * Get active sessions for current user
 */
router.get('/sessions', auth_middleware_js_1.authenticate, async (req, res) => {
    try {
        const sessions = await token_service_js_1.tokenService.getUserSessions(req.user.id);
        res.json({
            sessions: sessions.map((s) => ({
                id: s.id,
                userAgent: s.user_agent,
                ipAddress: s.ip_address,
                createdAt: s.created_at,
                lastUsedAt: s.last_used_at,
            })),
        });
    }
    catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            error: 'Failed to get sessions',
            code: 'GET_SESSIONS_FAILED',
        });
    }
});
/**
 * POST /api/auth/verify-email
 * Verify email address using token
 */
router.post('/verify-email', rateLimit_middleware_js_1.verifyEmailRateLimiter, (0, validate_middleware_js_1.validateBody)(auth_schemas_js_1.verifyEmailSchema), async (req, res) => {
    try {
        const { token } = req.body;
        const ipAddress = (0, ip_utils_js_1.getClientIp)(req);
        const result = await email_service_js_1.emailService.verifyToken(token, 'email_verification', ipAddress);
        if (!result.valid) {
            res.status(400).json({
                error: result.error || 'Invalid verification token',
                code: 'INVALID_TOKEN',
            });
            return;
        }
        // Update user's email verification status
        await user_service_js_1.userService.verifyEmail(result.userId);
        // CRM: Recalculate lead score on email verification
        (0, lead_scoring_service_js_1.recalculateScore)(result.userId).catch(err => console.error('CRM score recalc failed:', err));
        // Check if referral can qualify (email now verified)
        (0, referral_service_js_1.checkAndQualifyReferral)(result.userId).catch(err => console.error('Referral qualification check failed:', err));
        res.json({
            message: 'Email verified successfully. You can now log in.',
        });
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            error: 'Email verification failed',
            code: 'VERIFICATION_FAILED',
        });
    }
});
/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', rateLimit_middleware_js_1.verifyEmailRateLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({
                error: 'Email is required',
                code: 'EMAIL_REQUIRED',
            });
            return;
        }
        const user = await user_service_js_1.userService.findByEmail(email);
        // Don't reveal if email exists
        if (!user || user.email_verified) {
            res.json({
                message: 'If an unverified account exists with this email, a verification link has been sent.',
            });
            return;
        }
        // Send new verification email
        const verificationToken = await email_service_js_1.emailService.createVerificationToken(user.id);
        await email_service_js_1.emailService.sendVerificationEmail(user.email, user.first_name, verificationToken, user.id);
        res.json({
            message: 'If an unverified account exists with this email, a verification link has been sent.',
        });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            error: 'Failed to resend verification email',
            code: 'RESEND_FAILED',
        });
    }
});
/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', rateLimit_middleware_js_1.passwordResetRateLimiter, (0, validate_middleware_js_1.validateBody)(auth_schemas_js_1.passwordResetRequestSchema), async (req, res) => {
    try {
        const { email } = req.body;
        // Always return success to prevent email enumeration
        const successMessage = 'If an account exists with this email, a password reset link has been sent.';
        const user = await user_service_js_1.userService.findByEmail(email);
        if (!user) {
            res.json({ message: successMessage });
            return;
        }
        // Don't send reset email for suspended or deleted accounts
        if (user.status === 'suspended' || user.status === 'deleted') {
            res.json({ message: successMessage });
            return;
        }
        // Create and send password reset token
        const resetToken = await email_service_js_1.emailService.createPasswordResetToken(user.id);
        await email_service_js_1.emailService.sendPasswordResetEmail(user.email, user.first_name, resetToken, user.id);
        res.json({ message: successMessage });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        // Still return success to prevent enumeration
        res.json({
            message: 'If an account exists with this email, a password reset link has been sent.',
        });
    }
});
/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
router.post('/reset-password', rateLimit_middleware_js_1.passwordResetRateLimiter, (0, validate_middleware_js_1.validateBody)(auth_schemas_js_1.passwordResetSchema), async (req, res) => {
    try {
        const { token, password } = req.body;
        const ipAddress = (0, ip_utils_js_1.getClientIp)(req);
        // Verify token
        const result = await email_service_js_1.emailService.verifyToken(token, 'password_reset', ipAddress);
        if (!result.valid) {
            res.status(400).json({
                error: result.error || 'Invalid or expired reset token',
                code: 'INVALID_TOKEN',
            });
            return;
        }
        // Validate password strength
        const strengthCheck = password_service_js_1.passwordService.validateStrength(password);
        if (!strengthCheck.valid) {
            res.status(400).json({
                error: 'Password does not meet requirements',
                code: 'WEAK_PASSWORD',
                details: strengthCheck.errors,
            });
            return;
        }
        // Check for common passwords
        if (password_service_js_1.passwordService.isCommonPassword(password)) {
            res.status(400).json({
                error: 'This password is too common. Please choose a stronger password.',
                code: 'COMMON_PASSWORD',
            });
            return;
        }
        // Update password
        await user_service_js_1.userService.updatePassword(result.userId, password);
        // Revoke all existing refresh tokens (security measure)
        await token_service_js_1.tokenService.revokeAllUserTokens(result.userId, 'password_reset');
        res.json({
            message: 'Password reset successfully. Please log in with your new password.',
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'Password reset failed',
            code: 'RESET_FAILED',
        });
    }
});
/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', auth_middleware_js_1.authenticate, rateLimit_middleware_js_1.loginRateLimiter, (0, validate_middleware_js_1.validateBody)(auth_schemas_js_1.changePasswordSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        // Fetch user to verify current password
        const user = await user_service_js_1.userService.findById(userId);
        if (!user || !user.password_hash) {
            res.status(400).json({ error: 'Unable to change password', code: 'CHANGE_PASSWORD_FAILED' });
            return;
        }
        // Verify current password
        const isValid = await password_service_js_1.passwordService.verify(currentPassword, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Current password is incorrect', code: 'INVALID_CURRENT_PASSWORD' });
            return;
        }
        // Validate new password strength
        const strengthCheck = password_service_js_1.passwordService.validateStrength(newPassword);
        if (!strengthCheck.valid) {
            res.status(400).json({
                error: 'Password does not meet requirements',
                code: 'WEAK_PASSWORD',
                details: strengthCheck.errors,
            });
            return;
        }
        // Check for common passwords
        if (password_service_js_1.passwordService.isCommonPassword(newPassword)) {
            res.status(400).json({
                error: 'This password is too common. Please choose a stronger password.',
                code: 'COMMON_PASSWORD',
            });
            return;
        }
        // Update password
        await user_service_js_1.userService.updatePassword(userId, newPassword);
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password', code: 'CHANGE_PASSWORD_FAILED' });
    }
});
exports.authRouter = router;
//# sourceMappingURL=index.js.map