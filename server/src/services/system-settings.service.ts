/**
 * System Settings Service — Generic key-value settings store
 */

import { Pool } from 'pg';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

export async function getSetting(key: string): Promise<unknown> {
  const result = await pool.query(
    'SELECT value FROM system_settings WHERE key = $1',
    [key]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].value;
}

export async function setSetting(key: string, value: unknown, updatedBy?: string): Promise<void> {
  await pool.query(
    `INSERT INTO system_settings (key, value, updated_at, updated_by)
     VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3`,
    [key, JSON.stringify(value), updatedBy || null]
  );
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const result = await pool.query('SELECT key, value FROM system_settings');
  const settings: Record<string, unknown> = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function isComingSoonEnabled(): Promise<boolean> {
  const value = await getSetting('coming_soon_enabled');
  return value === true;
}
