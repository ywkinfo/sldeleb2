import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

test.describe("@mobile-smoke responsive UI foundations", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("tracks the full sticky stack and keeps hash targets visible after resize", async ({ page }) => {
    await page.goto(`${basePath}/practice/set/set-reading-library#r-lib-06`);
    await expect(page.locator("#r-lib-06")).toBeVisible();

    const readGeometry = () => page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const header = document.querySelector<HTMLElement>(".site-header");
      const bar = document.querySelector<HTMLElement>(".sticky-status-bar");
      const target = document.querySelector<HTMLElement>("#r-lib-06");
      return {
        headerVar: Number.parseFloat(rootStyle.getPropertyValue("--header-height")),
        contextVar: Number.parseFloat(rootStyle.getPropertyValue("--context-bar-height")),
        headerHeight: header?.getBoundingClientRect().height ?? 0,
        barBottom: bar?.getBoundingClientRect().bottom ?? 0,
        targetTop: target?.getBoundingClientRect().top ?? -1,
      };
    });

    const waitForStackMeasurement = async () => {
      // ResizeObserver and hydration delivery are asynchronous, especially in
      // WebKit. Verify the settled contract instead of racing its callback.
      await expect.poll(async () => {
        const geometry = await readGeometry();
        return Math.abs(geometry.headerVar - geometry.headerHeight) < 0.5 &&
          geometry.contextVar > 0;
      }).toBe(true);
    };

    const assertVisibleBelowStack = async () => {
      await waitForStackMeasurement();
      const geometry = await readGeometry();
      expect(geometry.headerVar).toBeCloseTo(geometry.headerHeight, 0);
      expect(geometry.contextVar).toBeGreaterThan(0);
      expect(geometry.targetTop).toBeGreaterThanOrEqual(geometry.barBottom - 1);
    };

    await assertVisibleBelowStack();
    await page.setViewportSize({ width: 320, height: 700 });
    await waitForStackMeasurement();
    await page.locator("#r-lib-06").evaluate((node) => node.scrollIntoView());
    await assertVisibleBelowStack();
  });

  test("reveals the active mobile destination and keeps primary controls touchable", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`${basePath}/guide`);
    const active = page.locator('.mobile-nav a[aria-current="page"]');
    await expect(active).toBeVisible();
    const box = await active.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect((await page.locator(".theme-toggle").boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("uses an accessible text color on the dark accent button", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("dele-b2:theme:v1", "dark"));
    await page.goto(`${basePath}/`);

    const contrast = await page.locator(".button").first().evaluate((element) => {
      const parse = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
      const luminance = (rgb: number[]) => {
        const linear = rgb.map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const style = getComputedStyle(element);
      const foreground = luminance(parse(style.color));
      const background = luminance(parse(style.backgroundColor));
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});
