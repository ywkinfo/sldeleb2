import { describe, expect, it } from "vitest";
import type {
  ContentCollections,
} from "../lib/validate";
import { validateContent } from "../lib/validate";

function validCollections(): ContentCollections {
  const review = {
    status: "published" as const,
    reviewedBy: "Spanish Lab",
    reviewedAt: "2026-07-11T00:00:00.000Z",
  };
  return {
    officialResources: [
      {
        id: "official-1",
        title: "공식 모델 시험",
        year: null,
        skill: "all",
        resourceType: "interactive",
        officialUrl: "https://cvc.cervantes.es/ensenanza/dele/b2/",
        fallbackUrl: "https://examenes.cervantes.es/es/dele/preparar-prueba/modelos-examen",
        sourceLabel: "Instituto Cervantes / CVC",
        rightsNote: "공식 자료 링크 — 사이트 내 재호스팅 아님",
      },
    ],
    readingTexts: [
      {
        id: "text-1",
        task: "tarea1",
        title: "Texto",
        passage: "Un texto de práctica.",
        sourceNote: "창작 지문",
        ...review,
      },
    ],
    practiceItems: [
      {
        id: "read-1",
        skill: "reading",
        kind: "mcq",
        textId: "text-1",
        prompt: "Pregunta",
        options: [
          { key: "a", text: "A" },
          { key: "b", text: "B" },
        ],
        correctAnswer: "a",
        explanationKo: "A가 정답입니다.",
        tags: ["detalle"],
        ...review,
      },
    ],
    practiceSets: [
      {
        id: "set-1",
        title: "짧은 연습",
        estimatedMin: 10,
        skill: "reading",
        itemIds: ["read-1"],
        ...review,
      },
    ],
  };
}

describe("content validation", () => {
  it("accepts a consistent reviewed content graph", () => {
    expect(validateContent(validCollections())).toEqual([]);
  });

  it("detects duplicate IDs, missing text references, and invalid answers", () => {
    const base = validCollections();
    const originalItem = base.practiceItems[0];
    if (originalItem.kind !== "mcq") throw new Error("Expected reading fixture");
    const data: ContentCollections = {
      ...base,
      readingTexts: [...base.readingTexts, { ...base.readingTexts[0] }],
      practiceItems: [
        {
          ...originalItem,
          textId: "missing",
          correctAnswer: "z",
        },
      ],
    };
    const fields = validateContent(data).map((issue) => issue.field);
    expect(fields).toEqual(expect.arrayContaining(["id", "textId", "correctAnswer"]));
  });

  it("rejects invalid skill/task combinations on official resources", () => {
    const base = validCollections();
    const data: ContentCollections = {
      ...base,
      officialResources: [
        {
          ...base.officialResources[0],
          skill: "writing",
          task: "tarea5",
        },
      ],
    };
    expect(validateContent(data).some((issue) => issue.field === "task")).toBe(true);
  });

  it("blocks an unreviewed item from a published set", () => {
    const base = validCollections();
    const data: ContentCollections = {
      ...base,
      practiceItems: [{ ...base.practiceItems[0], status: "draft" }],
    };
    expect(
      validateContent(data).some(
        (issue) =>
          issue.collection === "practiceSets" &&
          issue.message.includes("references draft item"),
      ),
    ).toBe(true);
  });
});
