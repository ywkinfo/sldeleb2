import { test, expect } from '@playwright/test';
import { basePath, readExamSessions, startExam, EXAM_URL } from './exam-helpers';

test('the exam list resumes an in-progress session; a retake appends a new session', async ({ page }) => {
  await startExam(page);
  await page.locator('.question').first().locator('.option').first().click();

  // 목록 페이지는 진행 중 세션을 이어하기로 안내한다.
  await page.goto(`${basePath}/exam`);
  await expect(page.locator('.badge', { hasText: '진행 중' })).toBeVisible();
  await page.getByRole('link', { name: '이어하기' }).click();
  await page.locator('.question').first().waitFor();
  await expect(page.locator('.question').first().locator('.option[aria-checked="true"]')).toHaveCount(1);

  // 제출 → terminal. 다시 응시하면 새 세션이 append된다(비파괴 재응시).
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '답안 제출' }).first().click();
  await expect(page.locator('#exam-result')).toBeVisible();
  await page.getByRole('button', { name: '다시 응시하기' }).click();
  await page.locator('.question').first().waitFor();

  const sessions = await readExamSessions(page);
  expect(sessions).toHaveLength(2);
  expect(sessions.map((session) => session.status).sort()).toEqual(['in-progress', 'submitted']);

  // 새 세션에는 이전 답이 없다.
  await expect(page.locator('.option[aria-checked="true"]')).toHaveCount(0);

  // 목록에는 지난 결과가 남는다.
  await page.goto(EXAM_URL.replace('/exam-listening-b2', ''));
  await expect(page.locator('.review-row').first()).toContainText('정답');
});
