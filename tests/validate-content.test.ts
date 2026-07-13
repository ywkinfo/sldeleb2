import { describe, expect, it } from "vitest";
import type {
  ContentCollections,
} from "../lib/validate";
import { validateContent } from "../lib/validate";
import { examBlueprints } from "../data/examBlueprints";
import { listeningScripts } from "../data/listeningScripts";
import { officialResources } from "../data/officialResources";
import { practiceItems } from "../data/practiceItems";
import { practiceSets } from "../data/practiceSets";
import { readingTexts } from "../data/readingTexts";

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
    listeningScripts: [
      {
        id: "script-1",
        task: "tarea3",
        title: "Entrevista",
        audioSrc: "/audio/listening/script-1.m4a",
        transcript: "PERIODISTA: Hola.\nDOCTORA: Buenas tardes.",
        voices: { PERIODISTA: "es-MX-JorgeNeural", DOCTORA: "es-ES-ElviraNeural" },
        rate: "+0%",
        sourceNote: "창작 스크립트",
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
      {
        id: "listen-1",
        skill: "listening",
        kind: "mcq",
        scriptId: "script-1",
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
      {
        id: "set-2",
        title: "짧은 듣기",
        estimatedMin: 10,
        skill: "listening",
        itemIds: ["listen-1"],
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
    if (originalItem.kind !== "mcq" || originalItem.skill !== "reading") {
      throw new Error("Expected reading fixture");
    }
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

  it("detects broken listening script references and invalid audio paths", () => {
    const base = validCollections();
    const listeningItem = base.practiceItems[1];
    if (listeningItem.kind !== "mcq" || listeningItem.skill !== "listening") {
      throw new Error("Expected listening fixture");
    }
    const data: ContentCollections = {
      ...base,
      listeningScripts: [
        { ...base.listeningScripts[0], audioSrc: "media/script-1.m4a" },
      ],
      practiceItems: [
        base.practiceItems[0],
        { ...listeningItem, scriptId: "missing" },
      ],
    };
    const fields = validateContent(data).map((issue) => issue.field);
    expect(fields).toEqual(expect.arrayContaining(["audioSrc", "scriptId"]));
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

describe("exam blueprint validation", () => {
  const realCollections: ContentCollections = {
    officialResources,
    readingTexts,
    listeningScripts,
    practiceItems,
    practiceSets,
    examBlueprints,
  };

  it("accepts the shipped listening blueprint against real content", () => {
    expect(validateContent(realCollections)).toEqual([]);
  });

  it("rejects a blueprint that does not cover Tarea 1-5 in order", () => {
    const broken = {
      ...realCollections,
      examBlueprints: [
        { ...examBlueprints[0], sections: examBlueprints[0].sections.slice(0, 4) },
      ],
    };
    expect(
      validateContent(broken).some(
        (issue) => issue.collection === "examBlueprints" && issue.message.includes("in order"),
      ),
    ).toBe(true);
  });

  it("rejects unknown sets and task/script mismatches", () => {
    const sections = examBlueprints[0].sections.map((section) =>
      section.task === "tarea5" ? { ...section, setId: "missing-set" } : section,
    );
    // Tarea 2 슬롯에 Tarea 3 세트를 꽂으면 스크립트 task 불일치가 잡혀야 한다.
    const swapped = sections.map((section) =>
      section.task === "tarea2" ? { ...section, setId: "set-listening-t3-arte" } : section,
    );
    const issues = validateContent({
      ...realCollections,
      examBlueprints: [{ ...examBlueprints[0], sections: swapped }],
    });
    expect(issues.some((issue) => issue.message.includes("Unknown practice set: missing-set"))).toBe(true);
    expect(issues.some((issue) => issue.message.includes("section expects tarea2"))).toBe(true);
  });

  it("rejects sections whose sets are not exactly six items", () => {
    const shortSet = practiceSets.find((set) => set.id === "set-reading-career");
    expect(shortSet).toBeDefined();
    const issues = validateContent({
      ...realCollections,
      examBlueprints: [
        {
          ...examBlueprints[0],
          sections: examBlueprints[0].sections.map((section) =>
            section.task === "tarea1" ? { ...section, setId: "set-reading-career" } : section,
          ),
        },
      ],
    });
    expect(issues.some((issue) => issue.message.includes("exactly 6 items"))).toBe(true);
  });
});
