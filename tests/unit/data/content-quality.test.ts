import { describe, expect, it } from "vitest";
import { practiceItems } from "@/data/practiceItems";

// 쓰기·말하기 저작 관행 중 자동 검증 가능한 규칙. validate:content가 다루지
// 않는 편집 규칙(체크리스트 정확히 5개, " → "로 연결한 모범 개요)을 회귀로
// 잠근다. 모범답안 길이는 쓰기만 validate:content가 검사하고, 말하기는
// speakTimeMin 내 낭독 가능 여부를 수동 검수로 확인한다.
describe("writing/speaking authoring conventions", () => {
  const openItems = practiceItems.filter(
    (item) => item.kind === "open" || item.kind === "oral",
  );

  it("ships the planned catalog size and writing/speaking task coverage", () => {
    expect(practiceItems).toHaveLength(114);
    expect(
      openItems.reduce<Record<string, number>>((counts, item) => {
        const key = `${item.skill}:${item.task}`;
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual({
      "writing:tarea1": 3,
      "writing:tarea2": 3,
      "speaking:tarea1": 2,
      "speaking:tarea2": 2,
      "speaking:tarea3": 2,
    });
  });

  it("keeps the five Task 5 additions in the published catalog", () => {
    const ids = openItems.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining([
      "w-flight-claim",
      "w-tourism-opinion",
      "s-remote-work-debate",
      "s-photo-mudanza",
      "s-survey-tiempo-libre",
    ]));
  });

  it("keeps exactly five self-check checklist lines per item", () => {
    for (const item of openItems) {
      expect(item.checklistKo, item.id).toHaveLength(5);
    }
  });

  it("joins model outlines with ' → ' stages", () => {
    for (const item of openItems) {
      expect(item.modelOutlineKo, item.id).toContain(" → ");
    }
  });
});
