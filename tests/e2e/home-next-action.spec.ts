import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const progressKey = "dele-b2:v1";
const examKey = "dele-b2:exam:v1";

function inProgressSession(deadlineAt: number) {
  return {
    id: "home-priority-exam",
    blueprintId: "exam-listening-b2",
    blueprintVersion: 1,
    sections: [],
    startedAt: deadlineAt - 60_000,
    deadlineAt,
    status: "in-progress",
    answers: {},
    flaggedItemIds: [],
    playbacks: {},
  };
}

test("personalized home action follows exam, practice, review, then starter priority", async ({ page }) => {
  const futureDeadline = Date.now() + 10 * 60_000;
  await page.goto(`${basePath}/`);
  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, sessions: [session] }));
    },
    { key: examKey, session: inProgressSession(futureDeadline) },
  );
  await page.reload();
  const action = page.locator("a.block-link").filter({ hasText: "진행 중인 모의고사" });
  await expect(action).toHaveAttribute("href", `${basePath}/exam/exam-listening-b2`);

  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, sessions: [session] }));
    },
    { key: examKey, session: inProgressSession(Date.now() - 1_000) },
  );
  await page.reload();
  await expect(page.locator("a.block-link").filter({ hasText: "모의고사 결과 확인" })).toHaveAttribute(
    "href",
    `${basePath}/exam/exam-listening-b2`,
  );
  const stillInProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).sessions[0].status, examKey);
  expect(stillInProgress).toBe("in-progress");

  await page.evaluate(
    ({ examStorageKey, progressStorageKey }) => {
      localStorage.removeItem(examStorageKey);
      localStorage.setItem(progressStorageKey, JSON.stringify({
        schemaVersion: 1,
        attempts: {
          "r-lib-01": {
            kind: "reading",
            itemId: "r-lib-01",
            selectedAnswer: "a",
            correct: true,
            flagged: false,
            attemptCount: 1,
            lastAttemptedAt: 100,
          },
        },
      }));
    },
    { examStorageKey: examKey, progressStorageKey: progressKey },
  );
  await page.reload();
  await expect(page.locator("a.block-link").filter({ hasText: "Tarea 1 · 공유 도서관" })).toHaveAttribute(
    "href",
    `${basePath}/practice/set/set-reading-library`,
  );

  await page.evaluate((key) => {
    const ids = ["r-lib-01", "r-lib-02", "r-lib-03", "r-lib-04", "r-lib-05", "r-lib-06"];
    const attempts = Object.fromEntries(ids.map((id, index) => [id, {
      kind: "reading",
      itemId: id,
      selectedAnswer: "a",
      correct: index !== 0,
      flagged: false,
      attemptCount: 1,
      lastAttemptedAt: 200 + index,
    }]));
    localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, attempts }));
  }, progressKey);
  await page.reload();
  await expect(page.locator("a.block-link").filter({ hasText: "맞춤 복습" })).toHaveAttribute(
    "href",
    `${basePath}/review`,
  );

  await page.evaluate((key) => localStorage.removeItem(key), progressKey);
  await page.reload();
  await expect(page.locator("a.block-link").filter({ hasText: "Tarea 1 · 공유 도서관" })).toHaveAttribute(
    "href",
    `${basePath}/practice/set/set-reading-library`,
  );
});

test("home and exam list switch a passed deadline to the result route without finalizing", async ({ page }) => {
  await page.clock.install();
  await page.goto(`${basePath}/`);
  await page.evaluate(
    ({ key }) => {
      const deadlineAt = Date.now() + 60_000;
      localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 1,
          sessions: [{
            id: "live-deadline-transition",
            blueprintId: "exam-listening-b2",
            blueprintVersion: 1,
            sections: [],
            startedAt: deadlineAt - 60_000,
            deadlineAt,
            status: "in-progress",
            answers: {},
            flaggedItemIds: [],
            playbacks: {},
          }],
        }),
      );
    },
    { key: examKey },
  );
  await page.reload();
  await expect(page.locator("a.block-link").filter({ hasText: "진행 중인 모의고사" })).toBeVisible();

  await page.clock.fastForward("01:01");
  await expect(page.locator("a.block-link").filter({ hasText: "모의고사 결과 확인" })).toBeVisible();

  await page.goto(`${basePath}/exam`);
  const card = page.locator("article.card").filter({ hasText: "듣기 모의고사" });
  await expect(card.getByText("시간 만료", { exact: true })).toBeVisible();
  await expect(card.getByRole("link", { name: "결과 확인" })).toHaveAttribute(
    "href",
    `${basePath}/exam/exam-listening-b2`,
  );
  const status = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).sessions[0].status,
    examKey,
  );
  expect(status).toBe("in-progress");
});
