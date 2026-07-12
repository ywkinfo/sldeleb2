import { test, expect } from '@playwright/test';

test.describe('Writing Draft Autosave', () => {
  test('should autosave draft to localStorage and restore it on reload', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = new URL(basePath + '/practice/set/set-writing-formal', startUrl).href;

    await page.goto(targetUrl);

    // Wait for the textarea to be visible
    const textarea = page.locator('textarea[id$="-draft"]').first();
    await expect(textarea).toBeVisible();

    // Type some text
    const draftText = 'Este es un borrador de prueba para asegurar que funciona correctamente.';
    await textarea.fill(draftText);

    // Wait for debounce (1.5s)
    await page.waitForTimeout(2000);

    const stored = await page.evaluate(() => window.localStorage.getItem('dele-b2:v1'));
    console.log("STORED:", stored);

    // Reload the page
    await page.reload();

    // Verify the text is restored
    const restoredTextarea = page.locator('textarea[id$="-draft"]').first();
    await expect(restoredTextarea).toHaveValue(draftText);
  });
});
