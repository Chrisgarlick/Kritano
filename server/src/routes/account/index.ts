import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { gdprService } from '../../services/gdpr.service.js';

const router = Router();

// Rate limiters
const exportRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 3,
  blockDurationMs: 15 * 60 * 1000,
  keyGenerator: (req: Request) => `export:${req.user?.id}`,
});

const deleteRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 3,
  blockDurationMs: 15 * 60 * 1000,
  keyGenerator: (req: Request) => `delete:${req.user?.id}`,
});

// Schemas
const exportSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const deleteSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmText: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'You must type "DELETE MY ACCOUNT" to confirm.' }),
  }),
});

/**
 * POST /api/account/export - Request a data export
 */
router.post(
  '/export',
  authenticate,
  exportRateLimiter,
  validateBody(exportSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;
      const userId = req.user!.id;

      const valid = await gdprService.verifyPassword(userId, password);
      if (!valid) {
        res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
        return;
      }

      const exportId = await gdprService.requestExport(userId);

      // Process export immediately instead of waiting for worker poll
      try {
        await gdprService.processExport(exportId);
        res.json({ message: 'Your data export is ready to download.', exportId, ready: true });
      } catch (exportError) {
        console.error('Export processing error:', exportError);
        res.status(202).json({ message: 'Export started. You will be notified when it is ready.', exportId, ready: false });
      }
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to start export', code: 'EXPORT_FAILED' });
    }
  }
);

/**
 * GET /api/account/export/status - Get latest export status
 */
router.get(
  '/export/status',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const exportInfo = await gdprService.getLatestExport(userId);
      res.json({ export: exportInfo });
    } catch (error) {
      console.error('Export status error:', error);
      res.status(500).json({ error: 'Failed to get export status', code: 'EXPORT_STATUS_FAILED' });
    }
  }
);

/**
 * GET /api/account/export/:id/download - Download an export file
 */
router.get(
  '/export/:id/download',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { filePath, fileName } = await gdprService.getExportDownload(userId, req.params.id);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      const stream = await import('fs');
      stream.createReadStream(filePath).pipe(res);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to download export', code: 'DOWNLOAD_FAILED' });
    }
  }
);

/**
 * POST /api/account/delete - Request account deletion
 */
router.post(
  '/delete',
  authenticate,
  deleteRateLimiter,
  validateBody(deleteSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;
      const userId = req.user!.id;

      const valid = await gdprService.verifyPassword(userId, password);
      if (!valid) {
        res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
        return;
      }

      const { scheduledFor } = await gdprService.requestAccountDeletion(userId);
      res.json({
        message: 'Account deletion scheduled. You can cancel at any time before the deletion date.',
        scheduledFor,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to schedule deletion', code: 'DELETION_FAILED' });
    }
  }
);

/**
 * POST /api/account/cancel-deletion - Cancel a pending deletion
 */
router.post(
  '/cancel-deletion',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      await gdprService.cancelAccountDeletion(userId);
      res.json({ message: 'Account deletion cancelled. Your account is active again.' });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to cancel deletion', code: 'CANCEL_FAILED' });
    }
  }
);

export const accountRouter = router;
