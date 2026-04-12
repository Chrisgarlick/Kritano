"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// ---------------------------------------------------------------------------
// Mocks — declared before importing the router so vi.mock hoisting works
// ---------------------------------------------------------------------------
// Mock Redis (used by rate limiter)
vitest_1.vi.mock('../db/redis.js', () => ({
    redis: {
        ttl: vitest_1.vi.fn().mockResolvedValue(-2), // no lock
        incr: vitest_1.vi.fn().mockResolvedValue(1), // first request in window
        expire: vitest_1.vi.fn().mockResolvedValue(1),
        setex: vitest_1.vi.fn().mockResolvedValue('OK'),
        del: vitest_1.vi.fn().mockResolvedValue(1),
    },
}));
// Mock DB pool (used directly in register route for UTM storage)
vitest_1.vi.mock('../db/index.js', () => ({
    pool: {
        query: vitest_1.vi.fn().mockResolvedValue({ rows: [] }),
    },
}));
// Mock IP utilities
vitest_1.vi.mock('../utils/ip.utils.js', () => ({
    getClientIp: () => '127.0.0.1',
    getDeviceInfo: () => ({ userAgent: 'test-agent', ipAddress: '127.0.0.1' }),
}));
// Stub out services that the auth route depends on but that we don't
// exercise in these unit tests.
vitest_1.vi.mock('../services/lead-scoring.service.js', () => ({
    recalculateScore: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
vitest_1.vi.mock('../services/crm-trigger.service.js', () => ({
    checkTriggers: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
vitest_1.vi.mock('../services/referral.service.js', () => ({
    resolveReferralCode: vitest_1.vi.fn().mockResolvedValue(null),
    createReferral: vitest_1.vi.fn().mockResolvedValue(undefined),
    checkAndQualifyReferral: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
vitest_1.vi.mock('../services/early-access.service.js', () => ({
    isEarlyAccessEnabled: vitest_1.vi.fn().mockResolvedValue(false),
    claimSpot: vitest_1.vi.fn().mockResolvedValue(false),
}));
vitest_1.vi.mock('../services/email-template.service.js', () => ({
    sendTemplate: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
vitest_1.vi.mock('../services/consent.service.js', () => ({
    recordTosAcceptance: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
vitest_1.vi.mock('../services/oauth.service.js', () => ({
    oauthService: {
        getLinkedProviders: vitest_1.vi.fn().mockResolvedValue([]),
    },
}));
// We control these service mocks directly in each test.
const mockUserService = {
    emailExists: vitest_1.vi.fn(),
    create: vitest_1.vi.fn(),
    findByEmail: vitest_1.vi.fn(),
    findById: vitest_1.vi.fn(),
    findSafeById: vitest_1.vi.fn(),
    isLocked: vitest_1.vi.fn(),
    recordLoginFailure: vitest_1.vi.fn(),
    recordLoginSuccess: vitest_1.vi.fn(),
    toSafeUser: vitest_1.vi.fn(),
    verifyEmail: vitest_1.vi.fn(),
    updatePassword: vitest_1.vi.fn(),
    hasPassword: vitest_1.vi.fn(),
};
const mockPasswordService = {
    validateStrength: vitest_1.vi.fn(),
    isCommonPassword: vitest_1.vi.fn(),
    verify: vitest_1.vi.fn(),
    hash: vitest_1.vi.fn(),
    needsRehash: vitest_1.vi.fn().mockResolvedValue(false),
};
const mockTokenService = {
    generateAccessToken: vitest_1.vi.fn().mockReturnValue('mock-access-token'),
    createRefreshToken: vitest_1.vi.fn().mockResolvedValue({ token: 'mock-refresh-token' }),
    hashToken: vitest_1.vi.fn().mockReturnValue('hashed'),
    revokeToken: vitest_1.vi.fn().mockResolvedValue(undefined),
    revokeAllUserTokens: vitest_1.vi.fn().mockResolvedValue(1),
    rotateRefreshToken: vitest_1.vi.fn(),
    getUserSessions: vitest_1.vi.fn().mockResolvedValue([]),
};
const mockEmailService = {
    createVerificationToken: vitest_1.vi.fn().mockResolvedValue('verify-token'),
    sendVerificationEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
    createPasswordResetToken: vitest_1.vi.fn().mockResolvedValue('reset-token'),
    sendPasswordResetEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
    verifyToken: vitest_1.vi.fn(),
};
vitest_1.vi.mock('../services/user.service.js', () => ({
    userService: mockUserService,
}));
vitest_1.vi.mock('../services/password.service.js', () => ({
    passwordService: mockPasswordService,
}));
vitest_1.vi.mock('../services/token.service.js', () => ({
    tokenService: mockTokenService,
}));
vitest_1.vi.mock('../services/email.service.js', () => ({
    emailService: mockEmailService,
}));
// Mock authenticate middleware — used for change-password, logout, etc.
vitest_1.vi.mock('../middleware/auth.middleware.js', () => ({
    authenticate: (req, _res, next) => {
        req.user = { id: 'test-user-id', email: 'test@example.com', role: 'user' };
        next();
    },
}));
// Mock the OAuth sub-router to avoid pulling in its dependencies
vitest_1.vi.mock('../routes/auth/oauth.js', () => ({
    oauthRouter: express_1.default.Router(),
}));
// ---------------------------------------------------------------------------
// Import the router AFTER mocks are set up
// ---------------------------------------------------------------------------
const index_js_1 = require("../routes/auth/index.js");
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
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use('/api/auth', index_js_1.authRouter);
    return app;
}
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('Auth API', () => {
    let app;
    let request;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Reset Redis counter so rate limiter doesn't block
        const { redis } = require('../db/redis.js');
        redis.ttl.mockResolvedValue(-2);
        redis.incr.mockResolvedValue(1);
        app = makeApp();
        request = (0, supertest_1.default)(app);
    });
    // =======================================================================
    // POST /api/auth/register
    // =======================================================================
    (0, vitest_1.describe)('POST /api/auth/register', () => {
        (0, vitest_1.it)('should register a new user successfully', async () => {
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
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.user).toBeDefined();
            (0, vitest_1.expect)(res.body.user.id).toBe('new-user-id');
            (0, vitest_1.expect)(res.body.user.email).toBe('new@example.com');
        });
        (0, vitest_1.it)('should reject duplicate email with 409', async () => {
            mockUserService.emailExists.mockResolvedValue(true);
            const res = await request.post('/api/auth/register').send(validRegisterBody);
            (0, vitest_1.expect)(res.status).toBe(409);
            (0, vitest_1.expect)(res.body.code).toBe('EMAIL_EXISTS');
        });
        (0, vitest_1.it)('should reject weak password', async () => {
            mockUserService.emailExists.mockResolvedValue(false);
            mockPasswordService.validateStrength.mockReturnValue({
                valid: false,
                errors: ['Too short'],
            });
            const res = await request.post('/api/auth/register').send(validRegisterBody);
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.code).toBe('WEAK_PASSWORD');
        });
        (0, vitest_1.it)('should reject common password', async () => {
            mockUserService.emailExists.mockResolvedValue(false);
            mockPasswordService.validateStrength.mockReturnValue({ valid: true, errors: [] });
            mockPasswordService.isCommonPassword.mockReturnValue(true);
            const res = await request.post('/api/auth/register').send(validRegisterBody);
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.code).toBe('COMMON_PASSWORD');
        });
        (0, vitest_1.it)('should return 400 for missing required fields (validation)', async () => {
            const res = await request.post('/api/auth/register').send({});
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.code).toBe('VALIDATION_ERROR');
        });
    });
    // =======================================================================
    // POST /api/auth/login
    // =======================================================================
    (0, vitest_1.describe)('POST /api/auth/login', () => {
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
        (0, vitest_1.it)('should login successfully with valid credentials', async () => {
            mockUserService.findByEmail.mockResolvedValue(activeUser);
            mockUserService.isLocked.mockResolvedValue({ locked: false });
            mockPasswordService.verify.mockResolvedValue(true);
            mockUserService.recordLoginSuccess.mockResolvedValue(undefined);
            mockUserService.toSafeUser.mockReturnValue(activeUser);
            mockPasswordService.needsRehash.mockResolvedValue(false);
            const res = await request.post('/api/auth/login').send(validLoginBody);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.message).toBe('Login successful');
            (0, vitest_1.expect)(res.body.user).toBeDefined();
            (0, vitest_1.expect)(res.body.user.id).toBe('user-1');
            // Should set cookies
            (0, vitest_1.expect)(res.headers['set-cookie']).toBeDefined();
        });
        (0, vitest_1.it)('should return 401 for wrong password', async () => {
            mockUserService.findByEmail.mockResolvedValue(activeUser);
            mockUserService.isLocked.mockResolvedValue({ locked: false });
            mockPasswordService.verify.mockResolvedValue(false);
            mockUserService.recordLoginFailure.mockResolvedValue({ locked: false });
            const res = await request.post('/api/auth/login').send(validLoginBody);
            (0, vitest_1.expect)(res.status).toBe(401);
            (0, vitest_1.expect)(res.body.code).toBe('INVALID_CREDENTIALS');
        });
        (0, vitest_1.it)('should return 401 for non-existent email with same error (anti-enumeration)', async () => {
            mockUserService.findByEmail.mockResolvedValue(null);
            const res = await request
                .post('/api/auth/login')
                .send({ email: 'noone@example.com', password: 'anything' });
            (0, vitest_1.expect)(res.status).toBe(401);
            (0, vitest_1.expect)(res.body.code).toBe('INVALID_CREDENTIALS');
            // Must be the same message as wrong-password to prevent enumeration
            (0, vitest_1.expect)(res.body.error).toBe('Invalid email or password');
        });
        (0, vitest_1.it)('should return 423 when account is locked', async () => {
            mockUserService.findByEmail.mockResolvedValue(activeUser);
            mockUserService.isLocked.mockResolvedValue({
                locked: true,
                until: new Date(Date.now() + 900_000).toISOString(),
            });
            const res = await request.post('/api/auth/login').send(validLoginBody);
            (0, vitest_1.expect)(res.status).toBe(423);
            (0, vitest_1.expect)(res.body.code).toBe('ACCOUNT_LOCKED');
            (0, vitest_1.expect)(res.body.retryAfter).toBeDefined();
        });
        (0, vitest_1.it)('should lock account after 5 failed attempts', async () => {
            mockUserService.findByEmail.mockResolvedValue(activeUser);
            mockUserService.isLocked.mockResolvedValue({ locked: false });
            mockPasswordService.verify.mockResolvedValue(false);
            // The 5th failure triggers a lock
            mockUserService.recordLoginFailure.mockResolvedValue({ locked: true });
            const res = await request.post('/api/auth/login').send(validLoginBody);
            (0, vitest_1.expect)(res.status).toBe(423);
            (0, vitest_1.expect)(res.body.code).toBe('ACCOUNT_LOCKED');
        });
    });
    // =======================================================================
    // POST /api/auth/change-password
    // =======================================================================
    (0, vitest_1.describe)('POST /api/auth/change-password', () => {
        const userWithHash = {
            id: 'test-user-id',
            password_hash: '$argon2id$hash',
        };
        (0, vitest_1.it)('should change password successfully using req.user.id', async () => {
            mockUserService.findById.mockResolvedValue(userWithHash);
            mockPasswordService.verify.mockResolvedValue(true);
            mockPasswordService.validateStrength.mockReturnValue({ valid: true, errors: [] });
            mockPasswordService.isCommonPassword.mockReturnValue(false);
            mockUserService.updatePassword.mockResolvedValue(undefined);
            const res = await request.post('/api/auth/change-password').send({
                currentPassword: 'OldP@ssw0rd!123',
                newPassword: STRONG_PASSWORD,
            });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.message).toBe('Password changed successfully');
            // Verify it used req.user.id (the mocked authenticate sets 'test-user-id')
            (0, vitest_1.expect)(mockUserService.findById).toHaveBeenCalledWith('test-user-id');
            (0, vitest_1.expect)(mockUserService.updatePassword).toHaveBeenCalledWith('test-user-id', STRONG_PASSWORD);
        });
        (0, vitest_1.it)('should reject weak new password', async () => {
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
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.code).toBe('WEAK_PASSWORD');
        });
        (0, vitest_1.it)('should reject wrong current password', async () => {
            mockUserService.findById.mockResolvedValue(userWithHash);
            mockPasswordService.verify.mockResolvedValue(false);
            const res = await request.post('/api/auth/change-password').send({
                currentPassword: 'Wr0ng!P@ssw0rd1',
                newPassword: STRONG_PASSWORD,
            });
            (0, vitest_1.expect)(res.status).toBe(401);
            (0, vitest_1.expect)(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
        });
        (0, vitest_1.it)('should reject common new password', async () => {
            mockUserService.findById.mockResolvedValue(userWithHash);
            mockPasswordService.verify.mockResolvedValue(true);
            mockPasswordService.validateStrength.mockReturnValue({ valid: true, errors: [] });
            mockPasswordService.isCommonPassword.mockReturnValue(true);
            const res = await request.post('/api/auth/change-password').send({
                currentPassword: 'OldP@ssw0rd!123',
                newPassword: STRONG_PASSWORD,
            });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.code).toBe('COMMON_PASSWORD');
        });
    });
    // =======================================================================
    // POST /api/auth/forgot-password
    // =======================================================================
    (0, vitest_1.describe)('POST /api/auth/forgot-password', () => {
        const successMessage = 'If an account exists with this email, a password reset link has been sent.';
        (0, vitest_1.it)('should return same message for existing email (anti-enumeration)', async () => {
            mockUserService.findByEmail.mockResolvedValue({
                id: 'u1',
                email: 'exists@example.com',
                first_name: 'Test',
                status: 'active',
            });
            const res = await request
                .post('/api/auth/forgot-password')
                .send({ email: 'exists@example.com' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.message).toBe(successMessage);
            (0, vitest_1.expect)(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return same message for non-existing email (anti-enumeration)', async () => {
            mockUserService.findByEmail.mockResolvedValue(null);
            const res = await request
                .post('/api/auth/forgot-password')
                .send({ email: 'noone@example.com' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.message).toBe(successMessage);
            (0, vitest_1.expect)(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not send reset email for suspended accounts', async () => {
            mockUserService.findByEmail.mockResolvedValue({
                id: 'u2',
                email: 'suspended@example.com',
                status: 'suspended',
            });
            const res = await request
                .post('/api/auth/forgot-password')
                .send({ email: 'suspended@example.com' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.message).toBe(successMessage);
            (0, vitest_1.expect)(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        });
    });
    // =======================================================================
    // Rate limiting — login endpoint
    // =======================================================================
    (0, vitest_1.describe)('Login rate limiting', () => {
        (0, vitest_1.it)('should return 429 when rate limiter blocks the request', async () => {
            // Simulate Redis returning a lock with positive TTL
            const { redis } = require('../db/redis.js');
            redis.ttl.mockResolvedValue(600); // locked for 600s
            const res = await request.post('/api/auth/login').send(validLoginBody);
            (0, vitest_1.expect)(res.status).toBe(429);
            (0, vitest_1.expect)(res.body.code).toBe('RATE_LIMITED');
        });
    });
});
//# sourceMappingURL=auth.api.test.js.map