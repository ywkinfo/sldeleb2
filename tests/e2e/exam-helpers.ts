import type { Page } from '@playwright/test';

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const EXAM_URL = `${basePath}/exam/exam-listening-b2`;
export const READING_EXAM_URL = `${basePath}/exam/exam-reading-b2`;
export const EXAM_KEY = 'dele-b2:exam:v1';
export const PROGRESS_KEY = 'dele-b2:v1';

export async function startReadingExam(page: Page) {
  await page.goto(READING_EXAM_URL);
  await page.getByRole('button', { name: '시험 시작' }).click();
  await page.locator('.question').first().waitFor();
}

/**
 * 오디오를 실제 파일 길이·코덱에 의존하지 않도록 media 메서드를 stub한다.
 * play()는 즉시 'playing'을 발생시키고, 테스트는 ended/error 이벤트를 직접
 * 발화시킨다.
 */
export async function stubMediaPlayback(page: Page, { rejectPlay = false } = {}) {
  await page.addInitScript((shouldReject) => {
    HTMLMediaElement.prototype.play = function play() {
      if (shouldReject) {
        return Promise.reject(new DOMException('blocked', 'NotAllowedError'));
      }
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {
      this.dispatchEvent(new Event('pause'));
    };
  }, rejectPlay);
}

export async function startExam(page: Page) {
  await page.goto(EXAM_URL);
  await page.getByRole('button', { name: '시험 시작' }).click();
  await page.locator('.question').first().waitFor();
}

export async function readExamSessions(page: Page) {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), EXAM_KEY);
  return raw ? (JSON.parse(raw).sessions as Array<Record<string, unknown>>) : [];
}

export async function readProgressAttempts(page: Page) {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), PROGRESS_KEY);
  return raw ? (JSON.parse(raw).attempts as Record<string, { attemptCount: number; correct: boolean }>) : {};
}

/** n번째 스크립트 블록의 오디오 엘리먼트에 media 이벤트를 발화시킨다. */
export async function dispatchMediaEvent(page: Page, blockIndex: number, eventName: string) {
  await page.evaluate(
    ([index, name]) => {
      const audio = document.querySelectorAll('.exam-player audio')[index as number];
      audio?.dispatchEvent(new Event(name as string));
    },
    [blockIndex, eventName] as const,
  );
}
