import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQuery = vi.fn();

vi.mock('../db/index.js', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

vi.mock('../services/password.service.js', () => ({
  passwordService: {
    hash: vi.fn().mockResolvedValue('$argon2id$hashed'),
    verify: vi.fn(),
  },
}));

vi.mock('../config/auth.config.js', () => ({
  LOCKOUT_CONFIG: {
    maxFailedAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000,
    resetFailedAttemptsAfterMs: 60 * 60 * 1000,
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { userService } from '../services/user.service.js';
import type { User } from '../types/auth.types.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fullUser: User = {
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

describe('UserService', () => {
  // =======================================================================
  // toSafeUser
  // =======================================================================
  describe('toSafeUser', () => {
    it('should strip sensitive fields from user object', () => {
      const safe = userService.toSafeUser(fullUser);

      // Should include safe fields
      expect(safe.id).toBe('u1');
      expect(safe.email).toBe('alice@example.com');
      expect(safe.first_name).toBe('Alice');
      expect(safe.last_name).toBe('Smith');
      expect(safe.company_name).toBe('Acme Inc');
      expect(safe.status).toBe('active');
      expect(safe.role).toBe('user');
      expect(safe.email_verified).toBe(true);
      expect(safe.created_at).toBeDefined();

      // Should NOT include sensitive fields
      const safeObj = safe as any;
      expect(safeObj.password_hash).toBeUndefined();
      expect(safeObj.password_changed_at).toBeUndefined();
      expect(safeObj.failed_login_attempts).toBeUndefined();
      expect(safeObj.lockout_until).toBeUndefined();
      expect(safeObj.last_login_ip).toBeUndefined();
      expect(safeObj.last_login_at).toBeUndefined();
      expect(safeObj.deleted_at).toBeUndefined();
    });

    it('should include deletion_requested_at and deletion_scheduled_for', () => {
      const deletionDate = new Date('2025-12-01');
      const scheduledDate = new Date('2025-12-31');
      const userWithDeletion = {
        ...fullUser,
        deletion_requested_at: deletionDate,
        deletion_scheduled_for: scheduledDate,
      };

      const safe = userService.toSafeUser(userWithDeletion);

      expect(safe.deletion_requested_at).toEqual(deletionDate);
      expect(safe.deletion_scheduled_for).toEqual(scheduledDate);
    });
  });

  // =======================================================================
  // findByEmail
  // =======================================================================
  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [fullUser] });

      const result = await userService.findByEmail('alice@example.com');

      expect(result).toEqual(fullUser);
      // Should lowercase the email
      expect(mockQuery.mock.calls[0][1]).toEqual(['alice@example.com']);
    });

    it('should lowercase email before querying', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await userService.findByEmail('ALICE@Example.COM');

      expect(mockQuery.mock.calls[0][1]).toEqual(['alice@example.com']);
    });

    it('should return null when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await userService.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });

    it('should exclude soft-deleted users', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await userService.findByEmail('alice@example.com');

      // Query should include deleted_at IS NULL filter
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('deleted_at IS NULL');
    });
  });

  // =======================================================================
  // isLocked
  // =======================================================================
  describe('isLocked', () => {
    it('should return locked=true when lockout_until is in the future', async () => {
      const futureDate = new Date(Date.now() + 900_000); // 15 min from now
      mockQuery.mockResolvedValueOnce({
        rows: [{ lockout_until: futureDate }],
      });

      const result = await userService.isLocked('u1');

      expect(result.locked).toBe(true);
      expect(result.until).toEqual(futureDate);
    });

    it('should return locked=false when lockout_until is in the past', async () => {
      const pastDate = new Date(Date.now() - 60_000); // 1 min ago
      mockQuery.mockResolvedValueOnce({
        rows: [{ lockout_until: pastDate }],
      });

      const result = await userService.isLocked('u1');

      expect(result.locked).toBe(false);
      expect(result.until).toBeNull();
    });

    it('should return locked=false when lockout_until is null', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ lockout_until: null }],
      });

      const result = await userService.isLocked('u1');

      expect(result.locked).toBe(false);
      expect(result.until).toBeNull();
    });

    it('should return locked=false when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await userService.isLocked('nonexistent');

      expect(result.locked).toBe(false);
      expect(result.until).toBeNull();
    });
  });

  // =======================================================================
  // recordLoginFailure
  // =======================================================================
  describe('recordLoginFailure', () => {
    it('should return locked=false when attempts below threshold', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ failed_login_attempts: 2, lockout_until: null }],
      });

      const result = await userService.recordLoginFailure('u1');

      expect(result.locked).toBe(false);
      expect(result.lockoutUntil).toBeNull();
    });

    it('should return locked=true when attempts reach threshold', async () => {
      const lockoutDate = new Date(Date.now() + 900_000);
      mockQuery.mockResolvedValueOnce({
        rows: [{ failed_login_attempts: 5, lockout_until: lockoutDate }],
      });

      const result = await userService.recordLoginFailure('u1');

      expect(result.locked).toBe(true);
      expect(result.lockoutUntil).toEqual(lockoutDate);
    });

    it('should pass LOCKOUT_CONFIG values to the query', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ failed_login_attempts: 1, lockout_until: null }],
      });

      await userService.recordLoginFailure('u1');

      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe('u1');          // userId
      expect(params[1]).toBe(5);              // maxFailedAttempts
      expect(params[2]).toBe(15 * 60 * 1000); // lockoutDurationMs
    });
  });

  // =======================================================================
  // emailExists
  // =======================================================================
  describe('emailExists', () => {
    it('should return true when email exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ '1': 1 }] });

      const result = await userService.emailExists('alice@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await userService.emailExists('nobody@example.com');

      expect(result).toBe(false);
    });

    it('should lowercase the email', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await userService.emailExists('Alice@Example.COM');

      expect(mockQuery.mock.calls[0][1]).toEqual(['alice@example.com']);
    });
  });

  // =======================================================================
  // hasPassword
  // =======================================================================
  describe('hasPassword', () => {
    it('should return true when user has a password hash', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: '$argon2id$hash' }],
      });

      const result = await userService.hasPassword('u1');

      expect(result).toBe(true);
    });

    it('should return false for OAuth-only user (null password)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: null }],
      });

      const result = await userService.hasPassword('u1');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await userService.hasPassword('nonexistent');

      expect(result).toBe(false);
    });
  });
});
