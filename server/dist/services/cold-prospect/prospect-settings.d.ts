/**
 * Local file-based settings for the cold prospect CLI.
 * Reads/writes from server/prospect-settings.json so the pipeline
 * can run without a database connection.
 */
export interface ProspectSettings {
    target_tlds: string[];
    excluded_keywords: string[];
    min_quality_score: number;
    daily_check_limit: number;
    daily_email_limit: number;
    auto_outreach_enabled: boolean;
    last_feed_date: string | null;
}
/**
 * Get all settings in the same shape the CLI expects.
 */
export declare function getLocalSettings(): {
    targetTlds: string[];
    excludedKeywords: string[];
    minQualityScore: number;
    dailyCheckLimit: number;
    dailyEmailLimit: number;
    autoOutreachEnabled: boolean;
    lastFeedDate: string | null;
};
/**
 * Update a single setting by its raw key (e.g. "daily_check_limit").
 */
export declare function updateLocalSetting(key: string, value: unknown): void;
//# sourceMappingURL=prospect-settings.d.ts.map