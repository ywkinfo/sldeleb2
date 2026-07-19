# Spanish Lab DELE B2 - 향후 구현 과제

이 문서는 현재까지 완료된 구현과 local-first 범위 밖의 장기 과제를 기록합니다.

## 현재 콘텐츠 현황 (2026-07-18 기준)

- 게시된 세트 28개, 총 114문항. 읽기·듣기 모의고사 청사진과 읽기 Tarea
  2 매칭·Tarea 3 문장 삽입·Tarea 4 cloze 전용 상호작용을 제공한다.
- 듣기 Tarea 1·2·3·4·5는 모두 공식 청사진에 맞춘 6문항 세트를 최소 1개씩
  게시했다. Tarea 2는 남녀 대화 화자 판별, Tarea 4는 네 화자 매칭 형식으로
  재배치했으며 기존 콘텐츠 id는 유지했다.
- 쓰기 Tarea 1·2는 각 3세트, 말하기 Tarea 1·2·3은 각 2세트를 게시했다
  (2-c 참고).

## 1. 완료 — 듣기 Tarea 1, 2, 3, 4 분량 확장과 품질 검수

- Tarea 1 단문 6개, Tarea 2 남녀 대화 6문항, Tarea 4 네 화자 매칭 6문항으로
  확장하고, 기존 예술가 인터뷰를 Tarea 3 세트 6문항으로 재배치했다.
- 콘텐츠 데이터와 검수 메타데이터 반영, Edge TTS 음성 생성, 최종 재생 검수를
  완료했다.

## 1-b. 완료 — MCQ 연습 흐름 결함 수정 (2026-07-13)

- 읽기·듣기 문항 로직을 공용 `McqQuestion` 컴포넌트로 통합했다. 세트 기준
  연번 표시, 채점 후 선택지 잠금과 "다시 풀기", 새로고침 후 잠금 상태 복원,
  표준 라디오 키보드 조작(방향키·roving tabindex)과 단축키 안내를 적용했다.
- 공식 자료 Tarea 필터는 `task` 값이 있는 자료가 생길 때까지 숨긴다.
- 회귀 테스트: `tests/unit/lib/sets.test.ts`, `tests/unit/lib/grading.test.ts`(디스패처),
  `tests/e2e/mcq.spec.ts`(연번·잠금·재제출 방지·복원·키보드).
- 제출 전 별표는 스키마 영향 때문에 모의고사 설계와 함께 결정하기로 연기.

## 2. 완료 — 모의고사 세션 듣기 v1 (2026-07-13)

- 설계 확정본: `docs/mock-exam-session-design.md`. 핵심 결정 —
  별도 저장 키 `dele-b2:exam:v1`(`dele-b2:v1` 불변, 다운그레이드 안전),
  일괄 채점 + pending projection으로 복습 큐 연동, deadline 단일 진실의
  단일 finalize, 블루프린트 버전·결과 스냅샷, 오디오 재생 슬롯 2회,
  멀티탭 last-write-wins, terminal 세션 50개 보존.
- 구현: `/exam` 목록 + `/exam/exam-listening-b2` 세션(30문항/40분, 이어하기,
  새로고침 복원, 만료 자동 제출, 결과 정오표, 복습 큐 반영). 단위 테스트
  `tests/unit/lib/examSession.test.ts`, E2E `tests/e2e/exam-*.spec.ts` 7종.
- 전체 백업은 완료·만료된 세션을 포함한다. Web Locks 단일 writer는 장기 과제로
  남긴다.

## 2-b. 완료 — 모의고사 세션 읽기 (2026-07-15)

- 엔진: `ExamItemContract` skill 판별 union(읽기 `textId`/듣기 `scriptId`),
  음원과 대칭인 `ExamTextContract`·섹션 `textIds/texts` 동결, 하위호환 유지
  (듣기 스냅샷 형태 불변, frozen 판정은 items 유무만). 검증기·resolver·UI 분기.
- 콘텐츠: `exam-reading-b2`(70분, 36문항 = T1 6·T2 10·T3 6·T4 14). 신규 지문 3개
  (해외 생활 매칭·주 4일 근무 문장삽입·팟캐스트 cloze) + 30문항. T1은
  `set-reading-library` 재사용. 지문 10·문항 109·세트 23·블루프린트 2.
- 읽기 청사진 version 2에서 T1 MCQ·T2 reusable matching·T3 single-use
  sentence insertion·T4 cloze presentation을 세션에 동결한다. 마커·slot·공유
  선택지 계약 검증과 키보드·터치·모바일 지문 dialog를 구현했다.
- 완료 세션 50개 직렬화는 약 1.37 MiB이며 terminal-only 전체 백업과 기록
  재열람을 지원한다.

## 2-c. 완료 — 제출 전 별표와 쓰기·말하기 확장 (2026-07-18)

- **제출 전 별표(연습 모드):** 1-b에서 연기했던 항목. `dele-b2:v1`에 선택적
  최상위 필드 `pendingFlags?: Record<itemId, flaggedAt>`를 추가했다(스키마
  버전·AttemptState 불변 — 구버전은 필드를 무시하고, `updateAttempt`의
  스프레드 저장에서 보존된다). 별표는 해당 문항의 **첫 attempt 저장 시**
  (쓰기 초안 자동저장 포함) `attempt.flagged`로 흡수되고 엔트리는 제거된다.
  읽기·듣기 MCQ, 특수 읽기 presentation, 쓰기·말하기(SelfAssessment) 네
  영역 모두 채점·평가 전에 별표할 수 있다.
- 복습 보드: 미풀이 별표는 "아직 풀지 않음 · 별표" 행으로 노출하고 "별표
  해제"(확인창 없음)로 지운다. 정답률·취약 태그 분모에는 넣지 않는다.
  홈 복습 수에는 포함하되 "이어하기" 판단에는 쓰지 않는다.
- 손상 방어: `pendingFlags`는 엔트리 단위로 정화하고(맵 손상이 attempts를
  리셋시키지 않음), attempt와 겹치는 별표는 로드·병합·projection 시점에
  흡수한다. 구버전의 백업 병합·projection에서 별표가 유실될 수 있음은
  알려진 다운그레이드 제한(설계 문서 참고).
- **쓰기·말하기 확장:** 말하기 Tarea 1(`s-remote-work-debate`)·Tarea 2
  (`s-photo-mudanza`)·Tarea 3(`s-survey-tiempo-libre`), 쓰기 Tarea 1
  (`w-flight-claim`)·Tarea 2(`w-tourism-opinion`)를 각 단일 문항 세트로
  추가해 문항 114·세트 28이 됐다. 말하기 모범답안 길이는 speakTimeMin 내
  낭독 가능 여부를 수동 검수로 확인했다(자동 검증은 쓰기만).

## 3. (추후 장기 과제) AI 채점, 계정, 서버 동기화, 사용자 행동 분석
- **Context**: 서버가 필요 없는 정적 환경(Static Export) 원칙을 벗어나는 대규모 아키텍처 변경입니다.
- **Dependencies**: 데이터베이스 연동, 인증 체계, AI API 인프라.
