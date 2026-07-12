import { test, expect } from '@playwright/test';

test.describe('Practice Set Flow', () => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  test('should navigate from practice index to a set, show progress, and handle completion', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const targetUrl = new URL(basePath + '/practice', startUrl).href;

    await page.goto(targetUrl);
    await expect(page.locator('h1')).toHaveText('짧게, 제대로 연습');

    const setLink = page.locator(`a[href$="/practice/set/set-reading-library"]`).first();
    await expect(setLink).toBeVisible();
    await setLink.click();

    await expect(page.locator('h1')).toContainText('공유 도서관');

    // Select wrong answer for first question (option A, which is incorrect)
    const firstOption = page.locator('.options').first().locator('button[role="radio"]').nth(0);
    await firstOption.click();
    await expect(firstOption).toHaveAttribute('aria-checked', 'true');

    // Click check answer button
    const checkAnswerBtn = page.locator('button:has-text("정답 확인")').first();
    await checkAnswerBtn.click();
    await expect(page.locator('.feedback').first()).toBeVisible();

    // Check SetSummary displays 1/6 and the wrong item link
    await expect(page.locator('text=1 / 6 완료')).toBeVisible();
    
    // The anchor link for r-lib-01 should be visible since it was wrong
    const wrongLink = page.locator('a[href="#r-lib-01"]');
    await expect(wrongLink).toBeVisible();

    // Go back to practice index
    await page.goto(targetUrl);
    
    // Verify "진행 중 · 1/6" badge appears on the card
    const badge = page.locator('a[href$="/practice/set/set-reading-library"]').locator('.badge.warning');
    await expect(badge).toHaveText('진행 중 · 1/6');

    // Inject full completion into localStorage
    await page.evaluate(() => {
      const state = {
        schemaVersion: 1,
        attempts: {
          'r-lib-01': { itemId: 'r-lib-01', kind: 'reading', flagged: false, selectedAnswer: 'A', correct: false, attemptCount: 1, lastAttemptedAt: Date.now() },
          'r-lib-02': { itemId: 'r-lib-02', kind: 'reading', flagged: false, selectedAnswer: 'B', correct: true, attemptCount: 1, lastAttemptedAt: Date.now() },
          'r-lib-03': { itemId: 'r-lib-03', kind: 'reading', flagged: false, selectedAnswer: 'C', correct: true, attemptCount: 1, lastAttemptedAt: Date.now() },
          'r-lib-04': { itemId: 'r-lib-04', kind: 'reading', flagged: false, selectedAnswer: 'D', correct: true, attemptCount: 1, lastAttemptedAt: Date.now() },
          'r-lib-05': { itemId: 'r-lib-05', kind: 'reading', flagged: false, selectedAnswer: 'E', correct: true, attemptCount: 1, lastAttemptedAt: Date.now() },
          'r-lib-06': { itemId: 'r-lib-06', kind: 'reading', flagged: false, selectedAnswer: 'F', correct: true, attemptCount: 1, lastAttemptedAt: Date.now() }
        }
      };
      window.localStorage.setItem('dele-b2:v1', JSON.stringify(state));
    });

    // Go back to the set page
    await page.goto(new URL(basePath + '/practice/set/set-reading-library', startUrl).href);
    
    // Check SetSummary shows done
    await expect(page.locator('text=6 / 6 완료')).toBeVisible();
    await expect(page.locator('text=(정답 5/6)')).toBeVisible();

    // Should have "다음 세트" link
    await expect(page.locator('a:has-text("다음 세트")')).toBeVisible();
  });
});
