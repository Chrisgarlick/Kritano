import { type Page, expect } from '@playwright/test';

/**
 * Assert no horizontal overflow on the page.
 */
export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow, 'Page has horizontal overflow').toBe(false);
}

/**
 * Assert no elements are clipped beyond the viewport width.
 */
export async function assertNoClippedContent(page: Page) {
  const viewportWidth = page.viewportSize()?.width ?? 390;
  const clipped = await page.evaluate((vw) => {
    const els = document.querySelectorAll('*');
    const offenders: string[] = [];
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.right > vw + 2) {
        offenders.push(`${el.tagName}.${el.className} (right=${Math.round(rect.right)})`);
      }
      if (offenders.length >= 5) break;
    }
    return offenders;
  }, viewportWidth);

  expect(clipped, `Elements clipped beyond viewport: ${clipped.join(', ')}`).toHaveLength(0);
}

/**
 * Warn (non-blocking) about interactive elements smaller than the minimum tap target.
 */
export async function assertMinTapTargets(page: Page, minSize = 44) {
  const smallTargets = await page.evaluate((min) => {
    const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
    const small: string[] = [];
    for (const el of interactive) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < min || rect.height < min)) {
        small.push(`${el.tagName}[${el.textContent?.trim().slice(0, 20)}] ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
      if (small.length >= 10) break;
    }
    return small;
  }, minSize);

  if (smallTargets.length > 0) {
    console.warn(`[Tap target warning] ${smallTargets.length} elements < ${minSize}px:`, smallTargets);
  }
}
