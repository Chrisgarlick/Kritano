/**
 * Public Email Routes
 *
 * Unsubscribe (one-click + preference page) and email preference management.
 * These endpoints are NOT behind admin middleware — they use signed tokens or auth.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  getPreferences,
  updatePreferences,
  unsubscribeAll,
  verifyUnsubscribeToken,
} from '../../services/email-preference.service.js';

const router = Router();

/**
 * GET /api/email/unsubscribe?token=...
 * One-click unsubscribe. Sets unsubscribed_all = true.
 */
router.get('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const result = verifyUnsubscribeToken(token);
    if (!result.valid || !result.userId) {
      res.status(400).json({ error: 'Invalid or expired unsubscribe token' });
      return;
    }

    await unsubscribeAll(result.userId);

    res.json({
      success: true,
      message: 'You have been unsubscribed from all marketing emails. You will still receive essential account emails.',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to process unsubscribe' });
  }
});

/**
 * POST /api/email/unsubscribe?token=...
 * RFC 8058 List-Unsubscribe-Post handler (email client one-click).
 */
router.post('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const result = verifyUnsubscribeToken(token);
    if (!result.valid || !result.userId) {
      res.status(400).json({ error: 'Invalid unsubscribe token' });
      return;
    }

    await unsubscribeAll(result.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe POST error:', error);
    res.status(500).json({ error: 'Failed to process unsubscribe' });
  }
});

/**
 * GET /api/email/preferences?token=...
 * Get email preferences using a signed token (from email footer link).
 */
router.get('/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const result = verifyUnsubscribeToken(token);
    if (!result.valid || !result.userId) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    const prefs = await getPreferences(result.userId);
    res.json({ preferences: prefs });
  } catch (error) {
    console.error('Get preferences (token) error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

const updatePreferencesSchema = z.object({
  audit_notifications: z.boolean().optional(),
  product_updates: z.boolean().optional(),
  educational: z.boolean().optional(),
  marketing: z.boolean().optional(),
  unsubscribed_all: z.boolean().optional(),
});

/**
 * POST /api/email/preferences?token=...
 * Update email preferences using a signed token.
 */
router.post('/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const result = verifyUnsubscribeToken(token);
    if (!result.valid || !result.userId) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    const body = updatePreferencesSchema.parse(req.body);
    const prefs = await updatePreferences(result.userId, body);
    res.json({ preferences: prefs });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update preferences (token) error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// =============================================
// Authenticated preference routes
// =============================================

/**
 * GET /api/email/my-preferences
 * Get email preferences for the authenticated user.
 */
router.get('/my-preferences', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const prefs = await getPreferences(req.user!.id);
    res.json({ preferences: prefs });
  } catch (error) {
    console.error('Get my preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

/**
 * PUT /api/email/my-preferences
 * Update email preferences for the authenticated user.
 */
router.put('/my-preferences', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = updatePreferencesSchema.parse(req.body);
    const prefs = await updatePreferences(req.user!.id, body);
    res.json({ preferences: prefs });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update my preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
