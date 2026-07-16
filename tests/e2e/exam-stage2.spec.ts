import { expect, test } from "@playwright/test";
import {
  basePath,
  readExamSessions,
  startExam,
  startReadingExam,
} from "./exam-helpers";

test("@mobile-smoke active exam uses focus chrome and restores the normal shell after submit", async ({ page }) => {
  await startExam(page);

  await expect(page.locator("html")).toHaveAttribute("data-exam-active", "true");
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".exam-page-hero")).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
  await expect(page.getByRole("link", { name: "시험 나가기" })).toHaveAttribute("href", `${basePath}/exam`);
  await expect(page.locator(".exam-save-state")).toContainText("저장됨");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "답안 제출" }).first().click();
  await expect(page.locator("#exam-result")).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-exam-active", "true");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".site-footer")).toBeVisible();
});

test("@mobile-smoke leaving an active exam restores the normal shell", async ({ page }) => {
  await startExam(page);
  await expect(page.locator("html")).toHaveAttribute("data-exam-active", "true");

  await page.getByRole("link", { name: "시험 나가기" }).click();

  await expect(page).toHaveURL(`${basePath}/exam`);
  await expect(page.locator("html")).not.toHaveAttribute("data-exam-active", "true");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".site-footer")).toBeVisible();
});

test("@mobile-smoke mobile palette reports states, navigates, and restores opener focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startExam(page);
  const toolbar = page.getByRole("toolbar", { name: "모의고사 도구" });
  await expect(toolbar.getByRole("button", { name: "문항 목록 열기" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "답안 제출" })).toBeVisible();
  expect(await toolbar.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await page.locator(".question").nth(0).locator(".option").first().click();
  await page.locator(".question").nth(1).getByRole("button", { name: /검토 표시/ }).click();

  const opener = page.getByRole("button", { name: "문항 목록 열기" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "문항 목록" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-item-id]').nth(0)).toHaveAttribute("data-state", "answered");
  await expect(dialog.locator('[data-item-id]').nth(1)).toHaveAttribute("data-flagged", "true");

  await dialog.getByRole("button", { name: "미응답", exact: true }).click();
  await expect(dialog.locator('[data-item-id][data-state="answered"]')).toHaveCount(0);
  await dialog.getByRole("button", { name: "전체", exact: true }).click();

  await dialog.locator('[data-item-id]').nth(2).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator(".question").nth(2)).toHaveAttribute("data-current", "true");
});

test("@mobile-smoke reading workspace offers a focus-restoring mobile passage dialog", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startReadingExam(page);

  const workspace = page.locator(".reading-workspace").first();
  const opener = workspace.getByRole("button", { name: "지문 보기" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: /지문/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "지문 닫기" }).click();
  await expect(opener).toBeFocused();
});

test("history query opens frozen result detail and deletes only completed records", async ({ page }) => {
  await startExam(page);
  await page.locator(".question").first().locator(".option").first().click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "답안 제출" }).first().click();

  const [finished] = await readExamSessions(page);
  await page.goto(`${basePath}/exam/history?session=${finished.id}`);
  await expect(page).toHaveURL(new RegExp(`/exam/history\\?session=${finished.id}$`));
  await expect(page.locator("#exam-result")).toBeVisible();
  await expect(page.locator(".exam-history-detail")).toContainText("문항별 결과");
  await expect(page.getByRole("link", { name: "다시 응시하기" })).toHaveAttribute(
    "href",
    `${basePath}/exam/exam-listening-b2`,
  );

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "이 기록 삭제" }).click();
  await expect(page).toHaveURL(/\/exam\/history$/);
  await expect(page.getByText("아직 완료한 모의고사가 없습니다.")).toBeVisible();
});

test("@mobile-smoke history protects active and pending sessions during single and bulk deletion", async ({ page }) => {
  await page.goto(`${basePath}/exam/history`);
  const base = {
    blueprintId: "exam-reading-b2",
    blueprintVersion: 1,
    sections: [],
    startedAt: 10,
    deadlineAt: 100,
    answers: {},
    flaggedItemIds: [],
    playbacks: {},
  };
  const result = { correct: 0, total: 0, byTask: {}, items: [] };
  await page.evaluate(
    ([key, sessionBase, emptyResult]) => window.localStorage.setItem(
      key,
      JSON.stringify({
        schemaVersion: 1,
        sessions: [
          { ...sessionBase, id: "active", status: "in-progress" },
          {
            ...sessionBase,
            id: "pending",
            status: "submitted",
            submittedAt: 20,
            result: emptyResult,
            progressProjection: { status: "pending", attempts: [] },
          },
          {
            ...sessionBase,
            id: "complete",
            status: "expired",
            submittedAt: 30,
            result: emptyResult,
            progressProjection: { status: "complete" },
          },
        ],
      }),
    ),
    ["dele-b2:exam:v1", base, result] as const,
  );
  await page.reload();

  await page.locator('a[href*="session=pending"]').click();
  await expect(page.getByRole("button", { name: "이 기록 삭제" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "다시 반영" })).toBeVisible();
  await page.getByRole("button", { name: /기록 목록/ }).click();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "완료 기록 모두 삭제" }).click();

  const ids = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem("dele-b2:exam:v1") ?? "null");
    return stored.sessions.map((session: { id: string }) => session.id);
  });
  expect(ids).toEqual(["active", "pending"]);
  await expect(page.locator('a[href*="session=pending"]')).toBeVisible();
  await expect(page.locator('a[href*="session=complete"]')).toHaveCount(0);
});
