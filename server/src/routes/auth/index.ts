import { Router } from 'express';
import type { Request, Response } from 'express';
import { userService } from '../../services/user.service.js';
import { tokenService } from '../../services/token.service.js';
import { passwordService } from '../../services/password.service.js';
import { emailService } from '../../services/email.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  verifyEmailRateLimiter,
  resetRateLimit,
} from '../../middleware/rateLimit.middleware.js';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  verifyEmailSchema,
} from '../../schemas/auth.schemas.js';
import { getDeviceInfo, getClientIp } from '../../utils/ip.utils.js';
import { recalculateScore } from '../../services/lead-scoring.service.js';
import { checkTriggers } from '../../services/crm-trigger.service.js';
import { resolveReferralCode, createReferral, checkAndQualifyReferral } from '../../services/referral.service.js';
import { isEarlyAccessEnabled, claimSpot } from '../../services/early-access.service.js';
import { sendTemplate } from '../../services/email-template.service.js';
import { COOKIE_CONFIG, REFRESH_TOKEN_CONFIG, JWT_CONFIG } from '../../config/auth.config.js';
import { oauthRouter } from './oauth.js';
import { oauthService } from '../../services/oauth.service.js';
import type {
  RegisterInput,
  LoginInput,
  PasswordResetRequestInput,
  PasswordResetInput,
  VerifyEmailInput,
} from '../../schemas/auth.schemas.js';
import { recordTosAcceptance } from '../../services/consent.service.js';
import { TOS_VERSION } from '../../constants/consent.constants.js';

const router = Router();

