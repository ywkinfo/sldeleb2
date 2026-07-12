# Spanish Lab DELE B2 - 향후 구현 과제 (Phase C)

이 문서는 Phase A, B, C를 거치며 완료된 항목 외의 추가 과제 명세입니다.

## 1. 듣기 Tarea 1, 2, 4 콘텐츠와 음원 추가
- **Context**: 현재 연습 문항 세트에는 읽기 전체와 듣기 Tarea 3, 5 일부가 포함되어 있으나, DELE B2 듣기 시험의 완성도를 위해 누락된 Tarea 유형(1, 2, 4)의 보강이 필요합니다.
- **Dependencies**: 
  - 신규 스크립트 작성 및 음성 합성(TTS) 파이프라인.
  - `data/practiceItems.ts` 및 `lib/sets.ts`에 아이템 매핑.
- **Acceptance Criteria**:
  - Tarea 1(단문 듣고 객관식), Tarea 2(장문 듣고 역할/주제 연결), Tarea 4(인터뷰 듣고 객관식)의 형식에 맞는 문항이 1세트 이상 추가된다.
  - `npm run validate:content` 및 `npm run generate:audio`가 성공적으로 수행된다.

## 2. (추후 장기 과제) AI 채점, 계정, 서버 동기화, 사용자 행동 분석
- **Context**: 서버가 필요 없는 정적 환경(Static Export) 원칙을 벗어나는 대규모 아키텍처 변경입니다.
- **Dependencies**: 데이터베이스 연동, 인증 체계, AI API 인프라.
