import {
  applyProjectionToSnapshot,
  EXAM_SCHEMA_VERSION,
  type ExamSessionStore,
  isExamSessionSnapshot,
  mergeTerminalSessions,
} from "./examSession";
import {
  type ImportProgressResult,
  type ImportStats,
  importProgress,
} from "./progress/transfer";
import {
  coerceProgressSnapshot,
  isProgressSnapshot,
} from "./progress/snapshot";
import { type AttemptStore } from "./progress/store";
import type {
  ExamSessionSnapshot,
  FinalizedExamSession,
  ProgressSnapshot,
} from "./types";

export interface UserDataExportV1 {
  kind: "dele-b2-backup";
  exportVersion: 1;
  exportedAt: string;
  progress: ProgressSnapshot;
  exams: ExamSessionSnapshot;
}

export interface ImportDomainResult {
  stats: ImportStats;
  persistent: boolean;
  localRecovered: boolean;
}

export interface UserDataImportResult {
  format: "backup-v1" | "legacy-progress";
  progress: ImportDomainResult;
  exams: ImportDomainResult | null;
}

export type ParsedUserDataFile =
  | { format: "backup-v1"; data: UserDataExportV1 }
  | { format: "legacy-progress"; data: ProgressSnapshot };

export function isUserDataExportV1(value: unknown): value is UserDataExportV1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.kind === "dele-b2-backup" &&
    candidate.exportVersion === 1 &&
    typeof candidate.exportedAt === "string" &&
    !Number.isNaN(Date.parse(candidate.exportedAt)) &&
    isProgressSnapshot(candidate.progress) &&
    isExamSessionSnapshot(candidate.exams)
  );
}

export function parseUserDataFile(raw: string): ParsedUserDataFile | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const legacyProgress = coerceProgressSnapshot(parsed);
    if (legacyProgress) {
      return { format: "legacy-progress", data: legacyProgress };
    }
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Record<string, unknown>;
    const progress = coerceProgressSnapshot(candidate.progress);
    if (
      candidate.kind === "dele-b2-backup" &&
      candidate.exportVersion === 1 &&
      typeof candidate.exportedAt === "string" &&
      !Number.isNaN(Date.parse(candidate.exportedAt)) &&
      progress &&
      isExamSessionSnapshot(candidate.exams)
    ) {
      return {
        format: "backup-v1",
        data: {
          kind: "dele-b2-backup",
          exportVersion: 1,
          exportedAt: candidate.exportedAt,
          progress,
          exams: candidate.exams,
        },
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 저장소를 변경하지 않고 완결된 사용자 데이터 사본을 만든다. pending projection은
 * export용 progress에만 접어 넣고, export용 세션 사본만 complete로 정규화한다.
 */
export function createUserDataExport(
  attemptStore: AttemptStore,
  examStore: ExamSessionStore,
  exportedAt = new Date().toISOString(),
): UserDataExportV1 {
  let progress = attemptStore.load().snapshot;
  const sessions: FinalizedExamSession[] = [];

  for (const session of examStore.load().snapshot.sessions) {
    if (session.status === "in-progress") continue;
    if (session.progressProjection.status === "pending") {
      progress = applyProjectionToSnapshot(
        progress,
        session.progressProjection.attempts,
      ).snapshot;
      sessions.push({ ...session, progressProjection: { status: "complete" } });
    } else {
      sessions.push(session);
    }
  }

  return {
    kind: "dele-b2-backup",
    exportVersion: 1,
    exportedAt,
    progress,
    exams: { schemaVersion: EXAM_SCHEMA_VERSION, sessions },
  };
}

export function exportUserData(
  attemptStore: AttemptStore,
  examStore: ExamSessionStore,
): string {
  return JSON.stringify(createUserDataExport(attemptStore, examStore));
}

function toDomainResult(result: ImportProgressResult): ImportDomainResult {
  return {
    stats: result.stats,
    persistent: result.persistent,
    localRecovered: result.localRecovered,
  };
}

/** 전체 파일을 먼저 검증한 뒤 progress → exam 순서로 독립 저장한다. */
export function importUserData(
  attemptStore: AttemptStore,
  examStore: ExamSessionStore,
  raw: string,
): UserDataImportResult | null {
  const parsed = parseUserDataFile(raw);
  if (!parsed) return null;

  if (parsed.format === "legacy-progress") {
    const progress = importProgress(attemptStore, JSON.stringify(parsed.data));
    if (!progress) return null;
    return {
      format: "legacy-progress",
      progress: toDomainResult(progress),
      exams: null,
    };
  }

  // parseUserDataFile이 두 도메인을 모두 검증한 뒤에만 첫 write가 일어난다.
  const progress = importProgress(attemptStore, JSON.stringify(parsed.data.progress));
  if (!progress) return null;

  const loadedExams = examStore.load();
  const merged = mergeTerminalSessions(
    loadedExams.snapshot.sessions,
    parsed.data.exams.sessions,
  );
  const examSave = merged.changed
    ? examStore.save({ schemaVersion: EXAM_SCHEMA_VERSION, sessions: merged.sessions })
    : { persistent: loadedExams.persistent };

  return {
    format: "backup-v1",
    progress: toDomainResult(progress),
    exams: {
      stats: merged.stats,
      persistent: examSave.persistent,
      localRecovered: loadedExams.recovered,
    },
  };
}
