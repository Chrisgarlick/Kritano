import { test, expect } from '@playwright/test';
import { assertNoHorizontalOverflow, assertNoClippedContent, assertMinTapTargets } from '../helpers/checks';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/pricing',
  '/services',
  '/services/seo',
  '/services/accessibility',
  '/services/security',
  '/services/performance',
  '/blog',
  '/contact',
  '/privacy',
  '/terms',
];

for (const route of PUBLIC_ROUTES) {
  test(`public route ${route} — no mobile overflow`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await assertNoHorizontalOverflow(page);
    await assertNoClippedContent(page);
    await assertMinTapTargets(page);
  });
}
