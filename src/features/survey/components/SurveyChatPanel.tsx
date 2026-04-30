import {
  startTransition,
  type FormEvent,
  type KeyboardEvent,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight,
  LoaderCircle,
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

type SurveyChatLoadingStateProps = {
  message?: string;
};

export function SurveyChatLoadingState({
  message = 'AI가 첫 질문을 준비하고 있습니다.',
}: SurveyChatLoadingStateProps) {
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

          <div className="hidden sm:block" />
        </div>
      </div>

      <div className="min-h-0 flex-1 px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3">
        <div className="survey-panel flex h-full min-h-0 flex-col overflow-hidden border-white/6 bg-[linear-gradient(180deg,rgba(12,12,14,0.86),rgba(7,7,8,0.94))]">
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#8d2c2c]/28 bg-[#180909]/52 text-[#f1b8b8] shadow-[0_0_0_8px_rgba(255,255,255,0.015)]">
                <LoaderCircle size={20} className="animate-spin" />
              </span>
              <p className="text-sm font-medium break-keep text-white/70 sm:text-[15px]">
                {message}
              </p>
            </div>
          </div>

          <div className="border-t border-white/8 px-4 py-3.5 sm:px-5 sm:py-4 md:px-6">
            <div className="h-15 rounded-full border border-white/8 bg-white/[0.03]" />
          </div>
        </div>
      </div>
    </section>
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
      : `${nonGameStrikeCount}/${NON_GAME_CHAT_MAX_STRIKES} 누적`;

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
            {!messages.length && isSubmitting ? (
              <div className="flex min-h-full items-center justify-center py-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#8d2c2c]/28 bg-[#180909]/52 text-[#f1b8b8] shadow-[0_0_0_8px_rgba(255,255,255,0.015)]">
                    <LoaderCircle size={18} className="animate-spin" />
                  </span>
                  <p className="text-sm font-medium break-keep text-white/70 sm:text-[15px]">
                    AI가 첫 질문을 준비하고 있습니다.
                  </p>
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <SurveyMessageBubble key={message.id} message={message} />
            ))}

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
