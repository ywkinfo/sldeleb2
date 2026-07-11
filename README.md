# Spanish Lab · DELE B2

한국어 사용자를 위한 무료 공개형 DELE B2 학습 도구입니다. 공식 자료 링크,
창작 유형 연습, 한국어 해설, 기기 내 복습 기록, 쓰기·말하기 자기평가를
로그인 없이 제공합니다.

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
- `npm run validate:content`: 콘텐츠 참조·검수 상태 검사
- `npm run check:links`: 공식 자료 링크 상태 검사
- `npm test`: 단위 테스트, 프로덕션 빌드, 렌더링 테스트

## 콘텐츠 원칙

- 공개되는 창작 콘텐츠는 `published` 및 검수 이력이 있어야 합니다.
- 공식 자료는 Instituto Cervantes 원문 링크만 제공하며 재호스팅하지 않습니다.
- 학습 기록과 테마는 브라우저에만 저장되고, 녹음은 업로드하지 않습니다.
