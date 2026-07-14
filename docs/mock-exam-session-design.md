# DELE B2 모의고사 세션 설계 (확정본)

확정일: 2026-07-13. 초안(work/mock-exam-session-design.md, 비추적)을 엔지니어링 리뷰
결과로 대체한다. TODOS.md 2번 과제의 산출물이다.

## 목적과 v1 범위

실제 시험 환경(제한 시간·일괄 채점·재생 제한)을 재현하는 모의고사 세션.

- **v1은 듣기 영역만.** 현재 콘텐츠 중 듣기만 공식 청사진(Tarea 1~5 × 6문항
  = 30문항 / 40분)과 정확히 일치한다.
- 블루프린트는 세트 ID를 명시적 순서로 나열한다. Tarea 3 세트가 두 개
  (`set-listening-t3-arte`, `set-listening-interview`) 존재하므로 순서·구성은
  항상 블루프린트가 결정하고, 추론하지 않는다.
- 읽기는 공식 36문항 대비 콘텐츠가 부족(약 21~23문항)하므로 콘텐츠 보강 후
  확장한다. 데이터 모델은 `AutoGradedExamSkill = "reading" | "listening"`
  까지만 일반화한다(쓰기·말하기는 `answers: Record<string, string>` 계약과
  맞지 않으므로 범위 밖).

## 저장 아키텍처 — 별도 키, `dele-b2:v1` 불변

- 세션은 새 localStorage 키 **`dele-b2:exam:v1`** 에 저장한다:
  `{ schemaVersion: 1, sessions: ExamSession[] }`.
- **`dele-b2:v1`(ProgressSnapshot)의 스키마·검증은 절대 변경하지 않는다.**
  근거: 기존 클라이언트는 같은 키의 파싱 실패 시 빈 스냅샷으로 리셋한다
  (lib/storage.ts). 같은 키에서 스키마를 올리면 배포 후 열려 있는 구버전
  탭이 진도를 초기화할 수 있다. 별도 키는 구버전이 무시하므로 안전하다.
- 진도 export/import(v1)에는 세션이 포함되지 않는다. 세션 export/import는
  범위 밖(후속 과제).

## 데이터 모델

```ts
type AutoGradedExamSkill = "reading" | "listening";

interface ExamBlueprint {
  id: string;                 // "exam-listening-b2"
  version: number;            // 구성 변경 시 증가
  title: string;
  skill: AutoGradedExamSkill;
  timeLimitMin: number;       // 듣기 40
  sections: { task: Task; setId: string }[]; // 명시적 순서
}

// 세션 시작 시 고정되는 구성 스냅샷 — 이후 콘텐츠/블루프린트가 바뀌어도
// 진행 중 세션은 자신의 스냅샷으로 채점·표시한다. 순서(itemIds/scriptIds)뿐
// 아니라 문항·정답·음원 계약(items/scripts)까지 동결한다.
interface ExamItemContract {
  id: string;
  skill: AutoGradedExamSkill;
  kind: "mcq";
  scriptId?: string;          // 듣기 문항만
  prompt: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanationKo: string;
}

interface ExamScriptContract {
  scriptId: string;
  title: string;
  audioSrc: string;           // 경로 문자열만 동결(같은 경로 덮어쓰기는 미보호 — 후속 과제)
}

interface ExamSectionSnapshot {
  task: Task;
  setId: string;
  itemIds: string[];          // items[].id(mcq 문항)와 정확히 일치
  scriptIds: string[];        // scripts[].scriptId와 정확히 일치
  items?: ExamItemContract[];    // 선택: 없으면 옛(ID-only) 세션 → 로드 시 라이브 폴백
  scripts?: ExamScriptContract[];
}

interface ExamResultItem {
  itemId: string;
  task: Task;
  selectedAnswer?: string;    // 미응답이면 없음
  correctAnswer: string;
  correct: boolean;
}

interface ExamResult {
  correct: number;
  total: number;
  byTask: Partial<Record<Task, { correct: number; total: number }>>;
  items: ExamResultItem[];    // 콘텐츠가 삭제돼도 정오표·점수 표시 가능
}

type ProgressProjection =
  | { status: "pending"; attempts: AttemptState[] }   // 복습 큐로 투영할 payload
  | { status: "complete" };

interface ExamSessionBase {
  id: string;
  blueprintId: string;
  blueprintVersion: number;
  sections: ExamSectionSnapshot[];
  startedAt: number;
  deadlineAt: number;         // startedAt + timeLimitMin. 일시정지 없음.
  answers: Record<string, string>;
  flaggedItemIds: string[];   // 제출 전 검토용 별표 (attempt에 복사하지 않음)
  playbacks: Record<string, { used: number; active: boolean }>; // scriptId별 슬롯
}

type ExamSession =
  | (ExamSessionBase & { status: "in-progress"; result?: never; submittedAt?: never })
  | (ExamSessionBase & {
      status: "submitted" | "expired";
      submittedAt: number;
      result: ExamResult;
      progressProjection: ProgressProjection;
    });
```

