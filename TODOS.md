# Spanish Lab DELE B2 - 향후 구현 과제 (Phase C)

이 문서는 Phase A 및 Phase B 범위를 벗어나는 추가 과제들의 명세입니다.

## 1. 듣기 Tarea 1, 2, 4 콘텐츠와 음원 추가
- **Context**: 현재 연습 문항 세트에는 읽기 전체와 듣기 Tarea 3, 5 일부가 포함되어 있으나, DELE B2 듣기 시험의 완성도를 위해 누락된 Tarea 유형(1, 2, 4)의 보강이 필요합니다.
- **Dependencies**: 
  - 신규 스크립트 작성 및 음성 합성(TTS) 파이프라인.
  - `data/practiceItems.ts` 및 `lib/sets.ts`에 아이템 매핑.
- **Acceptance Criteria**:
  - Tarea 1(단문 듣고 객관식), Tarea 2(장문 듣고 역할/주제 연결), Tarea 4(인터뷰 듣고 객관식)의 형식에 맞는 문항이 1세트 이상 추가된다.
  - `npm run validate:content` 및 `npm run generate:audio`가 성공적으로 수행된다.

## 2. 오늘의 복습 및 취약 태그 추천
- **Context**: 단순히 오답을 나열하는 복습 대기열(ReviewBoard)을 넘어, 사용자가 가장 취약한 영역(예: 특정 문법 태그, 오답 빈도 높은 Tarea)을 분석하여 맞춤형 복습을 제안하는 기능입니다.
- **Dependencies**: 
  - Phase B의 세트 중심 진도 모델 안정화.
  - 문항별 태그 메타데이터 보강.
- **Acceptance Criteria**:
  - `localStorage` 진도를 분석하여 오답률이 가장 높은 태그를 화면에 표시한다.
  - 하루 단위로 복습할 문항 3~5개를 선별하여 "오늘의 복습" 형태로 제공한다.

## 3. 쓰기 초안 자동저장과 JSON 가져오기·내보내기
- **Context**: 사용자가 작성 중인 긴 쓰기(Tarea 1, 2) 답변이 브라우저 탭 종료 시 날아가는 것을 방지하고, 기기 간 진도를 수동으로 옮길 수 있게 합니다.
- **Dependencies**: 
  - `useAttempts` 훅 및 `StorageNotice` 컴포넌트 확장.
  - `completed` 상태가 아닌 작성 중인 텍스트 상태(draft) 저장 지원.
- **Acceptance Criteria**:
  - 쓰기 입력란 내용이 변경될 때마다 디바이스의 `localStorage`에 자동 임시 저장된다.
  - 설정 또는 복습 탭에서 현재 저장된 진도(attempts)를 JSON 문자열로 클립보드에 복사할 수 있다.
  - 유효한 JSON을 붙여넣어 현재 기기의 진도를 덮어쓰거나 병합할 수 있다.

## 4. 쓰기·말하기 다차원 루브릭
- **Context**: 현재 쓰기/말하기 자기평가는 단순히 1~3점 척도를 사용하지만, 실제 DELE 시험은 과제 수행도(Cumplimiento de la tarea), 어휘(Alcance), 문법(Corrección), 유창성(Fluidez) 등 다차원 루브릭으로 채점됩니다.
- **Dependencies**: 
  - 자기평가 UI(`WritingTask.tsx`, `SpeakingTask.tsx`) 개편.
  - `schemaVersion` 마이그레이션 혹은 하위 호환성 유지.
- **Acceptance Criteria**:
  - 채점 기준표(Rubric)에 따라 세부 항목별로 자가 진단할 수 있는 UI가 제공된다.
  - 세부 점수의 평균 혹은 환산 점수가 진행률 및 통계 화면에 올바르게 반영된다.

## 5. (추후 장기 과제) AI 채점, 계정, 서버 동기화, 사용자 행동 분석
- **Context**: 서버가 필요 없는 정적 환경(Static Export) 원칙을 벗어나는 대규모 아키텍처 변경입니다.
- **Dependencies**: 데이터베이스 연동, 인증 체계, AI API 인프라.
