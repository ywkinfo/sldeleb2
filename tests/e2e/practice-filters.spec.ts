import { expect, test } from "@playwright/test";

test.describe("Practice catalog filters", () => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  test("syncs filters to URL history and separates guided from exam prep", async ({ page }) => {
    await page.goto(`${basePath}/practice`);

    await page.getByRole("button", { name: "읽기 영역 보기" }).click();
    await expect(page).toHaveURL(/\/practice\?skill=reading$/);

    await page.locator("#practice-filter-mode").selectOption("exam-prep");
    await expect(page).toHaveURL(/skill=reading&mode=exam-prep/);
    await expect(page.getByRole("heading", { name: "실전 대비" })).toBeVisible();
    await expect(page.locator('.practice-set-card[data-mode="exam-prep"]')).toHaveCount(3);

    await page.goBack();
    await expect(page.locator("#practice-filter-mode")).toHaveValue("all");
    await expect(page).toHaveURL(/\/practice\?skill=reading$/);

    await page.getByRole("button", { name: "듣기 영역 보기" }).click();
    await page.locator("#practice-filter-task").selectOption("tarea2");
    await expect(page.locator('a[href$="/practice/set/set-listening-t2"]')).toBeVisible();
    await expect(page.locator('a[href$="/practice/set/set-reading-cinema"]')).toHaveCount(0);
  });

  test("defaults mobile visitors to one sticky skill tab", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${basePath}/practice`);

    await expect(page).toHaveURL(/\/practice\?skill=reading$/);
    await expect(page.locator('.practice-skill-section')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "읽기 영역 보기" })).toHaveAttribute("aria-current", "page");
    const nav = page.locator('.practice-catalog-nav');
    await expect(nav).toHaveCSS("position", "sticky");

    await page.locator('.practice-set-card').nth(5).scrollIntoViewIfNeeded();
    const stickyGeometry = await page.evaluate(() => ({
      headerBottom: document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom ?? -1,
      navTop: document.querySelector<HTMLElement>('.practice-catalog-nav')?.getBoundingClientRect().top ?? -2,
    }));
    expect(stickyGeometry.navTop).toBeCloseTo(stickyGeometry.headerBottom, 0);
  });
});
