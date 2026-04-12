"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockQuery = vitest_1.vi.fn();
vitest_1.vi.mock('../db/index.js', () => ({
    pool: { query: (...args) => mockQuery(...args) },
}));
vitest_1.vi.mock('../services/password.service.js', () => ({
    passwordService: {
        hash: vitest_1.vi.fn().mockResolvedValue('$argon2id$hashed'),
        verify: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../config/auth.config.js', () => ({
    LOCKOUT_CONFIG: {
        maxFailedAttempts: 5,
        lockoutDurationMs: 15 * 60 * 1000,
        resetFailedAttemptsAfterMs: 60 * 60 * 1000,
    },
}));
// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
const user_service_js_1 = require("../services/user.service.js");
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fullUser = {
    id: 'u1',
    email: 'alice@example.com',
    email_verified: true,
    email_verified_at: new Date(),
    password_hash: '$argon2id$hash',
    password_changed_at: new Date(),
    first_name: 'Alice',
    last_name: 'Smith',
    company_name: 'Acme Inc',
    status: 'active',
    role: 'user',
    failed_login_attempts: 0,
    lockout_until: null,
    last_login_at: new Date(),
    last_login_ip: '1.2.3.4',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    deletion_requested_at: null,
    deletion_scheduled_for: null,
    beta_access: false,
};
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('UserService', () => {
    // =======================================================================
    // toSafeUser
    // =======================================================================
    (0, vitest_1.describe)('toSafeUser', () => {
        (0, vitest_1.it)('should strip sensitive fields from user object', () => {
            const safe = user_service_js_1.userService.toSafeUser(fullUser);
            // Should include safe fields
            (0, vitest_1.expect)(safe.id).toBe('u1');
            (0, vitest_1.expect)(safe.email).toBe('alice@example.com');
            (0, vitest_1.expect)(safe.first_name).toBe('Alice');
            (0, vitest_1.expect)(safe.last_name).toBe('Smith');
            (0, vitest_1.expect)(safe.company_name).toBe('Acme Inc');
            (0, vitest_1.expect)(safe.status).toBe('active');
            (0, vitest_1.expect)(safe.role).toBe('user');
            (0, vitest_1.expect)(safe.email_verified).toBe(true);
            (0, vitest_1.expect)(safe.created_at).toBeDefined();
            // Should NOT include sensitive fields
            const safeObj = safe;
            (0, vitest_1.expect)(safeObj.password_hash).toBeUndefined();
            (0, vitest_1.expect)(safeObj.password_changed_at).toBeUndefined();
            (0, vitest_1.expect)(safeObj.failed_login_attempts).toBeUndefined();
            (0, vitest_1.expect)(safeObj.lockout_until).toBeUndefined();
            (0, vitest_1.expect)(safeObj.last_login_ip).toBeUndefined();
            (0, vitest_1.expect)(safeObj.last_login_at).toBeUndefined();
            (0, vitest_1.expect)(safeObj.deleted_at).toBeUndefined();
        });
        (0, vitest_1.it)('should include deletion_requested_at and deletion_scheduled_for', () => {
            const deletionDate = new Date('2025-12-01');
            const scheduledDate = new Date('2025-12-31');
            const userWithDeletion = {
                ...fullUser,
                deletion_requested_at: deletionDate,
                deletion_scheduled_for: scheduledDate,
            };
            const safe = user_service_js_1.userService.toSafeUser(userWithDeletion);
            (0, vitest_1.expect)(safe.deletion_requested_at).toEqual(deletionDate);
            (0, vitest_1.expect)(safe.deletion_scheduled_for).toEqual(scheduledDate);
        });
    });
    // =======================================================================
    // findByEmail
    // =======================================================================
    (0, vitest_1.describe)('findByEmail', () => {
        (0, vitest_1.it)('should return user when found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [fullUser] });
            const result = await user_service_js_1.userService.findByEmail('alice@example.com');
            (0, vitest_1.expect)(result).toEqual(fullUser);
            // Should lowercase the email
            (0, vitest_1.expect)(mockQuery.mock.calls[0][1]).toEqual(['alice@example.com']);
        });
        (0, vitest_1.it)('should lowercase email before querying', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            await user_service_js_1.userService.findByEmail('ALICE@Example.COM');
            (0, vitest_1.expect)(mockQuery.mock.calls[0][1]).toEqual(['alice@example.com']);
        });
        (0, vitest_1.it)('should return null when user not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await user_service_js_1.userService.findByEmail('nobody@example.com');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should exclude soft-deleted users', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            await user_service_js_1.userService.findByEmail('alice@example.com');
            // Query should include deleted_at IS NULL filter
            const sql = mockQuery.mock.calls[0][0];
            (0, vitest_1.expect)(sql).toContain('deleted_at IS NULL');
        });
    });
    // =======================================================================
    // isLocked
    // =======================================================================
    (0, vitest_1.describe)('isLocked', () => {
        (0, vitest_1.it)('should return locked=true when lockout_until is in the future', async () => {
            const futureDate = new Date(Date.now() + 900_000); // 15 min from now
            mockQuery.mockResolvedValueOnce({
                rows: [{ lockout_until: futureDate }],
            });
            const result = await user_service_js_1.userService.isLocked('u1');
            (0, vitest_1.expect)(result.locked).toBe(true);
            (0, vitest_1.expect)(result.until).toEqual(futureDate);
        });
        (0, vitest_1.it)('should return locked=false when lockout_until is in the past', async () => {
            const pastDate = new Date(Date.now() - 60_000); // 1 min ago
            mockQuery.mockResolvedValueOnce({
                rows: [{ lockout_until: pastDate }],
            });
            const result = await user_service_js_1.userService.isLocked('u1');
            (0, vitest_1.expect)(result.locked).toBe(false);
            (0, vitest_1.expect)(result.until).toBeNull();
        });
        (0, vitest_1.it)('should return locked=false when lockout_until is null', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ lockout_until: null }],
            });
            const result = await user_service_js_1.userService.isLocked('u1');
            (0, vitest_1.expect)(result.locked).toBe(false);
            (0, vitest_1.expect)(result.until).toBeNull();
        });
        (0, vitest_1.it)('should return locked=false when user not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await user_service_js_1.userService.isLocked('nonexistent');
            (0, vitest_1.expect)(result.locked).toBe(false);
            (0, vitest_1.expect)(result.until).toBeNull();
        });
    });
    // =======================================================================
    // recordLoginFailure
    // =======================================================================
    (0, vitest_1.describe)('recordLoginFailure', () => {
        (0, vitest_1.it)('should return locked=false when attempts below threshold', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ failed_login_attempts: 2, lockout_until: null }],
            });
            const result = await user_service_js_1.userService.recordLoginFailure('u1');
            (0, vitest_1.expect)(result.locked).toBe(false);
            (0, vitest_1.expect)(result.lockoutUntil).toBeNull();
        });
        (0, vitest_1.it)('should return locked=true when attempts reach threshold', async () => {
            const lockoutDate = new Date(Date.now() + 900_000);
            mockQuery.mockResolvedValueOnce({
                rows: [{ failed_login_attempts: 5, lockout_until: lockoutDate }],
            });
            const result = await user_service_js_1.userService.recordLoginFailure('u1');
            (0, vitest_1.expect)(result.locked).toBe(true);
            (0, vitest_1.expect)(result.lockoutUntil).toEqual(lockoutDate);
        });
        (0, vitest_1.it)('should pass LOCKOUT_CONFIG values to the query', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ failed_login_attempts: 1, lockout_until: null }],
            });
            await user_service_js_1.userService.recordLoginFailure('u1');
            const params = mockQuery.mock.calls[0][1];
            (0, vitest_1.expect)(params[0]).toBe('u1'); // userId
            (0, vitest_1.expect)(params[1]).toBe(5); // maxFailedAttempts
            (0, vitest_1.expect)(params[2]).toBe(15 * 60 * 1000); // lockoutDurationMs
        });
    });
    // =======================================================================
    // emailExists
    // =======================================================================
    (0, vitest_1.describe)('emailExists', () => {
        (0, vitest_1.it)('should return true when email exists', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ '1': 1 }] });
            const result = await user_service_js_1.userService.emailExists('alice@example.com');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false when email does not exist', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await user_service_js_1.userService.emailExists('nobody@example.com');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should lowercase the email', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            await user_service_js_1.userService.emailExists('Alice@Example.COM');
            (0, vitest_1.expect)(mockQuery.mock.calls[0][1]).toEqual(['alice@example.com']);
        });
    });
    // =======================================================================
    // hasPassword
    // =======================================================================
    (0, vitest_1.describe)('hasPassword', () => {
        (0, vitest_1.it)('should return true when user has a password hash', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ password_hash: '$argon2id$hash' }],
            });
            const result = await user_service_js_1.userService.hasPassword('u1');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false for OAuth-only user (null password)', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ password_hash: null }],
            });
            const result = await user_service_js_1.userService.hasPassword('u1');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return false when user not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await user_service_js_1.userService.hasPassword('nonexistent');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
});
//# sourceMappingURL=user.service.test.js.map