import { test, expect } from '../fixtures/auth';
import { assertNoHorizontalOverflow, assertNoClippedContent, assertMinTapTargets } from '../helpers/checks';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/sites',
  '/analytics',
  '/schedules',
  '/compare',
  '/referrals',
  '/settings',
  '/settings/profile',
  '/settings/api-keys',
  '/settings/notifications',
  '/settings/organization',
  '/settings/members',
  '/settings/billing',
  '/settings/domain-verification',
  '/settings/danger-zone',
];

for (const route of PROTECTED_ROUTES) {
  test(`protected route ${route} — no mobile overflow`, async ({ userPage }) => {
    await userPage.goto(route, { waitUntil: 'networkidle' });

    // Should have hamburger menu visible on mobile
    const hamburger = userPage.locator('button[aria-label="Open menu"]');
    await expect(hamburger).toBeVisible();

    await assertNoHorizontalOverflow(userPage);
    await assertNoClippedContent(userPage);
    await assertMinTapTargets(userPage);
  });
}

test('protected — hamburger opens and closes sidebar', async ({ userPage }) => {
  await userPage.goto('/dashboard', { waitUntil: 'networkidle' });

  const hamburger = userPage.locator('button[aria-label="Open menu"]');
  await hamburger.click();

  const drawer = userPage.locator('aside[role="dialog"]');
  await expect(drawer).toBeVisible();

  const closeBtn = userPage.locator('button[aria-label="Close menu"]');
  await closeBtn.click();
  await expect(drawer).not.toBeVisible();
});

// Dynamic routes — navigate from list page
test('protected — site detail page no overflow', async ({ userPage }) => {
  await userPage.goto('/sites', { waitUntil: 'networkidle' });
  const firstSite = userPage.locator('a[href^="/sites/"]').first();
  if (await firstSite.isVisible()) {
    await firstSite.click();
    await userPage.waitForLoadState('networkidle');
    await assertNoHorizontalOverflow(userPage);
  }
});

test('protected — audit detail page no overflow', async ({ userPage }) => {
  await userPage.goto('/sites', { waitUntil: 'networkidle' });
  const firstAudit = userPage.locator('a[href^="/audits/"]').first();
  if (await firstAudit.isVisible()) {
    await firstAudit.click();
    await userPage.waitForLoadState('networkidle');
    await assertNoHorizontalOverflow(userPage);
  }
});

test('protected — analytics site page no overflow', async ({ userPage }) => {
  await userPage.goto('/analytics', { waitUntil: 'networkidle' });
  const firstCard = userPage.locator('[class*="cursor-pointer"]').first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await userPage.waitForLoadState('networkidle');
    await assertNoHorizontalOverflow(userPage);
  }
});
