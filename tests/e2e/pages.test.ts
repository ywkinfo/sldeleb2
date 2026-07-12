import { test, expect } from '@playwright/test';

test.describe('GitHub Pages Deployment', () => {
  test('should load the homepage and check for correct base path links', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    // For local test against npx serve: baseURL is http://localhost:3000
    // so it visits http://localhost:3000/sldeleb2/ (if mapped properly)
    // Actually, local playwright config uses http://localhost:3000.
    // When served by serve:pages script, the URL is http://localhost:3000/sldeleb2/
    
    // We should explicitly go to /sldeleb2/ if it's local test. Wait, CI uses github pages base URL.
    const isLocal = baseURL?.includes('localhost');
    const path = isLocal ? '/sldeleb2/' : '/';
    const targetUrl = new URL(path, startUrl).href;

    await page.goto(targetUrl);
    
    // Homepage should load successfully
    await expect(page).toHaveTitle(/DELE B2/);

    // Check if a link exists and points to the correct base path
    const practiceLink = page.locator('a[href$="/practice"]').first();
    const href = await practiceLink.getAttribute('href');
    
    expect(href).toMatch(/\/sldeleb2\/practice$/);
  });
});
