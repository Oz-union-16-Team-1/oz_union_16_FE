# Auth and Session

인증 관련 플로우와 토큰 관리 정책은 아래 내용을 기준으로 합니다.

## When To Read

- `src/features/auth`, `src/store/useAuthStore.ts`, `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`, `src/pages/mypage` 수정 전에 읽습니다.
- 토큰 저장 위치, refresh 정책, `/accounts/*` endpoint 계약을 바꿀 때 이 문서를 먼저 갱신합니다.

## Related Code

- `src/features/auth/api`
- `src/features/auth/hooks`
- `src/store/useAuthStore.ts`
- `src/pages/LoginPage.tsx`
- `src/pages/SignupPage.tsx`
- `src/pages/mypage`

## 1. 토큰 저장 및 관리 전략

- **Access Token**: 새로고침 안정성을 위해 `sessionStorage`와 클라이언트 메모리(Zustand State)에 함께 유지합니다. `localStorage`에는 저장하지 않습니다.
- **Refresh Token**: 브라우저 **HttpOnly, Secure 쿠키** 기반으로 관리하여 보안 강화. 쿠키는 프론트 도메인이 아니라 **백엔드 API 도메인** 아래 저장되는 것을 기준으로 확인합니다.
- **Startup Bootstrap**: 앱 최초 진입 시 `sessionStorage`의 Access Token을 먼저 복구합니다. 저장된 Access Token이 없으면 바로 ready 처리하고, 저장된 토큰이 만료 임박한 경우에만 `POST /api/v1/accounts/token/refresh`를 호출합니다.
- **Refresh 호출 조건**: 일반 새로고침(F5)에서는 불필요한 refresh를 피하고, Access Token 만료 임박 또는 API `401 Unauthorized` 응답 시에만 refresh를 시도합니다.
- **Legacy Cleanup**: 기존 `localStorage` 인증 키(`auth-storage`, `access_token`, `refresh_token` 등)는 앱 시작 시 1회 정리합니다. 현재 세션의 `sessionStorage.access_token`은 유지합니다.

### 운영 Origin 기준

- **Frontend Origin**: `https://oz-union-16-fe.vercel.app`
- **Backend API Origin**: `https://oz-pgti.duckdns.org`
- **DevTools Cookie 확인 위치**: `Application > Cookies > https://oz-pgti.duckdns.org`
- 프론트의 `VITE_API_BASE_URL`과 소셜 로그인 시작 URL/refresh URL은 위 백엔드 Origin 기준으로 정렬합니다.
- 운영에서 `Set-Cookie`는 보이는데 쿠키가 안 남는 경우, 먼저 **요청 host가 실제로 `oz-pgti.duckdns.org`인지**부터 확인합니다.

## 2. 인증 관련 API 엔드포인트

- **소셜 로그인 진입**: `GET /api/v1/accounts/social-login/{google|kakao|naver}` (백엔드 제공 OAuth 시작점)
- **소셜 로그인 콜백 경로**: 정식 경로는 `/callback`이며, 기존 `/auth/callback`은 하위 호환 redirect 경로로 유지함.
- **토큰 갱신**: `POST /api/v1/accounts/token/refresh` (쿠키의 리프레시 토큰을 사용하여 액세스 토큰 재발급)
- **주의**: API 명세서 표에 `refresh_token` body 예시가 있어도, 실서버 동작 기준은 HttpOnly 쿠키 인증이며 프론트는 `withCredentials` 요청으로 맞춥니다.
- **로그아웃**: `POST /api/v1/accounts/logout` (액세스 토큰 무효화 및 서버측 쿠키 삭제 요청)
- **비밀번호 변경**: `POST /api/v1/accounts/me/change-password`
- **비밀번호 확인**: `POST /api/v1/accounts/me/check-password` (일반 로그인 회원 탈퇴 전 현재 비밀번호 검증)
- **회원 탈퇴**: `DELETE /api/v1/accounts/me` (Authorization header만 사용, request body 없음, 성공 시 `204 No Content`)
- **마이페이지 찜 목록 조회**: `GET /api/v1/accounts/me/game-like`
- **마이페이지 찜 해제**: `DELETE /api/v1/games/{game_id}/like` (게임 공통 좋아요 취소 API 사용)
- **게임 좋아요 등록/해제**: `POST/DELETE /api/v1/games/{game_id}/like`

### 회원 탈퇴 Contract

- 요구사항 정의서상 일반 로그인 회원은 회원탈퇴 UX에서 비밀번호 확인을 거치고, 소셜 로그인 회원은 탈퇴 동의 후 진행합니다.
- 일반 로그인 회원은 `POST /api/v1/accounts/me/check-password`로 현재 비밀번호를 먼저 검증한 뒤, 성공하면 `DELETE /api/v1/accounts/me`를 호출합니다.
- 소셜 로그인 회원은 비밀번호 입력 없이 탈퇴 동의 후 바로 `DELETE /api/v1/accounts/me`를 호출합니다.
- 공식 API 명세서 기준 실제 탈퇴 요청은 `DELETE /api/v1/accounts/me`이며, request body 없이 `Authorization` header만 전송합니다.
- 성공 응답은 `204 No Content`, 인증 실패 응답은 `401 Unauthorized`를 기준으로 처리합니다.
- 프론트에서 비밀번호 확인 UI를 유지하더라도 API adapter 경계에서 탈퇴 요청 body에 `password`를 포함하지 않습니다.

