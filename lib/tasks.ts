import { readingTexts } from "@/data/readingTexts";
import { listeningScripts } from "@/data/listeningScripts";
import type { PracticeItem, Task } from "./types";

/*
 * Tarea(시험 과제 유형)는 문항이 아니라 지문/대본 쪽에 있다.
 * 읽기 MCQ는 textId, 듣기 MCQ는 scriptId로 간접 조회해야 하며,
 * id 문자열의 "t4" 같은 조각은 실제 task와 어긋날 수 있으므로
 * (예: listening-t4-entrevista-artista → tarea3) 반드시 필드를 읽는다.
 * data 모듈(대본 전문 포함)을 import하므로 서버 코드에서만 호출한다.
 */
const textTaskById = new Map<string, Task>(readingTexts.map((text) => [text.id, text.task]));
const scriptTaskById = new Map<string, Task>(listeningScripts.map((script) => [script.id, script.task]));

/** 문항의 Tarea를 해석한다. 쓰기·말하기는 item.task 직접, 읽기·듣기는 지문/대본 조회. */
export function getTaskForItem(item: PracticeItem): Task | undefined {
  if (item.kind !== "mcq") return item.task;
  if (item.skill === "reading") return textTaskById.get(item.textId);
  return scriptTaskById.get(item.scriptId);
}
