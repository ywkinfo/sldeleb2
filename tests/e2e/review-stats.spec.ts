import { test, expect } from '@playwright/test';
import { REVIEW_URL, seedReview } from './review-helpers';

test('shows per-Tarea accuracy with small-sample text', async ({ page }) => {
  await seedReview(page);
  await page.goto(REVIEW_URL);

  const tareaCard = page.locator('.card.flat').filter({ has: page.getByRole('heading', { name: 'Tarea별 정답률' }) });
  await expect(tareaCard).toBeVisible();
  await expect(tareaCard.getByText('각 문항의 가장 최근 결과 기준입니다.')).toBeVisible();

  // 읽기 Tarea 1 (정답 1/1) · 듣기 Tarea 3 (오답 0/1) — 표본 5문항 미만이라 m/n 표기.
  await expect(tareaCard.getByText('Tarea 1')).toBeVisible();
  await expect(tareaCard.getByText('Tarea 3')).toBeVisible();
  await expect(tareaCard.getByText('1/1 정답')).toBeVisible();
  await expect(tareaCard.getByText('0/1 정답')).toBeVisible();
});
