import {
  startTransition,
  type FormEvent,
  type KeyboardEvent,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import {
  LoaderCircle,
  ChevronRight,
  RotateCcw,
  SendHorizontal,
  TriangleAlert,
} from 'lucide-react';

import { ROUTES } from '../../../constants/routes';
import { useSurveyStore } from '../store/useSurveyStore';
import {
  formatRemainingBlockTime,
  GAME_RELATED_KEYWORDS,
  NON_GAME_CHAT_MAX_STRIKES,
  useSurveyModerationGuard,
} from '../hooks/useSurveyModerationGuard';
import { useSurveySessionFlow } from '../hooks/useSurveySessionFlow';
import { useSurveyViewportState } from '../hooks/useSurveyViewportState';
import SurveyGuardrailLauncher from './SurveyGuardrailLauncher';
import SurveyMessageBubble from './SurveyMessageBubble';
import SurveyProgress from './SurveyProgress';

type SurveyChatPanelProps = {
  isHistoryView?: boolean;
};

export function SurveyChatLoadingState() {
  return (
    <section className="survey-panel relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-white/8 px-4 py-2.5 sm:px-5 md:px-6">
        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="hidden sm:block" />

          <div className="min-w-0 text-center">
            <h2 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px] md:text-[31px]">
              게임 선호도 설문조사
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <div className="min-w-43 rounded-[22px] border border-white/10 bg-white/3 px-3.5 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.16)] backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div className="h-3.5 w-14 animate-pulse rounded-full bg-white/10" />
                <div className="h-4 w-9 animate-pulse rounded-full bg-white/12" />
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-white/14" />
              </div>
            </div>

            <div className="h-[52px] w-31 animate-pulse rounded-2xl border border-white/10 bg-white/3" />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3">
        <div className="survey-panel flex h-full min-h-0 flex-col overflow-hidden border-white/6 bg-[linear-gradient(180deg,rgba(12,12,14,0.86),rgba(7,7,8,0.94))]">
          <div className="survey-message-scroll max-h-none flex-1 space-y-4 px-4 py-4 sm:px-5 sm:py-4.5 md:px-6">
            <div className="flex justify-start">
              <div className="flex max-w-[92%] items-start gap-[0.7rem] md:max-w-[78%]">
                <div className="mt-1 h-[38px] w-[38px] shrink-0 animate-pulse rounded-2xl bg-white/8" />
                <div className="rounded-[24px] rounded-tl-md border border-white/8 bg-white/4 px-4 py-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                  <div className="space-y-2.5">
                    <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
                    <div className="h-4 w-full max-w-92 animate-pulse rounded-full bg-white/8" />
                    <div className="h-4 w-full max-w-80 animate-pulse rounded-full bg-white/8" />
                    <div className="h-4 w-48 animate-pulse rounded-full bg-white/8" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="flex max-w-[92%] items-start gap-2.5 md:max-w-[68%]">
                <div className="mt-1 h-[38px] w-[38px] shrink-0 animate-pulse rounded-2xl bg-white/8" />
                <div className="rounded-[24px] rounded-tl-md border border-white/7 bg-white/[0.03] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                  <div className="space-y-2.5">
                    <div className="h-4 w-full max-w-72 animate-pulse rounded-full bg-white/8" />
                    <div className="h-4 w-40 animate-pulse rounded-full bg-white/8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/8 px-4 py-3.5 sm:px-5 sm:py-4 md:px-6">
            <div className="relative block h-15 overflow-hidden rounded-full border border-white/10 bg-[#0e0e10]">
              <div className="h-full w-full py-4.25 pr-[5.8rem] pl-4 sm:pl-5">
                <div className="h-6 w-full max-w-110 rounded-full bg-white/8" />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <div className="h-11.5 w-11.5 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SurveyPendingAssistantBubble({ message }: { message: string }) {
  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-[92%] items-start gap-[0.7rem] md:max-w-[78%]">
        <div className="mt-1 h-[38px] w-[38px] shrink-0 rounded-2xl bg-white/8" />
        <div className="rounded-[24px] rounded-tl-md border border-white/8 bg-white/4 px-4 py-3.5 text-left shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-2.5 text-white/78">
            <LoaderCircle size={16} className="animate-spin text-[#ff8d8d]" />
            <p className="text-[15px] leading-6 break-keep">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurveyChatPanel({ isHistoryView = false }: SurveyChatPanelProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [isGuardrailPanelOpen, setIsGuardrailPanelOpen] = useState(false);

  const sessionId = useSurveyStore((state) => state.sessionId);
  const messages = useSurveyStore((state) => state.messages);
  const progress = useSurveyStore((state) => state.progress);
  const hasBootstrapped = useSurveyStore((state) => state.hasBootstrapped);
  const isSubmitting = useSurveyStore((state) => state.isSubmitting);
  const error = useSurveyStore((state) => state.error);
  const recommendationReady = useSurveyStore(
    (state) => state.recommendationReady,
  );
  const lastSubmittedMessage = useSurveyStore(
    (state) => state.lastSubmittedMessage,
  );

  const {
    moderationHeuristicEnabled,
    nonGameStrikeCount,
    remainingBlockTimeMs,
    isChatTemporarilyBlocked,
    hasExpiredChatBlock,
    isTextareaDisabled,
    isRecommendationButtonDisabled,
    inputPlaceholder,
    applySuccessfulSubmissionModeration,
  } = useSurveyModerationGuard({
    isHistoryView,
    isSubmitting,
    recommendationReady,
  });

  const {
    viewportRef,
    formRef,
    textareaRef,
    enteredWithCompletedSurvey,
    queueFocusRestore,
    cancelFocusRestore,
  } = useSurveyViewportState({
    messagesLength: messages.length,
    error,
    hasBootstrapped,
    sessionId,
    recommendationReady,
    isSubmitting,
    isChatTemporarilyBlocked,
    hasExpiredChatBlock,
  });

  const { submitMessage, handleRetry, handleReset, handleBlockedSubmission } =
    useSurveySessionFlow({
      queueFocusRestore,
      cancelFocusRestore,
    });

  const recommendationButtonLabel =
    isHistoryView || enteredWithCompletedSurvey
      ? '추천 결과로 돌아가기'
      : '추천 결과 바로 보기';
  const guardrailStatusLabel = isChatTemporarilyBlocked
    ? `${formatRemainingBlockTime(remainingBlockTimeMs)} 남음`
    : hasExpiredChatBlock
      ? '제한 종료'
      : moderationHeuristicEnabled
        ? `${nonGameStrikeCount}/${NON_GAME_CHAT_MAX_STRIKES} 누적`
        : '실서버 기준';
  const pendingAssistantMessage = recommendationReady
    ? null
    : messages.length === 0
      ? null
      : 'AI가 답변을 정리하고 있습니다.';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextMessage = inputValue.trim();

    if (
      !nextMessage ||
      isChatTemporarilyBlocked ||
      hasExpiredChatBlock ||
      recommendationReady
    ) {
      return;
    }

    queueFocusRestore();
    setInputValue('');

    const didSubmitSucceed = await submitMessage({
      content: nextMessage,
      appendUserMessage: true,
    });

    if (!didSubmitSucceed) {
      return;
    }

    applySuccessfulSubmissionModeration(nextMessage, {
      onBlocked: handleBlockedSubmission,
    });
  };

  const handleResetClick = async () => {
    setInputValue('');
    await handleReset();
  };

  const handleMoveToRecommendation = () => {
    if (isRecommendationButtonDisabled) {
      return;
    }

    startTransition(() => {
      const surveySessionQuery = sessionId
        ? `?source=survey&session_id=${sessionId}`
        : '?source=survey';
      navigate(`/${ROUTES.RECOMMENDATION_LIST}${surveySessionQuery}`);
    });
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  if (!messages.length && isSubmitting) {
    return <SurveyChatLoadingState />;
  }

  return (
    <section className="survey-panel relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-white/8 px-4 py-2.5 sm:px-5 md:px-6">
        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="hidden sm:block" />

          <div className="min-w-0 text-center">
            <h2 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px] md:text-[31px]">
              게임 선호도 설문조사
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <SurveyProgress progress={progress} compact />
            <button
              type="button"
              onClick={handleResetClick}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm font-semibold text-white/88 transition hover:border-white/20 hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={16} />
              설문 초기화
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3">
        <div className="survey-panel flex h-full min-h-0 flex-col overflow-hidden border-white/6 bg-[linear-gradient(180deg,rgba(12,12,14,0.86),rgba(7,7,8,0.94))]">
          <div
            ref={viewportRef}
            className="survey-message-scroll max-h-none flex-1 space-y-4 px-4 py-4 sm:px-5 sm:py-4.5 md:px-6"
          >
            {messages.map((message) => (
              <SurveyMessageBubble key={message.id} message={message} />
            ))}

            {isSubmitting && pendingAssistantMessage ? (
              <SurveyPendingAssistantBubble message={pendingAssistantMessage} />
            ) : null}

            {error ? (
              <div className="rounded-3xl border border-[#7d2424] bg-[#220a0a] px-5 py-4 text-[#ffb4b4]">
                <div className="flex items-start gap-3">
                  <TriangleAlert
                    size={18}
                    className="mt-1 shrink-0 text-[#ff6363]"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">
                      응답 처리 중 오류가 발생했습니다.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#ffcfcf]">
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={!lastSubmittedMessage || isSubmitting}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#944141] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {recommendationReady ? (
              <div className="flex w-full justify-center pt-2">
                {isRecommendationButtonDisabled ? (
                  <div className="max-w-130 rounded-[26px] border border-white/8 bg-white/2.5 px-5 py-4 text-center text-sm leading-6 break-keep text-white/58">
                    추천 결과는 준비되었지만 현재 설문 제한 상태에서는 바로
                    이동할 수 없어요. 설문 초기화 후 다시 진행해 주세요.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleMoveToRecommendation}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff3535,#9f1212)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(150,0,0,0.32)] transition hover:-translate-y-px hover:brightness-105"
                  >
                    {recommendationButtonLabel}
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/8 px-4 py-3.5 sm:px-5 sm:py-4 md:px-6">
            <form ref={formRef} onSubmit={handleSubmit}>
              <label className="relative block h-15 overflow-hidden rounded-full border border-white/10 bg-[#0e0e10] transition focus-within:border-[#b42525] focus-within:bg-[#121214]">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={inputPlaceholder}
                  className="h-full min-h-full w-full resize-none overflow-hidden bg-transparent py-4.25 pr-[5.8rem] pl-4 text-[15px] leading-6 text-white outline-none placeholder:text-white/26 sm:pl-5"
                  disabled={isTextareaDisabled}
                />
                {isChatTemporarilyBlocked ? (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <div className="inline-flex h-11.5 min-w-15.5 items-center justify-center rounded-full border border-[#6f2525] bg-[#170b0b] px-2.5 text-sm font-semibold text-[#ffb4b4]">
                      {formatRemainingBlockTime(remainingBlockTimeMs)}
                    </div>
                  </div>
                ) : hasExpiredChatBlock ? null : (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || recommendationReady}
                      aria-label={
                        recommendationReady
                          ? '설문 완료'
                          : isSubmitting
                            ? '응답 생성 중'
                            : '메시지 보내기'
                      }
                      className="inline-flex h-11.5 w-11.5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff3535,#9f1212)] text-white shadow-[0_14px_30px_rgba(139,0,0,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <SendHorizontal size={16} />
                    </button>
                  </div>
                )}
              </label>
            </form>
          </div>
        </div>
      </div>

      <SurveyGuardrailLauncher
        isOpen={isGuardrailPanelOpen}
        onToggle={() => setIsGuardrailPanelOpen((current) => !current)}
        onClose={() => setIsGuardrailPanelOpen(false)}
        statusLabel={guardrailStatusLabel}
        keywords={GAME_RELATED_KEYWORDS}
      />
    </section>
  );
}

export default SurveyChatPanel;
