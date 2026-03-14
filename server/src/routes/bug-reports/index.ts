/**
 * Bug Reports Routes (User-facing)
 *
 * Endpoints for users to create and view their bug reports.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { bugReportService } from '../../services/bug-report.service.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================
// Validation Schemas
// =============================================

const createReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Please provide more detail (20+ characters)').max(5000),
  severity: z.enum(['critical', 'major', 'minor', 'trivial']),
  category: z.enum(['ui', 'functionality', 'performance', 'data', 'security', 'other']),
  pageUrl: z.string().url().optional().nullable(),
  screenshotUrl: z.string().url().optional().nullable(),
  screenshotKey: z.string().optional().nullable(),
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
 * POST /api/bug-reports
 * Create a new bug report
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createReportSchema.parse(req.body);

    const report = await bugReportService.create({
      userId: req.user!.id,
      title: data.title,
      description: data.description,
      severity: data.severity,
      category: data.category,
      pageUrl: data.pageUrl || undefined,
      userAgent: req.headers['user-agent'],
      screenSize: data.screenSize || undefined,
      browserInfo: data.browserInfo || undefined,
      screenshotUrl: data.screenshotUrl || undefined,
      screenshotKey: data.screenshotKey || undefined,
    });

    res.status(201).json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Failed to create bug report:', error);
    res.status(500).json({ error: 'Failed to create bug report' });
  }
});

/**
 * GET /api/bug-reports/mine
 * List the current user's bug reports
 */
router.get('/mine', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const status = req.query.status as string | undefined;

    const result = await bugReportService.listByUser(req.user!.id, {
      page,
      limit,
      status,
    });

    res.json(result);
  } catch (error) {
    console.error('Failed to list bug reports:', error);
    res.status(500).json({ error: 'Failed to list bug reports' });
  }
});

/**
 * GET /api/bug-reports/:id
 * Get a single bug report (user can only view their own)
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await bugReportService.getById(req.params.id, req.user!.id);

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json({ report });
  } catch (error) {
    console.error('Failed to get bug report:', error);
    res.status(500).json({ error: 'Failed to get bug report' });
  }
});

/**
 * GET /api/bug-reports/:id/comments
 * Get comments for a bug report (user can only view their own report's comments)
 */
router.get('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    // First verify user owns this report
    const report = await bugReportService.getById(req.params.id, req.user!.id);

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const reportWithComments = await bugReportService.getWithComments(req.params.id);
    res.json({ comments: reportWithComments?.comments || [] });
  } catch (error) {
    console.error('Failed to get comments:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

/**
 * POST /api/bug-reports/:id/comments
 * Add a comment to a bug report (user can only comment on their own)
 */
router.post('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = addCommentSchema.parse(req.body);

    const comment = await bugReportService.addComment({
      reportId: req.params.id,
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
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
