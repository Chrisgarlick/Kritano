"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSettingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const admin_middleware_js_1 = require("../../middleware/admin.middleware.js");
const system_settings_service_js_1 = require("../../services/system-settings.service.js");
const router = (0, express_1.Router)();
exports.adminSettingsRouter = router;
/**
 * GET /api/admin/settings
 * Get all system settings
 */
router.get('/', async (req, res) => {
    try {
        const settings = await (0, system_settings_service_js_1.getAllSettings)();
        res.json({ settings });
    }
    catch (error) {
        console.error('Admin get settings error:', error);
        res.status(500).json({ error: 'Failed to load settings', code: 'GET_SETTINGS_ERROR' });
    }
});
const updateSettingSchema = zod_1.z.object({
    key: zod_1.z.string().min(1).max(100),
    value: zod_1.z.unknown(),
});
/**
 * PATCH /api/admin/settings
 * Update a system setting
 */
router.patch('/', async (req, res) => {
    try {
        const { key, value } = updateSettingSchema.parse(req.body);
        await (0, system_settings_service_js_1.setSetting)(key, value, req.admin.id);
        await (0, admin_middleware_js_1.logAdminActivity)(req.admin.id, 'update_setting', 'system_setting', null, { key, value }, req);
        const settings = await (0, system_settings_service_js_1.getAllSettings)();
        res.json({ settings });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Admin update setting error:', error);
        res.status(500).json({ error: 'Failed to update setting', code: 'UPDATE_SETTING_ERROR' });
    }
});
//# sourceMappingURL=settings.js.map