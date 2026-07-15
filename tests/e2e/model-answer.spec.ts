import { test, expect } from '@playwright/test';

// 쓰기·말하기 과제의 스페인어 모범답안 disclosure 동작을 검증한다.
const cases = [
  { name: 'writing', setId: 'set-writing-formal', itemId: 'w-neighborhood-noise' },
  { name: 'speaking', setId: 'set-speaking-opinion', itemId: 's-public-space' },
];

test.describe('Spanish model answer disclosure', () => {
  for (const { name, setId, itemId } of cases) {
    test(`${name}: 기본 접힘 → 클릭·Enter로 스페인어 답안 표시, 한국어 개요는 독립`, async ({ page, baseURL }) => {
      const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const targetUrl = new URL(basePath + `/practice/set/${setId}`, startUrl).href;
      await page.goto(targetUrl);

      const article = page.locator(`#${itemId}`);
      await expect(article).toBeVisible();

      // 개요 + 모범답안, 두 개의 details가 존재한다.
      const details = article.locator('details');
      await expect(details).toHaveCount(2);

      const outline = details.filter({ hasText: '모범 개요' });
      const answer = details.filter({ hasText: '모범답안' });
      const answerBody = answer.locator('.passage[lang="es"]');
      const outlineBody = outline.locator('.outline-box');

      // 최초에는 접혀 있어 스페인어 본문이 숨겨져 있다.
      await expect(answerBody).toBeHidden();

      // 클릭으로 펼치면 비어 있지 않은 스페인어 본문이 보인다.
      await answer.locator('summary').click();
      await expect(answerBody).toBeVisible();
      await expect(answerBody).not.toHaveText('');

      // 모범답안을 열어도 한국어 개요는 독립적으로 닫힌 상태다.
      await expect(outlineBody).toBeHidden();

      // 다시 닫고, 키보드 Enter로도 펼칠 수 있다.
      await answer.locator('summary').click();
      await expect(answerBody).toBeHidden();
      await answer.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(answerBody).toBeVisible();
    });
  }
});
