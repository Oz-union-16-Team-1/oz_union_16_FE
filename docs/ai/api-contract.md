# API Contract Notes

이 문서는 프론트 구현 중 API 명세와 요구사항 정의서가 흔들리는 부분을 한 곳에 모아두기 위한 임시 계약 문서입니다.
백엔드 답변이 확정되면 이 문서를 먼저 갱신한 뒤 구현 코드를 맞춥니다.

## Auth and Session

인증 관련 플로우와 토큰 관리 정책은 아래 내용을 기준으로 합니다.

### 1. 토큰 저장 및 관리 전략

- **Access Token**: 클라이언트 메모리(Zustand State) 내에서 관리하여 XSS 공격 방어.
- **Refresh Token**: 브라우저 **HttpOnly, Secure 쿠키** 기반으로 관리하여 보안 강화.
- **Legacy Cleanup**: 기존 `localStorage`에 `refresh_token`을 저장하던 방식은 완전히 폐기하며, 관련 데이터를 일괄 삭제함.

### 2. 인증 관련 API 엔드포인트

- **소셜 로그인 진입**: `GET /api/v1/accounts/login/{google|kakao|naver}` (백엔드 제공 OAuth 시작점)
- **토큰 갱신**: `POST /api/v1/accounts/token/refresh` (쿠키의 리프레시 토큰을 사용하여 액세스 토큰 재발급)
- **로그아웃**: `POST /api/v1/accounts/logout` (액세스 토큰 무효화 및 서버측 쿠키 삭제 요청)

### 3. 로그아웃 및 세션 초기화 규정

- **상태 초기화**: 로그아웃 실행 시 `useAuthStore`의 토큰 및 사용자 프로필 정보를 즉시 `null`로 초기화.
- **데이터 정리**: `localStorage`에 남아 있는 모든 인증 관련 레거시 데이터를 명시적으로 삭제.
- **UI/UX**: 로그아웃 후 즉시 메인 페이지(`/`)로 리다이렉트하며, 헤더를 비로그인 상태로 갱신.

### 4. 인증 에러(401) 처리 로직

- **Axios Interceptor**: 모든 API 요청에서 `401 Unauthorized` 발생 시 `/token/refresh`를 자동 호출하여 세션 연장 시도.
- **세션 만료 처리**: 리프레시 토큰 만료로 갱신 실패 시, '세션 만료' 안내 후 강제 로그아웃 및 로그인 페이지로 유도.

## Customer Support Chatbot

고객센터 챗봇 관련 명세는 아래와 같습니다.

### API Endpoints

```text
POST   /api/v1/support/chat/send    # 메시지 전송 및 AI 응답 (Streaming)
GET    /api/v1/support/faq          # 자주 묻는 질문 목록 조회
```

### Integration Details

- **Widget**: `SupportChatWidget`을 통해 전역 레이아웃(`App.tsx`)에 배치.
- **Mocking**: 백엔드 미완성 시 MSW를 통해 스트리밍 응답 시뮬레이션.
- **State**: `useSupportChatStore`를 통한 대화 내역 및 위젯 상태 관리.

---

_(이하 기존 게임 목록/상세 API 명세 생략 가능하나 문서 무결성을 위해 유지 권장)_
