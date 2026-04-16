# Task Template

기능이나 버그 수정을 시작하기 전에 아래 템플릿을 복사해 이슈, PR 본문, 또는 작업 메모에 작성합니다.

```md
# Task: <작업 이름>

## Goal

- 무엇을 완료하면 성공인지 한 문장으로 작성합니다.

## Scope

- 포함:
- 제외:

## Context

- 관련 요구사항:
- 관련 API:
- 관련 라우트:
- 참고 화면:

## Plan

1.
2.
3.

## Data and State

- API 요청:
- 화면에서 사용할 타입:
- 로딩/에러/빈 상태:

## Code Quality

- 분기/상태가 섞이는 지점:
- API/상태/UI 책임 경계:
- 공통화 여부와 근거:
- 함께 관리할 상수/문구:

## Validation

- [ ] npm run lint
- [ ] npm run build
- [ ] 브라우저에서 주요 화면 확인

## Notes

- API/기획 미확정 사항:
- 팀에 확인할 사항:
```

## Example

```md
# Task: 메인 페이지 TOP 100 게임 카드 노출

## Goal

- 메인 페이지에서 인기 TOP 100 게임을 카드 리스트로 확인하고 상세 페이지로 이동할 수 있다.

## Scope

- 포함: TOP 100 조회, 카드 UI, 상세 이동, 로딩/에러/빈 상태
- 제외: 장르 필터 실제 API 연결, 설문조사/매칭 페이지 구현

## Context

- 관련 요구사항: REQ-GAME-001
- 관련 API: GET /api/v1/games/list/top100
- 관련 라우트: /, /games/:gameId
- 참고 화면: 메인페이지.png

## Plan

1. 메인 라우트와 페이지 컴포넌트를 만든다.
2. 게임 카드 컴포넌트를 만든다.
3. TOP 100 API 함수를 연결하고 응답을 화면 타입으로 정규화한다.

## Data and State

- API 요청: genre_id=0 기준 전체 조회 준비
- 화면에서 사용할 타입: GameListItem
- 로딩/에러/빈 상태: skeleton, 에러 메시지, 빈 목록 안내

## Code Quality

- 분기/상태가 섞이는 지점: 로딩/에러/빈 목록/목록 노출 케이스를 명확히 분리한다.
- API/상태/UI 책임 경계: API 응답 정규화는 gameApi, 화면 상태는 페이지, 카드 표시는 GameCard가 담당한다.
- 공통화 여부와 근거: 첫 구현에서는 무리한 공통 카드 추상화를 만들지 않는다.
- 함께 관리할 상수/문구: page size, sort key, 빈 상태 문구를 가까운 상수로 둔다.

## Validation

- [ ] npm run lint
- [ ] npm run build
- [ ] 카드 클릭 시 상세 라우트 이동 확인

## Notes

- 일반 목록 API의 장르 파라미터는 백엔드 답변 후 연결한다.
```
