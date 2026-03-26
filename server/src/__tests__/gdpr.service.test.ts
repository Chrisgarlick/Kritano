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

const mockFindById = vi.fn();
const mockToSafeUser = vi.fn();

vi.mock('../services/user.service.js', () => ({
  userService: {
    findById: (...args: any[]) => mockFindById(...args),
    toSafeUser: (...args: any[]) => mockToSafeUser(...args),
  },
}));

vi.mock('../services/token.service.js', () => ({
  tokenService: {
    revokeAllUserTokens: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('../services/email-template.service.js', () => ({
  sendTemplate: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { gdprService } from '../services/gdpr.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GDPR Service', () => {
  // =======================================================================
  // requestExport — data export structure
  // =======================================================================
  describe('requestExport', () => {
    it('should create a new export record and return the export ID', async () => {
      // No existing pending exports
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Insert new export
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'export-1' }] });

      const exportId = await gdprService.requestExport('u1');

      expect(exportId).toBe('export-1');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw 409 if an export is already in progress', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-export' }] });

      await expect(
        gdprService.requestExport('u1')
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // =======================================================================
  // getLatestExport
  // =======================================================================
  describe('getLatestExport', () => {
    it('should return the latest export status', async () => {
      const exportRow = {
        id: 'exp-1',
        status: 'completed',
        created_at: new Date('2025-06-01'),
        completed_at: new Date('2025-06-01'),
        expires_at: new Date('2025-06-02'),
        file_size_bytes: 12345,
      };
      mockQuery.mockResolvedValueOnce({ rows: [exportRow] });

      const result = await gdprService.getLatestExport('u1');

      expect(result).toEqual({
        id: 'exp-1',
        status: 'completed',
        createdAt: exportRow.created_at,
        completedAt: exportRow.completed_at,
        expiresAt: exportRow.expires_at,
        fileSizeBytes: 12345,
      });
    });

    it('should return null when no exports exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await gdprService.getLatestExport('u1');

      expect(result).toBeNull();
    });
  });

  // =======================================================================
  // requestAccountDeletion
  // =======================================================================
  describe('requestAccountDeletion', () => {
    it('should schedule deletion 30 days in the future', async () => {
      const user = {
        id: 'u1',
        email: 'alice@example.com',
        first_name: 'Alice',
        deletion_requested_at: null,
      };
      mockFindById.mockResolvedValue(user);
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE users

      const result = await gdprService.requestAccountDeletion('u1');

      expect(result.scheduledFor).toBeDefined();
      // Should be approximately 30 days from now
      const daysUntilDeletion = (result.scheduledFor.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      expect(daysUntilDeletion).toBeGreaterThan(29);
      expect(daysUntilDeletion).toBeLessThan(31);
    });

    it('should throw 404 when user not found', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        gdprService.requestAccountDeletion('nonexistent')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw 409 when deletion is already scheduled', async () => {
      mockFindById.mockResolvedValue({
        id: 'u1',
        email: 'alice@example.com',
        first_name: 'Alice',
        deletion_requested_at: new Date(), // Already requested
      });

      await expect(
        gdprService.requestAccountDeletion('u1')
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // =======================================================================
  // cancelAccountDeletion
  // =======================================================================
  describe('cancelAccountDeletion', () => {
    it('should cancel a pending deletion and set status to active', async () => {
      mockFindById.mockResolvedValue({
        id: 'u1',
        email: 'alice@example.com',
        first_name: 'Alice',
        deletion_requested_at: new Date(),
      });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE users

      await expect(
        gdprService.cancelAccountDeletion('u1')
      ).resolves.toBeUndefined();

      // Verify the UPDATE query clears deletion fields and sets status to 'active'
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('deletion_requested_at = NULL');
      expect(sql).toContain('deletion_scheduled_for = NULL');
      expect(sql).toContain("status = 'active'");
    });

    it('should throw 404 when user not found', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        gdprService.cancelAccountDeletion('nonexistent')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw 400 when no pending deletion exists', async () => {
      mockFindById.mockResolvedValue({
        id: 'u1',
        email: 'alice@example.com',
        first_name: 'Alice',
        deletion_requested_at: null, // No pending deletion
      });

      await expect(
        gdprService.cancelAccountDeletion('u1')
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // =======================================================================
  // verifyPassword
  // =======================================================================
  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: '$argon2id$hash' }],
      });

      const { passwordService } = await import('../services/password.service.js');
      (passwordService.verify as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await gdprService.verifyPassword('u1', 'correct-pass');

      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: '$argon2id$hash' }],
      });

      const { passwordService } = await import('../services/password.service.js');
      (passwordService.verify as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await gdprService.verifyPassword('u1', 'wrong-pass');

      expect(result).toBe(false);
    });

    it('should return false when user has no password (OAuth user)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: null }],
      });

      const result = await gdprService.verifyPassword('u1', 'any-pass');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await gdprService.verifyPassword('nonexistent', 'any-pass');

      expect(result).toBe(false);
    });
  });

  // =======================================================================
  // getExportDownload
  // =======================================================================
  describe('getExportDownload', () => {
    it('should throw 404 when export not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        gdprService.getExportDownload('u1', 'exp-missing')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw 410 when export has expired', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          file_path: '/tmp/export.zip',
          expires_at: new Date(Date.now() - 86400_000), // 1 day ago
        }],
      });

      await expect(
        gdprService.getExportDownload('u1', 'exp-expired')
      ).rejects.toMatchObject({ statusCode: 410 });
    });
  });
});
