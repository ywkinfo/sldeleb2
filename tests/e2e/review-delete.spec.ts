import { test, expect } from '@playwright/test';
import { REVIEW_URL, seedReview } from './review-helpers';

test('deletes a queued item after confirming', async ({ page }) => {
  await seedReview(page);
  await page.goto(REVIEW_URL);

  const queue = page.locator('.card.flat').filter({ has: page.locator('#review-filter-skill') });
  await expect(queue.locator('.result-count')).toHaveText('문항 3개');

  page.on('dialog', (dialog) => dialog.accept());
  await queue.locator('.review-row').filter({ hasText: '쓰기' }).getByRole('button', { name: '기록 삭제' }).click();

  await expect(queue.locator('.result-count')).toHaveText('문항 2개');
  await expect(queue.locator('.review-row').filter({ hasText: '쓰기' })).toHaveCount(0);
});
