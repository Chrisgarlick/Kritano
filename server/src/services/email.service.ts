import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { pool } from '../db/index.js';
import { generateSecureToken, hashToken } from '../utils/crypto.utils.js';
import { EMAIL_TOKEN_CONFIG } from '../config/auth.config.js';
import type { EmailTokenType } from '../types/auth.types.js';
import { sendTemplate } from './email-template.service.js';

/**
 * Email service supporting multiple transports:
 * 1. SMTP (Mailpit for dev) — when SMTP_HOST is set
 * 2. Resend (production) — when RESEND_API_KEY is set
 * 3. Console logging — fallback when neither is configured
 */
export class EmailService {
  private resend: Resend | null = null;
  private smtpTransport: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor() {
    // SMTP transport (Mailpit / any SMTP server) takes priority in development
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      this.smtpTransport = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '1025', 10),
        secure: false,
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        } : undefined,
      });
      console.log(`📧 SMTP transport configured → ${smtpHost}:${process.env.SMTP_PORT || '1025'}`);
    }

    // Resend transport (production)
    const apiKey = process.env.RESEND_API_KEY;
    if (!this.smtpTransport && apiKey && apiKey !== 're_your_api_key_here') {
      this.resend = new Resend(apiKey);
    } else if (!this.smtpTransport) {
      console.warn('No email transport configured - emails will be logged to console');
    }

    this.fromAddress = process.env.EMAIL_FROM || 'PagePulser <noreply@pagepulser.com>';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  /**
   * Create an email verification token
   */
  async createVerificationToken(userId: string): Promise<string> {
    return this.createEmailToken(userId, 'email_verification', EMAIL_TOKEN_CONFIG.verificationExpiryMs);
  }

  /**
   * Create a password reset token
   */
  async createPasswordResetToken(userId: string): Promise<string> {
    return this.createEmailToken(userId, 'password_reset', EMAIL_TOKEN_CONFIG.passwordResetExpiryMs);
  }

  /**
   * Create an email token of specified type
   */
  private async createEmailToken(
    userId: string,
    tokenType: EmailTokenType,
    expiryMs: number
  ): Promise<string> {
    // Invalidate any existing tokens of this type for this user
    await pool.query(
      `UPDATE email_verification_tokens
       SET is_used = TRUE
       WHERE user_id = $1 AND token_type = $2 AND is_used = FALSE`,
      [userId, tokenType]
    );

    // Generate new token
    const token = generateSecureToken(EMAIL_TOKEN_CONFIG.tokenLength);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + expiryMs);

    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, token_type, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, tokenHash, tokenType, expiresAt]
    );

    return token;
  }

  /**
   * Verify an email token
   */
  async verifyToken(
    token: string,
    tokenType: EmailTokenType,
    ipAddress?: string
  ): Promise<{ valid: boolean; userId?: string; error?: string }> {
    const tokenHash = hashToken(token);

    const result = await pool.query<{
      id: string;
      user_id: string;
      is_used: boolean;
      expires_at: Date;
    }>(
      `SELECT id, user_id, is_used, expires_at
       FROM email_verification_tokens
       WHERE token_hash = $1 AND token_type = $2`,
      [tokenHash, tokenType]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: 'Invalid token' };
    }

    const tokenRecord = result.rows[0];

    if (tokenRecord.is_used) {
      return { valid: false, error: 'Token already used' };
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return { valid: false, error: 'Token expired' };
    }

    // Mark token as used
    await pool.query(
      `UPDATE email_verification_tokens
       SET is_used = TRUE, used_at = NOW(), used_ip = $2
       WHERE id = $1`,
      [tokenRecord.id, ipAddress || null]
    );

    return { valid: true, userId: tokenRecord.user_id };
  }

  /**
   * Send email verification email via template service.
   */
  async sendVerificationEmail(email: string, firstName: string, token: string, userId?: string): Promise<void> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;

    if (userId) {
      try {
        await sendTemplate({
          templateSlug: 'email_verification',
          to: { userId, email, firstName },
          variables: { firstName, verifyUrl },
        });
        return;
      } catch (err) {
        console.warn('Template send failed, falling back to direct send:', err);
      }
    }

    // Fallback: direct send (for migration period or missing userId)
    await this.sendEmailDirect(email, 'Verify your PagePulser account', this.buildVerificationHtml(firstName, verifyUrl));
  }

  /**
   * Send password reset email via template service.
   */
  async sendPasswordResetEmail(email: string, firstName: string, token: string, userId?: string): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

    if (userId) {
      try {
        await sendTemplate({
          templateSlug: 'password_reset',
          to: { userId, email, firstName },
          variables: { firstName, resetUrl },
        });
        return;
      } catch (err) {
        console.warn('Template send failed, falling back to direct send:', err);
      }
    }

    await this.sendEmailDirect(email, 'Reset your PagePulser password', this.buildResetHtml(firstName, resetUrl));
  }

  /**
   * Send audit completion notification email via template service.
   */
  async sendAuditCompletedEmail(
    email: string,
    firstName: string,
    audit: {
      id: string;
      target_url: string;
      target_domain: string;
      status: string;
      total_issues: number;
      critical_issues: number;
      seo_score: number | null;
      accessibility_score: number | null;
      security_score: number | null;
      performance_score: number | null;
      content_score?: number | null;
      structured_data_score?: number | null;
    },
    userId?: string
  ): Promise<void> {
    const isSuccess = audit.status === 'completed';
    const statusText = isSuccess ? 'Completed' : 'Failed';

    if (userId) {
      try {
        await sendTemplate({
          templateSlug: 'audit_completed',
          to: { userId, email, firstName },
          variables: {
            firstName,
            domain: audit.target_domain,
            targetUrl: audit.target_url,
            statusText,
            statusMessage: isSuccess ? 'completed successfully' : 'failed',
            auditId: audit.id,
            auditUrl: `${this.appUrl}/audits/${audit.id}`,
            totalIssues: String(audit.total_issues || 0),
            criticalIssues: String(audit.critical_issues || 0),
            seoScore: String(audit.seo_score || 0),
            accessibilityScore: String(audit.accessibility_score || 0),
            securityScore: String(audit.security_score || 0),
            performanceScore: String(audit.performance_score || 0),
            contentScore: String(audit.content_score || 0),
            structuredDataScore: String(audit.structured_data_score || 0),
          },
        });
        return;
      } catch (err) {
        console.warn('Template send failed, falling back to direct send:', err);
      }
    }

    // Fallback
    await this.sendEmailDirect(email, `Audit ${statusText}: ${audit.target_domain}`, this.buildAuditHtml(firstName, audit));
  }

  /**
   * Low-level email send (fallback when template system is unavailable).
   * Supports SMTP (Mailpit), Resend, or console logging.
   */
  private async sendEmailDirect(to: string, subject: string, html: string): Promise<void> {
    if (this.smtpTransport) {
      try {
        const info = await this.smtpTransport.sendMail({
          from: this.fromAddress,
          to,
          subject,
          html,
        });
        console.log(`📧 Email sent via SMTP to ${to}: ${info.messageId}`);
      } catch (error) {
        console.error('SMTP send failed:', error);
        throw error;
      }
    } else if (this.resend) {
      try {
        const result = await this.resend.emails.send({
          from: this.fromAddress,
          to,
          subject,
          html,
        });

        if (result.error) {
          console.error('Resend error:', result.error);
          throw new Error(`Failed to send email: ${result.error.message}`);
        }

        console.log(`Email sent to ${to}: ${result.data?.id}`);
      } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
      }
    } else {
      console.log('\n📧 EMAIL (Development Mode)');
      console.log('━'.repeat(50));
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('━'.repeat(50));
      const urlMatch = html.match(/href="([^"]+)"/);
      if (urlMatch) {
        console.log(`🔗 Action URL: ${urlMatch[1]}`);
      }
      console.log('━'.repeat(50) + '\n');
    }
  }

  /**
   * Get the SMTP transport (used by template service for SMTP sends).
   */
  getSmtpTransport(): Transporter | null {
    return this.smtpTransport;
  }

  // ========================================
  // Fallback HTML builders (inline templates for migration period)
  // ========================================

  private buildVerificationHtml(firstName: string, verifyUrl: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #4f46e5; margin: 0;">PagePulser</h1></div><h2 style="color: #1f2937;">Hi ${firstName},</h2><p>Welcome to PagePulser! Please verify your email address by clicking the button below:</p><div style="text-align: center; margin: 30px 0;"><a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a></div><p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"><p style="color: #9ca3af; font-size: 12px;">If you didn't create an account with PagePulser, you can safely ignore this email.</p></body></html>`;
  }

  private buildResetHtml(firstName: string, resetUrl: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #4f46e5; margin: 0;">PagePulser</h1></div><h2 style="color: #1f2937;">Hi ${firstName},</h2><p>We received a request to reset your password. Click the button below to choose a new password:</p><div style="text-align: center; margin: 30px 0;"><a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a></div><p style="color: #6b7280; font-size: 14px;"><strong>This link will expire in 1 hour.</strong></p><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"><p style="color: #9ca3af; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p></body></html>`;
  }

  private buildAuditHtml(firstName: string, audit: { id: string; target_url: string; target_domain: string; status: string; total_issues: number; critical_issues: number; seo_score: number | null; accessibility_score: number | null; security_score: number | null; performance_score: number | null }): string {
    const viewUrl = `${this.appUrl}/audits/${audit.id}`;
    const isSuccess = audit.status === 'completed';
    const statusText = isSuccess ? 'Completed' : 'Failed';
    const scoreRow = (label: string, score: number | null) => {
      if (score === null) return '';
      const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
      return `<tr><td style="padding: 8px 16px; border-bottom: 1px solid #e5e7eb;">${label}</td><td style="padding: 8px 16px; border-bottom: 1px solid #e5e7eb; color: ${color}; font-weight: 600;">${score}/100</td></tr>`;
    };
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #4f46e5; margin: 0;">PagePulser</h1></div><h2 style="color: #1f2937;">Hi ${firstName},</h2><p>Your audit of <strong>${audit.target_url}</strong> has ${isSuccess ? 'completed successfully' : 'failed'}.</p>${isSuccess ? `<div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;"><p style="margin: 8px 0;"><strong>Issues Found:</strong> ${audit.total_issues} (${audit.critical_issues} critical)</p><table style="width: 100%; border-collapse: collapse;">${scoreRow('SEO', audit.seo_score)}${scoreRow('Accessibility', audit.accessibility_score)}${scoreRow('Security', audit.security_score)}${scoreRow('Performance', audit.performance_score)}</table></div>` : ''}<div style="text-align: center; margin: 30px 0;"><a href="${viewUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Audit Results</a></div><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"><p style="color: #9ca3af; font-size: 12px; text-align: center;">You're receiving this email because you have audit notifications enabled.</p></body></html>`;
  }
}

// Export singleton instance
export const emailService = new EmailService();