### 비밀번호 확인 Contract

- `POST /api/v1/accounts/me/check-password`는 현재 비밀번호 검증 성공 여부만 판단하는 API입니다.
- 성공 시 `200 OK`를 기준으로 처리하며, 프론트는 성공 response body를 사용하지 않습니다.
- 프론트 호출부는 성공/실패 여부만 분기하고, 성공 payload shape를 가정하지 않습니다.
- 실패 시에만 `error_detail` 또는 field error를 사용해 UI 메시지를 노출합니다.

### 비밀번호 변경 필드 계약

비밀번호 변경은 현재 프론트 구현 기준으로 아래 필드명을 canonical contract로 사용합니다.
백엔드 명세가 다시 조정되더라도, 프론트는 이 문서를 먼저 갱신한 뒤 타입과 mock을 함께 수정합니다.

```json
{
  "old_password": "string",
  "new_password": "string",
  "new_password_check": "string"
}
```

- `old_password`: 현재 비밀번호
- `new_password`: 새 비밀번호
- `new_password_check`: 새 비밀번호 확인
- 필드 검증 에러는 `detail` 또는 `error_detail` 안에 위 3개 키로 내려오는 것을 기준으로 처리합니다.
- 현재 비밀번호 불일치는 field error가 아니라 일반 에러 메시지로 처리하며, 응답 예시는 아래와 같습니다.

```json
{
  "error_detail": "현재 비밀번호가 올바르지 않습니다."
}
```

- 성공 응답은 아래 형태를 기준으로 사용합니다.

```json
{
  "detail": "비밀번호가 변경되었습니다."
}
```

## 3. 로그아웃 및 세션 초기화 규정

- **상태 초기화**: 로그아웃 실행 시 `useAuthStore`의 토큰 및 사용자 프로필 정보를 즉시 `null`로 초기화.
- **데이터 정리**: 브라우저 저장소에 남아 있는 모든 인증 관련 레거시 데이터를 명시적으로 삭제.
- **UI/UX**: 로그아웃 후 즉시 메인 페이지(`/`)로 리다이렉트하며, 헤더를 비로그인 상태로 갱신.

## 4. 인증 에러(401) 처리 로직

- **Axios Interceptor**: 저장된 Access Token이 있는 요청에서 `401 Unauthorized` 발생 시 `/token/refresh`를 자동 호출하여 세션 연장 시도.
- **Refresh 동시성 제어**: 여러 API가 동시에 401을 받아도 하나의 refresh만 실행하고, 나머지는 subscriber queue에서 대기합니다.
- **세션 만료 처리**: 리프레시 토큰 만료로 갱신 실패 시, '세션 만료' 안내 후 강제 로그아웃 및 로그인 페이지로 유도.
- **초기 진입 예외 처리**: 콜백 라우트(`/callback`, `/auth/callback`)에서는 중복 refresh를 피하기 위해 앱 시작 bootstrap을 건너뜀.

### 배포 CORS / Cookie 전제 조건

- `Access-Control-Allow-Origin`은 반드시 `https://oz-union-16-fe.vercel.app`와 정확히 일치해야 합니다.
- `Access-Control-Allow-Credentials: true`가 포함되어야 합니다.
- `Access-Control-Allow-Origin: *`는 credentials 요청과 함께 사용할 수 없습니다.
- refresh 쿠키는 `SameSite=None; Secure; HttpOnly`를 전제로 하며, 프론트와 백엔드는 모두 `https:` 환경이어야 합니다.
- 브라우저 런타임 코드에서는 `Set-Cookie` 응답 헤더와 실제 `Cookie` 요청 헤더 원문을 읽을 수 없으므로, 배포 검증은 DevTools와 DEV 진단 로그를 함께 사용합니다.

### 로컬 HTTPS 소셜 로그인 전제 조건

- 기본 개발 서버는 `https://localhost:5173`를 사용합니다.
- 로컬 소셜 로그인과 `Secure` refresh 쿠키 검증은 HTTPS 개발 서버 기준으로 확인합니다.
- 로컬 프론트에서 소셜 로그인을 시작할 때는 backend의 `/api/v1/accounts/social-login/{provider}/local` 시작 경로를 사용합니다.
- backend CORS 허용 origin에 `https://localhost:5173`가 포함되어야 합니다.
- 소셜 로그인 로컬 redirect URI를 사용한다면 `https://localhost:5173/callback` 기준으로 등록합니다.

## 5. 마이페이지 프로필 표시 필드

- `GET /api/v1/accounts/me` 응답은 최소 `nickname`, `name`, `gender`, `email`을 포함한다고 가정합니다.
- 프론트 마이페이지 상단 프로필 영역은 위 4개 필드를 우선 노출하고, 누락 값은 `N/A`로 처리합니다.
