# PGTI Frontend

PGTI는 사용자 취향에 맞는 게임을 탐색하고 추천받는 웹 서비스입니다.
이 저장소는 React + TypeScript + Vite 기반 프론트엔드입니다.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- TanStack Query
- Zustand
- Axios

## Getting Started

Node.js 20 사용을 권장합니다. CI도 Node.js 20 기준으로 실행됩니다.

```bash
npm install
npm run dev
```

기본 개발 서버는 `https://localhost:5173` 기준으로 실행합니다.

처음 한 번은 로컬 인증서를 생성합니다.

```bash
brew install mkcert
mkcert -install
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1
```

이후 아래 명령으로 개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 `https://localhost:5173`로 접속합니다.

인증/소셜 로그인과 무관한 단순 UI 작업 등으로 HTTP가 필요하면 예외적으로 아래 명령을 사용할 수 있습니다.

```bash
npm run dev:http
```

백엔드 연동 시에는 아래 조건도 함께 맞아야 합니다.

- backend CORS 허용 origin에 `https://localhost:5173` 추가
- `Access-Control-Allow-Credentials: true` 유지
- 소셜 로그인 로컬 redirect URI가 있다면 `https://localhost:5173` 기준으로 등록

## Verification

PR을 올리기 전에 최소한 아래 명령을 실행합니다.

```bash
npm run lint
npm run build
```

UI 변경이 있으면 브라우저에서 직접 확인하고 PR에 스크린샷을 첨부합니다.

## Branch Rules

브랜치 이름은 `scripts/validate-branch-name.mjs` 기준을 따릅니다.

```text
main
dev
feat/<slug>
fix/<slug>
docs/<slug>
refactor/<slug>
test/<slug>
chore/<slug>
release/<value>
hotfix/<value>
```

예시:

```text
feat/main-page
docs/team-context
fix/#10-login-redirect
```

## Commit Rules

커밋 메시지는 `commit-msg` hook에서 아래 형식을 검사합니다.

```text
type(scope): subject
```

예시:

```text
docs(context): add team context guide
feat(main-page): add top games section
```

허용 type:

```text
feat, fix, docs, style, refactor, test, chore, perf, ci, revert
```

## PR Flow

1. `dev`에서 작업 브랜치를 만듭니다.
2. 작업 전 관련 요구사항과 API 명세를 확인합니다.
3. 작은 단위로 구현하고 `npm run lint`, `npm run build`를 실행합니다.
4. PR 템플릿에 변경 내용, 테스트 결과, API/요구사항 영향을 작성합니다.
5. UI 변경은 스크린샷을 첨부합니다.

## Team Context

팀 공용 컨텍스트는 Markdown 문서로 관리합니다.

- `AGENTS.md`: 팀원과 AI 에이전트가 먼저 읽는 진입 문서
- `docs/ai/project-context.md`: 서비스와 화면 맥락
- `docs/ai/api-contract.md`: API 계약 인덱스와 공통 규칙
- `docs/ai/workflow.md`: 작업 흐름
- `docs/ai/code-quality.md`: 코드 품질 기준
- `docs/ai/task-template.md`: 기능 시작 전 미니 계획 템플릿

원칙은 짧은 진입 문서와 상세 문서 분리입니다.
`AGENTS.md`에 모든 내용을 몰아넣지 말고, 필요한 상세 문서를 참조합니다.
