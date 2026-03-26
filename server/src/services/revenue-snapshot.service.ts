/**
 * Revenue Snapshot Service
 *
 * Takes daily snapshots of MRR/ARR for historical revenue tracking.
 * Uses the same tier pricing as admin-analytics.service.ts.
 */

import { Pool } from 'pg';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// Mirror tier pricing from admin-analytics.service.ts
const TIER_PRICING: Record<string, number> = {
  free: 0,
  starter: parseInt(process.env.TIER_PRICE_STARTER || '19', 10),
  pro: parseInt(process.env.TIER_PRICE_PRO || '49', 10),
  agency: parseInt(process.env.TIER_PRICE_AGENCY || '99', 10),
  enterprise: parseInt(process.env.TIER_PRICE_ENTERPRISE || '199', 10),
};

function getTierPrice(tier: string): number {
  return TIER_PRICING[tier] ?? 0;
}

/**
 * Take a revenue snapshot for today.
 * Uses UPSERT so it's safe to call multiple times on the same day.
 */
export async function takeSnapshot(): Promise<void> {
  // Query current tier counts from active subscriptions
  const tierCountsResult = await pool.query(
    `SELECT tier, COUNT(*) as count
     FROM subscriptions
     WHERE status = 'active'
     GROUP BY tier`
  );

  const tierCounts: Record<string, number> = {};
  let totalMrr = 0;
  let totalSubscribers = 0;

  for (const row of tierCountsResult.rows) {
    const count = parseInt(row.count, 10);
    const tier = row.tier as string;
    tierCounts[tier] = count;

    if (tier !== 'free') {
      totalSubscribers += count;
    }
    totalMrr += count * getTierPrice(tier);
  }

  const arr = totalMrr * 12;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  await pool.query(
    `INSERT INTO revenue_snapshots (snapshot_date, mrr, arr, total_subscribers, tier_counts)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (snapshot_date) DO UPDATE SET
       mrr = EXCLUDED.mrr,
       arr = EXCLUDED.arr,
       total_subscribers = EXCLUDED.total_subscribers,
       tier_counts = EXCLUDED.tier_counts`,
    [today, totalMrr, arr, totalSubscribers, JSON.stringify(tierCounts)]
  );
}

/**
 * Get historical revenue snapshots for the last N days.
 */
export async function getHistory(
  days: number
): Promise<Array<{ date: string; mrr: number; arr: number; subscribers: number }>> {
  const result = await pool.query(
    `SELECT snapshot_date, mrr, arr, total_subscribers
     FROM revenue_snapshots
     WHERE snapshot_date >= CURRENT_DATE - $1::integer
     ORDER BY snapshot_date ASC`,
    [days]
  );

  return result.rows.map((row) => ({
    date: row.snapshot_date.toISOString().split('T')[0],
    mrr: row.mrr,
    arr: row.arr,
    subscribers: row.total_subscribers,
  }));
}
