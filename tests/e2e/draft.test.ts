import { test, expect } from '@playwright/test';

test.describe('Writing Draft Autosave', () => {
  test('should autosave draft to localStorage and restore it on reload', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = new URL(basePath + '/practice/set/set-writing-formal', startUrl).href;

    await page.goto(targetUrl);

    // Wait for the textarea to be visible
    const textarea = page.locator('textarea[id$="-draft"]').first();
    await expect(textarea).toBeVisible();

    // Type some text
    const draftText = 'Este es un borrador de prueba para asegurar que funciona correctamente.';
    await textarea.fill(draftText);

    // Wait for debounce (1.5s)
    await page.waitForTimeout(2000);

    const stored = await page.evaluate(() => window.localStorage.getItem('dele-b2:v1'));
    console.log("STORED:", stored);

    // Reload the page
    await page.reload();

    // Verify the text is restored
    const restoredTextarea = page.locator('textarea[id$="-draft"]').first();
    await expect(restoredTextarea).toHaveValue(draftText);
  });

  test('should not lose a draft when navigating away before the 1.5s debounce fires', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = new URL(basePath + '/practice/set/set-writing-formal', startUrl).href;

    await page.goto(targetUrl);
    const textarea = page.locator('textarea[id$="-draft"]').first();
    await expect(textarea).toBeVisible();

    const draftText = 'Borrador que debe sobrevivir a una navegación inmediata.';
    await textarea.fill(draftText);

    // 디바운스(1.5s)가 끝나기 전에 즉시 다른 페이지로 이동한다.
    // blur·pagehide flush가 없다면 이 초안은 유실된다.
    await page.getByRole('link', { name: '모의고사' }).first().click();
    await page.waitForLoadState('load');

    // 세트로 돌아오면 초안이 남아 있어야 한다.
    await page.goto(targetUrl);
    const restoredTextarea = page.locator('textarea[id$="-draft"]').first();
    await expect(restoredTextarea).toHaveValue(draftText);
  });

  test('shows 저장 중 → 저장됨 transition and never 임시 저장됨 when storage works', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = new URL(basePath + '/practice/set/set-writing-formal', startUrl).href;

    await page.goto(targetUrl);
    const textarea = page.locator('textarea[id$="-draft"]').first();
    await expect(textarea).toBeVisible();

    await textarea.fill('Un borrador para observar el estado de guardado.');
    const status = page.locator('span.wordcount').first();
    await expect(status).toContainText('저장 중', { timeout: 1500 });
    await expect(status).toContainText('저장됨', { timeout: 4000 });
    await expect(status).not.toContainText('임시 저장됨');
  });

  test('shows 임시 저장됨 (not a false 저장됨) when the progress write cannot persist', async ({ page, baseURL }) => {
    // 진도 키 저장만 실패시켜 메모리 폴백을 강제한다(테마 등 다른 저장은 유지).
    await page.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'dele-b2:v1') throw new DOMException('blocked', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    });

    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = new URL(basePath + '/practice/set/set-writing-formal', startUrl).href;

    await page.goto(targetUrl);
    const textarea = page.locator('textarea[id$="-draft"]').first();
    await expect(textarea).toBeVisible();

    await textarea.fill('Este borrador no puede persistir en localStorage.');
    const status = page.locator('span.wordcount').first();
    await expect(status).toContainText('임시 저장됨', { timeout: 4000 });
  });

  test('persists an emptied draft when leaving immediately after clearing', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = new URL(basePath + '/practice/set/set-writing-formal', startUrl).href;

    await page.goto(targetUrl);
    const textarea = page.locator('textarea[id$="-draft"]').first();
    await expect(textarea).toBeVisible();

    await textarea.fill('Contenido inicial que luego se borra.');
    await page.waitForTimeout(2000); // 저장 확정
    await textarea.fill(''); // 초안 비우기
    // 디바운스 전에 즉시 이동 — flush가 빈 초안을 저장해야 한다.
    await page.getByRole('link', { name: '모의고사' }).first().click();
    await page.waitForLoadState('load');

    await page.goto(targetUrl);
    await expect(page.locator('textarea[id$="-draft"]').first()).toHaveValue('');
  });

  test('flushes on pagehide before the debounce fires', async ({ page, baseURL }) => {
    const startUrl = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = new URL(basePath + '/practice/set/set-writing-formal', startUrl).href;

    await page.goto(targetUrl);
    const textarea = page.locator('textarea[id$="-draft"]').first();
    await expect(textarea).toBeVisible();

    const draftText = 'Guardado por el manejador de pagehide.';
    await textarea.fill(draftText);
    // 디바운스 전에 pagehide만 발생시켜 해당 경로를 독립 검증한다.
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.reload();
    await expect(page.locator('textarea[id$="-draft"]').first()).toHaveValue(draftText);
  });
});
