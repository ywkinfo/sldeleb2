export type ExamSkill = "reading" | "listening" | "writing" | "speaking";
export type PracticeSkill = ExamSkill;
export type Task = "tarea1" | "tarea2" | "tarea3" | "tarea4" | "tarea5";

export type ContentStatus = "draft" | "reviewed" | "published";

export interface ContentReviewMetadata {
  status: ContentStatus;
  reviewedBy: string;
  reviewedAt: string;
}

export interface OfficialResource {
  id: string;
  title: string;
  year: number | null;
  skill: ExamSkill | "all";
  task?: Task;
  resourceType:
    | "booklet"
    | "audio"
    | "transcript"
    | "answers"
    | "interactive";
  officialUrl: string;
  fallbackUrl: string;
  sourceLabel: string;
  rightsNote: string;
}

export interface ReadingText extends ContentReviewMetadata {
  id: string;
  task: "tarea1" | "tarea2" | "tarea3" | "tarea4";
  title: string;
  passage: string;
  sourceNote: string;
}

export interface ListeningScript extends ContentReviewMetadata {
  id: string;
  task: Task;
  title: string;
  audioSrc: string;
  transcript: string;
  // 화자 라벨 → Edge TTS 음성 이름(예: es-ES-ElviraNeural). scripts/generate-listening-audio.ts가 사용.
  voices: Record<string, string>;
  // Edge TTS 속도 오프셋 (예: "+0%", "-6%")
  rate: string;
  sourceNote: string;
}

export interface ReadingMCQItem extends ContentReviewMetadata {
  id: string;
  skill: "reading";
  kind: "mcq";
  textId: string;
  prompt: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanationKo: string;
  tags: string[];
}

export interface ListeningMCQItem extends ContentReviewMetadata {
  id: string;
  skill: "listening";
  kind: "mcq";
  scriptId: string;
  prompt: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanationKo: string;
  tags: string[];
}

export interface WritingTaskItem extends ContentReviewMetadata {
  id: string;
  skill: "writing";
  kind: "open";
  task: "tarea1" | "tarea2";
  prompt: string;
  wordCount: [number, number];
  timeLimitMin: number;
  checklistKo: string[];
  modelOutlineKo: string;
  tags: string[];
}

export interface SpeakingTaskItem extends ContentReviewMetadata {
  id: string;
  skill: "speaking";
  kind: "oral";
  task: "tarea1" | "tarea2" | "tarea3";
  prompt: string;
  prepTimeMin: number;
  speakTimeMin: number;
  checklistKo: string[];
  modelOutlineKo: string;
  tags: string[];
}

export type PracticeItem =
  | ReadingMCQItem
  | ListeningMCQItem
  | WritingTaskItem
  | SpeakingTaskItem;

export interface PracticeSet extends ContentReviewMetadata {
  id: string;
  title: string;
  estimatedMin: number;
  skill: PracticeSkill | "mixed";
  itemIds: string[];
}

export interface GlossaryEntry {
  id: string;
  termEs: string;
  termKo: string;
  definitionKo: string;
  category: "exam" | "instruction" | "assessment";
}

export interface BaseAttempt {
  itemId: string;
  flagged: boolean;
  attemptCount: number;
  lastAttemptedAt: number;
}

export interface ReadingAttempt extends BaseAttempt {
  kind: "reading";
  selectedAnswer: string;
  correct: boolean;
}

export interface ListeningAttempt extends BaseAttempt {
  kind: "listening";
  selectedAnswer: string;
  correct: boolean;
}

export type RubricScore = 1 | 2 | 3;

export interface WritingRubricScores {
  adequacy: RubricScore;
  coherence: RubricScore;
  accuracy: RubricScore;
  range: RubricScore;
}

export interface SpeakingRubricScores {
  coherence: RubricScore;
  fluency: RubricScore;
  accuracy: RubricScore;
  range: RubricScore;
}

export type RubricScores = WritingRubricScores | SpeakingRubricScores;

export type OpenAttempt =
  | (BaseAttempt & {
      kind: "open";
      completed: false;
      draft?: string;
      selfScore?: never;
      rubricScores?: never;
    })
  | (BaseAttempt & {
      kind: "open";
      completed: true;
      draft?: string;
      selfScore: 1 | 2 | 3;
      rubricScores?: RubricScores;
    });

export type AttemptState = ReadingAttempt | ListeningAttempt | OpenAttempt;

export interface ProgressSnapshot {
  schemaVersion: 1;
  attempts: Record<string, AttemptState>;
}

// ---- 모의고사 세션 (설계: docs/mock-exam-session-design.md) ----

// 쓰기·말하기는 answers 계약과 맞지 않으므로 자동 채점 영역까지만 일반화한다.
export type AutoGradedExamSkill = "reading" | "listening";

export interface ExamBlueprint {
  id: string;
  // 구성(세트·순서) 변경 시 증가. 진행 중 세션은 자신의 스냅샷으로 복원된다.
  version: number;
  title: string;
  skill: AutoGradedExamSkill;
  timeLimitMin: number;
  sections: { task: Task; setId: string }[];
}

// 세션 시작 시 고정되는 구성 스냅샷 — 배포로 콘텐츠가 바뀌어도 세션은 불변.
export interface ExamSectionSnapshot {
  task: Task;
  setId: string;
  itemIds: string[];
  scriptIds: string[];
}

export interface ExamResultItem {
  itemId: string;
  task: Task;
  selectedAnswer?: string;
  correctAnswer: string;
  correct: boolean;
}

export interface ExamResult {
  correct: number;
  total: number;
  byTask: Partial<Record<Task, { correct: number; total: number }>>;
  // 콘텐츠가 삭제돼도 정오표·점수를 표시할 수 있도록 문항별 결과를 보존한다.
  items: ExamResultItem[];
}

// 복습 큐(dele-b2:v1) 반영용 outbox. pending payload는 finalize 시점에 1회만
// 계산되며, 재적용은 멱등이다.
export type ProgressProjection =
  | { status: "pending"; attempts: AttemptState[] }
  | { status: "complete" };

// 오디오 재생 슬롯: 재생 시작 시 예약(used+1, active), ended로 완료,
// 재생 실패 시 환불. 새로고침 시 active 슬롯은 소비된 것으로 유지한다.
export interface ExamPlayback {
  used: number;
  active: boolean;
}

interface ExamSessionBase {
  id: string;
  blueprintId: string;
  blueprintVersion: number;
  sections: ExamSectionSnapshot[];
  startedAt: number;
  deadlineAt: number;
  answers: Record<string, string>;
  flaggedItemIds: string[];
  playbacks: Record<string, ExamPlayback>;
}

export type InProgressExamSession = ExamSessionBase & {
  status: "in-progress";
  submittedAt?: never;
  result?: never;
  progressProjection?: never;
};

export type FinalizedExamSession = ExamSessionBase & {
  status: "submitted" | "expired";
  submittedAt: number;
  result: ExamResult;
  progressProjection: ProgressProjection;
};

export type ExamSession = InProgressExamSession | FinalizedExamSession;

export interface ExamSessionSnapshot {
  schemaVersion: 1;
  sessions: ExamSession[];
}
