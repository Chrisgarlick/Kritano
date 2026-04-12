"use strict";
/**
 * Local file-based settings for the cold prospect CLI.
 * Reads/writes from server/prospect-settings.json so the pipeline
 * can run without a database connection.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalSettings = getLocalSettings;
exports.updateLocalSetting = updateLocalSetting;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Settings file at server/prospect-settings.json (relative to server/)
const SETTINGS_PATH = path_1.default.resolve(process.cwd(), 'prospect-settings.json');
const DEFAULTS = {
    target_tlds: ['com', 'co.uk', 'org.uk', 'uk', 'io', 'co', 'net'],
    excluded_keywords: [],
    min_quality_score: 50,
    daily_check_limit: 5000,
    daily_email_limit: 20,
    auto_outreach_enabled: false,
    last_feed_date: null,
};
function readRaw() {
    if (!fs_1.default.existsSync(SETTINGS_PATH))
        return { ...DEFAULTS };
    try {
        const data = JSON.parse(fs_1.default.readFileSync(SETTINGS_PATH, 'utf-8'));
        return { ...DEFAULTS, ...data };
    }
    catch {
        return { ...DEFAULTS };
    }
}
function writeRaw(settings) {
    fs_1.default.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
/**
 * Get all settings in the same shape the CLI expects.
 */
function getLocalSettings() {
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
function updateLocalSetting(key, value) {
    const settings = readRaw();
    settings[key] = value;
    writeRaw(settings);
}
//# sourceMappingURL=prospect-settings.js.map