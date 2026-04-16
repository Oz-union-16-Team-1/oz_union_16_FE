# Team Workflow

## Start a Task

작업을 시작하기 전 아래 순서로 확인합니다.

1. 이슈 또는 요구사항의 성공 조건을 확인합니다.
2. 관련 화면, 라우트, API 문서를 확인합니다.
3. `docs/ai/code-quality.md`에서 이번 작업에 직접 걸리는 기준을 확인합니다.
4. `docs/ai/task-template.md` 형식으로 미니 계획을 작성합니다.
5. 작업 범위를 한 기능 또는 한 버그로 줄입니다.
6. 구현 후 실행할 검증 명령을 먼저 정합니다.

## Implementation Loop

기본 루프는 아래 순서를 따릅니다.

```text
계획 작성 -> 작은 단위 구현 -> 로컬 확인 -> lint/build -> PR 작성
```

- 큰 기능은 한 번에 끝내려 하지 말고 화면 골격, 데이터 연결, 예외 처리, 반응형 마감으로 나눕니다.
- API가 확정되지 않은 기능은 mock 또는 정규화 계층을 먼저 두고 컴포넌트가 원본 응답에 의존하지 않게 합니다.
- 에러 로그는 요약해서 추측하지 말고 원문을 확인한 뒤 원인을 정리합니다.
- 구현 중 공통화가 필요해 보이면 먼저 함께 바뀌는 요구사항인지 확인하고, 흐름 파악이 어려워지면 중복을 허용합니다.
- 페이지와 상위 컴포넌트는 핵심 흐름이 위에서 아래로 읽히게 두고, API/상태/검증/표시 책임이 섞이면 분리합니다.
- PR 전에는 `docs/ai/code-quality.md`의 PR Review Checklist로 셀프 리뷰를 합니다.

## Context Management

- 한 세션에서는 한 작업만 진행합니다.
- 오래된 대화나 unrelated 탐색 결과를 다음 작업에 끌고 가지 않습니다.
- 공용 지식은 개인 메모리가 아니라 저장소 문서에 남깁니다.
- `AGENTS.md`에는 상세 내용을 길게 쓰지 말고 `docs/ai/` 문서로 연결합니다.
- 반복되는 작업 절차는 문서나 스크립트로 옮기고, 매번 채팅 프롬프트로 재작성하지 않습니다.

## Branch and PR

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

PR에는 아래 내용을 반드시 남깁니다.

- 관련 이슈
- 변경 내용
- 테스트 결과
- 요구사항 또는 API 명세 영향
- UI 변경 시 스크린샷

## Verification

기본 검증 명령:

```bash
npm run lint
npm run build
```

UI 변경이 있으면 개발 서버에서 직접 확인합니다.

```bash
npm run dev
```
