# Spanish Lab · DELE B2

한국어 사용자를 위한 무료 공개형 DELE B2 학습 도구입니다. 공식 자료 링크,
창작 유형 연습, 한국어 해설, 기기 내 복습 기록, 쓰기·말하기 자기평가를
로그인 없이 제공합니다.

## 주요 기능

- 읽기·듣기·쓰기·말하기 23개 연습 세트와 109개 문항, 영역별 가이드
- 읽기·듣기 시간제 모의고사, 문항 팔레트, 만료 자동 제출, 결과 기록·재응시
- 읽기 Tarea 2 매칭, Tarea 3 문장 삽입, Tarea 4 cloze 전용 상호작용
- 최근 학습 이어하기와 오늘의 복습, 기기 내 진도·완료 시험 기록 전체 백업
- 로그인·업로드 없이 동작하는 local-first 저장 구조

## 로컬 실행

```bash
npm install
npm run dev
npm run build
```

Node.js `>=22.13.0`이 필요합니다.

## 검증 명령

- `npm run typecheck`: TypeScript 검사
- `npm run lint`: ESLint 검사
- `npm run validate:content`: 콘텐츠 참조·검수 상태·듣기 음원 존재 검사
- `npm run check:links`: 공식 자료 링크 상태 검사
- `npm test`: 단위 테스트, 프로덕션 빌드, 렌더링 테스트
- `npm run test:e2e:fresh`: Pages 정적 빌드·산출물 검사·브라우저 E2E 전체 실행

## 듣기 음원 생성

- `npm run generate:audio`: `data/listeningScripts.ts`의 창작 스크립트를
  Edge TTS 뉴럴 음성(es-ES-ElviraNeural 등)으로 합성해
  `public/audio/listening/*.m4a`를 만듭니다.
- `edge-tts`(`pip install edge-tts`, 네트워크 필요)와 Homebrew `ffmpeg`가
  필요합니다. `EDGE_TTS_PYTHON`으로 edge_tts가 설치된 파이썬을 지정할 수
  있으며, 없으면 `~/spanish-lab/.venv`를 자동으로 사용합니다.
- 스크립트 해시 매니페스트로 내용이 바뀐 음원만 다시 생성합니다.
  전체 재생성은 `npm run generate:audio -- --force`.

## 콘텐츠 원칙

- 공개되는 창작 콘텐츠는 `published` 및 검수 이력이 있어야 합니다.
- 공식 자료는 Instituto Cervantes 원문 링크만 제공하며 재호스팅하지 않습니다.
- 듣기 음원은 창작 스크립트를 TTS로 합성한 것으로, 공식 기출 음원을 복제하지 않습니다.
- 학습 진도·완료 시험 기록·테마는 브라우저에만 저장되고, 녹음은 업로드하지 않습니다.

## 관련 문서

- [`DESIGN.md`](DESIGN.md): UI 토큰, 상태, 접근성, 반응형 규칙
- [`docs/mock-exam-session-design.md`](docs/mock-exam-session-design.md): 모의고사 저장·동결·백업 계약
- [`TODOS.md`](TODOS.md): 완료 내역과 장기 보류 과제
