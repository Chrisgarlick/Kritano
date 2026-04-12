"use strict";
/**
 * System Settings Service — Generic key-value settings store
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.getAllSettings = getAllSettings;
exports.isComingSoonEnabled = isComingSoonEnabled;
exports.getSiteMode = getSiteMode;
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
async function getSetting(key) {
    const result = await pool.query('SELECT value FROM system_settings WHERE key = $1', [key]);
    if (result.rows.length === 0)
        return null;
    return result.rows[0].value;
}
async function setSetting(key, value, updatedBy) {
    await pool.query(`INSERT INTO system_settings (key, value, updated_at, updated_by)
     VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3`, [key, JSON.stringify(value), updatedBy || null]);
}
async function getAllSettings() {
    const result = await pool.query('SELECT key, value FROM system_settings');
    const settings = {};
    for (const row of result.rows) {
        settings[row.key] = row.value;
    }
    return settings;
}
async function isComingSoonEnabled() {
    const value = await getSetting('coming_soon_enabled');
    return value === true;
}
async function getSiteMode() {
    const mode = await getSetting('site_mode');
    if (mode === 'waitlist' || mode === 'early_access' || mode === 'live')
        return mode;
    // Fallback: check legacy coming_soon_enabled
    const comingSoon = await isComingSoonEnabled();
    return comingSoon ? 'waitlist' : 'live';
}
//# sourceMappingURL=system-settings.service.js.map