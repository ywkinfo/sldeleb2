import { test, expect } from '@playwright/test';
import { dispatchMediaEvent, readExamSessions, startExam, stubMediaPlayback, EXAM_URL } from './exam-helpers';

test('restores answers, flags, deadline, and consumed playback slots after a reload', async ({ page }) => {
  await stubMediaPlayback(page);
  await startExam(page);

  const before = await readExamSessions(page);
  const deadlineBefore = before[0].deadlineAt;

  // 응답 + 검토 표시 + 첫 스크립트 재생 시작(끝까지 듣지 않고 이탈).
  const firstQuestion = page.locator('.question').first();
  await firstQuestion.locator('.option').first().click();
  const secondQuestion = page.locator('.question').nth(1);
  await secondQuestion.getByRole('button', { name: /검토 표시/ }).click();
  await page.locator('.exam-player button', { hasText: '재생' }).first().click();
  await expect(page.locator('.exam-player .badge').first()).toContainText('재생 1/2');

  await page.reload();
  await page.locator('.question').first().waitFor();

  // 답·별표 복원, deadline 불변.
  await expect(page.locator('.question').first().locator('.option[aria-checked="true"] .option-key')).toHaveText('A');
  await expect(page.locator('.question').nth(1).getByRole('button', { name: /검토 표시 해제/ })).toBeVisible();
  const after = await readExamSessions(page);
  expect(after[0].deadlineAt).toBe(deadlineBefore);

  // 재생 중 이탈한 슬롯은 소비된 채 닫힌다(무한 재청취 우회 차단).
  await expect(page.locator('.exam-player .badge').first()).toContainText('재생 1/2');
  const playbacks = after[0].playbacks as Record<string, { used: number; active: boolean }>;
  const used = Object.values(playbacks).find((entry) => entry.used > 0);
  expect(used).toEqual({ used: 1, active: false });

  // 남은 슬롯 하나로는 다시 재생할 수 있다.
  await page.locator('.exam-player button', { hasText: '재생' }).first().click();
  await dispatchMediaEvent(page, 0, 'ended');
  await expect(page.locator('.exam-player .badge').first()).toContainText('재생 2/2');
});

test('resumes the in-progress session instead of starting a new one', async ({ page }) => {
  await startExam(page);
  await page.locator('.question').first().locator('.option').first().click();

  await page.goto(EXAM_URL);
  await page.locator('.question').first().waitFor();
  await expect(page.getByRole('button', { name: '시험 시작' })).toHaveCount(0);
  const sessions = await readExamSessions(page);
  expect(sessions).toHaveLength(1);
});
