import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAllSeoEntries } from '../services/seo.service.js';

const router = Router();

/**
 * GET /api/seo
 * Public endpoint — returns all SEO entries for frontend consumption.
 * Cached by the frontend on app load.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const entries = await getAllSeoEntries();
    // Cache for 5 minutes
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ entries });
  } catch (error) {
    console.error('Public SEO entries error:', error);
    res.status(500).json({ error: 'Failed to load SEO entries' });
  }
});

export { router as seoRouter };
