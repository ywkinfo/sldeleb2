import { test, expect } from '@playwright/test';
import { dispatchMediaEvent, startExam, stubMediaPlayback } from './exam-helpers';

test('a rejected play() consumes no slot and allows a retry', async ({ page }) => {
  await stubMediaPlayback(page, { rejectPlay: true });
  await startExam(page);

  const player = page.locator('.exam-player').first();
  await player.getByRole('button', { name: '재생' }).click();

  await expect(player.getByRole('alert')).toContainText('차감되지 않았습니다');
  await expect(player.locator('.badge')).toHaveText('재생 0/2');
  await expect(player.getByRole('button', { name: '재생' })).toBeEnabled();
});

test('a media error mid-playback refunds the reserved slot', async ({ page }) => {
  await stubMediaPlayback(page);
  await startExam(page);

  const player = page.locator('.exam-player').first();
  await player.getByRole('button', { name: '재생' }).click();
  await expect(player.locator('.badge')).toContainText('재생 1/2');

  await dispatchMediaEvent(page, 0, 'error');
  await expect(player.getByRole('alert')).toContainText('차감되지 않았습니다');
  await expect(player.locator('.badge')).toHaveText('재생 0/2');
  await expect(player.getByRole('button', { name: '재생' })).toBeEnabled();
});
