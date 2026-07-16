import type {
  ContentReviewMetadata,
  ExamSkill,
  ExamBlueprint,
  ListeningMCQItem,
  ListeningScript,
  OfficialResource,
  PracticeItem,
  PracticeSet,
  ReadingMCQItem,
  ReadingText,
  Task,
} from "./types";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { validateReadingPresentationContent } from "./readingPresentation.ts";

export interface ContentCollections {
  officialResources: readonly OfficialResource[];
  readingTexts: readonly ReadingText[];
  listeningScripts: readonly ListeningScript[];
  practiceItems: readonly PracticeItem[];
  practiceSets: readonly PracticeSet[];
  examBlueprints?: readonly ExamBlueprint[];
}

export interface ValidationIssue {
  collection: keyof ContentCollections;
  id: string;
  field: string;
  message: string;
}

const ALLOWED_OFFICIAL_HOSTS = new Set([
  "cvc.cervantes.es",
  "examenes.cervantes.es",
]);

const SKILL_TASKS: Record<string, readonly Task[]> = {
  reading: ["tarea1", "tarea2", "tarea3", "tarea4"],
  listening: ["tarea1", "tarea2", "tarea3", "tarea4", "tarea5"],
  writing: ["tarea1", "tarea2"],
  speaking: ["tarea1", "tarea2", "tarea3"],
};

const EXAM_SKILLS: readonly ExamSkill[] = [
  "reading",
  "listening",
  "writing",
  "speaking",
];

function add(
  issues: ValidationIssue[],
  collection: ValidationIssue["collection"],
  id: string,
  field: string,
  message: string,
): void {
  issues.push({ collection, id, field, message });
}

function validateUniqueIds<T extends { id: string }>(
  collection: keyof ContentCollections,
  values: readonly T[],
  issues: ValidationIssue[],
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value.id.trim()) add(issues, collection, "(empty)", "id", "ID is required");
    if (seen.has(value.id)) {
      add(issues, collection, value.id, "id", `Duplicate ID: ${value.id}`);
    }
    seen.add(value.id);
  }
}

function validateReview(
  collection: "readingTexts" | "listeningScripts" | "practiceItems" | "practiceSets",
  value: { id: string } & ContentReviewMetadata,
  issues: ValidationIssue[],
): void {
  if (!(["draft", "reviewed", "published"] as const).includes(value.status)) {
    add(issues, collection, value.id, "status", "Unknown review status");
  }
  if (!value.reviewedBy?.trim()) {
    add(issues, collection, value.id, "reviewedBy", "Reviewer is required");
  }
  if (!value.reviewedAt?.trim() || Number.isNaN(Date.parse(value.reviewedAt))) {
    add(issues, collection, value.id, "reviewedAt", "Valid review date is required");
  }
}

function validateOfficialUrl(
  resource: OfficialResource,
  field: "officialUrl" | "fallbackUrl",
  issues: ValidationIssue[],
): void {
  try {
    const url = new URL(resource[field]);
    if (url.protocol !== "https:") throw new Error("URL must use HTTPS");
    if (!ALLOWED_OFFICIAL_HOSTS.has(url.hostname)) {
      throw new Error(`Host is not allowed: ${url.hostname}`);
    }
  } catch (error) {
    add(
      issues,
      "officialResources",
      resource.id,
      field,
      error instanceof Error ? error.message : "Invalid URL",
    );
  }
}

function validTaskForSkill(skill: string, task: Task | undefined): boolean {
  return task === undefined || SKILL_TASKS[skill]?.includes(task) === true;
}

function validateMCQOptions(
  item: ReadingMCQItem | ListeningMCQItem,
  issues: ValidationIssue[],
): void {
  const optionKeys = item.options.map((option) => option.key);
  if (item.options.length < 2) {
    add(issues, "practiceItems", item.id, "options", "At least two options are required");
  }
  if (new Set(optionKeys).size !== optionKeys.length) {
    add(issues, "practiceItems", item.id, "options", "Option keys must be unique");
  }
  if (!optionKeys.includes(item.correctAnswer)) {
    add(
      issues,
      "practiceItems",
      item.id,
      "correctAnswer",
      "Correct answer must match an option key",
    );
  }
  if (!item.explanationKo.trim()) {
    add(issues, "practiceItems", item.id, "explanationKo", "Explanation is required");
  }
}

