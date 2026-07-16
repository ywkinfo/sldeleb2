import { test, expect } from '@playwright/test';

test.describe('GitHub Pages Deployment', () => {
  test('should load the homepage and check for correct base path links', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = new URL(basePath + '/', startUrl).href;

    await page.goto(targetUrl);

    // Homepage should load successfully
    await expect(page).toHaveTitle(/DELE B2/);

    // Check if a link exists and points to the correct base path
    const practiceLink = page.locator('a[href$="/practice"]').first();
    const href = await practiceLink.getAttribute('href');

    expect(href).toMatch(/\/sldeleb2\/practice$/);
  });
});
