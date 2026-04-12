"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPoolQuery = vitest_1.vi.fn();
vitest_1.vi.mock('../db/index.js', () => ({
    pool: { query: (...args) => mockPoolQuery(...args) },
}));
vitest_1.vi.mock('../utils/crypto.utils.js', () => ({
    generateSecureToken: vitest_1.vi.fn().mockReturnValue('mock-token-abc123'),
    hashToken: vitest_1.vi.fn().mockReturnValue('hashed-token-abc123'),
}));
vitest_1.vi.mock('../config/auth.config.js', () => ({
    EMAIL_TOKEN_CONFIG: {
        tokenLength: 32,
        verificationExpiryMs: 24 * 60 * 60 * 1000,
        passwordResetExpiryMs: 1 * 60 * 60 * 1000,
    },
}));
vitest_1.vi.mock('./email-template.service.js', () => ({
    sendTemplate: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
// Stub Resend and nodemailer
vitest_1.vi.mock('resend', () => ({
    Resend: vitest_1.vi.fn().mockImplementation(() => ({
        emails: { send: vitest_1.vi.fn().mockResolvedValue({ id: 'msg-1' }) },
    })),
}));
vitest_1.vi.mock('nodemailer', () => ({
    default: {
        createTransport: vitest_1.vi.fn().mockReturnValue({
            sendMail: vitest_1.vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
        }),
    },
}));
const email_service_js_1 = require("../services/email.service.js");
(0, vitest_1.describe)('EmailService', () => {
    let emailService;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Reset env
        delete process.env.SMTP_HOST;
        delete process.env.RESEND_API_KEY;
        emailService = new email_service_js_1.EmailService();
    });
    (0, vitest_1.describe)('createVerificationToken', () => {
        (0, vitest_1.it)('invalidates existing tokens and creates a new one', async () => {
            mockPoolQuery.mockResolvedValue({ rows: [] });
            const token = await emailService.createVerificationToken('user-1');
            (0, vitest_1.expect)(token).toBe('mock-token-abc123');
            // First call: invalidate old tokens
            (0, vitest_1.expect)(mockPoolQuery).toHaveBeenCalledWith(vitest_1.expect.stringContaining('UPDATE email_verification_tokens'), ['user-1', 'email_verification']);
            // Second call: insert new token
            (0, vitest_1.expect)(mockPoolQuery).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO email_verification_tokens'), vitest_1.expect.arrayContaining(['user-1', 'hashed-token-abc123', 'email_verification']));
        });
    });
    (0, vitest_1.describe)('createPasswordResetToken', () => {
        (0, vitest_1.it)('creates a password reset token', async () => {
            mockPoolQuery.mockResolvedValue({ rows: [] });
            const token = await emailService.createPasswordResetToken('user-1');
            (0, vitest_1.expect)(token).toBe('mock-token-abc123');
            (0, vitest_1.expect)(mockPoolQuery).toHaveBeenCalledWith(vitest_1.expect.stringContaining('UPDATE email_verification_tokens'), ['user-1', 'password_reset']);
        });
    });
    (0, vitest_1.describe)('verifyToken', () => {
        (0, vitest_1.it)('returns valid for a good token', async () => {
            mockPoolQuery
                .mockResolvedValueOnce({
                rows: [{
                        id: 'token-1',
                        user_id: 'user-1',
                        is_used: false,
                        expires_at: new Date(Date.now() + 3600000), // 1h from now
                    }],
            })
                .mockResolvedValueOnce({ rows: [] }); // UPDATE used
            const result = await emailService.verifyToken('mock-token', 'email_verification', '127.0.0.1');
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.userId).toBe('user-1');
            // Should mark as used
            (0, vitest_1.expect)(mockPoolQuery).toHaveBeenCalledWith(vitest_1.expect.stringContaining('SET is_used = TRUE'), ['token-1', '127.0.0.1']);
        });
        (0, vitest_1.it)('returns invalid for a non-existent token', async () => {
            mockPoolQuery.mockResolvedValueOnce({ rows: [] });
            const result = await emailService.verifyToken('bad-token', 'email_verification');
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.error).toBe('Invalid token');
        });
        (0, vitest_1.it)('returns invalid for an already-used token', async () => {
            mockPoolQuery.mockResolvedValueOnce({
                rows: [{
                        id: 'token-1',
                        user_id: 'user-1',
                        is_used: true,
                        expires_at: new Date(Date.now() + 3600000),
                    }],
            });
            const result = await emailService.verifyToken('used-token', 'email_verification');
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.error).toBe('Token already used');
        });
        (0, vitest_1.it)('returns invalid for an expired token', async () => {
            mockPoolQuery.mockResolvedValueOnce({
                rows: [{
                        id: 'token-1',
                        user_id: 'user-1',
                        is_used: false,
                        expires_at: new Date(Date.now() - 1000), // expired
                    }],
            });
            const result = await emailService.verifyToken('expired-token', 'email_verification');
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.error).toBe('Token expired');
        });
    });
    (0, vitest_1.describe)('Email sending', () => {
        (0, vitest_1.it)('sendVerificationEmail calls sendTemplate with correct variables', async () => {
            const { sendTemplate } = await import('../services/email-template.service.js');
            await emailService.sendVerificationEmail('test@example.com', 'Chris', 'token123', 'user-1');
            (0, vitest_1.expect)(sendTemplate).toHaveBeenCalledWith({
                templateSlug: 'email_verification',
                to: { userId: 'user-1', email: 'test@example.com', firstName: 'Chris' },
                variables: {
                    firstName: 'Chris',
                    verifyUrl: vitest_1.expect.stringContaining('token123'),
                },
            });
        });
        (0, vitest_1.it)('sendPasswordResetEmail calls sendTemplate with correct variables', async () => {
            const { sendTemplate } = await import('../services/email-template.service.js');
            await emailService.sendPasswordResetEmail('test@example.com', 'Chris', 'reset-token', 'user-1');
            (0, vitest_1.expect)(sendTemplate).toHaveBeenCalledWith({
                templateSlug: 'password_reset',
                to: { userId: 'user-1', email: 'test@example.com', firstName: 'Chris' },
                variables: {
                    firstName: 'Chris',
                    resetUrl: vitest_1.expect.stringContaining('reset-token'),
                },
            });
        });
    });
});
//# sourceMappingURL=email.service.test.js.map