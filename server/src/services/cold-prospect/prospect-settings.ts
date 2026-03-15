/**
 * Local file-based settings for the cold prospect CLI.
 * Reads/writes from server/prospect-settings.json so the pipeline
 * can run without a database connection.
 */

import fs from 'fs';
import path from 'path';

// Settings file at server/prospect-settings.json (relative to server/)
const SETTINGS_PATH = path.resolve(process.cwd(), 'prospect-settings.json');

export interface ProspectSettings {
  target_tlds: string[];
  excluded_keywords: string[];
  min_quality_score: number;
  daily_check_limit: number;
  daily_email_limit: number;
  auto_outreach_enabled: boolean;
  last_feed_date: string | null;
}

const DEFAULTS: ProspectSettings = {
  target_tlds: ['com', 'co.uk', 'org.uk', 'uk', 'io', 'co', 'net'],
  excluded_keywords: [],
  min_quality_score: 50,
  daily_check_limit: 5000,
  daily_email_limit: 20,
  auto_outreach_enabled: false,
  last_feed_date: null,
};

function readRaw(): ProspectSettings {
  if (!fs.existsSync(SETTINGS_PATH)) return { ...DEFAULTS };
  try {
    const data = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeRaw(settings: ProspectSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

/**
 * Get all settings in the same shape the CLI expects.
 */
export function getLocalSettings(): {
  targetTlds: string[];
  excludedKeywords: string[];
  minQualityScore: number;
  dailyCheckLimit: number;
  dailyEmailLimit: number;
  autoOutreachEnabled: boolean;
  lastFeedDate: string | null;
} {
  const s = readRaw();
  return {
    targetTlds: s.target_tlds,
    excludedKeywords: s.excluded_keywords,
    minQualityScore: s.min_quality_score,
    dailyCheckLimit: s.daily_check_limit,
    dailyEmailLimit: s.daily_email_limit,
    autoOutreachEnabled: s.auto_outreach_enabled,
    lastFeedDate: s.last_feed_date,
  };
}

/**
 * Update a single setting by its raw key (e.g. "daily_check_limit").
 */
export function updateLocalSetting(key: string, value: unknown): void {
  const settings = readRaw();
  (settings as unknown as Record<string, unknown>)[key] = value;
  writeRaw(settings);
}
