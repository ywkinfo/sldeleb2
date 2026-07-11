import type { OfficialResource } from '../lib/types';

const modelPortal =
  'https://examenes.cervantes.es/es/dele/preparar-prueba/modelos-examen';
const preparationPortal =
  'https://examenes.cervantes.es/es/dele/preparar-prueba';
const b2Overview = 'https://examenes.cervantes.es/es/dele/examenes/b2';

export const officialResources = [
  {
    id: 'cvc-b2-interactive-model',
    title: 'CVC DELE B2 모델 시험',
    year: null,
    skill: 'all',
    resourceType: 'interactive',
    officialUrl: 'https://cvc.cervantes.es/ensenanza/dele/b2/index.htm',
    fallbackUrl: modelPortal,
    sourceLabel: 'Instituto Cervantes / CVC',
    rightsNote: '공식 자료 링크 — Spanish Lab 사이트 내 재호스팅 아님',
  },
  {
    id: 'dele-b2-model-portal',
    title: 'DELE B2 모델 시험 자료 모음',
    year: null,
    skill: 'all',
    resourceType: 'booklet',
    officialUrl: modelPortal,
    fallbackUrl: preparationPortal,
    sourceLabel: 'Instituto Cervantes',
    rightsNote: '공식 자료 링크 — Spanish Lab 사이트 내 재호스팅 아님',
  },
  {
    id: 'dele-b2-audio-resources',
    title: 'DELE B2 2013 시행 듣기 음원 자료',
    year: 2013,
    skill: 'listening',
    resourceType: 'audio',
    officialUrl: modelPortal,
    fallbackUrl: preparationPortal,
    sourceLabel: 'Instituto Cervantes',
    rightsNote: '공식 음원 안내 링크 — Spanish Lab 사이트 내 복제·재생성 아님',
  },
  {
    id: 'dele-b2-transcripts',
    title: 'DELE B2 2013 시행 듣기 전사 자료',
    year: 2013,
    skill: 'listening',
    resourceType: 'transcript',
    officialUrl: modelPortal,
    fallbackUrl: preparationPortal,
    sourceLabel: 'Instituto Cervantes',
    rightsNote: '공식 전사 자료 안내 링크 — Spanish Lab 사이트 내 재호스팅 아님',
  },
  {
    id: 'dele-b2-answer-keys',
    title: 'DELE B2 2013 시행 모델 시험 정답',
    year: 2013,
    skill: 'reading',
    resourceType: 'answers',
    officialUrl: modelPortal,
    fallbackUrl: preparationPortal,
    sourceLabel: 'Instituto Cervantes',
    rightsNote: '공식 정답 자료 안내 링크 — Spanish Lab 사이트 내 재호스팅 아님',
  },
  {
    id: 'dele-b2-exam-overview',
    title: 'DELE B2 시험 구성과 평가 안내',
    year: null,
    skill: 'all',
    resourceType: 'interactive',
    officialUrl: b2Overview,
    fallbackUrl: preparationPortal,
    sourceLabel: 'Instituto Cervantes',
    rightsNote: '공식 시험 안내 링크 — 최신 정보는 연결된 원문에서 확인',
  },
] satisfies OfficialResource[];
