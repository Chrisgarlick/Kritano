import type { Transporter } from 'nodemailer';
import type { EmailTokenType } from '../types/auth.types.js';
/**
 * Email service supporting multiple transports:
 * 1. SMTP (Mailpit for dev) — when SMTP_HOST is set
 * 2. Resend (production) — when RESEND_API_KEY is set
 * 3. Console logging — fallback when neither is configured
 */
export declare class EmailService {
    private resend;
    private smtpTransport;
    private readonly fromAddress;
    private readonly appUrl;
    constructor();
    /**
     * Create an email verification token
     */
    createVerificationToken(userId: string): Promise<string>;
    /**
     * Create a password reset token
     */
    createPasswordResetToken(userId: string): Promise<string>;
    /**
     * Create an email token of specified type
     */
    private createEmailToken;
    /**
     * Verify an email token
     */
    verifyToken(token: string, tokenType: EmailTokenType, ipAddress?: string): Promise<{
        valid: boolean;
        userId?: string;
        error?: string;
    }>;
    /**
     * Send email verification email via template service.
     */
    sendVerificationEmail(email: string, firstName: string, token: string, userId?: string): Promise<void>;
    /**
     * Send password reset email via template service.
     */
    sendPasswordResetEmail(email: string, firstName: string, token: string, userId?: string): Promise<void>;
    /**
     * Send audit completion notification email via template service.
     */
    sendAuditCompletedEmail(email: string, firstName: string, audit: {
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
    }, userId?: string): Promise<void>;
    /**
     * Low-level email send (fallback when template system is unavailable).
     * Supports SMTP (Mailpit), Resend, or console logging.
     */
    /**
     * Send a generic email (used for contact form notifications, admin alerts, etc.).
     */
    sendGenericEmail(to: string, subject: string, html: string): Promise<void>;
    private sendEmailDirect;
    /**
     * Get the SMTP transport (used by template service for SMTP sends).
     */
    getSmtpTransport(): Transporter | null;
    /**
     * Send payment failure (dunning) notification email.
     */
    sendPaymentFailedEmail(email: string, firstName: string): Promise<void>;
    private get businessAddress();
    private buildEmailFooter;
    private buildVerificationHtml;
    private buildResetHtml;
    private buildAuditHtml;
}
export declare const emailService: EmailService;
//# sourceMappingURL=email.service.d.ts.map