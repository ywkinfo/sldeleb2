import { test, expect } from '@playwright/test';
import { basePath, EXAM_KEY, EXAM_URL, readExamSessions, startExam, startReadingExam } from './exam-helpers';

test('exam list shows the reading card with 36 items / 70 min and no audio note', async ({ page }) => {
  await page.goto(`${basePath}/exam`);
  const card = page.locator('article.card').filter({ hasText: '읽기 모의고사' });
  await expect(card).toBeVisible();
  await expect(card.locator('.eyebrow')).toHaveText('Comprensión de lectura');
  await expect(card).toContainText('36문항');
  await expect(card).toContainText('70분');
  await expect(card).not.toContainText('음원');
});

test('reading session renders Tarea 1-4, passages and 36 questions without any audio player', async ({ page }) => {
  await startReadingExam(page);

  const tareas = (await page.locator('article.card .eyebrow').allTextContents()).filter((l) => l.includes('Tarea'));
  expect(tareas).toEqual([
    'Lectura · Tarea 1',
    'Lectura · Tarea 2',
    'Lectura · Tarea 3',
    'Lectura · Tarea 4',
  ]);

  // 섹션마다 지문 1개 → 4개.
  await expect(page.locator('.passage[lang="es"]')).toHaveCount(4);
  // 오디오 플레이어는 없다.
  await expect(page.locator('.exam-player')).toHaveCount(0);

  const questions = page.locator('.question h3');
  await expect(questions).toHaveCount(36);
  await expect(questions.first()).toContainText(/^1\./);
  await expect(questions.last()).toContainText(/^36\./);

  // 제출 전에는 채점 흔적이 없다.
  await expect(page.locator('.feedback')).toHaveCount(0);
  await expect(page.locator('.option-state')).toHaveCount(0);
});

test('answers and a flag survive a reload', async ({ page }) => {
  await startReadingExam(page);
  await page.locator('.question').nth(0).locator('.option').first().click();
  await page.locator('.question').nth(2).getByRole('button', { name: /검토 표시/ }).click();

  await page.reload();
  await expect(page.locator('.question').nth(0).locator('.option').first()).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.question').nth(2).getByRole('button', { name: '★ 검토 표시 해제' })).toBeVisible();
});

test('submitting grades all 36 with Tarea denominators 6/10/6/14', async ({ page }) => {
  await startReadingExam(page);
  // 몇 문항만 응답하고 제출(미응답은 오답으로 집계, 분모는 그대로).
  await page.locator('.question').nth(0).locator('.option').first().click();
  await page.locator('.question').nth(10).locator('.option').first().click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '답안 제출' }).first().click();

  await expect(page.locator('#exam-result h2')).toContainText(/정답 \d+ \/ 36/);
  const tiles = page.locator('.exam-bytask .stat strong');
  await expect(tiles).toHaveCount(4);
  await expect(tiles.nth(0)).toContainText('/6');
  await expect(tiles.nth(1)).toContainText('/10');
  await expect(tiles.nth(2)).toContainText('/6');
  await expect(tiles.nth(3)).toContainText('/14');
});

test('an ID-only (legacy) reading session still renders passages and questions from live content', async ({ page }) => {
  await startReadingExam(page);
  // 동결 계약을 벗겨 옛(ID-only) 세션 형태로 만든 뒤 복원.
  await page.evaluate((key) => {
    const snap = JSON.parse(window.localStorage.getItem(key) as string);
    snap.sessions = snap.sessions.map((s: Record<string, unknown>) => ({
      ...s,
      sections: (s.sections as Array<Record<string, unknown>>).map((sec) => ({
        task: sec.task,
        setId: sec.setId,
        itemIds: sec.itemIds,
        scriptIds: sec.scriptIds,
      })),
    }));
    window.localStorage.setItem(key, JSON.stringify(snap));
  }, EXAM_KEY);

  await page.goto(EXAM_URL.replace('exam-listening-b2', 'exam-reading-b2'));
  await expect(page.locator('.passage[lang="es"]')).toHaveCount(4);
  await expect(page.locator('.question h3')).toHaveCount(36);
});

test('reading and listening in-progress sessions resume independently by blueprint', async ({ page }) => {
  await startReadingExam(page);
  await page.locator('.question').nth(0).locator('.option').first().click();

  await startExam(page); // 듣기 세션 시작(별도 blueprint)

  // 읽기 URL로 돌아오면 읽기 세션이 그대로 이어진다.
  await page.goto(EXAM_URL.replace('exam-listening-b2', 'exam-reading-b2'));
  await expect(page.locator('.passage[lang="es"]')).toHaveCount(4);
  await expect(page.locator('.question').nth(0).locator('.option').first()).toHaveAttribute('aria-checked', 'true');

  // 두 세션이 각각 in-progress로 공존한다.
  const sessions = await readExamSessions(page);
  const inProgress = sessions.filter((s) => s.status === 'in-progress');
  expect(inProgress.map((s) => s.blueprintId).sort()).toEqual(['exam-listening-b2', 'exam-reading-b2']);
});

test('no horizontal overflow on a 375px dark viewport', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 800 });
  await startReadingExam(page);
  await expect(page.locator('.passage[lang="es"]').first()).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