function validateReadingItem(
  item: ReadingMCQItem,
  textById: Map<string, ReadingText>,
  issues: ValidationIssue[],
): void {
  const text = textById.get(item.textId);
  if (!text) {
    add(
      issues,
      "practiceItems",
      item.id,
      "textId",
      `Unknown reading text: ${item.textId}`,
    );
  } else if (item.status === "published" && text.status !== "published") {
    add(
      issues,
      "practiceItems",
      item.id,
      "textId",
      `Published item references ${text.status} text: ${item.textId}`,
    );
  }
  validateMCQOptions(item, issues);
}

function validateListeningItem(
  item: ListeningMCQItem,
  scriptById: Map<string, ListeningScript>,
  issues: ValidationIssue[],
): void {
  const script = scriptById.get(item.scriptId);
  if (!script) {
    add(
      issues,
      "practiceItems",
      item.id,
      "scriptId",
      `Unknown listening script: ${item.scriptId}`,
    );
  } else if (item.status === "published" && script.status !== "published") {
    add(
      issues,
      "practiceItems",
      item.id,
      "scriptId",
      `Published item references ${script.status} script: ${item.scriptId}`,
    );
  }
  validateMCQOptions(item, issues);
}

/** 블루프린트 skill·task별 section당 기대 문항 수 (공식 청사진). */
const EXPECTED_SECTION_ITEMS: Record<ExamBlueprint["skill"], Partial<Record<Task, number>>> = {
  listening: { tarea1: 6, tarea2: 6, tarea3: 6, tarea4: 6, tarea5: 6 },
  reading: { tarea1: 6, tarea2: 10, tarea3: 6, tarea4: 14 },
};

function validateExamBlueprints(
  blueprints: readonly ExamBlueprint[],
  setById: Map<string, PracticeSet>,
  itemById: Map<string, PracticeItem>,
  scriptById: Map<string, ListeningScript>,
  textById: Map<string, ReadingText>,
  issues: ValidationIssue[],
): void {
  validateUniqueIds("examBlueprints", blueprints, issues);

  for (const blueprint of blueprints) {
    if (!blueprint.title.trim()) {
      add(issues, "examBlueprints", blueprint.id, "title", "Title is required");
    }
    if (!Number.isInteger(blueprint.version) || blueprint.version <= 0) {
      add(issues, "examBlueprints", blueprint.id, "version", "Version must be a positive integer");
    }
    if (!Number.isFinite(blueprint.timeLimitMin) || blueprint.timeLimitMin <= 0) {
      add(issues, "examBlueprints", blueprint.id, "timeLimitMin", "Time limit must be positive");
    }

    // 완전한 영역 시험: section task는 해당 skill의 Tarea 전체를 순서대로 덮어야 한다.
    const expectedTasks = SKILL_TASKS[blueprint.skill] ?? [];
    const sectionTasks = blueprint.sections.map((section) => section.task);
    if (sectionTasks.join(",") !== expectedTasks.join(",")) {
      add(
        issues,
        "examBlueprints",
        blueprint.id,
        "sections",
        `Sections must cover ${expectedTasks.join(", ")} in order`,
      );
    }

    const setIds = blueprint.sections.map((section) => section.setId);
    if (new Set(setIds).size !== setIds.length) {
      add(issues, "examBlueprints", blueprint.id, "sections", "Section set IDs must be unique");
    }

    const seenItemIds = new Set<string>();

    for (const section of blueprint.sections) {
      const field = `sections.${section.task}`;
      const expectedCount = EXPECTED_SECTION_ITEMS[blueprint.skill]?.[section.task];
      const set = setById.get(section.setId);
      if (!set) {
        add(issues, "examBlueprints", blueprint.id, field, `Unknown practice set: ${section.setId}`);
        continue;
      }
      if (set.status !== "published") {
        add(issues, "examBlueprints", blueprint.id, field, `Set is not published: ${section.setId}`);
      }
      if (set.skill !== blueprint.skill) {
        add(issues, "examBlueprints", blueprint.id, field, `Set skill must be ${blueprint.skill}: ${section.setId}`);
      }
      if (expectedCount !== undefined && set.itemIds.length !== expectedCount) {
        add(
          issues,
          "examBlueprints",
          blueprint.id,
          field,
          `Section must have exactly ${expectedCount} items, got ${set.itemIds.length}`,
        );
      }

      for (const itemId of set.itemIds) {
        if (seenItemIds.has(itemId)) {
          add(issues, "examBlueprints", blueprint.id, field, `Duplicate item across sections: ${itemId}`);
        }
        seenItemIds.add(itemId);

        const item = itemById.get(itemId);
        if (!item) {
          add(issues, "examBlueprints", blueprint.id, field, `Unknown practice item: ${itemId}`);
          continue;
        }
        if (item.status !== "published") {
          add(issues, "examBlueprints", blueprint.id, field, `Item is not published: ${itemId}`);
        }
        if (item.kind !== "mcq" || item.skill !== blueprint.skill) {
          add(issues, "examBlueprints", blueprint.id, field, `Item must be a ${blueprint.skill} MCQ: ${itemId}`);
          continue;
        }
        if (item.skill === "listening") {
          const script = scriptById.get(item.scriptId);
          if (!script) {
            add(issues, "examBlueprints", blueprint.id, field, `Unknown listening script: ${item.scriptId}`);
          } else {
            if (script.status !== "published") {
              add(issues, "examBlueprints", blueprint.id, field, `Script is not published: ${script.id}`);
            }
            if (script.task !== section.task) {
              add(
                issues,
                "examBlueprints",
                blueprint.id,
                field,
                `Script ${script.id} is ${script.task}, section expects ${section.task}`,
              );
            }
          }
        }
        if (item.skill === "reading") {
          const text = textById.get(item.textId);
          if (!text) {
            add(issues, "examBlueprints", blueprint.id, field, `Unknown reading text: ${item.textId}`);
          } else {
            if (text.status !== "published") {
              add(issues, "examBlueprints", blueprint.id, field, `Text is not published: ${text.id}`);
            }
            // 지문 task가 섹션 task와 달라야 하는 세트 교환(예: 동수인 T1/T3)을 거부한다.
            if (text.task !== section.task) {
              add(
                issues,
                "examBlueprints",
                blueprint.id,
                field,
                `Text ${text.id} is ${text.task}, section expects ${section.task}`,
              );
            }
          }
        }
      }
    }
  }
}

