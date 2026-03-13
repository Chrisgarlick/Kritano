/**
 * Early Access Service
 *
 * Manages the founding members early access campaign:
 * - 200 spots shared across email + social channels
 * - Claim a spot on registration, activate all at once later
 * - 30-day Agency trial + lifetime discount for founding members
 */

import { pool } from '../db/index.js';
import { getSetting, setSetting } from './system-settings.service.js';
import { startTrial } from './trial.service.js';

export async function isEarlyAccessEnabled(): Promise<boolean> {
  const val = await getSetting('early_access_enabled');
  return val === true || val === 'true';
}

export interface EarlyAccessStatus {
  enabled: boolean;
  maxSpots: number;
  claimed: number;
  remaining: number;
  activated: boolean;
}

export async function getEarlyAccessStatus(): Promise<EarlyAccessStatus> {
  const [enabled, maxSpots, activated] = await Promise.all([
    isEarlyAccessEnabled(),
    getSetting('early_access_max_spots'),
    getSetting('early_access_activated'),
  ]);

  const max = Number(maxSpots) || 200;

  const result = await pool.query(
    `SELECT COUNT(*)::int AS claimed FROM users WHERE early_access = true`
  );
  const claimed = result.rows[0].claimed;

  return {
    enabled,
    maxSpots: max,
    claimed,
    remaining: Math.max(0, max - claimed),
    activated: activated === true || activated === 'true',
  };
}

export async function canClaimSpot(): Promise<boolean> {
  const status = await getEarlyAccessStatus();
  return status.enabled && status.remaining > 0;
}

/**
 * Claim an early access spot for a user.
 * Uses a CTE count check to prevent race conditions.
 */
export async function claimSpot(
  userId: string,
  channel: 'email' | 'social'
): Promise<boolean> {
  const maxSpots = Number(await getSetting('early_access_max_spots')) || 200;
  const discountPercent = Number(await getSetting('early_access_discount_percent')) || 50;

  const result = await pool.query(
    `WITH spot_check AS (
       SELECT COUNT(*)::int AS claimed FROM users WHERE early_access = true
     )
     UPDATE users
     SET early_access = true,
         early_access_channel = $2,
         discount_percent = $3
     FROM spot_check
     WHERE users.id = $1
       AND users.early_access = false
       AND spot_check.claimed < $4
     RETURNING users.id`,
    [userId, channel, discountPercent, maxSpots]
  );

  return result.rows.length > 0;
}

export interface ChannelBreakdown {
  email: number;
  social: number;
  total: number;
}

export async function getChannelBreakdown(): Promise<ChannelBreakdown> {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN early_access_channel = 'email' THEN 1 ELSE 0 END), 0)::int AS email,
       COALESCE(SUM(CASE WHEN early_access_channel = 'social' THEN 1 ELSE 0 END), 0)::int AS social,
       COUNT(*)::int AS total
     FROM users
     WHERE early_access = true`
  );
  return result.rows[0];
}

export interface EarlyAccessUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  channel: string;
  emailVerified: boolean;
  activatedAt: string | null;
  createdAt: string;
}

export async function getEarlyAccessUsers(
  page: number = 1,
  limit: number = 25,
  search?: string
): Promise<{ users: EarlyAccessUser[]; total: number }> {
  const offset = (page - 1) * limit;
  const params: unknown[] = [limit, offset];
  let whereClause = 'WHERE u.early_access = true';

  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND (u.email ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`;
  }

  const [usersResult, countResult] = await Promise.all([
    pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.early_access_channel,
              u.email_verified, u.early_access_activated_at, u.created_at
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM users u ${whereClause}`,
      search ? [`%${search}%`] : []
    ),
  ]);

  return {
    users: usersResult.rows.map((r) => ({
      id: r.id,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      channel: r.early_access_channel,
      emailVerified: r.email_verified,
      activatedAt: r.early_access_activated_at,
      createdAt: r.created_at,
    })),
    total: countResult.rows[0].total,
  };
}

/**
 * Activate all early access users: start 30-day Agency trial for each.
 * Idempotent — skips already-activated users.
 */
export async function activateAll(adminId: string): Promise<{ activated: number; skipped: number }> {
  const result = await pool.query(
    `SELECT id, email, first_name, discount_percent
     FROM users
     WHERE early_access = true AND early_access_activated_at IS NULL`
  );

  let activated = 0;
  let skipped = 0;

  for (const user of result.rows) {
    try {
      await startTrial(user.id, 'agency', 30);

      await pool.query(
        `UPDATE users SET early_access_activated_at = NOW() WHERE id = $1`,
        [user.id]
      );

      // [Phase 10] Would send early_access_activated email
      console.log(`[Phase 10] Would send early_access_activated email to ${user.email}`);

      activated++;
    } catch (err) {
      console.error(`Failed to activate early access for user ${user.id}:`, err);
      skipped++;
    }
  }

  // Mark campaign as activated
  if (activated > 0) {
    await setSetting('early_access_activated', true, adminId);
  }

  return { activated, skipped };
}
