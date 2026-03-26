/**
 * Event Tracking Service
 *
 * Minimal fire-and-forget event tracking for product analytics.
 * Inserts into analytics_events table — never throws on failure.
 */

import { Pool } from 'pg';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

/**
 * Track a product event. Fire-and-forget — never throws.
 */
export async function trackEvent(
  userId: string | null,
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO analytics_events (user_id, event_name, properties) VALUES ($1, $2, $3)`,
      [userId, eventName, JSON.stringify(properties ?? {})]
    );
  } catch (err) {
    // Fire-and-forget: log but never throw
    console.error(`Event tracking failed for "${eventName}":`, err);
  }
}

/**
 * Get the count of a specific event since a given date.
 */
export async function getEventCounts(eventName: string, since: Date): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM analytics_events WHERE event_name = $1 AND created_at >= $2`,
    [eventName, since.toISOString()]
  );
  return parseInt(result.rows[0].count, 10);
}
