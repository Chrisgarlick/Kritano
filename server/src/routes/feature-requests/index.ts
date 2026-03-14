/**
 * Feature Requests Routes (User-facing)
 *
 * Endpoints for users to create and view their feature requests.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { featureRequestService } from '../../services/feature-request.service.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================
// Validation Schemas
// =============================================

const createRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Please provide more detail (20+ characters)').max(5000),
  impact: z.enum(['nice_to_have', 'would_be_helpful', 'important', 'critical_for_workflow']),
  category: z.enum(['accessibility', 'reporting', 'ui_ux', 'integrations', 'performance', 'other']),
  pageUrl: z.string().url().optional().nullable(),
  browserInfo: z.object({
    name: z.string(),
    version: z.string(),
    os: z.string(),
  }).optional().nullable(),
  screenSize: z.string().optional().nullable(),
});

const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});

// =============================================
// Routes
// =============================================

/**
 * POST /api/feature-requests
 * Create a new feature request
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createRequestSchema.parse(req.body);

    const request = await featureRequestService.create({
      userId: req.user!.id,
      title: data.title,
      description: data.description,
      impact: data.impact,
      category: data.category,
      pageUrl: data.pageUrl || undefined,
      userAgent: req.headers['user-agent'],
      screenSize: data.screenSize || undefined,
      browserInfo: data.browserInfo || undefined,
    });

    res.status(201).json({ request });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Failed to create feature request:', error);
    res.status(500).json({ error: 'Failed to create feature request' });
  }
});

/**
 * GET /api/feature-requests/mine
 * List the current user's feature requests
 */
router.get('/mine', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const status = req.query.status as string | undefined;

    const result = await featureRequestService.listByUser(req.user!.id, {
      page,
      limit,
      status,
    });

    res.json(result);
  } catch (error) {
    console.error('Failed to list feature requests:', error);
    res.status(500).json({ error: 'Failed to list feature requests' });
  }
});

/**
 * GET /api/feature-requests/:id
 * Get a single feature request (user can only view their own)
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await featureRequestService.getById(req.params.id, req.user!.id);

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    res.json({ request });
  } catch (error) {
    console.error('Failed to get feature request:', error);
    res.status(500).json({ error: 'Failed to get feature request' });
  }
});

/**
 * GET /api/feature-requests/:id/comments
 * Get comments for a feature request (user can only view their own request's comments)
 */
router.get('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    // First verify user owns this request
    const request = await featureRequestService.getById(req.params.id, req.user!.id);

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const requestWithComments = await featureRequestService.getWithComments(req.params.id);
    res.json({ comments: requestWithComments?.comments || [] });
  } catch (error) {
    console.error('Failed to get comments:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

/**
 * POST /api/feature-requests/:id/comments
 * Add a comment to a feature request (user can only comment on their own)
 */
router.post('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = addCommentSchema.parse(req.body);

    const comment = await featureRequestService.addComment({
      requestId: req.params.id,
      userId: req.user!.id,
      content,
      isAdmin: false,
    });

    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
