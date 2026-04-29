# API Contract Notes

이 문서는 프론트 구현 중 API 명세와 요구사항 정의서가 흔들리는 부분을 관리하는 인덱스 문서입니다.
도메인별 세부 계약은 아래 문서로 분리하며, 백엔드 명세가 바뀌면 관련 도메인 문서를 먼저 갱신한 뒤 구현 코드를 맞춥니다.

## When To Read

- API 응답 필드, request body, pagination, fallback 정책이 헷갈릴 때 먼저 읽습니다.
- 새 기능 구현 전 "어느 도메인 계약 문서를 봐야 하는지" 찾을 때 이 문서를 인덱스로 사용합니다.
- 세부 계약 수정이 필요하면 이 문서가 아니라 해당 도메인 문서를 직접 수정합니다.

## Common Rules

- 화면 컴포넌트는 raw API 필드명에 직접 의존하지 않습니다.
- 원본 응답과 화면용 상태 사이의 차이는 `adapter/normalizer` 계층에서 정리합니다.
- API 불확실성, legacy fallback, mock 정책은 각 도메인 계약 문서에서 관리합니다.
- 누락 데이터는 요구사항 기준에 맞춰 `N/A` 또는 명확한 빈 상태로 표시합니다.
- mock/real 모드는 가능한 한 같은 endpoint와 같은 응답 구조를 사용합니다.

## Domain Contracts

- [Auth](/Users/admin/Desktop/oz_union_16_FE/docs/ai/api-contract/auth.md)
  - 인증, 세션, 토큰, 마이페이지 계정 API 수정 전
- [Survey](/Users/admin/Desktop/oz_union_16_FE/docs/ai/api-contract/survey.md)
  - 설문 세션/챗봇 흐름 수정 전
- [Recommendation](/Users/admin/Desktop/oz_union_16_FE/docs/ai/api-contract/recommendation.md)
  - 추천 결과, 매칭 결과, 공통 좋아요 연동 수정 전
- [Games](/Users/admin/Desktop/oz_union_16_FE/docs/ai/api-contract/games.md)
  - 메인 게임 목록, 상세 모달, 게임 좋아요 수정 전
- [Support Chat](/Users/admin/Desktop/oz_union_16_FE/docs/ai/api-contract/support-chat.md)
  - 고객센터 챗봇 위젯/API 수정 전
