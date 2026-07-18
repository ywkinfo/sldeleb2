import { test, expect } from '@playwright/test';
import { REVIEW_FIXTURE, REVIEW_URL, seedReview } from './review-helpers';

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

test('shows a pending-only star row with its own unflag control', async ({ page }) => {
  // 공용 fixture는 그대로 두고 이 테스트에서만 미풀이 별표를 얹는다.
  await seedReview(page, { ...REVIEW_FIXTURE, pendingFlags: { 's-public-space': 4 } });
  await page.goto(REVIEW_URL);

  const queue = page.locator('.card.flat').filter({ has: page.locator('#review-filter-skill') });
  await expect(queue.locator('.result-count')).toHaveText('문항 4개');

  // 사유 = 별표 → 기존 별표(r-lib-01) + 미풀이 별표(s-public-space).
  await queue.locator('#review-filter-reason').selectOption('flagged');
  await expect(queue.locator('.result-count')).toHaveText('문항 2개');

  const pendingRow = queue.locator('.review-row').filter({ hasText: '아직 풀지 않음' });
  await expect(pendingRow).toHaveCount(1);
  await expect(pendingRow.getByRole('button', { name: '별표 해제' })).toBeVisible();
  await expect(pendingRow.getByRole('button', { name: '기록 삭제' })).toHaveCount(0);

  // 별표 해제는 확인창 없이 바로 행을 지우고 저장소도 정리한다.
  await pendingRow.getByRole('button', { name: '별표 해제' }).click();
  await expect(queue.locator('.result-count')).toHaveText('문항 1개');
  const raw = await page.evaluate(() => window.localStorage.getItem('dele-b2:v1'));
  expect(JSON.parse(raw!).pendingFlags).toBeUndefined();
});
