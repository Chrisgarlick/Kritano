import { test, expect } from '../fixtures/auth';
import { assertNoHorizontalOverflow, assertNoClippedContent, assertMinTapTargets } from '../helpers/checks';

const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/organizations',
  '/admin/bug-reports',
  '/admin/feature-requests',
  '/admin/schedules',
  '/admin/activity',
  '/admin/crm/leads',
  '/admin/crm/triggers',
  '/admin/email/templates',
  '/admin/email/campaigns',
  '/admin/cold-prospects',
  '/admin/referrals',
  '/admin/marketing/content',
  '/admin/marketing/campaigns',
  '/admin/cms/posts',
  '/admin/cms/media',
  '/admin/cms/advice',
  '/admin/cms/announcements',
  '/admin/cms/stories',
  '/admin/analytics/funnel',
  '/admin/analytics/trends',
  '/admin/analytics/revenue',
  '/admin/email/analytics',
  '/admin/settings',
  '/admin/coming-soon',
];

for (const route of ADMIN_ROUTES) {
  test(`admin route ${route} — no mobile overflow`, async ({ adminPage }) => {
    await adminPage.goto(route, { waitUntil: 'networkidle' });

    // Should have admin hamburger menu visible on mobile
    const hamburger = adminPage.locator('button[aria-label="Open admin menu"]');
    await expect(hamburger).toBeVisible();

    await assertNoHorizontalOverflow(adminPage);
    await assertNoClippedContent(adminPage);
    await assertMinTapTargets(adminPage);
  });
}

test('admin — hamburger opens and closes drawer', async ({ adminPage }) => {
  await adminPage.goto('/admin', { waitUntil: 'networkidle' });

  const hamburger = adminPage.locator('button[aria-label="Open admin menu"]');
  await hamburger.click();

  const drawer = adminPage.locator('aside[role="dialog"]');
  await expect(drawer).toBeVisible();

  const closeBtn = adminPage.locator('button[aria-label="Close admin menu"]');
  await closeBtn.click();
  await expect(drawer).not.toBeVisible();
});

test('admin — drawer closes on navigation', async ({ adminPage }) => {
  await adminPage.goto('/admin', { waitUntil: 'networkidle' });

  const hamburger = adminPage.locator('button[aria-label="Open admin menu"]');
  await hamburger.click();

  const drawer = adminPage.locator('aside[role="dialog"]');
  await expect(drawer).toBeVisible();

  // Click a nav link inside the drawer
  await adminPage.locator('aside[role="dialog"] a[href="/admin/users"]').click();
  await adminPage.waitForURL('/admin/users');

  await expect(drawer).not.toBeVisible();
});