// Register OAuth sub-router
router.use('/oauth', oauthRouter);

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post(
  '/register',
  registerRateLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const input: RegisterInput = req.body;

      // Check if email already exists
      const existingUser = await userService.emailExists(input.email);
      if (existingUser) {
        res.status(409).json({
          error: 'An account with this email already exists',
          code: 'EMAIL_EXISTS',
        });
        return;
      }

      // Check password strength
      const strengthCheck = passwordService.validateStrength(input.password);
      if (!strengthCheck.valid) {
        res.status(400).json({
          error: 'Password does not meet requirements',
          code: 'WEAK_PASSWORD',
          details: strengthCheck.errors,
        });
        return;
      }

      // Check for common passwords
      if (passwordService.isCommonPassword(input.password)) {
        res.status(400).json({
          error: 'This password is too common. Please choose a stronger password.',
          code: 'COMMON_PASSWORD',
        });
        return;
      }

      // Create user
      const user = await userService.create(input);

      // Record ToS acceptance
      try {
        await recordTosAcceptance(
          user.id,
          getClientIp(req),
          req.get('user-agent'),
          TOS_VERSION
        );
      } catch (tosError) {
        console.error('Failed to record ToS acceptance:', tosError);
        // Don't fail registration if ToS recording fails
      }

      // Send verification email
      try {
        const verificationToken = await emailService.createVerificationToken(user.id);
        await emailService.sendVerificationEmail(user.email, user.first_name, verificationToken, user.id);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails - user can resend later
      }

      // CRM: Recalculate lead score on registration
      recalculateScore(user.id).catch(err => console.error('CRM score recalc failed:', err));

      // Handle early access claim if channel provided
      let earlyAccess = false;
      if (input.earlyAccessChannel) {
        try {
          const eaEnabled = await isEarlyAccessEnabled();
          if (eaEnabled) {
            const claimed = await claimSpot(user.id, input.earlyAccessChannel);
            earlyAccess = claimed;

            if (claimed) {
              // Send confirmation email (non-blocking)
              const { getSetting } = await import('../../services/system-settings.service.js');
              const discountPercent = Number(await getSetting('early_access_discount_percent')) || 50;

              sendTemplate({
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
              }).catch((err: unknown) => console.error('Failed to send early_access_confirmed email:', err));
            }
          }
        } catch (eaErr) {
          console.error('Early access processing error:', eaErr);
          // Don't fail registration if early access fails
        }
      }

      // Handle referral code if provided
      if (input.referralCode) {
        try {
          const referrer = await resolveReferralCode(input.referralCode);
          if (referrer && referrer.userId !== user.id) {
            await createReferral(referrer.userId, user.id, input.referralCode, getClientIp(req));
          }
        } catch (refErr) {
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
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed. Please try again.',
        code: 'REGISTRATION_FAILED',
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post(
  '/login',
  loginRateLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const timings: Record<string, number> = {};
    try {
      const input: LoginInput = req.body;
      const deviceInfo = getDeviceInfo(req);
      const ipAddress = getClientIp(req);

      // Find user by email
      let t = Date.now();
      const user = await userService.findByEmail(input.email);
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
      const lockStatus = await userService.isLocked(user.id);
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
      const passwordValid = await passwordService.verify(input.password, user.password_hash);
      timings.verifyPassword = Date.now() - t;

      if (!passwordValid) {
        // Record failed attempt
        const failureResult = await userService.recordLoginFailure(user.id);

        if (failureResult.locked) {
          res.status(423).json({
            error: 'Account temporarily locked due to too many failed attempts',
            code: 'ACCOUNT_LOCKED',
            retryAfter: Math.ceil(REFRESH_TOKEN_CONFIG.expiryMs / 1000),
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
      await userService.recordLoginSuccess(user.id, ipAddress);
      timings.recordSuccess = Date.now() - t;

      // Reset rate limit on successful login
      t = Date.now();
      await resetRateLimit(ipAddress, `POST:/api/auth/login`);
      timings.resetRateLimit = Date.now() - t;

      // Generate tokens
      t = Date.now();
      const safeUser = userService.toSafeUser(user);
      const accessToken = tokenService.generateAccessToken(safeUser);
      const { token: refreshToken } = await tokenService.createRefreshToken(user.id, deviceInfo);
      timings.generateTokens = Date.now() - t;

      // Check if password needs rehash (config changed) - do in background
      passwordService.needsRehash(user.password_hash).then(async (needsRehash) => {
        if (needsRehash) {
          await userService.updatePassword(user.id, input.password);
        }
      }).catch(() => {});

      // Set cookies
      res.cookie('access_token', accessToken, {
        ...COOKIE_CONFIG,
        maxAge: JWT_CONFIG.accessTokenExpiry * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        ...COOKIE_CONFIG,
        maxAge: REFRESH_TOKEN_CONFIG.expiryMs,
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
        expiresIn: JWT_CONFIG.accessTokenExpiry,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed. Please try again.',
        code: 'LOGIN_FAILED',
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout current session (revoke refresh token)
 */
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      const tokenHash = tokenService.hashToken(refreshToken);
      await tokenService.revokeToken(tokenHash, 'logout');
    }

    // Clear cookies
    res.clearCookie('access_token', { path: COOKIE_CONFIG.path });
    res.clearCookie('refresh_token', { path: COOKIE_CONFIG.path });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if revocation fails
    res.clearCookie('access_token', { path: COOKIE_CONFIG.path });
    res.clearCookie('refresh_token', { path: COOKIE_CONFIG.path });
    res.json({ message: 'Logged out' });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices (revoke all refresh tokens)
 */
router.post('/logout-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Revoke all user tokens
    const revokedCount = await tokenService.revokeAllUserTokens(userId, 'logout_all_devices');

    // Clear current session cookies
    res.clearCookie('access_token', { path: COOKIE_CONFIG.path });
    res.clearCookie('refresh_token', { path: COOKIE_CONFIG.path });

    res.json({
      message: 'Logged out from all devices',
      sessionsRevoked: revokedCount,
    });
  } catch (error) {
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
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      res.status(401).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING',
      });
      return;
    }

    const deviceInfo = getDeviceInfo(req);
    const result = await tokenService.rotateRefreshToken(refreshToken, deviceInfo);

    if (!result) {
      // Clear invalid cookies
      res.clearCookie('access_token', { path: COOKIE_CONFIG.path });
      res.clearCookie('refresh_token', { path: COOKIE_CONFIG.path });

      res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'REFRESH_TOKEN_INVALID',
      });
      return;
    }

    const { tokenPair, user } = result;

    // Set new cookies
    res.cookie('access_token', tokenPair.accessToken, {
      ...COOKIE_CONFIG,
      maxAge: JWT_CONFIG.accessTokenExpiry * 1000, // Convert seconds to ms
    });

    res.cookie('refresh_token', tokenPair.refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: REFRESH_TOKEN_CONFIG.expiryMs,
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
  } catch (error) {
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
router.get('/config', (_req: Request, res: Response): void => {
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
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.findSafeById(req.user!.id);

    if (!user) {
      res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // Get OAuth info
    const [hasPassword, linkedProviders] = await Promise.all([
      userService.hasPassword(user.id),
      oauthService.getLinkedProviders(user.id),
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
        hasPassword,
        linkedProviders,
      },
    });
  } catch (error) {
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
router.get('/sessions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await tokenService.getUserSessions(req.user!.id);

    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        userAgent: s.user_agent,
        ipAddress: s.ip_address,
        createdAt: s.created_at,
        lastUsedAt: s.last_used_at,
      })),
    });
  } catch (error) {
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
router.post(
  '/verify-email',
  verifyEmailRateLimiter,
  validateBody(verifyEmailSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body as VerifyEmailInput;
      const ipAddress = getClientIp(req);

      const result = await emailService.verifyToken(token, 'email_verification', ipAddress);

      if (!result.valid) {
        res.status(400).json({
          error: result.error || 'Invalid verification token',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      // Update user's email verification status
      await userService.verifyEmail(result.userId!);

      // CRM: Recalculate lead score on email verification
      recalculateScore(result.userId!).catch(err => console.error('CRM score recalc failed:', err));

      // Check if referral can qualify (email now verified)
      checkAndQualifyReferral(result.userId!).catch(err => console.error('Referral qualification check failed:', err));

      res.json({
        message: 'Email verified successfully. You can now log in.',
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        error: 'Email verification failed',
        code: 'VERIFICATION_FAILED',
      });
    }
  }
);

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post(
  '/resend-verification',
  verifyEmailRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          error: 'Email is required',
          code: 'EMAIL_REQUIRED',
        });
        return;
      }

      const user = await userService.findByEmail(email);

      // Don't reveal if email exists
      if (!user || user.email_verified) {
        res.json({
          message: 'If an unverified account exists with this email, a verification link has been sent.',
        });
        return;
      }

      // Send new verification email
      const verificationToken = await emailService.createVerificationToken(user.id);
      await emailService.sendVerificationEmail(user.email, user.first_name, verificationToken, user.id);

      res.json({
        message: 'If an unverified account exists with this email, a verification link has been sent.',
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        error: 'Failed to resend verification email',
        code: 'RESEND_FAILED',
      });
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateBody(passwordResetRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body as PasswordResetRequestInput;

      // Always return success to prevent email enumeration
      const successMessage = 'If an account exists with this email, a password reset link has been sent.';

      const user = await userService.findByEmail(email);

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
      const resetToken = await emailService.createPasswordResetToken(user.id);
      await emailService.sendPasswordResetEmail(user.email, user.first_name, resetToken, user.id);

      res.json({ message: successMessage });
    } catch (error) {
      console.error('Forgot password error:', error);
      // Still return success to prevent enumeration
      res.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateBody(passwordResetSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body as PasswordResetInput;
      const ipAddress = getClientIp(req);

      // Verify token
      const result = await emailService.verifyToken(token, 'password_reset', ipAddress);

      if (!result.valid) {
        res.status(400).json({
          error: result.error || 'Invalid or expired reset token',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      // Validate password strength
      const strengthCheck = passwordService.validateStrength(password);
      if (!strengthCheck.valid) {
        res.status(400).json({
          error: 'Password does not meet requirements',
          code: 'WEAK_PASSWORD',
          details: strengthCheck.errors,
        });
        return;
      }

      // Check for common passwords
      if (passwordService.isCommonPassword(password)) {
        res.status(400).json({
          error: 'This password is too common. Please choose a stronger password.',
          code: 'COMMON_PASSWORD',
        });
        return;
      }

      // Update password
      await userService.updatePassword(result.userId!, password);

      // Revoke all existing refresh tokens (security measure)
      await tokenService.revokeAllUserTokens(result.userId!, 'password_reset');

      res.json({
        message: 'Password reset successfully. Please log in with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        code: 'RESET_FAILED',
      });
    }
  }
);

export const authRouter = router;
