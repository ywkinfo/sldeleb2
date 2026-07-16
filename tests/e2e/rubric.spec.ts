import { test, expect } from '@playwright/test';

test.describe('Multidimensional Rubrics & Review Board', () => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  test('Select 4 dimensions -> Save -> Reload -> Review Board', async ({ page }) => {
    await page.goto(`${basePath}/practice`);
    
    // Click on a writing task (e.g. Tarea 1)
    const writingLink = page.locator('#writing a').first();
    await writingLink.click();

    // Verify we are on a practice item page with SelfAssessment
    await expect(page.locator('h3:has-text("자가점검")')).toBeVisible();
    await expect(page.locator('.rubric-scale-legend')).toHaveCount(1);
    await expect(page.getByRole('button', { name: '적합성 · 2점 · 대체로 부합' })).toBeVisible();

    // Check that the save button is disabled initially
    const saveButton = page.locator('button:has-text("평가 저장")');
    await expect(saveButton).toBeDisabled();

    // Select dimensions
    const dimensions = ["적합성", "일관성", "정확성", "표현의 다양성"];
    for (const dim of dimensions) {
      const fieldset = page.locator(`fieldset:has(legend:has-text("${dim}"))`);
      const button2 = fieldset.locator('button:has-text("2")');
      await button2.click();
    }

    // Now save should be enabled
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // It should show average 2/3
    await expect(page.locator('text=평균 2/3')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('text=평균 2/3')).toBeVisible();
    for (const dim of dimensions) {
      const fieldset = page.locator(`fieldset:has(legend:has-text("${dim}"))`);
      const button2 = fieldset.locator('button[aria-pressed="true"]');
      await expect(button2).toContainText('2');
    }

    // Change one dimension to 1 (which triggers review queue)
    const accuracyFieldset = page.locator(`fieldset:has(legend:has-text("정확성"))`);
    await accuracyFieldset.locator('button:has-text("1")').click();
    await saveButton.click();
    await expect(page.locator('text=평균 2/3')).toBeVisible(); // 2+2+1+2 = 7 / 4 = 1.8 -> holistic 2

    // Go to review board
    await page.goto(`${basePath}/review`);
    
    // Check if the item is in the review queue with the weak dimension reason
    const reviewRow = page.locator('.review-row').filter({ hasText: '취약: 정확성' }).first();
    await expect(reviewRow).toBeVisible();

    // Verify localStorage format (schema v1)
    const snapshotStr = await page.evaluate(() => window.localStorage.getItem('dele-b2:v1'));
    expect(snapshotStr).toBeTruthy();
    const snapshot = JSON.parse(snapshotStr!);
    expect(snapshot.schemaVersion).toBe(1);
    
    const attempts = Object.values(snapshot.attempts);
    interface AnyAttempt { kind?: string; rubricScores?: unknown }
    const writingAttempt = attempts.find((a: unknown) => (a as AnyAttempt).kind === 'open') as AnyAttempt;
    expect(writingAttempt).toBeTruthy();
    expect(writingAttempt.rubricScores).toEqual({
      adequacy: 2,
      coherence: 2,
      accuracy: 1,
      range: 2
    });
  });
});
