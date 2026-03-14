import { test as setup, expect } from '@playwright/test';
import path from 'path';

const USER_FILE = path.join(__dirname, '.auth/user.json');
const ADMIN_FILE = path.join(__dirname, '.auth/admin.json');

setup('authenticate as user', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
  }

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });

  await page.context().storageState({ path: USER_FILE });
});

setup('authenticate as admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set in .env.test');
  }

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });

  await page.context().storageState({ path: ADMIN_FILE });
});
