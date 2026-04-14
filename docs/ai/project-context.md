# Project Context

## Service Summary

PGTI는 사용자가 게임을 탐색하고, 설문조사 또는 매칭 평가를 통해 취향 기반 추천을 받는 웹 서비스입니다.
프론트엔드는 React + TypeScript + Vite 기반이며, API 통신은 Axios와 TanStack Query를 사용합니다.

## Current Repository State

- 현재 앱은 초기 세팅 상태입니다.
- 라우터는 `src/main.tsx`에서 `createBrowserRouter`로 구성되어 있습니다.
- `src/api/axios.ts`에 공통 Axios 인스턴스가 있습니다.
- `src/index.css`에는 Pretendard, Tailwind v4 테마, 공통 버튼/입력/카드 클래스가 일부 정의되어 있습니다.
- Zustand 테스트 store가 존재하지만 실제 서비스 상태 구조는 아직 확정되지 않았습니다.

## Main Domain for First Implementation

이번 문서 기준에서 우선순위가 높은 프론트 담당 도메인은 메인 페이지와 게임 상세 페이지입니다.

- 메인 페이지:
  - 로고와 인증 진입 버튼
  - 인기 TOP 100 게임 카드 리스트
  - 게임명 검색
  - 장르 필터 진입점
  - 설문조사 및 매칭 시작 CTA
- 상세 페이지:
  - 게임 제목, 장르, 설명
  - 커버 이미지와 프로모션 영상
  - 출시일, 개발사, 배급사
  - 플랫폼, 외부 링크
  - 좋아요 상태와 좋아요 수

## Route Plan

초기 라우트는 아래 기준으로 맞춥니다.

```text
/                 메인 페이지
/games/:gameId    게임 상세 페이지
```

설문조사, 매칭, 인증, 마이페이지 등은 담당자가 별도로 구현할 수 있으므로 메인 페이지에서는 임시 링크 또는 비활성 상태를 허용합니다.

## UI Assets

기획 시안은 저장소의 공유 이미지로 관리합니다.

- 메인 페이지: `../assets/main-page.png`
- 상세 페이지: `../assets/detail-page.png`

시안을 기준으로 하되, 실제 구현에서는 반응형과 접근성을 함께 고려합니다.

## Shared Decisions

- 목록과 상세 화면에서 누락 데이터는 `N/A`로 표시합니다.
- 목록 카드는 클릭 시 상세 페이지로 이동합니다.
- 좋아요는 로그인 사용자 기능입니다. 인증 구현 전에는 UI 상태를 분리해두고 실제 요청 연결을 나중에 붙입니다.
- API 응답 필드명이 바뀔 수 있는 영역은 화면 컴포넌트가 아닌 API 계층에서 정규화합니다.
