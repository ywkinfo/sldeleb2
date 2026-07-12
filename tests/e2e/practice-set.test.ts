import { test, expect } from '@playwright/test';

test.describe('Practice Set Flow', () => {
  test('should navigate from practice index to a set and answer a question', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const isLocal = baseURL?.includes('localhost');
    const path = isLocal ? '/sldeleb2/practice/' : '/practice/';
    const targetUrl = new URL(path, startUrl).href;

    await page.goto(targetUrl);

    await expect(page.locator('h1')).toHaveText('짧게, 제대로 연습');

    // Find the link to set-reading-library
    const setLink = page.locator(`a[href$="/practice/set/set-reading-library"]`).first();
    await expect(setLink).toBeVisible();

    // Click on the set link
    await setLink.click();

    // Now on the set page
    await expect(page.locator('h1')).toContainText('공유 도서관');

    // Find the first option for the first question
    const firstOption = page.locator('button[role="radio"]').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();

    // Check that it gets selected
    await expect(firstOption).toHaveAttribute('aria-checked', 'true');

    // Click the check answer button
    const checkAnswerBtn = page.locator('button:has-text("정답 확인")').first();
    await expect(checkAnswerBtn).toBeEnabled();
    await checkAnswerBtn.click();

    // Check feedback visibility
    const feedback = page.locator('.feedback').first();
    await expect(feedback).toBeVisible();
  });
});
