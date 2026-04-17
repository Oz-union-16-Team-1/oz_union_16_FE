function SupportChatTypingIndicator() {
  return (
    <div className="flex items-center gap-1.5" aria-label="챗봇 응답 작성 중">
      <span className="support-chat-dot [animation-delay:0ms]" />
      <span className="support-chat-dot [animation-delay:150ms]" />
      <span className="support-chat-dot [animation-delay:300ms]" />
    </div>
  );
}

export default SupportChatTypingIndicator;
