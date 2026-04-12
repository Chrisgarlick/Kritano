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
const mockFindById = vitest_1.vi.fn();
const mockToSafeUser = vitest_1.vi.fn();
vitest_1.vi.mock('../services/user.service.js', () => ({
    userService: {
        findById: (...args) => mockFindById(...args),
        toSafeUser: (...args) => mockToSafeUser(...args),
    },
}));
vitest_1.vi.mock('../services/token.service.js', () => ({
    tokenService: {
        revokeAllUserTokens: vitest_1.vi.fn().mockResolvedValue(1),
    },
}));
vitest_1.vi.mock('../services/email-template.service.js', () => ({
    sendTemplate: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
const gdpr_service_js_1 = require("../services/gdpr.service.js");
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('GDPR Service', () => {
    // =======================================================================
    // requestExport — data export structure
    // =======================================================================
    (0, vitest_1.describe)('requestExport', () => {
        (0, vitest_1.it)('should create a new export record and return the export ID', async () => {
            // No existing pending exports
            mockQuery.mockResolvedValueOnce({ rows: [] });
            // Insert new export
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 'export-1' }] });
            const exportId = await gdpr_service_js_1.gdprService.requestExport('u1');
            (0, vitest_1.expect)(exportId).toBe('export-1');
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should throw 409 if an export is already in progress', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-export' }] });
            await (0, vitest_1.expect)(gdpr_service_js_1.gdprService.requestExport('u1')).rejects.toMatchObject({ statusCode: 409 });
        });
    });
    // =======================================================================
    // getLatestExport
    // =======================================================================
    (0, vitest_1.describe)('getLatestExport', () => {
        (0, vitest_1.it)('should return the latest export status', async () => {
            const exportRow = {
                id: 'exp-1',
                status: 'completed',
                created_at: new Date('2025-06-01'),
                completed_at: new Date('2025-06-01'),
                expires_at: new Date('2025-06-02'),
                file_size_bytes: 12345,
            };
            mockQuery.mockResolvedValueOnce({ rows: [exportRow] });
            const result = await gdpr_service_js_1.gdprService.getLatestExport('u1');
            (0, vitest_1.expect)(result).toEqual({
                id: 'exp-1',
                status: 'completed',
                createdAt: exportRow.created_at,
                completedAt: exportRow.completed_at,
                expiresAt: exportRow.expires_at,
                fileSizeBytes: 12345,
            });
        });
        (0, vitest_1.it)('should return null when no exports exist', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await gdpr_service_js_1.gdprService.getLatestExport('u1');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    // =======================================================================
    // requestAccountDeletion
    // =======================================================================
    (0, vitest_1.describe)('requestAccountDeletion', () => {
        (0, vitest_1.it)('should schedule deletion 30 days in the future', async () => {
            const user = {
                id: 'u1',
                email: 'alice@example.com',
                first_name: 'Alice',
                deletion_requested_at: null,
            };
            mockFindById.mockResolvedValue(user);
            mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE users
            const result = await gdpr_service_js_1.gdprService.requestAccountDeletion('u1');
            (0, vitest_1.expect)(result.scheduledFor).toBeDefined();
            // Should be approximately 30 days from now
            const daysUntilDeletion = (result.scheduledFor.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
            (0, vitest_1.expect)(daysUntilDeletion).toBeGreaterThan(29);
            (0, vitest_1.expect)(daysUntilDeletion).toBeLessThan(31);
        });
        (0, vitest_1.it)('should throw 404 when user not found', async () => {
            mockFindById.mockResolvedValue(null);
            await (0, vitest_1.expect)(gdpr_service_js_1.gdprService.requestAccountDeletion('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
        });
        (0, vitest_1.it)('should throw 409 when deletion is already scheduled', async () => {
            mockFindById.mockResolvedValue({
                id: 'u1',
                email: 'alice@example.com',
                first_name: 'Alice',
                deletion_requested_at: new Date(), // Already requested
            });
            await (0, vitest_1.expect)(gdpr_service_js_1.gdprService.requestAccountDeletion('u1')).rejects.toMatchObject({ statusCode: 409 });
        });
    });
    // =======================================================================
    // cancelAccountDeletion
    // =======================================================================
    (0, vitest_1.describe)('cancelAccountDeletion', () => {
        (0, vitest_1.it)('should cancel a pending deletion and set status to active', async () => {
            mockFindById.mockResolvedValue({
                id: 'u1',
                email: 'alice@example.com',
                first_name: 'Alice',
                deletion_requested_at: new Date(),
            });
            mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE users
            await (0, vitest_1.expect)(gdpr_service_js_1.gdprService.cancelAccountDeletion('u1')).resolves.toBeUndefined();
            // Verify the UPDATE query clears deletion fields and sets status to 'active'
            const sql = mockQuery.mock.calls[0][0];
            (0, vitest_1.expect)(sql).toContain('deletion_requested_at = NULL');
            (0, vitest_1.expect)(sql).toContain('deletion_scheduled_for = NULL');
            (0, vitest_1.expect)(sql).toContain("status = 'active'");
        });
        (0, vitest_1.it)('should throw 404 when user not found', async () => {
            mockFindById.mockResolvedValue(null);
            await (0, vitest_1.expect)(gdpr_service_js_1.gdprService.cancelAccountDeletion('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
        });
        (0, vitest_1.it)('should throw 400 when no pending deletion exists', async () => {
            mockFindById.mockResolvedValue({
                id: 'u1',
                email: 'alice@example.com',
                first_name: 'Alice',
                deletion_requested_at: null, // No pending deletion
            });
            await (0, vitest_1.expect)(gdpr_service_js_1.gdprService.cancelAccountDeletion('u1')).rejects.toMatchObject({ statusCode: 400 });
        });
    });
    // =======================================================================
    // verifyPassword
    // =======================================================================
    (0, vitest_1.describe)('verifyPassword', () => {
        (0, vitest_1.it)('should return true for correct password', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ password_hash: '$argon2id$hash' }],
            });
            const { passwordService } = await import('../services/password.service.js');
            passwordService.verify.mockResolvedValue(true);
            const result = await gdpr_service_js_1.gdprService.verifyPassword('u1', 'correct-pass');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false for wrong password', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ password_hash: '$argon2id$hash' }],
            });
            const { passwordService } = await import('../services/password.service.js');
            passwordService.verify.mockResolvedValue(false);
            const result = await gdpr_service_js_1.gdprService.verifyPassword('u1', 'wrong-pass');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return false when user has no password (OAuth user)', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ password_hash: null }],
            });
            const result = await gdpr_service_js_1.gdprService.verifyPassword('u1', 'any-pass');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return false when user not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await gdpr_service_js_1.gdprService.verifyPassword('nonexistent', 'any-pass');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    // =======================================================================
    // getExportDownload
    // =======================================================================
    (0, vitest_1.describe)('getExportDownload', () => {
        (0, vitest_1.it)('should throw 404 when export not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            await (0, vitest_1.expect)(gdpr_service_js_1.gdprService.getExportDownload('u1', 'exp-missing')).rejects.toMatchObject({ statusCode: 404 });
        });
        (0, vitest_1.it)('should throw 410 when export has expired', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{
                        file_path: '/tmp/export.zip',
                        expires_at: new Date(Date.now() - 86400_000), // 1 day ago
                    }],
            });
            await (0, vitest_1.expect)(gdpr_service_js_1.gdprService.getExportDownload('u1', 'exp-expired')).rejects.toMatchObject({ statusCode: 410 });
        });
    });
});
//# sourceMappingURL=gdpr.service.test.js.map