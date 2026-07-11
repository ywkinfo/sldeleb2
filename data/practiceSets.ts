import type { PracticeSet } from '../lib/types';

const review = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-11',
};

export const practiceSets = [
  {
    id: 'set-reading-library',
    title: 'Tarea 1 · 공유 도서관',
    estimatedMin: 12,
    skill: 'reading',
    itemIds: ['r-lib-01', 'r-lib-02', 'r-lib-03', 'r-lib-04', 'r-lib-05', 'r-lib-06'],
    ...review,
  },
  {
    id: 'set-reading-town',
    title: 'Tarea 1 · 재택근무와 마을',
    estimatedMin: 12,
    skill: 'reading',
    itemIds: [
      'r-town-01',
      'r-town-02',
      'r-town-03',
      'r-town-04',
      'r-town-05',
      'r-town-06',
    ],
    ...review,
  },
  {
    id: 'set-reading-career',
    title: 'Tarea 3 · 네 사람의 직업 전환',
    estimatedMin: 9,
    skill: 'reading',
    itemIds: ['r-career-01', 'r-career-02', 'r-career-03', 'r-career-04'],
    ...review,
  },
  {
    id: 'set-reading-grammar',
    title: 'Tarea 4 · 옥상 텃밭 연결어',
    estimatedMin: 8,
    skill: 'reading',
    itemIds: ['r-garden-01', 'r-garden-02', 'r-garden-03', 'r-garden-04', 'r-garden-05'],
    ...review,
  },
  {
    id: 'set-writing-formal',
    title: '쓰기 Tarea 1 · 격식 있는 의견 전달',
    estimatedMin: 40,
    skill: 'writing',
    itemIds: ['w-neighborhood-noise'],
    ...review,
  },
  {
    id: 'set-writing-article',
    title: '쓰기 Tarea 2 · 지역 잡지 기사',
    estimatedMin: 40,
    skill: 'writing',
    itemIds: ['w-local-market-article'],
    ...review,
  },
  {
    id: 'set-speaking-opinion',
    title: '말하기 Tarea 1 · 도시 정책 발표',
    estimatedMin: 9,
    skill: 'speaking',
    itemIds: ['s-public-space'],
    ...review,
  },
] satisfies PracticeSet[];
