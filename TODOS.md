# Spanish Lab DELE B2 - 향후 구현 과제

이 문서는 Phase A, B, C를 거치며 완료된 항목 외의 추가 과제 명세입니다.

## 현재 콘텐츠 현황 (2026-07-12 기준)

- 게시된 세트 19개(읽기 7 · 듣기 5 · 쓰기 4 · 말하기 3), 총 61문항.
- 듣기는 Tarea 1~5 모두 최소 1세트씩 게시됨. 다만 Tarea별 문항 수는
  T1 1개 · T2 3개 · T3 6개 · T4 2개 · T5 6개로 편차가 크다.

## 1. 듣기 Tarea 1, 2, 4 분량 확장과 품질 검수

- **Context**: Tarea 1·2·4는 형식 견본 수준(각 1~3문항)만 게시되어 있다.
  실제 시험 청사진(각 Tarea당 6문항)에 맞춰 분량을 확장하고, 기존 문항을
  포함해 시험 형식 부합 여부를 검수해야 한다. "신규 구현"이 아니라
  "확장·검수" 과제다.
- **Dependencies**:
  - 신규 스크립트 작성 및 기존 Edge TTS 음성 합성 파이프라인 재사용.
  - `data/practiceItems.ts`, `data/listeningScripts.ts`, `data/practiceSets.ts` 매핑.
- **Acceptance Criteria**:
  - Tarea 1(단문 듣고 객관식), Tarea 2(장문 듣고 역할/주제 연결),
    Tarea 4(인터뷰 듣고 객관식)가 각각 시험 형식에 맞는 문항 수(6문항 기준)로 확장된다.
  - `npm run validate:content` 및 `npm run generate:audio`가 성공적으로 수행된다.
  - 이 확장이 끝난 뒤에만 모의고사 모드 설계를 검토한다.

## 2. (추후 장기 과제) AI 채점, 계정, 서버 동기화, 사용자 행동 분석
- **Context**: 서버가 필요 없는 정적 환경(Static Export) 원칙을 벗어나는 대규모 아키텍처 변경입니다.
- **Dependencies**: 데이터베이스 연동, 인증 체계, AI API 인프라.
