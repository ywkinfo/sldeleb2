import type { Page } from '@playwright/test';

export const REVIEW_URL = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/review`;
const PROGRESS_KEY = 'dele-b2:v1';

/*
 * 고정 진도 fixture. 세 문항으로 사유·영역·Tarea를 모두 커버한다.
 *  - r-lib-01: 읽기 정답 + 별표 → 사유 [별표], 읽기 Tarea1 정답률 1/1
 *  - l-t4-artista-01: 듣기 오답 → 사유 [오답], 듣기 Tarea3 정답률 0/1 (id는 t4지만 실제 tarea3)
 *  - w-neighborhood-noise: 쓰기 자기평가 1점 → 사유 [낮은 자기평가]
 */
export const REVIEW_FIXTURE = {
  schemaVersion: 1,
  attempts: {
    'r-lib-01': { itemId: 'r-lib-01', kind: 'reading', selectedAnswer: 'b', correct: true, flagged: true, attemptCount: 1, lastAttemptedAt: 3 },
    'l-t4-artista-01': { itemId: 'l-t4-artista-01', kind: 'listening', selectedAnswer: 'a', correct: false, flagged: false, attemptCount: 1, lastAttemptedAt: 2 },
    'w-neighborhood-noise': { itemId: 'w-neighborhood-noise', kind: 'open', completed: true, selfScore: 1, flagged: false, attemptCount: 1, lastAttemptedAt: 1 },
  },
};

export async function seedReview(page: Page, snapshot: unknown = REVIEW_FIXTURE): Promise<void> {
  await page.addInitScript((data) => {
    window.localStorage.setItem(data.key, data.value);
  }, { key: PROGRESS_KEY, value: JSON.stringify(snapshot) });
}
