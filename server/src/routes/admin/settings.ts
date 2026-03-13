import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { type AdminRequest, logAdminActivity } from '../../middleware/admin.middleware.js';
import { getAllSettings, setSetting } from '../../services/system-settings.service.js';

const router = Router();

/**
 * GET /api/admin/settings
 * Get all system settings
 */
router.get('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const settings = await getAllSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Admin get settings error:', error);
    res.status(500).json({ error: 'Failed to load settings', code: 'GET_SETTINGS_ERROR' });
  }
});

const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});

/**
 * PATCH /api/admin/settings
 * Update a system setting
 */
router.patch('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { key, value } = updateSettingSchema.parse(req.body);

    await setSetting(key, value, req.admin!.id);

    await logAdminActivity(
      req.admin!.id,
      'update_setting',
      'system_setting',
      null,
      { key, value },
      req
    );

    const settings = await getAllSettings();
    res.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Admin update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting', code: 'UPDATE_SETTING_ERROR' });
  }
});

export { router as adminSettingsRouter };
