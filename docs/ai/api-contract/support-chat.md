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

## Integration Details

- **Widget**: `SupportChatWidget`을 통해 전역 레이아웃(`App.tsx`)에 배치.
- **Mocking**: 백엔드 미완성 시 MSW를 통해 스트리밍 응답 시뮬레이션.
- **State**: `useSupportChatStore`를 통한 대화 내역 및 위젯 상태 관리.
- **Boundary**: 고객센터 챗봇 API(`/api/v1/chatbot/*`)는 설문 챗봇 API(`/api/v1/survey/chatbot/*`)와 별개로 운영하며, 경로를 혼용하지 않습니다.
