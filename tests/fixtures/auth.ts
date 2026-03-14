import { test as base, type Page } from '@playwright/test';
import path from 'path';

type AuthFixtures = {
  userPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/user.json'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/admin.json'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
