import { test, expect } from '@playwright/test';
import { startExam } from './exam-helpers';

test('renders Tarea 1-5 in blueprint order with numbers 1-30 and no pre-grade feedback', async ({ page }) => {
  await startExam(page);

  // Tarea 섹션이 블루프린트 순서대로 나온다.
  const sectionLabels = await page.locator('article.card .eyebrow').allTextContents();
  const tareas = sectionLabels.filter((label) => label.includes('Tarea'));
  expect(tareas).toEqual([
    'Audición · Tarea 1',
    'Audición · Tarea 2',
    'Audición · Tarea 3',
    'Audición · Tarea 4',
    'Audición · Tarea 5',
  ]);

  // 세트 전체 연번 1~30.
  const questions = page.locator('.question h3');
  await expect(questions).toHaveCount(30);
  await expect(questions.first()).toContainText(/^1\./);
  await expect(questions.last()).toContainText(/^30\./);

  // 제출 전에는 피드백·정답 확인·정오 배지가 없다.
  await expect(page.locator('.feedback')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '정답 확인' })).toHaveCount(0);
  await expect(page.locator('.option-state')).toHaveCount(0);
});
