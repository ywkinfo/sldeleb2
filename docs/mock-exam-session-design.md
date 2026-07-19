# DELE B2 모의고사 세션 설계 (확정본)

확정일: 2026-07-13, 읽기 presentation·전체 백업 반영: 2026-07-16.
초안(work/mock-exam-session-design.md, 비추적)을 엔지니어링 리뷰 결과로 대체한다.
TODOS.md 2번 과제의 산출물이다.

## 목적과 현재 범위

실제 시험 환경(제한 시간·일괄 채점·재생 제한)을 재현하는 모의고사 세션.

- 듣기(Tarea 1~5 × 6문항 = 30문항 / 40분)와 읽기(Tarea 1~4 = 36문항 /
  70분) 모의고사를 제공한다.
- 블루프린트는 세트 ID를 명시적 순서로 나열한다. Tarea 3 세트가 두 개
  (`set-listening-t3-arte`, `set-listening-interview`) 존재하므로 순서·구성은
  항상 블루프린트가 결정하고, 추론하지 않는다.
- 데이터 모델은 `AutoGradedExamSkill = "reading" | "listening"`까지만
  일반화한다. 쓰기·말하기는 `answers: Record<string, string>` 자동 채점 계약과
  맞지 않으므로 범위 밖이다.

## 저장 아키텍처 — 별도 키, `dele-b2:v1` 보수적 확장만 허용

- 세션은 새 localStorage 키 **`dele-b2:exam:v1`** 에 저장한다:
  `{ schemaVersion: 1, sessions: ExamSession[] }`.
- **`dele-b2:v1`(ProgressSnapshot)은 `schemaVersion: 1`과 `AttemptState`
  union을 유지한다.** 허용되는 변경은 구버전 클라이언트가 무시할 수 있는
  **선택적 최상위 필드 추가뿐**이다(예: 제출 전 별표 `pendingFlags`).
  근거: 기존 클라이언트는 같은 키의 파싱 실패 시 빈 스냅샷으로 리셋한다
  (lib/progress/store.ts). attempts 형태를 바꾸거나 schemaVersion을 올리면 배포 후
  열려 있는 구버전 탭이 진도를 초기화할 수 있다. 미지의 최상위 필드는
  구버전 검증(`isProgressSnapshot`)을 통과하고 `updateAttempt`의 스프레드
  저장에서도 보존된다.
- **알려진 다운그레이드 제한:** 구버전의 백업 import(`mergeSnapshots`)와
  exam projection 적용, 백업 export용 projection 반영은 스냅샷을
  `{schemaVersion, attempts}`로 재구성하므로 선택 필드(대기 별표)가 유실될
  수 있다. attempts는 어떤 경로에서도 손상되지 않는다.
- **대기 별표 백업 병합 제한:** `pendingFlags` 추가는 시각의 최댓값으로
  병합하지만 해제 이력(tombstone)은 저장하지 않는다. 따라서 답하지 않은
  문항의 별표를 해제한 뒤 그보다 오래된 백업을 직접 가져오면 별표가 다시
  나타날 수 있다. 이미 생긴 attempt의 해제 상태는 더 오래된 pending 별표나
  같은 시각의 백업이 되살리지 않도록 보호한다.
- 시험 세션의 `flaggedItemIds`(제출 전 검토용)는 여전히 연습의
  `attempt.flagged`로 복사하지 않는다. 연습의 제출 전 별표(`pendingFlags`)만
  attempt 저장 시점에 `attempt.flagged`로 흡수된다.
- 전체 백업 envelope(`dele-b2-backup`, exportVersion 1)는 진도와 terminal
  시험 세션을 함께 다루며, 기존 ProgressSnapshot 단독 파일도 가져올 수 있다.

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
  presentation?: ReadingPresentationContract; // 동결 읽기 섹션만
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
- 전체 백업(`dele-b2-backup`, exportVersion 1)은 terminal 세션만 포함한다.
  export 사본에서는 pending projection을 진도 사본에 먼저 반영하고 세션의
  projection을 complete로 정규화하며, 실제 로컬 저장 상태는 변경하지 않는다.
- import는 진도를 먼저 병합한 뒤 terminal 시험 기록을 별도로 병합한다. 같은 ID의
  로컬 terminal은 유지하고, 같은 ID의 로컬 in-progress와 가져온 terminal이
  충돌하면 terminal을 우선한다. 두 저장 영역의 영속 여부는 독립적으로 보고한다.
- 삭제는 projection complete인 terminal에만 허용한다. 진행 중·pending 세션은
  단건 삭제와 전체 삭제 모두에서 보호한다.

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

## 읽기 확장 (2026-07-15 완료)

`ExamItemContract`는 skill 판별 union(읽기 `textId` / 듣기 `scriptId`, 배타적)으로,
음원 계약과 대칭인 `ExamTextContract{ textId,title,passage }`·섹션 `textIds/texts`를
동결한다. 듣기 스냅샷 형태는 불변(읽기 섹션만 `textIds/texts` 방출, frozen 판정은
`items` 유무만 사용). 검증기는 `texts/textIds` 한쪽만 존재·중복·누락·잉여·섹션 밖
`textId`·교차 skill ID를 거부하고, 옛(계약 없는) 읽기 세션은 라이브 지문으로 폴백한다.
`exam-reading-b2` (version 2, 70분): T1 `set-reading-library`(6) → T2
`set-reading-anio-fuera`(10) → T3 `set-reading-semana-cuatro`(6) → T4
`set-reading-podcast`(14) = 36문항. 새 세션은 T1 MCQ, T2 reusable matching,
T3 single-use sentence insertion, T4 cloze 계약을 모두 동결한다. 구세션은
presentation이 전혀 없을 때 MCQ로 해석한다.

## NOT in scope

- 쓰기·말하기 시험 세션
- 계정·서버 동기화
- 공식 시험처럼 Tarea별 음원을 자동 순차 재생하는 단일 방송 트랙
- 부정행위 방지(개발자 도구·페이지 복제 차단 등)
- Web Locks 기반 멀티탭 단일 writer
