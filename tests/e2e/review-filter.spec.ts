import { test, expect } from '@playwright/test';
import { REVIEW_URL, seedReview } from './review-helpers';

test('@mobile-smoke filters the queue by skill and reason, and resets when empty', async ({ page }) => {
  await seedReview(page);
  await page.goto(REVIEW_URL);

  const queue = page.locator('.card.flat').filter({ has: page.locator('#review-filter-skill') });
  await expect(queue.locator('.result-count')).toHaveText('문항 3개');

  // 영역 = 듣기 → 오답 문항 1개.
  await queue.locator('#review-filter-skill').selectOption('listening');
  await expect(queue.locator('.result-count')).toHaveText('문항 1개');
  await expect(queue.locator('.review-row')).toHaveCount(1);
  await expect(queue.locator('.review-row .badge').filter({ hasText: '오답' })).toBeVisible();

  // 영역 초기화 후 사유 = 낮은 자기평가 → 쓰기 문항만.
  await queue.locator('#review-filter-skill').selectOption('all');
  await queue.locator('#review-filter-reason').selectOption('low-assessment');
  await expect(queue.locator('.result-count')).toHaveText('문항 1개');
  await expect(queue.locator('.review-row').filter({ hasText: '쓰기' })).toBeVisible();

  // 결과 0건 → 필터 초기화 버튼으로 복구.
  await queue.locator('#review-filter-reason').selectOption('all');
  await queue.locator('#review-filter-skill').selectOption('speaking');
  await expect(queue.locator('.result-count')).toHaveText('문항 0개');
  await queue.getByRole('button', { name: '필터 초기화' }).click();
  await expect(queue.locator('.result-count')).toHaveText('문항 3개');
});