export function validateContent(collections: ContentCollections): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  validateUniqueIds("officialResources", collections.officialResources, issues);
  validateUniqueIds("readingTexts", collections.readingTexts, issues);
  validateUniqueIds("listeningScripts", collections.listeningScripts, issues);
  validateUniqueIds("practiceItems", collections.practiceItems, issues);
  validateUniqueIds("practiceSets", collections.practiceSets, issues);

  const textById = new Map(collections.readingTexts.map((text) => [text.id, text]));
  const scriptById = new Map(
    collections.listeningScripts.map((script) => [script.id, script]),
  );
  const itemById = new Map(collections.practiceItems.map((item) => [item.id, item]));

  for (const resource of collections.officialResources) {
    if (!resource.title.trim()) add(issues, "officialResources", resource.id, "title", "Title is required");
    if (!resource.sourceLabel.trim()) add(issues, "officialResources", resource.id, "sourceLabel", "Source is required");
    if (!resource.rightsNote.trim()) add(issues, "officialResources", resource.id, "rightsNote", "Rights note is required");
    validateOfficialUrl(resource, "officialUrl", issues);
    validateOfficialUrl(resource, "fallbackUrl", issues);
    const skills = Array.isArray(resource.skills) ? resource.skills : [];
    if (skills.length === 0) {
      add(issues, "officialResources", resource.id, "skills", "At least one skill is required");
    }
    if (new Set(skills).size !== skills.length) {
      add(issues, "officialResources", resource.id, "skills", "Skills must be unique");
    }
    const invalidSkills = skills.filter(
      (skill) => !EXAM_SKILLS.includes(skill as ExamSkill),
    );
    if (invalidSkills.length > 0) {
      add(
        issues,
        "officialResources",
        resource.id,
        "skills",
        `Invalid skills: ${invalidSkills.join(", ")}`,
      );
    }
    if (
      resource.task !== undefined &&
      skills.some(
        (skill) =>
          EXAM_SKILLS.includes(skill as ExamSkill) &&
          !validTaskForSkill(skill, resource.task),
      )
    ) {
      add(
        issues,
        "officialResources",
        resource.id,
        "task",
        `Invalid task for skills: ${skills.join(", ")}`,
      );
    }
  }

  for (const text of collections.readingTexts) {
    validateReview("readingTexts", text, issues);
    if (!text.title.trim()) add(issues, "readingTexts", text.id, "title", "Title is required");
    if (!text.passage.trim()) add(issues, "readingTexts", text.id, "passage", "Passage is required");
    if (!text.sourceNote.trim()) add(issues, "readingTexts", text.id, "sourceNote", "Source note is required");
  }

  for (const script of collections.listeningScripts) {
    validateReview("listeningScripts", script, issues);
    if (!script.title.trim()) add(issues, "listeningScripts", script.id, "title", "Title is required");
    if (!script.transcript.trim()) add(issues, "listeningScripts", script.id, "transcript", "Transcript is required");
    if (!script.sourceNote.trim()) add(issues, "listeningScripts", script.id, "sourceNote", "Source note is required");
    if (!script.audioSrc.startsWith("/audio/")) {
      add(issues, "listeningScripts", script.id, "audioSrc", "Audio source must live under /audio/");
    }
    if (!validTaskForSkill("listening", script.task)) {
      add(issues, "listeningScripts", script.id, "task", "Invalid task for listening");
    }
    if (Object.keys(script.voices).length === 0) {
      add(issues, "listeningScripts", script.id, "voices", "At least one voice mapping is required");
    }
    if (!/^[+-]\d+%$/.test(script.rate)) {
      add(issues, "listeningScripts", script.id, "rate", "Rate must be an Edge TTS offset like +0% or -6%");
    }
  }

  for (const item of collections.practiceItems) {
    validateReview("practiceItems", item, issues);
    if (!item.prompt.trim()) add(issues, "practiceItems", item.id, "prompt", "Prompt is required");
    if (item.tags.length === 0) add(issues, "practiceItems", item.id, "tags", "At least one tag is required");

    if (item.kind === "mcq") {
      if (item.skill === "reading") {
        validateReadingItem(item, textById, issues);
      } else {
        validateListeningItem(item, scriptById, issues);
      }
    } else if (!validTaskForSkill(item.skill, item.task)) {
      add(issues, "practiceItems", item.id, "task", `Invalid task for ${item.skill}`);
    }

    if (item.kind === "open") {
      if (item.wordCount[0] <= 0 || item.wordCount[1] < item.wordCount[0]) {
        add(issues, "practiceItems", item.id, "wordCount", "Invalid word-count range");
      }
      if (item.timeLimitMin <= 0) add(issues, "practiceItems", item.id, "timeLimitMin", "Time limit must be positive");
    }
    if (item.kind === "oral" && (item.prepTimeMin <= 0 || item.speakTimeMin <= 0)) {
      add(issues, "practiceItems", item.id, "timeLimit", "Speaking times must be positive");
    }

    if (item.kind === "open" || item.kind === "oral") {
      // 스페인어 모범답안은 모든 쓰기·말하기 문항에 필수다.
      const answer = item.modelAnswerEs?.trim() ?? "";
      if (!answer) {
        add(issues, "practiceItems", item.id, "modelAnswerEs", "Spanish model answer is required");
      } else if (item.kind === "open") {
        // 쓰기 모범답안은 UI와 동일한 방식으로 세어 정확히 wordCount 범위 안이어야 한다.
        // (말하기 길이는 사용자 낭독 검수로 확인하며 자동 검증하지 않는다.)
        const words = answer.split(/\s+/).length;
        const [min, max] = item.wordCount;
        if (words < min || words > max) {
          add(
            issues,
            "practiceItems",
            item.id,
            "modelAnswerEs",
            `Model answer must be ${min}–${max} words, got ${words}`,
          );
        }
      }
    }
  }

  for (const set of collections.practiceSets) {
    validateReview("practiceSets", set, issues);
    if (!set.title.trim()) add(issues, "practiceSets", set.id, "title", "Title is required");
    if (!Number.isFinite(set.estimatedMin) || set.estimatedMin <= 0) {
      add(issues, "practiceSets", set.id, "estimatedMin", "Estimated time must be positive");
    }
    if (set.itemIds.length === 0) add(issues, "practiceSets", set.id, "itemIds", "Set cannot be empty");
    if (new Set(set.itemIds).size !== set.itemIds.length) {
      add(issues, "practiceSets", set.id, "itemIds", "Set item IDs must be unique");
    }
    if (set.mode !== "guided" && set.mode !== "exam-prep") {
      add(issues, "practiceSets", set.id, "mode", "Mode must be guided or exam-prep");
    }
    if (!Number.isInteger(set.sequence) || set.sequence < 1) {
      add(issues, "practiceSets", set.id, "sequence", "Sequence must be a positive integer");
    }
    if (!validTaskForSkill(set.skill, set.task)) {
      add(issues, "practiceSets", set.id, "task", `${set.task} is not valid for ${set.skill}`);
    }

    if (set.presentation !== undefined) {
      if (set.skill !== "reading") {
        add(
          issues,
          "practiceSets",
          set.id,
          "presentation",
          "Reading presentation is allowed only on reading sets",
        );
      } else {
        const readingItems = set.itemIds.flatMap((itemId) => {
          const item = itemById.get(itemId);
          return item?.kind === "mcq" && item.skill === "reading" ? [item] : [];
        });
        const referencedTextIds = [
          ...new Set(readingItems.map((item) => item.textId)),
        ];
        const passages = referencedTextIds.flatMap((textId) => {
          const text = textById.get(textId);
          return text ? [text.passage] : [];
        });
        for (const issue of validateReadingPresentationContent({
          presentation: set.presentation,
          itemIds: set.itemIds,
          items: readingItems,
          passages,
        })) {
          add(issues, "practiceSets", set.id, issue.field, issue.message);
        }
      }
    }

    for (const itemId of set.itemIds) {
      const item = itemById.get(itemId);
      if (!item) {
        add(issues, "practiceSets", set.id, "itemIds", `Unknown practice item: ${itemId}`);
        continue;
      }
      if (set.status === "published" && item.status !== "published") {
        add(issues, "practiceSets", set.id, "itemIds", `Published set references ${item.status} item: ${itemId}`);
      }
      if (set.skill !== "mixed" && item.skill !== set.skill) {
        add(issues, "practiceSets", set.id, "skill", `${itemId} does not match set skill ${set.skill}`);
      }
      const itemTask =
        item.kind !== "mcq"
          ? item.task
          : item.skill === "reading"
            ? textById.get(item.textId)?.task
            : scriptById.get(item.scriptId)?.task;
      if (set.task !== undefined && itemTask !== undefined && itemTask !== set.task) {
        add(
          issues,
          "practiceSets",
          set.id,
          "task",
          `${itemId} is ${itemTask}, set expects ${set.task}`,
        );
      }
    }
  }

  // 같은 영역·모드·Tarea 안의 순서는 1부터 빠짐없이 이어져야 목록 순서가
  // 원본 배열 배치에 의존하지 않는다.
  const sequenceGroups = new Map<string, PracticeSet[]>();
  for (const set of collections.practiceSets) {
    if (
      (set.mode !== "guided" && set.mode !== "exam-prep") ||
      !Number.isInteger(set.sequence) ||
      set.sequence < 1
    ) {
      continue;
    }
    const key = `${set.skill}:${set.mode}:${set.task ?? "none"}`;
    const group = sequenceGroups.get(key) ?? [];
    group.push(set);
    sequenceGroups.set(key, group);
  }
  for (const group of sequenceGroups.values()) {
    const ordered = [...group].sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
    ordered.forEach((set, index) => {
      const expected = index + 1;
      if (set.sequence !== expected) {
        add(
          issues,
          "practiceSets",
          set.id,
          "sequence",
          `Sequence must be contiguous from 1 within its catalog group; expected ${expected}, got ${set.sequence}`,
        );
      }
    });
  }

  // 단일 소속: 한 문항은 최대 한 세트에만 속해야 한다(getSetIdForItem 가정). 같은 세트
  // 내부 중복은 위의 "unique" 검사가 잡으므로 여기서는 서로 다른 세트 간 중복만 본다.
  const itemOwner = new Map<string, string>();
  for (const set of collections.practiceSets) {
    for (const itemId of set.itemIds) {
      const owner = itemOwner.get(itemId);
      if (owner === undefined) {
        itemOwner.set(itemId, set.id);
      } else if (owner !== set.id) {
        add(issues, "practiceSets", set.id, "itemIds", `Item ${itemId} already belongs to set ${owner}`);
      }
    }
  }

  if (collections.examBlueprints) {
    const setById = new Map(collections.practiceSets.map((set) => [set.id, set]));
    validateExamBlueprints(collections.examBlueprints, setById, itemById, scriptById, textById, issues);
  }

  return issues;
}

export function assertValidContent(collections: ContentCollections): void {
  const issues = validateContent(collections);
  if (issues.length === 0) return;
  const detail = issues
    .map((issue) => `${issue.collection}/${issue.id}.${issue.field}: ${issue.message}`)
    .join("\n");
  throw new Error(`Content validation failed (${issues.length} issue${issues.length === 1 ? "" : "s"}):\n${detail}`);
}
