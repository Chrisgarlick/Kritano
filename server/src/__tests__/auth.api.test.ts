import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// ---------------------------------------------------------------------------
// Mocks — declared before importing the router so vi.mock hoisting works
// ---------------------------------------------------------------------------

// Mock Redis (used by rate limiter)
vi.mock('../db/redis.js', () => ({
  redis: {
    ttl: vi.fn().mockResolvedValue(-2), // no lock
    incr: vi.fn().mockResolvedValue(1), // first request in window
    expire: vi.fn().mockResolvedValue(1),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
}));

// Mock DB pool (used directly in register route for UTM storage)
vi.mock('../db/index.js', () => ({
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

// Mock IP utilities
vi.mock('../utils/ip.utils.js', () => ({
  getClientIp: () => '127.0.0.1',
  getDeviceInfo: () => ({ userAgent: 'test-agent', ipAddress: '127.0.0.1' }),
}));

// Stub out services that the auth route depends on but that we don't
// exercise in these unit tests.
vi.mock('../services/lead-scoring.service.js', () => ({
  recalculateScore: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../services/crm-trigger.service.js', () => ({
  checkTriggers: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../services/referral.service.js', () => ({
  resolveReferralCode: vi.fn().mockResolvedValue(null),
  createReferral: vi.fn().mockResolvedValue(undefined),
  checkAndQualifyReferral: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../services/early-access.service.js', () => ({
  isEarlyAccessEnabled: vi.fn().mockResolvedValue(false),
  claimSpot: vi.fn().mockResolvedValue(false),
}));
vi.mock('../services/email-template.service.js', () => ({
  sendTemplate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../services/consent.service.js', () => ({
  recordTosAcceptance: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../services/oauth.service.js', () => ({
  oauthService: {
    getLinkedProviders: vi.fn().mockResolvedValue([]),
  },
}));

// We control these service mocks directly in each test.
const mockUserService = {
  emailExists: vi.fn(),
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findSafeById: vi.fn(),
  isLocked: vi.fn(),
  recordLoginFailure: vi.fn(),
  recordLoginSuccess: vi.fn(),
  toSafeUser: vi.fn(),
  verifyEmail: vi.fn(),
  updatePassword: vi.fn(),
  hasPassword: vi.fn(),
};

const mockPasswordService = {
  validateStrength: vi.fn(),
  isCommonPassword: vi.fn(),
  verify: vi.fn(),
  hash: vi.fn(),
  needsRehash: vi.fn().mockResolvedValue(false),
};

const mockTokenService = {
  generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  createRefreshToken: vi.fn().mockResolvedValue({ token: 'mock-refresh-token' }),
  hashToken: vi.fn().mockReturnValue('hashed'),
  revokeToken: vi.fn().mockResolvedValue(undefined),
  revokeAllUserTokens: vi.fn().mockResolvedValue(1),
  rotateRefreshToken: vi.fn(),
  getUserSessions: vi.fn().mockResolvedValue([]),
};

const mockEmailService = {
  createVerificationToken: vi.fn().mockResolvedValue('verify-token'),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  createPasswordResetToken: vi.fn().mockResolvedValue('reset-token'),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  verifyToken: vi.fn(),
};

vi.mock('../services/user.service.js', () => ({
  userService: mockUserService,
}));
vi.mock('../services/password.service.js', () => ({
  passwordService: mockPasswordService,
}));
vi.mock('../services/token.service.js', () => ({
  tokenService: mockTokenService,
}));
vi.mock('../services/email.service.js', () => ({
  emailService: mockEmailService,
}));

// Mock authenticate middleware — used for change-password, logout, etc.
vi.mock('../middleware/auth.middleware.js', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', role: 'user' };
    next();
  },
}));

// Mock the OAuth sub-router to avoid pulling in its dependencies
vi.mock('../routes/auth/oauth.js', () => ({
  oauthRouter: express.Router(),
}));

// ---------------------------------------------------------------------------
// Import the router AFTER mocks are set up
// ---------------------------------------------------------------------------
import { authRouter } from '../routes/auth/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STRONG_PASSWORD = 'T3st!ng@Str0ngP4ss';

const validRegisterBody = {
  email: 'new@example.com',
  password: STRONG_PASSWORD,
  firstName: 'Jane',
  lastName: 'Doe',
  acceptedTos: true,
};

const validLoginBody = {
  email: 'user@example.com',
  password: STRONG_PASSWORD,
};

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Auth API', () => {
  let app: express.Application;
  let request: ReturnType<typeof supertest>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Redis counter so rate limiter doesn't block
    const { redis } = require('../db/redis.js');
    (redis.ttl as ReturnType<typeof vi.fn>).mockResolvedValue(-2);
    (redis.incr as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    app = makeApp();
    request = supertest(app);
  });

  // =======================================================================
  // POST /api/auth/register
  // =======================================================================
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockUserService.emailExists.mockResolvedValue(false);
      mockPasswordService.validateStrength.mockReturnValue({ valid: true, errors: [] });
      mockPasswordService.isCommonPassword.mockReturnValue(false);
      mockUserService.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'new@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
      });

      const res = await request.post('/api/auth/register').send(validRegisterBody);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe('new-user-id');
      expect(res.body.user.email).toBe('new@example.com');
    });

    it('should reject duplicate email with 409', async () => {
      mockUserService.emailExists.mockResolvedValue(true);

      const res = await request.post('/api/auth/register').send(validRegisterBody);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    it('should reject weak password', async () => {
      mockUserService.emailExists.mockResolvedValue(false);
      mockPasswordService.validateStrength.mockReturnValue({
        valid: false,
        errors: ['Too short'],
      });

      const res = await request.post('/api/auth/register').send(validRegisterBody);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('WEAK_PASSWORD');
    });

    it('should reject common password', async () => {
      mockUserService.emailExists.mockResolvedValue(false);
      mockPasswordService.validateStrength.mockReturnValue({ valid: true, errors: [] });
      mockPasswordService.isCommonPassword.mockReturnValue(true);

      const res = await request.post('/api/auth/register').send(validRegisterBody);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('COMMON_PASSWORD');
    });

    it('should return 400 for missing required fields (validation)', async () => {
      const res = await request.post('/api/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // =======================================================================
  // POST /api/auth/login
  // =======================================================================
  describe('POST /api/auth/login', () => {
    const activeUser = {
      id: 'user-1',
      email: 'user@example.com',
      password_hash: '$argon2id$hash',
      first_name: 'Test',
      last_name: 'User',
      email_verified: true,
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    it('should login successfully with valid credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(activeUser);
      mockUserService.isLocked.mockResolvedValue({ locked: false });
      mockPasswordService.verify.mockResolvedValue(true);
      mockUserService.recordLoginSuccess.mockResolvedValue(undefined);
      mockUserService.toSafeUser.mockReturnValue(activeUser);
      mockPasswordService.needsRehash.mockResolvedValue(false);

      const res = await request.post('/api/auth/login').send(validLoginBody);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe('user-1');
      // Should set cookies
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      mockUserService.findByEmail.mockResolvedValue(activeUser);
      mockUserService.isLocked.mockResolvedValue({ locked: false });
      mockPasswordService.verify.mockResolvedValue(false);
      mockUserService.recordLoginFailure.mockResolvedValue({ locked: false });

      const res = await request.post('/api/auth/login').send(validLoginBody);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email with same error (anti-enumeration)', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const res = await request
        .post('/api/auth/login')
        .send({ email: 'noone@example.com', password: 'anything' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
      // Must be the same message as wrong-password to prevent enumeration
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 423 when account is locked', async () => {
      mockUserService.findByEmail.mockResolvedValue(activeUser);
      mockUserService.isLocked.mockResolvedValue({
        locked: true,
        until: new Date(Date.now() + 900_000).toISOString(),
      });

      const res = await request.post('/api/auth/login').send(validLoginBody);

      expect(res.status).toBe(423);
      expect(res.body.code).toBe('ACCOUNT_LOCKED');
      expect(res.body.retryAfter).toBeDefined();
    });

    it('should lock account after 5 failed attempts', async () => {
      mockUserService.findByEmail.mockResolvedValue(activeUser);
      mockUserService.isLocked.mockResolvedValue({ locked: false });
      mockPasswordService.verify.mockResolvedValue(false);
      // The 5th failure triggers a lock
      mockUserService.recordLoginFailure.mockResolvedValue({ locked: true });

      const res = await request.post('/api/auth/login').send(validLoginBody);

      expect(res.status).toBe(423);
      expect(res.body.code).toBe('ACCOUNT_LOCKED');
    });
  });

  // =======================================================================
  // POST /api/auth/change-password
  // =======================================================================
  describe('POST /api/auth/change-password', () => {
    const userWithHash = {
      id: 'test-user-id',
      password_hash: '$argon2id$hash',
    };

    it('should change password successfully using req.user.id', async () => {
      mockUserService.findById.mockResolvedValue(userWithHash);
      mockPasswordService.verify.mockResolvedValue(true);
      mockPasswordService.validateStrength.mockReturnValue({ valid: true, errors: [] });
      mockPasswordService.isCommonPassword.mockReturnValue(false);
      mockUserService.updatePassword.mockResolvedValue(undefined);

      const res = await request.post('/api/auth/change-password').send({
        currentPassword: 'OldP@ssw0rd!123',
        newPassword: STRONG_PASSWORD,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password changed successfully');
      // Verify it used req.user.id (the mocked authenticate sets 'test-user-id')
      expect(mockUserService.findById).toHaveBeenCalledWith('test-user-id');
      expect(mockUserService.updatePassword).toHaveBeenCalledWith('test-user-id', STRONG_PASSWORD);
    });

    it('should reject weak new password', async () => {
      mockUserService.findById.mockResolvedValue(userWithHash);
      mockPasswordService.verify.mockResolvedValue(true);
      mockPasswordService.validateStrength.mockReturnValue({
        valid: false,
        errors: ['Too short'],
      });

      const res = await request.post('/api/auth/change-password').send({
        currentPassword: 'OldP@ssw0rd!123',
        newPassword: STRONG_PASSWORD,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('WEAK_PASSWORD');
    });

    it('should reject wrong current password', async () => {
      mockUserService.findById.mockResolvedValue(userWithHash);
      mockPasswordService.verify.mockResolvedValue(false);

      const res = await request.post('/api/auth/change-password').send({
        currentPassword: 'Wr0ng!P@ssw0rd1',
        newPassword: STRONG_PASSWORD,
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('should reject common new password', async () => {
      mockUserService.findById.mockResolvedValue(userWithHash);
      mockPasswordService.verify.mockResolvedValue(true);
      mockPasswordService.validateStrength.mockReturnValue({ valid: true, errors: [] });
      mockPasswordService.isCommonPassword.mockReturnValue(true);

      const res = await request.post('/api/auth/change-password').send({
        currentPassword: 'OldP@ssw0rd!123',
        newPassword: STRONG_PASSWORD,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('COMMON_PASSWORD');
    });
  });

  // =======================================================================
  // POST /api/auth/forgot-password
  // =======================================================================
  describe('POST /api/auth/forgot-password', () => {
    const successMessage = 'If an account exists with this email, a password reset link has been sent.';

    it('should return same message for existing email (anti-enumeration)', async () => {
      mockUserService.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'exists@example.com',
        first_name: 'Test',
        status: 'active',
      });

      const res = await request
        .post('/api/auth/forgot-password')
        .send({ email: 'exists@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(successMessage);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should return same message for non-existing email (anti-enumeration)', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const res = await request
        .post('/api/auth/forgot-password')
        .send({ email: 'noone@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(successMessage);
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should not send reset email for suspended accounts', async () => {
      mockUserService.findByEmail.mockResolvedValue({
        id: 'u2',
        email: 'suspended@example.com',
        status: 'suspended',
      });

      const res = await request
        .post('/api/auth/forgot-password')
        .send({ email: 'suspended@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(successMessage);
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  // =======================================================================
  // Rate limiting — login endpoint
  // =======================================================================
  describe('Login rate limiting', () => {
    it('should return 429 when rate limiter blocks the request', async () => {
      // Simulate Redis returning a lock with positive TTL
      const { redis } = require('../db/redis.js');
      (redis.ttl as ReturnType<typeof vi.fn>).mockResolvedValue(600); // locked for 600s

      const res = await request.post('/api/auth/login').send(validLoginBody);

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('RATE_LIMITED');
    });
  });
});
