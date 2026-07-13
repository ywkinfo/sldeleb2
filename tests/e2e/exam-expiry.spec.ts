import { test, expect } from '@playwright/test';
import { readExamSessions, readProgressAttempts, startExam } from './exam-helpers';

test('auto-submits when the deadline passes and does not double-apply after reload', async ({ page }) => {
  await page.clock.install();
  await startExam(page);
  await page.locator('.question').first().locator('.option').first().click();

  // 40분 경과 → 만료 자동 제출 (interval도 fake clock으로 구동된다).
  await page.clock.fastForward('40:01');
  await expect(page.locator('#exam-result')).toBeVisible();
  await expect(page.locator('#exam-result .eyebrow').first()).toContainText('시간 만료');

  const sessions = await readExamSessions(page);
  expect(sessions[0].status).toBe('expired');
  const attempts = await readProgressAttempts(page);
  expect(Object.keys(attempts)).toHaveLength(1);
  expect(Object.values(attempts)[0].attemptCount).toBe(1);

  // 새로고침해도 채점·투영이 중복되지 않는다.
  await page.reload();
  await page.getByRole('button', { name: '시험 시작' }).waitFor();
  const attemptsAfter = await readProgressAttempts(page);
  expect(Object.values(attemptsAfter)[0].attemptCount).toBe(1);
  expect((await readExamSessions(page))[0].status).toBe('expired');
});
