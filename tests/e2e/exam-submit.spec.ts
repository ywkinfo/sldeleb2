import { test, expect } from '@playwright/test';
import { basePath, readExamSessions, readProgressAttempts, startExam } from './exam-helpers';

test('cancelling the confirm changes nothing; accepting grades once and projects answered items only', async ({ page }) => {
  await startExam(page);

  await page.locator('.question').nth(0).locator('.option').first().click();
  await page.locator('.question').nth(1).locator('.option').nth(1).click();

  // confirm 취소 → 세션 유지, 진도 키 무변화.
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: '답안 제출' }).first().click();
  await expect(page.locator('.question').first()).toBeVisible();
  expect((await readExamSessions(page))[0].status).toBe('in-progress');
  expect(await readProgressAttempts(page)).toEqual({});

  // confirm 수락 → 일괄 채점 + 응답한 문항만 복습 큐로 투영.
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '답안 제출' }).first().click();
  await expect(page.locator('#exam-result')).toBeVisible();
  await expect(page.locator('#exam-result h2')).toContainText(/정답 \d+ \/ 30/);

  const sessions = await readExamSessions(page);
  expect(sessions[0].status).toBe('submitted');
  expect((sessions[0].progressProjection as { status: string }).status).toBe('complete');

  const attempts = await readProgressAttempts(page);
  expect(Object.keys(attempts)).toHaveLength(2);
  for (const attempt of Object.values(attempts)) {
    expect(attempt.attemptCount).toBe(1);
  }

  // 결과 화면에서 복습 큐로 이동할 수 있다.
  await expect(page.getByRole('link', { name: '복습 큐로 가기' })).toHaveAttribute('href', `${basePath}/review`);
});
