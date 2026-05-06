# Customer Support Chatbot

고객센터 챗봇 관련 명세는 아래와 같습니다.

## When To Read

- `src/features/support-chat`, `src/components/support-chat`, 전역 레이아웃 챗봇 위젯 연결을 수정하기 전에 읽습니다.
- `/api/v1/chatbot/*` endpoint나 SSE 처리 규칙이 바뀌면 이 문서를 먼저 갱신합니다.

## Related Code

- `src/features/support-chat/api`
- `src/features/support-chat/hooks`
- `src/features/support-chat/store`
- `src/components/support-chat`
- `src/App.tsx`

## API Endpoints

```text
POST   /api/v1/chatbot/messages     # 메시지 전송 (세션 생성/재사용)
GET    /api/v1/chatbot/stream       # AI 응답 스트리밍 (SSE, query: session_id)
```

## Message Session Contract

- `POST /api/v1/chatbot/messages`는 인증 없이 호출하며 `Authorization` 헤더를 사용하지 않습니다.
- Request body는 `message`를 필수로 보내고, 최초 요청이 아닌 경우 직전 응답에서 받은 `session_id`를 함께 보냅니다.
- 최초 요청은 `session_id`를 생략할 수 있으며, 응답의 `session_id`는 이후 메시지 요청과 스트리밍 요청에 재사용합니다.
- `GET /api/v1/chatbot/stream`은 `session_id` query가 필수입니다.
- 세션은 생성 또는 마지막 유효 요청 기준 30분 동안 유지됩니다.
- 챗봇 대화는 현재 화면 한정 임시 상태입니다. 챗봇 종료, 패널 바깥 클릭, `Esc`, 화면 이탈, 새로고침 시 세션과 메시지 내역을 초기화합니다.

```json
{
  "message": "아이디는 어디서 찾나요?",
  "session_id": "1ae7032f-1051-441c-ae9d-07b7eb6d2b7d"
}
```

## Integration Details

- **Widget**: `SupportChatWidget`을 통해 전역 레이아웃(`App.tsx`)에 배치.
- **Mocking**: 백엔드 미완성 시 MSW를 통해 스트리밍 응답 시뮬레이션.
- **State**: `useSupportChatStore`를 통한 대화 내역 및 위젯 상태 관리.
- **Boundary**: 고객센터 챗봇 API(`/api/v1/chatbot/*`)는 설문 챗봇 API(`/api/v1/survey/chatbot/*`)와 별개로 운영하며, 경로를 혼용하지 않습니다.
