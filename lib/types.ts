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
