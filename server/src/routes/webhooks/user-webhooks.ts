import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { z } from 'zod';
import {
  createWebhook,
  listWebhooks,
  deleteWebhook,
  listDeliveries,
} from '../../services/webhook.service.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/webhooks — create a webhook
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      url: z.string().url().max(2048),
      siteId: z.string().uuid().nullable().optional(),
      events: z.array(z.string()).min(1),
    });

    const { url, siteId, events } = schema.parse(req.body);
    const userId = req.user!.id;

    const result = await createWebhook(userId, siteId ?? null, url, events);
    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request. Provide a valid URL and at least one event.' });
      return;
    }
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to create webhook' });
  }
});

// GET /api/webhooks — list webhooks
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const webhooks = await listWebhooks(userId);
    res.json({ webhooks });
  } catch (error) {
    console.error('List webhooks error:', error);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

// DELETE /api/webhooks/:id — delete a webhook
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id;

    if (!z.string().uuid().safeParse(webhookId).success) {
      res.status(400).json({ error: 'Invalid webhook ID' });
      return;
    }

    await deleteWebhook(userId, webhookId);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to delete webhook' });
  }
});

// GET /api/webhooks/:id/deliveries — list recent deliveries
router.get('/:id/deliveries', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id;

    if (!z.string().uuid().safeParse(webhookId).success) {
      res.status(400).json({ error: 'Invalid webhook ID' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const deliveries = await listDeliveries(userId, webhookId, limit);
    res.json({ deliveries });
  } catch (error: any) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to list deliveries' });
  }
});

export { router as userWebhooksRouter };