판별 union으로 "submitted인데 result 없음", "in-progress인데 submittedAt 있음"
같은 상태를 타입 수준에서 배제한다.

## 콘텐츠 동결과 검증 (all-or-nothing)

- 세션 시작 시 `snapshotBlueprint`가 각 문항의 prompt·options·correctAnswer·
  explanation과 음원 title·audioSrc를 계약으로 동결한다. `resolveSections`·
  `finalizeSession`·결과 화면은 **동결 계약만** 읽는다. 계약이 없는 옛 세션
  (items/scripts 부재)만 현재 콘텐츠로 폴백한다.
- **all-or-nothing:** 한 세션의 모든 섹션은 함께 동결이거나 함께 옛 형식이어야
  한다. `resolveSections`는 세션에 동결 섹션이 하나라도 있으면 전체를 동결로
  취급해 어떤 섹션도 라이브를 읽지 않는다(혼합 세션 방어).
- **저장 검증(`isExamSession`)**: `dele-b2:exam:v1` 스키마 버전은 유지(선택
  필드 추가)하되, 동결 세션은 (1) items·scripts 동시 존재, (2) itemIds·
  scriptIds와 계약 ID의 정확한 일치(누락·잉여·중복 금지), (3) correctAnswer가
  선택지 키에 존재, (4) 듣기 문항 scriptId가 섹션 scriptIds에 포함을 모두
  만족해야 한다. 하나라도 어기면 파싱 실패로 간주해 스냅샷 전체를 초기화한다
  (손상·변조 방어). 정상 콘텐츠(`lib/validate.ts` 통과)로 생성한 세션은 항상
  만족하므로 기존 이력은 초기화되지 않는다.
- **후속 과제:** 불완전 세션 하나가 전체 이력 초기화를 유발하므로 세션별
  격리 복구가 필요하고, `audioSrc` 문자열만 동결하므로 같은 경로 파일을
  덮어쓰면 과거 세션 음원이 바뀐다(콘텐츠 해시 파일명으로 보강 필요).

## 상태 전이 — 단일 finalize

- `finalizeSession(session, resolvedItems, now, requestedReason)` 하나로 통합:
  - `now >= deadlineAt`이면 사유와 무관하게 **`expired`**, 이전이면 `submitted`.
  - terminal 세션에 재호출하면 **완전한 no-op**(만료 자동 제출과 수동 제출이
    경합해도 채점은 1회).
  - 답변·별표·재생 슬롯 변경은 terminal 상태 또는 deadline 경과 후 거부한다.
- **`deadlineAt`이 유일한 진실.** UI interval은 표시용이며, mount·focus·
  `visibilitychange`·storage event·제출 직전에 deadline을 재검사한다
  (백그라운드 탭에서 interval은 지연될 수 있다).
- 손상된 answer key(옵션에 없는 값)는 finalize에서 사전 검증해 미응답으로
  취급한다. 채점 전체가 실패하지 않는다.

## 복습 큐 연동 — pending projection(outbox) 프로토콜

서로 다른 localStorage 키를 트랜잭션으로 묶을 수 없으므로, 문항별
`updateAttempt()` 반복 호출(부분 반영·중복 카운트 위험) 대신:

