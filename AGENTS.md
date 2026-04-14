# PGTI Team Context

이 파일은 사람과 AI 에이전트가 작업을 시작할 때 가장 먼저 읽는 진입 문서입니다.
상세한 기준은 `docs/ai/` 아래 문서로 분리하고, 이 파일에는 항상 필요한 규칙만 둡니다.

## Project

- 서비스명: PGTI
- 목적: 사용자 취향에 맞는 게임을 탐색하고 추천받는 웹 서비스
- 현재 프론트 스택: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Zustand, Axios
- 기본 브랜치 흐름: `dev` 기반으로 기능 브랜치를 만들고 PR을 올립니다.

## Read Order

1. `README.md`: 설치, 실행, 브랜치, PR 흐름
2. `docs/ai/project-context.md`: 서비스/화면/라우트 맥락
3. `docs/ai/api-contract.md`: API 계약과 현재 불확실성
4. `docs/ai/workflow.md`: 작업 진행 방식
5. `docs/ai/code-quality.md`: 코드 품질 기준
6. `docs/ai/task-template.md`: 기능 시작 전 미니 계획 템플릿

## Working Rules

- 한 작업 단위는 가능한 한 한 기능 또는 한 버그로 제한합니다.
- 구현 전 요구사항, 관련 API, 라우트, 상태, 검증 방법을 먼저 확인합니다.
- 런타임 코드 변경과 문서 변경을 섞어야 할 이유가 없으면 PR을 분리합니다.
- 기존 구조와 라이브러리를 우선 사용하고, 새 의존성은 팀 합의 없이 추가하지 않습니다.
- API 명세가 흔들리는 값은 화면 컴포넌트에 직접 흩뿌리지 말고 API 어댑터나 타입 경계에서 흡수합니다.
- 데이터가 없을 때는 요구사항 기준에 맞춰 `N/A` 또는 명확한 빈 상태를 표시합니다.
- 사용자에게 보이는 UI 문구는 한국어 기준으로 작성합니다.

## Do Not

- `dist/`, `node_modules/` 같은 생성물은 직접 수정하지 않습니다.
- 다른 팀원의 변경을 되돌리지 않습니다.
- 명세가 불확실한 API 파라미터를 여러 컴포넌트에 직접 하드코딩하지 않습니다.
- 화면 구현 중 임의의 디자인 시스템이나 상태관리 방식을 새로 만들지 않습니다.
- 불필요한 공통화로 파일 이동을 늘리지 않습니다. 함께 바뀌는 것이 확인될 때만 추상화합니다.

## Verification

변경 후 최소 검증은 다음 명령으로 합니다.

```bash
npm run lint
npm run build
```

UI 변경은 브라우저에서 주요 화면을 확인하고 PR에 스크린샷을 첨부합니다.
