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
  skills: ExamSkill[];
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
  modelAnswerEs: string; // B2 수준 스페인어 모범 응답
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
  modelAnswerEs: string; // B2 수준 스페인어 모범 응답
  tags: string[];
}

export type PracticeItem =
  | ReadingMCQItem
  | ListeningMCQItem
  | WritingTaskItem
  | SpeakingTaskItem;

export interface PresentationSlot {
  slot: number;
  itemId: string;
}

export type ReadingPresentationContract =
  | { kind: "mcq" }
  | {
      kind: "matching";
      sharedOptions: { key: string; text: string }[];
      optionUse: "single-use" | "reusable";
    }
  | {
      kind: "sentence-insertion";
      sharedOptions: { key: string; text: string }[];
      optionUse: "single-use";
      slots: PresentationSlot[];
    }
  | {
      kind: "cloze";
      slots: PresentationSlot[];
    };

export interface PracticeSet extends ContentReviewMetadata {
  id: string;
  title: string;
  estimatedMin: number;
  skill: PracticeSkill | "mixed";
  task?: Task;
  sequence: number;
  mode: "guided" | "exam-prep";
  itemIds: string[];
  presentation?: ReadingPresentationContract;
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

// 채점·표시에 필요한 최소 필드만 동결한 문항 계약. skill 판별 union —
// 읽기는 지문(textId), 듣기는 음원(scriptId)을 가지며 두 ID는 배타적이다.
// 라이브 아이템(ReadingMCQItem|ListeningMCQItem)은 구조적으로 대입 가능하다.
interface ExamItemContractBase {
  id: string;
  kind: "mcq";
  prompt: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanationKo: string;
}
export type ExamItemContract =
  | (ExamItemContractBase & { skill: "reading"; textId: string; scriptId?: never })
  | (ExamItemContractBase & { skill: "listening"; scriptId: string; textId?: never });

// 동결된 음원 메타 — 배포로 title·audioSrc가 바뀌어도 세션은 시작 시점 값을 쓴다.
export interface ExamScriptContract {
  scriptId: string;
  title: string;
  audioSrc: string;
}

// 동결된 읽기 지문 메타 — 세션에서 실제로 표시하는 필드만 얼린다.
// 미표시 필드(sourceNote 등)는 계약에서 제외한다.
export interface ExamTextContract {
  textId: string;
  title: string;
  passage: string;
}

// 세션 시작 시 고정되는 구성 스냅샷 — 배포로 콘텐츠가 바뀌어도 세션은 불변.
// items·scripts·textIds·texts는 하위 호환을 위해 선택 필드다. 계약이 없는 옛
// 세션은 로드 시 라이브 콘텐츠로 폴백 해석된다(resolveSections 참고).
export interface ExamSectionSnapshot {
  task: Task;
  setId: string;
  itemIds: string[];
  scriptIds: string[];
  textIds?: string[];
  items?: ExamItemContract[];
  scripts?: ExamScriptContract[];
  texts?: ExamTextContract[];
  presentation?: ReadingPresentationContract;
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
