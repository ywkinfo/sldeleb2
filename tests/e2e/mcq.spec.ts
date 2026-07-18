import { test, expect } from '@playwright/test';

test.describe('MCQ Component & Materials Smoke', () => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  test('MCQ state transition and keyboard accessibility', async ({ page }) => {
    await page.goto(`${basePath}/practice/set/set-listening-t1`);
    
    // 1. 문항 번호 1.~6. 고유 연번 표시
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`h3:has-text("${i}. ")`).first()).toBeVisible();
    }

    const firstQuestion = page.locator('.question').first();

    // 2. 오답 제출 (임의로 A 선택)
    const optionA = firstQuestion.locator('button[data-key="a"]');
    await optionA.click();
    
    const submitBtn = firstQuestion.locator('button:has-text("정답 확인")');
    await submitBtn.click();
    
    const feedback = firstQuestion.locator('.feedback');
    await expect(feedback).toBeVisible();

    await expect(submitBtn).toBeHidden();
    const retryBtn = firstQuestion.locator('button:has-text("다시 풀기")');
    await expect(retryBtn).toBeVisible();

    await expect(optionA).toBeDisabled();

    // 3. 잠금 중 클릭
    const optionB = firstQuestion.locator('button[data-key="b"]');
    await optionB.click({ force: true });
    
    // Check localStorage
    const snapshotStr = await page.evaluate(() => window.localStorage.getItem('dele-b2:v1'));
    const snapshot1 = JSON.parse(snapshotStr!);
    const attempt1 = Object.values(snapshot1.attempts)[0] as { attemptCount: number };
    expect(attempt1.attemptCount).toBe(1);

    // 4. 새로고침
    await page.reload();
    // Wait for the hydration and the UI to update based on localStorage
    await page.waitForSelector('.question');
    const reloadedQuestion = page.locator('.question').first();
    await expect(reloadedQuestion.locator('button:has-text("정답 확인")')).toBeHidden();
    await expect(reloadedQuestion.locator('button:has-text("다시 풀기")')).toBeVisible();
    
    // 5. 다시 풀기
    await reloadedQuestion.locator('button:has-text("다시 풀기")').click();
    
    // 6. 키보드 동작
    const reloadedOptionA = reloadedQuestion.locator('button[data-key="a"]');
    const reloadedOptionB = reloadedQuestion.locator('button[data-key="b"]');
    
    await reloadedOptionA.focus();
    await page.keyboard.press('ArrowDown');
    await expect(reloadedOptionB).toHaveClass(/selected/);
    
    await page.keyboard.press('Enter');
    // 제출되지 않았어야 하므로 정답 확인 버튼 존재
    await expect(reloadedQuestion.locator('button:has-text("정답 확인")')).toBeVisible();
    
    // 제출 버튼을 클릭하여 제출
    const submitBtn2 = reloadedQuestion.locator('button:has-text("정답 확인")');
    await submitBtn2.click();
    
    await expect(reloadedQuestion.locator('button:has-text("정답 확인")')).toBeHidden();
    const snapshotStr2 = await page.evaluate(() => window.localStorage.getItem('dele-b2:v1'));
    const snapshot2 = JSON.parse(snapshotStr2!);
    const attempt2 = Object.values(snapshot2.attempts)[0] as { attemptCount: number };
    expect(attempt2.attemptCount).toBe(2);
  });

  test('pre-submit star persists in pendingFlags and is absorbed on grading', async ({ page }) => {
    await page.goto(`${basePath}/practice/set/set-listening-t1`);
    const firstQuestion = page.locator('.question').first();
    const itemId = await firstQuestion.getAttribute('id');

    // 1. 채점 전 별표 — hydration이 끝나면 활성화된다.
    const starBtn = firstQuestion.locator('button:has-text("다시 보기")');
    await expect(starBtn).toHaveText('☆ 다시 보기');
    await starBtn.click();
    await expect(starBtn).toHaveText('★ 다시 보기 해제');

    const raw1 = await page.evaluate(() => window.localStorage.getItem('dele-b2:v1'));
    const snapshot1 = JSON.parse(raw1!);
    expect(snapshot1.pendingFlags[itemId!]).toEqual(expect.any(Number));
    expect(snapshot1.attempts).toEqual({});

    // 2. 새로고침해도 답 없이 별표가 유지된다.
    await page.reload();
    await page.waitForSelector('.question');
    const reloadedQuestion = page.locator('.question').first();
    await expect(reloadedQuestion.locator('button:has-text("다시 보기")')).toHaveText('★ 다시 보기 해제');
    await expect(reloadedQuestion.locator('button:has-text("정답 확인")')).toBeVisible();

    // 3. 채점하면 별표가 attempt.flagged로 흡수되고 pending 엔트리는 사라진다.
    await reloadedQuestion.locator('button[data-key="a"]').click();
    await reloadedQuestion.locator('button:has-text("정답 확인")').click();
    await expect(reloadedQuestion.locator('button:has-text("정답 확인")')).toBeHidden();

    const raw2 = await page.evaluate(() => window.localStorage.getItem('dele-b2:v1'));
    const snapshot2 = JSON.parse(raw2!);
    expect(snapshot2.attempts[itemId!].flagged).toBe(true);
    expect(snapshot2.pendingFlags).toBeUndefined();
    await expect(reloadedQuestion.locator('button:has-text("다시 보기")')).toHaveText('★ 다시 보기 해제');
  });

  test('pre-submit star syncs live across tabs', async ({ page, context }) => {
    const url = `${basePath}/practice/set/set-listening-t1`;
    await page.goto(url);
    const secondPage = await context.newPage();
    await secondPage.goto(url);

    const firstStar = page.locator('.question').first().locator('button:has-text("다시 보기")');
    const secondStar = secondPage.locator('.question').first().locator('button:has-text("다시 보기")');
    await expect(firstStar).toHaveText('☆ 다시 보기');
    await expect(secondStar).toHaveText('☆ 다시 보기');

    await firstStar.click();
    await expect(secondStar).toHaveText('★ 다시 보기 해제');

    await secondStar.click();
    await expect(firstStar).toHaveText('☆ 다시 보기');
    await secondPage.close();
  });

  test('Materials Filter smoke test', async ({ page }) => {
    await page.goto(`${basePath}/materials`);
    await expect(page.locator('label:has-text("과제")')).toBeHidden();

    const skillFilter = page.locator('#filter-skill');
    const answerKey = page.locator('.resource-card', { hasText: 'DELE B2 2013 시행 정답' });

    await skillFilter.selectOption('reading');
    await expect(answerKey).toBeVisible();
    await skillFilter.selectOption('listening');
    await expect(answerKey).toBeVisible();
    await skillFilter.selectOption('writing');
    await expect(answerKey).toBeHidden();
  });
});