```
finalize 1회
  → terminal 세션에 projection{status:"pending", attempts:[...]} 저장
  → ProgressSnapshot 1회 load → 병합 → AttemptStore.save 1회
  → 세션의 projection.status = "complete"
```

- payload는 finalize 시점에 **1회만 계산**해 세션에 저장한다(재시도 시
  재계산 금지 → 멱등). 계산은 기존 `gradeMcqAttempt`를 재사용하고, 그 시점
  store의 previous로 attemptCount를 정한다.
- 로드 시 pending 세션이 있으면 같은 payload를 재적용한다. 병합 규칙:
  - 기존 attempt가 payload보다 최신(lastAttemptedAt)이면 기존 보존.
  - timestamp·값이 동일하면 이미 반영된 것 — attemptCount 불변.
  - 그 외에는 payload 기록.
- `AttemptStore.save()`가 비영속 폴백으로 떨어지면 projection은 pending을
  유지하고 경고를 표시한다.
- 미응답 문항은 payload에 포함하지 않는다(세션 결과에서만 오답 집계).
- 시험 별표(`flaggedItemIds`)는 attempt.flagged로 복사하지 않는다.

## 오디오 재생 정책 — 슬롯 예약 (스크립트당 2회)

`ended` 카운트만으로는 끝 직전 정지·새로고침으로 반복 청취가 가능하므로:

- `play()` 성공 후 실제 재생 시작(`playing`) 시 슬롯 1개를 예약하고 즉시
  영속한다. pause/resume은 같은 슬롯을 사용한다. `ended`는 슬롯을 완료한다.
- 재생 실패·media error는 슬롯을 환불하고 `role="alert"`로 알린 뒤 재시도를
  허용한다.
- 새로고침 시 예약된(active) 슬롯은 소비된 것으로 유지한다 — 재생 중 이탈은
  실전과 동일하게 그 회차를 잃는다.
- UI: "재생 n/2", 슬롯 소진 시 재생 버튼 비활성. seek UI 없음(재생/일시정지와
  시간 표시만), 배속 없음. 배속·자유 재생은 연습 모드 전용 기능으로 남긴다.

## 멀티탭 정책 (v1)

- 블루프린트당 in-progress 세션은 1개. `/exam` 진입은 start-or-resume.
- **동시 탭 편집은 지원하지 않는다(last-write-wins).** 단, 저장 병합에서
  terminal 상태는 어떤 stale in-progress 저장보다 항상 우선한다 — 같은 id의
  terminal 세션을 in-progress로 되돌리는 저장은 거부한다.
- Web Locks 기반 단일 writer는 범위 밖(필요해지면 후속 도입).

## 히스토리 보존

- terminal 세션은 최근 **50개**만 유지한다. in-progress와 projection pending
  세션은 절대 삭제하지 않는다. pruning은 projection complete 시에만 실행한다.
- 세션 export/import는 지원하지 않으며, 이 보존 한도를 UI 안내에 명시한다.

## 블루프린트 검증 (lib/validate.ts)

콘텐츠 검증 계층에 추가하고 `npm run validate:content`(prebuild)가 실행한다:

- 블루프린트 id·section task·setId 중복 금지, task 순서는 Tarea 1~5.
- 각 setId 존재·published·listening, section당 정확히 6문항.
- 각 문항 published·listening MCQ, script 존재·published,
  `script.task === section.task`.
- 전체 문항 30개·고유, `timeLimitMin`은 양의 유한값.

## v1 블루프린트

`exam-listening-b2` (version 1, 40분): T1 `set-listening-t1` → T2
`set-listening-t2` → T3 `set-listening-t3-arte` → T4 `set-listening-t4` →
T5 `set-listening-lecture`.

## NOT in scope (v1)

- 읽기 모의고사(36문항 청사진 콘텐츠 준비 후 확장)
- 쓰기·말하기 시험 세션
- 모의고사 세션 export/import, 계정·서버 동기화, 기기 간 이전
- 공식 시험처럼 Tarea별 음원을 자동 순차 재생하는 단일 방송 트랙
- 부정행위 방지(개발자 도구·페이지 복제 차단 등)
- Web Locks 기반 멀티탭 단일 writer
