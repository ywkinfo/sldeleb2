import { type AttemptStore } from "../progress/store";
import type { FinalizedExamSession } from "../types";
import { applyProjectionToSnapshot } from "./session";
import type { ExamSessionStore } from "./store";

/**
 * outbox 적용: ProgressSnapshot 1회 load → 병합 → 1회 save → 성공 시에만
 * projection complete로 전환. 비영속 폴백이면 pending을 유지한다(재시도 대상).
 */
export function applyPendingProjection(
  session: FinalizedExamSession,
  attemptStore: AttemptStore,
  examStore: ExamSessionStore,
): { applied: boolean; session: FinalizedExamSession } {
  if (session.progressProjection.status !== "pending") {
    return { applied: true, session };
  }
  const loaded = attemptStore.load();
  const { snapshot: merged, changed } = applyProjectionToSnapshot(
    loaded.snapshot,
    session.progressProjection.attempts,
  );
  if (changed) {
    const saved = attemptStore.save(merged);
    if (!saved.persistent) {
      return { applied: false, session };
    }
  } else if (!loaded.persistent) {
    // 직전 저장 실패가 메모리 fallback에는 payload를 남길 수 있다. 그 상태를
    // "이미 반영됨"으로 오인해 complete로 바꾸면 브라우저 종료 시 진도가 사라진다.
    return { applied: false, session };
  }
  const completed: FinalizedExamSession = { ...session, progressProjection: { status: "complete" } };
  examStore.upsertSession(completed);
  return { applied: true, session: completed };
}
