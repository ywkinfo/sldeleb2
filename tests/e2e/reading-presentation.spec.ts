import { expect, test } from "@playwright/test";
import {
  basePath,
  PROGRESS_KEY,
  readExamSessions,
  startReadingExam,
} from "./exam-helpers";

const practiceUrl = (setId: string) => `${basePath}/practice/set/${setId}`;

test("Tarea 2 matching supports keyboard and click selection with reload restoration", async ({ page }) => {
  await page.goto(practiceUrl("set-reading-anio-fuera"));
  const presentation = page.locator('[data-presentation-kind="matching"]');
  await expect(presentation).toBeVisible();
  await expect(presentation.locator(".presentation-option-bank")).toContainText("여러 번 사용 가능");

  const questions = presentation.locator('[data-presentation-summary="true"]');
  const first = questions.nth(0);
  await first.getByRole("radio").first().focus();
  await page.keyboard.press("KeyB");
  await expect(first.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");

  const second = questions.nth(1);
  await second.locator('[role="radio"][data-key="c"]').click();
  await expect(second.locator('[role="radio"][data-key="c"]')).toHaveAttribute("aria-checked", "true");

  await first.getByRole("button", { name: "정답 확인" }).click();
  await expect(first.getByRole("status")).toContainText("맞았어요");
  await page.reload();
  await expect(
    page.locator('[data-presentation-kind="matching"] [data-presentation-summary="true"]').first().locator('[role="radio"][data-key="b"]'),
  ).toHaveAttribute("aria-checked", "true");
});

test("Tarea 3 renders exact marker slots and warns without blocking duplicate selections", async ({ page }) => {
  await page.goto(practiceUrl("set-reading-semana-cuatro"));
  const presentation = page.locator('[data-presentation-kind="sentence-insertion"]');
  await expect(presentation).toBeVisible();
  await expect(page.locator("body")).not.toContainText("[[slot:");

  const slots = presentation.locator(".presentation-slot-control");
  await expect(slots).toHaveCount(6);
  await slots.nth(0).getByRole("radio").first().focus();
  await page.keyboard.press("KeyC");
  await slots.nth(1).locator('[role="radio"][data-key="c"]').click();

  await expect(presentation.locator('.presentation-duplicate-warning[role="status"]')).toHaveCount(2);
  const confirm = presentation.locator('[data-presentation-summary="true"]').first().getByRole("button", { name: "정답 확인" });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(presentation.locator('[data-presentation-summary="true"]').first().getByRole("status")).toContainText("맞았어요");
});

test("Tarea 4 cloze supports per-slot keyboard and click choices", async ({ page }) => {
  await page.goto(practiceUrl("set-reading-podcast"));
  const presentation = page.locator('[data-presentation-kind="cloze"]');
  await expect(presentation).toBeVisible();
  await expect(page.locator("body")).not.toContainText("[[slot:");

  const slots = presentation.locator(".presentation-slot-control");
  await expect(slots).toHaveCount(14);
  await slots.nth(0).getByRole("radio").first().focus();
  await page.keyboard.press("KeyB");
  await expect(slots.nth(0).locator('[role="radio"][data-key="b"]')).toHaveAttribute("aria-checked", "true");
  await slots.nth(1).locator('[role="radio"][data-key="b"]').click();
  await expect(slots.nth(1).locator('[role="radio"][data-key="b"]')).toHaveAttribute("aria-checked", "true");
});

test("reading exam freezes presentations, restores answers, submits duplicates, and projects review", async ({ page }) => {
  await startReadingExam(page);
  const [started] = await readExamSessions(page);
  expect(
    (started.sections as Array<{ presentation?: { kind: string } }>).map(
      (section) => section.presentation?.kind,
    ),
  ).toEqual(["mcq", "matching", "sentence-insertion", "cloze"]);

  const insertion = page.locator('[data-presentation-kind="sentence-insertion"]');
  const slots = insertion.locator(".presentation-slot-control");
  await slots.nth(0).locator('[role="radio"][data-key="c"]').click();
  await slots.nth(1).locator('[role="radio"][data-key="c"]').click();
  await expect(insertion.locator('.presentation-duplicate-warning[role="status"]')).toHaveCount(2);
  await expect(
    page.locator('.exam-question-palette [data-item-id="r-sem4-02"]'),
  ).toHaveAttribute("aria-current", "true");
  await expect(page.locator("body")).not.toContainText("[[slot:");

  await page.reload();
  const restored = page.locator('[data-presentation-kind="sentence-insertion"]');
  await expect(restored.locator(".presentation-slot-control").nth(0).locator('[data-key="c"]')).toHaveAttribute("aria-checked", "true");
  await expect(restored.locator(".presentation-slot-control").nth(1).locator('[data-key="c"]')).toHaveAttribute("aria-checked", "true");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "답안 제출" }).first().click();
  await expect(page.locator("#exam-result")).toBeVisible();

  const projected = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    const attempts = JSON.parse(raw).attempts;
    return { first: attempts["r-sem4-01"], second: attempts["r-sem4-02"] };
  }, PROGRESS_KEY);
  expect(projected).toMatchObject({
    first: { selectedAnswer: "c", correct: true },
    second: { selectedAnswer: "c", correct: false },
  });

  await page.goto(`${basePath}/review`);
  const reviewRow = page.locator('.review-row').filter({ hasText: /읽기 · Hueco \[2\]/ }).last();
  await expect(reviewRow).toBeVisible();
  await expect(reviewRow.locator('.badge', { hasText: '오답' })).toBeVisible();
});

test("@mobile-smoke mobile passage dialog updates slot summary and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(practiceUrl("set-reading-semana-cuatro"));
  const presentation = page.locator('[data-presentation-kind="sentence-insertion"]');
  const opener = presentation.getByRole("button", { name: "지문 보기" });
  await opener.click();

  const dialog = page.getByRole("dialog", { name: /¿Menos horas, más vida\? 지문/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText("[[slot:");
  await dialog.locator(".presentation-slot-control").first().locator('[data-key="c"]').click();
  await dialog.getByRole("button", { name: "지문 닫기" }).click();

  await expect(opener).toBeFocused();
  await expect(presentation.locator('[data-presentation-summary="true"]').first()).toContainText("C");
});

test("@mobile-smoke touch selection works for matching and cloze presentations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(practiceUrl("set-reading-anio-fuera"));
  const matching = page.locator('[data-presentation-kind="matching"]');
  await matching.locator('[data-presentation-summary="true"]').first().locator('[data-key="b"]').click();
  await expect(
    matching.locator('[data-presentation-summary="true"]').first().locator('[data-key="b"]'),
  ).toHaveAttribute("aria-checked", "true");

  await page.goto(practiceUrl("set-reading-podcast"));
  const cloze = page.locator('[data-presentation-kind="cloze"]');
  const opener = cloze.getByRole("button", { name: "지문 보기" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: /El regreso de escuchar historias 지문/ });
  await dialog.locator('.presentation-slot-control[data-slot="1"] [data-key="b"]').click();
  await dialog.getByRole("button", { name: "지문 닫기" }).click();
  await expect(cloze.locator('[data-presentation-summary="true"]').first()).toContainText("B");
});
