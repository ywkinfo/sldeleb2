# DELE B2 듣기 Tarea 1·2·3·4 청사진 정합 확장 브리프

## 목표

공식 DELE B2 듣기 청사진에 맞게 기존 Tarea 배치를 바로잡고, Tarea 1·2·3·4의 해당 세트를 각각 6문항으로 확장한다. 스페인어 스크립트와 문항은 공식 기출을 복제하지 않은 B2 수준 창작물이어야 한다.

최종 데이터 상태:

| 세트 id | `script.task` | 콘텐츠 | 문항 |
| --- | --- | --- | --- |
| `set-listening-t1` | `tarea1` | 기존 안내방송 1개 + 신규 2인 미니 대화 5개 | 스크립트당 1개, 총 6개 |
| `set-listening-t2` | `tarea2` | 신규 남녀 2인 비격식 대화 1개 | `¿Quién lo dice?`, 총 6개 |
| `set-listening-t4` | `tarea4` | 기존 `listening-t2-experiencias-idiomas` 패널을 확장하고 task 변경 | 화자 매칭 총 6개 |
| `set-listening-t3-arte` | `tarea3` | 기존 `listening-t4-entrevista-artista` 인터뷰를 확장하고 task 변경 | 객관식 총 6개 |

신규 아이템은 정확히 18개, 신규 스크립트는 정확히 6개, 신규 세트는 정확히 1개다. 기존 아이템 5개는 유지하되 필요한 옵션 공유 상수 및 검수 메타데이터를 갱신한다.

## 수정 범위

수정 허용:

- `data/listeningScripts.ts`
- `data/practiceItems.ts`
- `data/practiceSets.ts`
- `TODOS.md`

수정 금지:

- UI 컴포넌트, `lib/`, 테스트 코드
- 새 의존성
- 기존 스크립트, 아이템, 세트 id 변경
- 오디오 파일 및 manifest 직접 수정. 오디오는 후속 단계에서 생성한다.

## 타입과 데이터 관례

`lib/types.ts`의 기존 타입을 그대로 따른다.

- `ListeningScript`: `id`, `task`, `title`, `audioSrc`, `transcript`, `voices`, `rate`, `sourceNote`, `status`, `reviewedBy`, `reviewedAt`
- `ListeningMCQItem`: `id`, `skill:'listening'`, `kind:'mcq'`, `scriptId`, `prompt`, `options`, `correctAnswer`, `explanationKo`, `tags`, 검수 필드

스크립트 규칙:

- transcript는 매 줄 `HABLANTE: 대사` 형식이다.
- 화자 라벨은 대문자이며 악센트를 허용한다. 모든 라벨은 `voices` 키와 정확히 일치해야 한다.
- `audioSrc`는 `/audio/listening/<스크립트-id>.m4a`이며 id와 정확히 맞춘다.
- `rate`는 `^[+-]\d+%$` 형식이다.
- 허용 음성은 아래 5종뿐이다.
  - `es-ES-ElviraNeural`
  - `es-ES-AlvaroNeural`
  - `es-MX-JorgeNeural`
  - `es-US-AlonsoNeural`
  - `es-US-PalomaNeural`
- 신규 T1 미니 대화 5개의 2인 음성 조합을 다양하게 회전한다.

이번에 신규 또는 수정되는 모든 스크립트, 아이템, 세트는 아래 공유 상수를 스프레드한다. 기존 파일의 2026-07-11 상수는 다른 미수정 콘텐츠가 사용하므로 유지하고 별도 상수를 추가해도 된다.

```ts
const listeningExpansionReview = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-12',
};
```

published 세트는 published 아이템과 published 스크립트만 참조해야 하며 `validate:content`가 이를 강제한다.

## id 및 역사적 명칭 원칙

기존 id는 이름에 `t2` 또는 `t4`가 남아도 절대 바꾸지 않는다. 오디오 파일명, manifest, localStorage 기록이 id에 묶여 있다.

- `listening-t2-experiencias-idiomas`는 `task: 'tarea4'`로만 변경한다.
- `listening-t4-entrevista-artista`는 `task: 'tarea3'`로만 변경한다.
- `data/listeningScripts.ts`의 두 항목 근처에 다음 취지의 주석을 남긴다: “id는 역사적 명칭이며 `script.task`가 현재 시험 배치의 진실이다.”

신규 id:

- T1 스크립트: `listening-t1-<slug>`
- T1 아이템: `l-t1-<slug>-01`
- T2 스크립트: `listening-t2-<slug>`
- T2 아이템: `l-t2-<slug>-01`부터 `-06`
- 패널 추가 아이템: `l-t2-idiomas-04`, `-05`, `-06`
- 인터뷰 추가 아이템: `l-t4-artista-03`, `-04`, `-05`, `-06`

