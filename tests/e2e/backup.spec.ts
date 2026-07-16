import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("@mobile-smoke imports a full backup and skips an in-progress exam", async ({ page }) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  await page.goto(`${basePath}/review`);

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
  await page.evaluate(
    ([key, session]) => window.localStorage.setItem(
      key,
      JSON.stringify({ schemaVersion: 1, sessions: [session] }),
    ),
    [
      "dele-b2:exam:v1",
      { ...base, id: "promote-active", status: "in-progress" },
    ] as const,
  );
  const backup = {
    kind: "dele-b2-backup",
    exportVersion: 1,
    exportedAt: "2026-07-16T00:00:00.000Z",
    progress: {
      schemaVersion: 1,
      attempts: {
        "backup-item": {
          kind: "reading",
          itemId: "backup-item",
          selectedAnswer: "a",
          correct: false,
          flagged: true,
          attemptCount: 1,
          lastAttemptedAt: 20,
        },
      },
    },
    exams: {
      schemaVersion: 1,
      sessions: [
        { ...base, id: "skip-active", status: "in-progress" },
        {
          ...base,
          id: "promote-active",
          status: "expired",
          submittedAt: 25,
          result: { correct: 0, total: 0, byTask: {}, items: [] },
          progressProjection: { status: "complete" },
        },
        {
          ...base,
          id: "imported-terminal",
          status: "submitted",
          submittedAt: 30,
          result: { correct: 0, total: 0, byTask: {}, items: [] },
          progressProjection: { status: "complete" },
        },
      ],
    },
  };

  await page.locator("#import-file").setInputFiles({
    name: "dele-b2-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  const section = page.locator("section.sync-progress", {
    has: page.getByRole("heading", { name: "데이터 백업 및 복원" }),
  });
  await expect(section.getByRole("status")).toContainText("학습 진도: 새 기록 1건");
  await expect(section.getByRole("status")).toContainText("모의고사 기록: 새 기록 1건 · 갱신 1건");
  await expect(section.getByRole("status")).toContainText("건너뜀 1건");

  const stored = await page.evaluate(() => ({
    progress: JSON.parse(window.localStorage.getItem("dele-b2:v1") ?? "null"),
    exams: JSON.parse(window.localStorage.getItem("dele-b2:exam:v1") ?? "null"),
  }));
  expect(stored.progress.attempts["backup-item"]).toBeDefined();
  expect(stored.exams.sessions.map((session: { id: string }) => session.id)).toEqual([
    "promote-active",
    "imported-terminal",
  ]);
  expect(stored.exams.sessions[0].status).toBe("expired");
});

test("downloads a terminal-only backup and normalizes pending projections without mutating local data", async ({ page }) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  await page.goto(`${basePath}/review`);
  const attempt = {
    kind: "reading",
    itemId: "pending-item",
    selectedAnswer: "a",
    correct: true,
    flagged: false,
    attemptCount: 1,
    lastAttemptedAt: 20,
  };
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
  await page.evaluate(
    ([progressKey, examKey, projectedAttempt, sessionBase]) => {
      window.localStorage.setItem(
        progressKey,
        JSON.stringify({ schemaVersion: 1, attempts: {} }),
      );
      window.localStorage.setItem(
        examKey,
        JSON.stringify({
          schemaVersion: 1,
          sessions: [
            { ...sessionBase, id: "active", status: "in-progress" },
            {
              ...sessionBase,
              id: "pending",
              status: "submitted",
              submittedAt: 30,
              result: { correct: 1, total: 1, byTask: {}, items: [] },
              progressProjection: { status: "pending", attempts: [projectedAttempt] },
            },
          ],
        }),
      );
    },
    ["dele-b2:v1", "dele-b2:exam:v1", attempt, base] as const,
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /전체 백업 파일 다운로드/ }).click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error("Downloaded backup has no local path");
  const exported = JSON.parse(await readFile(path, "utf8"));

  expect(exported.kind).toBe("dele-b2-backup");
  expect(exported.progress.attempts[attempt.itemId]).toEqual(attempt);
  expect(exported.exams.sessions.map((session: { id: string }) => session.id)).toEqual([
    "pending",
  ]);
  expect(exported.exams.sessions[0].progressProjection).toEqual({ status: "complete" });

  const local = await page.evaluate(() => JSON.parse(
    window.localStorage.getItem("dele-b2:exam:v1") ?? "null",
  ));
  expect(local.sessions.map((session: { id: string }) => session.id)).toEqual([
    "active",
    "pending",
  ]);
  expect(local.sessions[1].progressProjection.status).toBe("pending");
});

test("@mobile-smoke reports a partial import when exam storage cannot persist", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (key === "dele-b2:exam:v1") {
        throw new DOMException("full", "QuotaExceededError");
      }
      return nativeSetItem.call(this, key, value);
    };
  });
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  await page.goto(`${basePath}/review`);
  const terminal = {
    id: "temporary-terminal",
    blueprintId: "exam-reading-b2",
    blueprintVersion: 1,
    sections: [],
    startedAt: 10,
    deadlineAt: 100,
    status: "submitted",
    submittedAt: 30,
    answers: {},
    flaggedItemIds: [],
    playbacks: {},
    result: { correct: 0, total: 0, byTask: {}, items: [] },
    progressProjection: { status: "complete" },
  };
  const backup = {
    kind: "dele-b2-backup",
    exportVersion: 1,
    exportedAt: "2026-07-16T00:00:00.000Z",
    progress: { schemaVersion: 1, attempts: {} },
    exams: { schemaVersion: 1, sessions: [terminal] },
  };

  await page.locator("#import-file").setInputFiles({
    name: "dele-b2-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  const status = page.locator(".sync-progress").getByRole("status");
  await expect(status).toContainText("학습 진도:");
  await expect(status).toContainText("모의고사 기록:");
  await expect(status).toContainText("현재 세션에만 임시 반영");
  await expect(status).toContainText("부분 저장 경고");
  await expect(status).toContainText("재시도");
});
