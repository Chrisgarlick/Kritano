import { Router } from 'express';
import type { Request, Response } from 'express';
import { setSsrHeaders } from '../services/ssr-shared.service.js';
import { renderCompareLanding, renderCompareDetail } from '../services/compare-ssr.service.js';

const router = Router();
const SSR_CACHE = 'public, max-age=300, stale-while-revalidate=86400';

// GET /compare - Landing page with optional filtering and pagination
router.get('/', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const type = (req.query.type as string) || undefined;
    const html = renderCompareLanding({ page, type });
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('Compare landing SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /compare/:slug - Detail page
router.get('/:slug', (req: Request, res: Response): void => {
  try {
    const html = renderCompareDetail(req.params.slug);
    if (!html) {
      res.status(404).send('Not found');
      return;
    }
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('Compare detail SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

export { router as compareSsrRouter };