## 콘텐츠 요구사항

### Tarea 1

- 기존 `listening-t1-anuncio-estacion`과 `l-t1-estacion-01`은 유지한다.
- 서로 다른 일상 상황의 신규 미니 대화 5개를 만든다.
- 각 스크립트는 2인 대화, 스페인어 총 60~90단어다.
- 각 스크립트에 객관식 1문항, 보기 3개를 만든다.
- 세트는 기존 1개 + 신규 5개를 포함해 정확히 6문항이다.

### Tarea 2

- 남녀 2인의 자연스러운 비격식 대화 스크립트 1개를 새로 만든다.
- 스페인어 총 350~450단어다.
- 6문항 모두 `¿Quién lo dice?` 계열이며 다음 공유 옵션 상수를 사용한다.

```ts
const listeningT2SpeakerOptions = [
  { key: 'a', text: 'El hombre' },
  { key: 'b', text: 'La mujer' },
  { key: 'c', text: 'Ninguno de los dos' },
];
```

- 정답 분포에 `a`, `b`, `c`가 모두 등장해야 하며 `c`는 최소 1개다.

### Tarea 4 패널

- `listening-t2-experiencias-idiomas`의 `task`만 `tarea4`로 변경한다.
- 네 화자 Carlos, Lucía, Marcos, Elena 각각의 발언을 현재 내용과 모순 없이 2~3문장씩 보강한다.
- 기존 아이템 `l-t2-idiomas-01..03`의 id와 stem은 유지하며 확장 transcript에서도 정답이 성립하게 한다.
- 기존 3개를 포함한 6문항 모두 아래 공유 옵션 상수를 사용한다.

```ts
const listeningT4SpeakerOptions = [
  { key: 'a', text: 'Carlos' },
  { key: 'b', text: 'Lucía' },
  { key: 'c', text: 'Marcos' },
  { key: 'd', text: 'Elena' },
];
```

- 신규 `l-t2-idiomas-04..06`을 만든다.
- 6문항 중 Elena 정답이 최소 1개여야 한다.

### Tarea 3 인터뷰

- `listening-t4-entrevista-artista`의 `task`만 `tarea3`로 변경한다.
- 현재 질문-답변 흐름을 6~7쌍으로 확장한다. 기존 사실과 모순되지 않아야 한다.
- 기존 `l-t4-artista-01..02`의 id와 stem을 유지하고 정답이 계속 성립하게 한다.
- 신규 `l-t4-artista-03..06`을 만들어 총 6문항으로 구성한다.

## 문항 품질

- 스페인어는 자연스러운 B2 수준 창작물이어야 한다. 공식 기출 문구를 복제하지 않는다.
- 모든 `correctAnswer`는 transcript의 명확한 근거로 성립해야 한다.
- 오답은 문맥상 그럴듯하지만 transcript로 반박 가능해야 한다.
- `explanationKo`는 한국어 해설과 transcript의 짧은 스페인어 원문 근거 인용을 함께 포함한다.
- `tags`는 `[유형, '듣기', 주제]` 순서의 한국어 3개 문자열이다.

## 세트 변경

`data/practiceSets.ts`에서:

- `set-listening-t1`: 정확히 6개 item id, 확장 내용을 반영한 title과 합리적인 `estimatedMin`
- `set-listening-t2`: 신규 대화의 6개 item id, 공식 Tarea 2 형식을 반영한 title과 `estimatedMin`
- `set-listening-t4`: 패널 `l-t2-idiomas-01..06`, 공식 Tarea 4 형식을 반영한 title과 `estimatedMin`
- 신규 `set-listening-t3-arte`: 인터뷰 `l-t4-artista-01..06`, title과 `estimatedMin`
- 위 네 세트에 2026-07-12 검수 상수를 적용한다.

최종 게시 세트는 20개, 총 문항은 79개가 되어야 한다. 듣기 세트는 6개다.

## TODOS.md

현재 듣기 Tarea 1·2·4 확장 과제를 완료 상태로 반영한다. 현황을 게시 세트 20개, 총 79문항, 듣기 6세트로 갱신하고 다음 과제를 “모의고사 설계 검토”로 명확히 적는다. 장기 과제는 보존한다.

## 자체 검증

구현 후 다음을 순서대로 실행한다.

1. `npm run validate:content`
   - 신규 오디오가 아직 없어서 오디오 부재 오류만 남는 것은 정상이다.
   - 그 외 참조, 타입, metadata, transcript/voice 오류는 모두 해결한다.
2. `npm run typecheck`
3. `npm run lint`

검증 결과와 변경 파일을 보고한다. 커밋, 오디오 생성, UI 검수는 하지 않는다.
