import { test, expect } from '@playwright/test';
import { dispatchMediaEvent, startExam, stubMediaPlayback } from './exam-helpers';

test('allows two full playbacks, keeps pause/resume on one slot, and blocks a third', async ({ page }) => {
  await stubMediaPlayback(page);
  await startExam(page);

  const player = page.locator('.exam-player').first();
  const badge = player.locator('.badge');

  // 1회차: 재생 → 일시정지 → 재개(같은 슬롯) → 종료.
  await player.getByRole('button', { name: '재생' }).click();
  await expect(badge).toContainText('재생 1/2 · 재생 중');
  await player.getByRole('button', { name: '일시정지' }).click();
  await player.getByRole('button', { name: '재생' }).click();
  await expect(badge).toContainText('재생 1/2');
  await dispatchMediaEvent(page, 0, 'ended');
  await expect(badge).toHaveText('재생 1/2');

  // 2회차 종료 후에는 재생 버튼이 비활성화된다.
  await player.getByRole('button', { name: '재생' }).click();
  await dispatchMediaEvent(page, 0, 'ended');
  await expect(badge).toHaveText('재생 2/2');
  await expect(player.getByRole('button', { name: '재생' })).toBeDisabled();
  await expect(player).toContainText('재생 횟수를 모두 사용했어요.');
});
