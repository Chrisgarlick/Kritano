/**
 * Email Preference Service
 *
 * Manages user-level email opt-in/opt-out preferences and
 * generates signed unsubscribe tokens for CAN-SPAM/GDPR compliance.
 */

import jwt from 'jsonwebtoken';
import { pool } from '../db/index.js';
import type { EmailPreferences, TemplateCategory, CATEGORY_TO_PREFERENCE } from '../types/email-template.types.js';
import { CATEGORY_TO_PREFERENCE as categoryMap } from '../types/email-template.types.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

/**
 * Get email preferences for a user. Returns defaults if no row exists.
 */
export async function getPreferences(userId: string): Promise<EmailPreferences> {
  const result = await pool.query<EmailPreferences>(
    `SELECT * FROM email_preferences WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Return defaults
  return {
    user_id: userId,
    transactional: true,
    audit_notifications: true,
    product_updates: true,
    educational: true,
    marketing: true,
    unsubscribed_all: false,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Update email preferences for a user. Creates the row if it doesn't exist.
 */
export async function updatePreferences(
  userId: string,
  prefs: Partial<Omit<EmailPreferences, 'user_id' | 'updated_at'>>
): Promise<EmailPreferences> {
  const fields: string[] = [];
  const values: unknown[] = [userId];
  let paramIndex = 2;

  const allowedKeys = [
    'transactional', 'audit_notifications', 'product_updates',
    'educational', 'marketing', 'unsubscribed_all',
  ] as const;

  for (const key of allowedKeys) {
    if (key in prefs) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(prefs[key]);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    return getPreferences(userId);
  }

  const result = await pool.query<EmailPreferences>(
    `INSERT INTO email_preferences (user_id, ${allowedKeys.filter(k => k in prefs).join(', ')}, updated_at)
     VALUES ($1, ${allowedKeys.filter(k => k in prefs).map((_, i) => `$${i + 2}`).join(', ')}, NOW())
     ON CONFLICT (user_id) DO UPDATE SET ${fields.join(', ')}, updated_at = NOW()
     RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * One-click unsubscribe — sets unsubscribed_all = true.
 */
export async function unsubscribeAll(userId: string): Promise<void> {
  await pool.query(
    `INSERT INTO email_preferences (user_id, unsubscribed_all, updated_at)
     VALUES ($1, true, NOW())
     ON CONFLICT (user_id) DO UPDATE SET unsubscribed_all = true, updated_at = NOW()`,
    [userId]
  );
}

/**
 * Check if a specific email category can be sent to a user.
 * Transactional emails always send (except if the category itself is opted out).
 */
export async function canSendCategory(
  userId: string,
  category: TemplateCategory
): Promise<boolean> {
  // Transactional and security emails always send
  if (category === 'transactional' || category === 'security') {
    return true;
  }

  const prefs = await getPreferences(userId);

  // Master kill switch blocks all non-transactional
  if (prefs.unsubscribed_all) {
    return false;
  }

  // Map category to preference column
  const prefKey = categoryMap[category];
  if (!prefKey || prefKey === 'transactional') {
    return true;
  }

  return prefs[prefKey] as boolean;
}

/**
 * Generate a signed, non-expiring JWT token for unsubscribe links.
 */
export function generateUnsubscribeToken(userId: string): string {
  return jwt.sign({ userId, purpose: 'unsubscribe' }, JWT_SECRET);
}

/**
 * Verify an unsubscribe token.
 */
export function verifyUnsubscribeToken(token: string): { valid: boolean; userId?: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; purpose: string };
    if (payload.purpose !== 'unsubscribe') {
      return { valid: false };
    }
    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false };
  }
}
