/**
 * Email Preference Service
 *
 * Manages user-level email opt-in/opt-out preferences and
 * generates signed unsubscribe tokens for CAN-SPAM/GDPR compliance.
 */
import type { EmailPreferences, TemplateCategory } from '../types/email-template.types.js';
/**
 * Get email preferences for a user. Returns defaults if no row exists.
 */
export declare function getPreferences(userId: string): Promise<EmailPreferences>;
/**
 * Update email preferences for a user. Creates the row if it doesn't exist.
 */
export declare function updatePreferences(userId: string, prefs: Partial<Omit<EmailPreferences, 'user_id' | 'updated_at'>>): Promise<EmailPreferences>;
/**
 * One-click unsubscribe — sets unsubscribed_all = true.
 */
export declare function unsubscribeAll(userId: string): Promise<void>;
/**
 * Check if a specific email category can be sent to a user.
 * Transactional emails always send (except if the category itself is opted out).
 */
export declare function canSendCategory(userId: string, category: TemplateCategory): Promise<boolean>;
/**
 * Generate a signed, non-expiring JWT token for unsubscribe links.
 */
export declare function generateUnsubscribeToken(userId: string): string;
/**
 * Verify an unsubscribe token.
 */
export declare function verifyUnsubscribeToken(token: string): {
    valid: boolean;
    userId?: string;
};
//# sourceMappingURL=email-preference.service.d.ts.map