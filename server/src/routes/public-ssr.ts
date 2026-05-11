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
import { renderHomepage, renderAboutPage, renderServicesPage, renderServiceDetailPage, renderPricingPage, renderContactPage, renderFaqPage, renderAuthorPage } from '../services/public-ssr.service.js';

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

// GET /about - About page
router.get('/about', (_req: Request, res: Response): void => {
  try {
    const html = renderAboutPage();
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('About SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /services - Services listing page
router.get('/services', (_req: Request, res: Response): void => {
  try {
    const html = renderServicesPage();
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('Services SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /services/:slug - Service detail page
router.get('/services/:slug', (req: Request, res: Response): void => {
  try {
    const html = renderServiceDetailPage(req.params.slug);
    if (!html) {
      res.status(404).send('Not found');
      return;
    }
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('Service detail SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /pricing - Pricing page
router.get('/pricing', (_req: Request, res: Response): void => {
  try {
    const html = renderPricingPage();
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('Pricing SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /contact - Contact page
router.get('/contact', (_req: Request, res: Response): void => {
  try {
    const html = renderContactPage();
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('Contact SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /faq - FAQ page
router.get('/faq', (_req: Request, res: Response): void => {
  try {
    const html = renderFaqPage();
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('FAQ SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /author/chris-garlick - Author page
router.get('/author/chris-garlick', (_req: Request, res: Response): void => {
  try {
    const html = renderAuthorPage();
    setSsrHeaders(res);
    res.set('Cache-Control', SSR_CACHE);
    res.send(html);
  } catch (error) {
    console.error('Author SSR error:', error);
    res.status(500).send('Internal server error');
  }
});

export { router as publicSsrRouter };
