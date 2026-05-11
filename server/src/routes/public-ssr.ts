/**
 * Public Pages SSR Routes
 *
 * Serves fully rendered HTML for public marketing pages.
 * These routes take priority over the SPA catch-all in nginx,
 * ensuring crawlers and fetch tools see complete content.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { setSsrHeaders } from '../services/ssr-shared.service.js';
import { renderHomepage } from '../services/public-ssr.service.js';

const router = Router();

const SSR_CACHE = 'public, max-age=300, stale-while-revalidate=86400';

// GET / - Homepage
router.get('/', (_req: Request, res: Response): void => {
  try {
    const html = renderHomepage();
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('Homepage SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

export { router as publicSsrRouter };
