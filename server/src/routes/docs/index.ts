import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /api/docs
 * Redirect to the SPA docs pages
 */
router.get('/', (_req: Request, res: Response): void => {
  res.redirect(301, '/docs');
});

export const docsRouter = router;
