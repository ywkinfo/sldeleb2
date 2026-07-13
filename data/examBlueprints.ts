import type { ExamBlueprint } from '../lib/types';

// 블루프린트가 세트 구성·순서의 유일한 결정자다 — Tarea 3 세트가 두 개
// (set-listening-t3-arte, set-listening-interview) 있으므로 추론하지 않는다.
// 구성(세트·순서)을 바꿀 때는 반드시 version을 올린다.
export const examBlueprints = [
  {
    id: 'exam-listening-b2',
    version: 1,
    title: '듣기 모의고사 · Tarea 1–5',
    skill: 'listening',
    timeLimitMin: 40,
    sections: [
      { task: 'tarea1', setId: 'set-listening-t1' },
      { task: 'tarea2', setId: 'set-listening-t2' },
      { task: 'tarea3', setId: 'set-listening-t3-arte' },
      { task: 'tarea4', setId: 'set-listening-t4' },
      { task: 'tarea5', setId: 'set-listening-lecture' },
    ],
  },
] satisfies ExamBlueprint[];

export function getBlueprintById(blueprintId: string): ExamBlueprint | undefined {
  return examBlueprints.find((blueprint) => blueprint.id === blueprintId);
}
