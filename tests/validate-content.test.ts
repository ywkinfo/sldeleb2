import { describe, expect, it } from "vitest";
import type {
  ContentCollections,
} from "../lib/validate";
import type { SpeakingTaskItem, WritingTaskItem } from "../lib/types";
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

  it("accepts the full shipped content graph (all real collections)", () => {
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

describe("model answer (modelAnswerEs) validation", () => {
  const review = {
    status: "published" as const,
    reviewedBy: "Spanish Lab",
    reviewedAt: "2026-07-14",
  };

  function writingItem(overrides: Partial<WritingTaskItem> = {}): WritingTaskItem {
    return {
      id: "write-1",
      skill: "writing",
      kind: "open",
      task: "tarea1",
      prompt: "Escribe un correo.",
      wordCount: [2, 3],
      timeLimitMin: 40,
      checklistKo: ["요건"],
      modelOutlineKo: "개요",
      modelAnswerEs: "Hola amigo",
      tags: ["email"],
      ...review,
      ...overrides,
    };
  }

  function oralItem(overrides: Partial<SpeakingTaskItem> = {}): SpeakingTaskItem {
    return {
      id: "oral-1",
      skill: "speaking",
      kind: "oral",
      task: "tarea1",
      prompt: "Haz una presentación.",
      prepTimeMin: 3,
      speakTimeMin: 3,
      checklistKo: ["요건"],
      modelOutlineKo: "개요",
      modelAnswerEs: "Buenos días a todos",
      tags: ["presentacion"],
      ...review,
      ...overrides,
    };
  }

  // 다른 컬렉션과 무관하게 대상 문항만 검증한다. 세트 순서 가정을 건드리지 않는다.
  function only(items: (WritingTaskItem | SpeakingTaskItem)[]): ContentCollections {
    return {
      officialResources: [],
      readingTexts: [],
      listeningScripts: [],
      practiceItems: items,
      practiceSets: [],
    };
  }

  const modelAnswerIssues = (collections: ContentCollections) =>
    validateContent(collections).filter((issue) => issue.field === "modelAnswerEs");

  it("requires a non-empty Spanish model answer on writing items", () => {
    const issues = modelAnswerIssues(only([writingItem({ modelAnswerEs: "   " })]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ collection: "practiceItems", id: "write-1", field: "modelAnswerEs" });
    expect(issues[0].message).toMatch(/required/i);
  });

  it("requires a non-empty Spanish model answer on speaking items", () => {
    const issues = modelAnswerIssues(only([oralItem({ modelAnswerEs: "" })]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ collection: "practiceItems", id: "oral-1", field: "modelAnswerEs" });
    expect(issues[0].message).toMatch(/required/i);
  });

  it("accepts writing answers at the exact word-count bounds", () => {
    expect(modelAnswerIssues(only([writingItem({ modelAnswerEs: "Hola amigo" })]))).toEqual([]); // 2 = 하한
    expect(modelAnswerIssues(only([writingItem({ modelAnswerEs: "Hola querido amigo" })]))).toEqual([]); // 3 = 상한
  });

  it("blocks writing answers outside the word-count range", () => {
    const below = modelAnswerIssues(only([writingItem({ modelAnswerEs: "Hola" })])); // 1 < 2
    expect(below).toHaveLength(1);
    expect(below[0].message).toMatch(/got 1/);

    const above = modelAnswerIssues(only([writingItem({ modelAnswerEs: "Hola querido buen amigo" })])); // 4 > 3
    expect(above).toHaveLength(1);
    expect(above[0].message).toMatch(/got 4/);
  });

  it("does not add a length issue on top of a missing-answer issue", () => {
    const issues = modelAnswerIssues(only([writingItem({ modelAnswerEs: "" })]));
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/required/i);
  });

  it("does not apply word-count checks to speaking answers", () => {
    // 아주 짧은 말하기 답안도 길이 문제로 막지 않는다(낭독 검수로 확인).
    expect(modelAnswerIssues(only([oralItem({ modelAnswerEs: "Hola" })]))).toEqual([]);
  });
});

describe("reading exam blueprint & content", () => {
  const realCollections: ContentCollections = {
    officialResources,
    readingTexts,
    listeningScripts,
    practiceItems,
    practiceSets,
    examBlueprints,
  };
  const readingBp = examBlueprints.find((bp) => bp.id === "exam-reading-b2");

  function readingBpWithSection(task: string, setId: string): ContentCollections {
    if (!readingBp) throw new Error("exam-reading-b2 blueprint missing");
    return {
      ...realCollections,
      examBlueprints: [
        { ...readingBp, sections: readingBp.sections.map((s) => (s.task === task ? { ...s, setId } : s)) },
      ],
    };
  }

  const mcqOptions = (id: string) => {
    const item = practiceItems.find((candidate) => candidate.id === id);
    if (!item || item.kind !== "mcq") throw new Error(`Missing reading MCQ item: ${id}`);
    return item.options;
  };

  it("ships a valid exam-reading-b2 against real content", () => {
    expect(readingBp).toBeDefined();
    expect(validateContent(realCollections)).toEqual([]);
  });

  it("rejects a same-size T1 set swapped into the reading T3 section (text task mismatch)", () => {
    // set-reading-town: 6문항이지만 지문 task가 tarea1이라 tarea3 섹션에 넣으면 거부돼야 한다.
    const issues = validateContent(readingBpWithSection("tarea3", "set-reading-town"));
    expect(issues.some((issue) => issue.message.includes("section expects tarea3"))).toBe(true);
  });

  it("rejects a reading T2 section whose set has the wrong item count", () => {
    // set-reading-cinema: 지문 task는 tarea2로 맞지만 6문항이라 10문항 요구에 걸린다.
    const issues = validateContent(readingBpWithSection("tarea2", "set-reading-cinema"));
    expect(issues.some((issue) => issue.message.includes("exactly 10 items"))).toBe(true);
  });

  it("rejects the same item belonging to two different sets (single-ownership)", () => {
    const dup: ContentCollections = {
      ...realCollections,
      practiceSets: [
        ...realCollections.practiceSets,
        {
          id: "dup-set",
          title: "중복 소속",
          estimatedMin: 5,
          skill: "reading",
          itemIds: ["r-anio-01"],
          status: "published",
          reviewedBy: "Spanish Lab",
          reviewedAt: "2026-07-15",
        },
      ],
    };
    expect(validateContent(dup).some((issue) => issue.message.includes("already belongs to set"))).toBe(true);
  });

  it("T2 has 10 items sharing four common options", () => {
    const t2 = practiceItems.filter((item) => item.id.startsWith("r-anio-"));
    expect(t2).toHaveLength(10);
    const keys = mcqOptions("r-anio-01").map((option) => option.key);
    expect(keys).toHaveLength(4);
    for (const item of t2) {
      expect(mcqOptions(item.id).map((option) => option.key)).toEqual(keys);
    }
  });

  it("T3 has 6 items over 8 common fragments with distinct correct answers", () => {
    const t3 = practiceItems.filter((item) => item.id.startsWith("r-sem4-"));
    expect(t3).toHaveLength(6);
    const answers: string[] = [];
    for (const item of t3) {
      expect(mcqOptions(item.id)).toHaveLength(8);
      if (item.kind === "mcq") answers.push(item.correctAnswer);
    }
    expect(new Set(answers).size).toBe(6);
  });

  it("T4 has 14 cloze items with three options each", () => {
    const t4 = practiceItems.filter((item) => item.id.startsWith("r-pod-"));
    expect(t4).toHaveLength(14);
    for (const item of t4) {
      expect(mcqOptions(item.id)).toHaveLength(3);
    }
  });
});
