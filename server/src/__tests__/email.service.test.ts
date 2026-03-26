import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPoolQuery = vi.fn();

vi.mock('../db/index.js', () => ({
  pool: { query: (...args: unknown[]) => mockPoolQuery(...args) },
}));

vi.mock('../utils/crypto.utils.js', () => ({
  generateSecureToken: vi.fn().mockReturnValue('mock-token-abc123'),
  hashToken: vi.fn().mockReturnValue('hashed-token-abc123'),
}));

vi.mock('../config/auth.config.js', () => ({
  EMAIL_TOKEN_CONFIG: {
    tokenLength: 32,
    verificationExpiryMs: 24 * 60 * 60 * 1000,
    passwordResetExpiryMs: 1 * 60 * 60 * 1000,
  },
}));

vi.mock('./email-template.service.js', () => ({
  sendTemplate: vi.fn().mockResolvedValue(undefined),
}));

// Stub Resend and nodemailer
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'msg-1' }) },
  })),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
    }),
  },
}));

import { EmailService } from '../services/email.service.js';

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env
    delete process.env.SMTP_HOST;
    delete process.env.RESEND_API_KEY;
    emailService = new EmailService();
  });

  describe('createVerificationToken', () => {
    it('invalidates existing tokens and creates a new one', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      const token = await emailService.createVerificationToken('user-1');

      expect(token).toBe('mock-token-abc123');
      // First call: invalidate old tokens
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE email_verification_tokens'),
        ['user-1', 'email_verification']
      );
      // Second call: insert new token
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_verification_tokens'),
        expect.arrayContaining(['user-1', 'hashed-token-abc123', 'email_verification'])
      );
    });
  });

  describe('createPasswordResetToken', () => {
    it('creates a password reset token', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      const token = await emailService.createPasswordResetToken('user-1');

      expect(token).toBe('mock-token-abc123');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE email_verification_tokens'),
        ['user-1', 'password_reset']
      );
    });
  });

  describe('verifyToken', () => {
    it('returns valid for a good token', async () => {
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

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-1');
      // Should mark as used
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET is_used = TRUE'),
        ['token-1', '127.0.0.1']
      );
    });

    it('returns invalid for a non-existent token', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const result = await emailService.verifyToken('bad-token', 'email_verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('returns invalid for an already-used token', async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{
          id: 'token-1',
          user_id: 'user-1',
          is_used: true,
          expires_at: new Date(Date.now() + 3600000),
        }],
      });

      const result = await emailService.verifyToken('used-token', 'email_verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token already used');
    });

    it('returns invalid for an expired token', async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{
          id: 'token-1',
          user_id: 'user-1',
          is_used: false,
          expires_at: new Date(Date.now() - 1000), // expired
        }],
      });

      const result = await emailService.verifyToken('expired-token', 'email_verification');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });
  });

  describe('Email sending', () => {
    it('sendVerificationEmail calls sendTemplate with correct variables', async () => {
      const { sendTemplate } = await import('./email-template.service.js') as { sendTemplate: ReturnType<typeof vi.fn> };

      await emailService.sendVerificationEmail('test@example.com', 'Chris', 'token123', 'user-1');

      expect(sendTemplate).toHaveBeenCalledWith({
        templateSlug: 'email_verification',
        to: { userId: 'user-1', email: 'test@example.com', firstName: 'Chris' },
        variables: {
          firstName: 'Chris',
          verifyUrl: expect.stringContaining('token123'),
        },
      });
    });

    it('sendPasswordResetEmail calls sendTemplate with correct variables', async () => {
      const { sendTemplate } = await import('./email-template.service.js') as { sendTemplate: ReturnType<typeof vi.fn> };

      await emailService.sendPasswordResetEmail('test@example.com', 'Chris', 'reset-token', 'user-1');

      expect(sendTemplate).toHaveBeenCalledWith({
        templateSlug: 'password_reset',
        to: { userId: 'user-1', email: 'test@example.com', firstName: 'Chris' },
        variables: {
          firstName: 'Chris',
          resetUrl: expect.stringContaining('reset-token'),
        },
      });
    });
  });
});
