import type {
  ContentReviewMetadata,
  OfficialResource,
  PracticeItem,
  PracticeSet,
  ReadingMCQItem,
  ReadingText,
  Task,
} from "./types";

export interface ContentCollections {
  officialResources: readonly OfficialResource[];
  readingTexts: readonly ReadingText[];
  practiceItems: readonly PracticeItem[];
  practiceSets: readonly PracticeSet[];
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
  collection: "readingTexts" | "practiceItems" | "practiceSets",
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

export function validateContent(collections: ContentCollections): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  validateUniqueIds("officialResources", collections.officialResources, issues);
  validateUniqueIds("readingTexts", collections.readingTexts, issues);
  validateUniqueIds("practiceItems", collections.practiceItems, issues);
  validateUniqueIds("practiceSets", collections.practiceSets, issues);

  const textById = new Map(collections.readingTexts.map((text) => [text.id, text]));
  const itemById = new Map(collections.practiceItems.map((item) => [item.id, item]));

  for (const resource of collections.officialResources) {
    if (!resource.title.trim()) add(issues, "officialResources", resource.id, "title", "Title is required");
    if (!resource.sourceLabel.trim()) add(issues, "officialResources", resource.id, "sourceLabel", "Source is required");
    if (!resource.rightsNote.trim()) add(issues, "officialResources", resource.id, "rightsNote", "Rights note is required");
    validateOfficialUrl(resource, "officialUrl", issues);
    validateOfficialUrl(resource, "fallbackUrl", issues);
    if (resource.skill === "all" && resource.task !== undefined) {
      add(issues, "officialResources", resource.id, "task", "An all-skill resource cannot target one task");
    } else if (resource.skill !== "all" && !validTaskForSkill(resource.skill, resource.task)) {
      add(issues, "officialResources", resource.id, "task", `Invalid task for ${resource.skill}`);
    }
  }

  for (const text of collections.readingTexts) {
    validateReview("readingTexts", text, issues);
    if (!text.title.trim()) add(issues, "readingTexts", text.id, "title", "Title is required");
    if (!text.passage.trim()) add(issues, "readingTexts", text.id, "passage", "Passage is required");
    if (!text.sourceNote.trim()) add(issues, "readingTexts", text.id, "sourceNote", "Source note is required");
  }

  for (const item of collections.practiceItems) {
    validateReview("practiceItems", item, issues);
    if (!item.prompt.trim()) add(issues, "practiceItems", item.id, "prompt", "Prompt is required");
    if (item.tags.length === 0) add(issues, "practiceItems", item.id, "tags", "At least one tag is required");

    if (item.kind === "mcq") {
      validateReadingItem(item, textById, issues);
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
    }
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
