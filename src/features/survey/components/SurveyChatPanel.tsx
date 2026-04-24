import {
  startTransition,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import {
  BadgeInfo,
  ChevronRight,
  RotateCcw,
  SendHorizontal,
  TriangleAlert,
  X,
} from 'lucide-react';

import { ROUTES } from '../../../constants/routes';
import { isMockServiceWorkerEnabled } from '../../../lib/env';
import {
  useContinueSurveyMutation,
  useResetSurveyMutation,
  useStartSurveySessionMutation,
} from '../api/useSurveyApi';
import { extractApiErrorMessage } from '../api/survey';
import { useSurveyStore } from '../store/useSurveyStore';
import SurveyMessageBubble from './SurveyMessageBubble';
import SurveyProgress from './SurveyProgress';

const NON_GAME_CHAT_MAX_STRIKES = 3;
const NON_GAME_CHAT_BLOCK_DURATION_MS = 5 * 60 * 1000;

const GAME_RELATED_KEYWORDS = [
  '게임',
  '장르',
  '스토리',
  '전투',
  '보스',
  '탐험',
  '수집',
  '성장',
  '플레이',
  '플레이스타일',
  '멀티',
  '싱글',
  '협동',
  '그래픽',
  '분위기',
  '손맛',
  'rpg',
  'fps',
  '액션',
  '어드벤처',
  '슈팅',
  '전략',
  '시뮬레이션',
  '레이싱',
  '스포츠',
  '퍼즐',
  '플랫폼',
  '격투',
  '리듬',
  '비주얼 노벨',
];

const isLikelyGameRelatedMessage = (content: string) => {
  const normalized = content.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return GAME_RELATED_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
};

const formatRemainingBlockTime = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(1, '0')}:${String(seconds).padStart(2, '0')}`;
};

function SurveyChatPanel() {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const [inputValue, setInputValue] = useState('');
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isGuardrailPanelOpen, setIsGuardrailPanelOpen] = useState(false);

  const {
    sessionId,
    messages,
    progress,
    hasBootstrapped,
    isSubmitting,
    error,
    recommendationReady,
    lastSubmittedMessage,
    nonGameStrikeCount,
    chatBlockedUntil,
    setHasBootstrapped,
    setSubmitting,
    setError,
    clearError,
    setLastSubmittedMessage,
    setNonGameStrikeCount,
    setChatBlockedUntil,
    clearModerationState,
    addUserMessage,
    hydrateInitialSession,
    applyChatResponse,
    resetSurveyState,
  } = useSurveyStore();

  const startSessionMutation = useStartSurveySessionMutation();
  const continueSurveyMutation = useContinueSurveyMutation();
  const resetSurveyMutation = useResetSurveyMutation();

  const isRecoverableMockSessionError = (message: string | null) =>
    isMockServiceWorkerEnabled() &&
    Boolean(
      message &&
      (message.includes('해당 세션') || message.includes('설문 세션이 만료')),
    );

  const remainingBlockTimeMs = chatBlockedUntil
    ? Math.max(chatBlockedUntil - currentTime, 0)
    : 0;
  const hasReachedNonGameChatLimit =
    nonGameStrikeCount >= NON_GAME_CHAT_MAX_STRIKES;
  const isChatTemporarilyBlocked = Boolean(
    chatBlockedUntil && remainingBlockTimeMs > 0,
  );
  const hasExpiredChatBlock = Boolean(
    chatBlockedUntil && remainingBlockTimeMs <= 0,
  );
  const isTextareaDisabled =
    isSubmitting ||
    recommendationReady ||
    isChatTemporarilyBlocked ||
    hasExpiredChatBlock;
  const isRecommendationButtonDisabled =
    !recommendationReady ||
    isSubmitting ||
    isChatTemporarilyBlocked ||
    hasExpiredChatBlock ||
    hasReachedNonGameChatLimit;
  const shouldShowGuardrailPanel = import.meta.env.DEV;
  const guardrailStatusLabel = isChatTemporarilyBlocked
    ? `${formatRemainingBlockTime(remainingBlockTimeMs)} 남음`
    : hasExpiredChatBlock
      ? '제한 종료'
      : `${nonGameStrikeCount}/${NON_GAME_CHAT_MAX_STRIKES} 누적`;
  const inputPlaceholder = useMemo(() => {
    if (isChatTemporarilyBlocked) {
      return '반복된 이상행동으로 인해 5분간 채팅이 정지됩니다.';
    }

    if (hasExpiredChatBlock) {
      return '제한 시간이 종료되었습니다. 설문 초기화를 누르고 다시 진행해 주세요.';
    }

    if (recommendationReady) {
      return '추천 결과가 준비되었어요. 아래 버튼으로 다음 단계로 이동해 주세요.';
    }

    return '취향과 관련된 게임 이야기를 입력해 주세요.';
  }, [hasExpiredChatBlock, isChatTemporarilyBlocked, recommendationReady]);

  useEffect(() => {
    if (!isChatTemporarilyBlocked) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isChatTemporarilyBlocked]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const shouldJumpToBottom =
      lastMessageCountRef.current === 0 && messages.length > 0;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: shouldJumpToBottom ? 'auto' : 'smooth',
    });

    lastMessageCountRef.current = messages.length;
  }, [messages, error]);

  const restoreTextareaFocus = useCallback(() => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea || textarea.disabled) {
        return;
      }

      textarea.focus();
      const cursorPosition = textarea.value.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }, []);

  useEffect(() => {
    if (
      !isSubmitting &&
      !recommendationReady &&
      !isChatTemporarilyBlocked &&
      !hasExpiredChatBlock &&
      shouldRestoreFocusRef.current
    ) {
      shouldRestoreFocusRef.current = false;
      restoreTextareaFocus();
    }
  }, [
    hasExpiredChatBlock,
    isChatTemporarilyBlocked,
    isSubmitting,
    recommendationReady,
    restoreTextareaFocus,
  ]);

  const bootstrapSurvey = useCallback(
    async (force = false) => {
      if ((hasBootstrapped && !force) || (isSubmitting && !force)) {
        return;
      }

      clearError();
      resetSurveyState();
      setHasBootstrapped(true);
      setSubmitting(true);

      try {
        const response = await startSessionMutation.mutateAsync({
          is_reset: false,
        });
        hydrateInitialSession(response);
      } catch (requestError) {
        setHasBootstrapped(false);
        setError(extractApiErrorMessage(requestError));
      } finally {
        setSubmitting(false);
      }
    },
    [
      clearError,
      hydrateInitialSession,
      hasBootstrapped,
      isSubmitting,
      resetSurveyState,
      setError,
      setHasBootstrapped,
      setSubmitting,
      startSessionMutation,
    ],
  );

  useEffect(() => {
    if (!sessionId && !hasBootstrapped) {
      void bootstrapSurvey();
    }
  }, [bootstrapSurvey, hasBootstrapped, sessionId]);

  const submitMessage = async ({
    content,
    appendUserMessage,
  }: {
    content: string;
    appendUserMessage: boolean;
  }) => {
    const trimmed = content.trim();

    if (!trimmed || isSubmitting) {
      return false;
    }

    clearError();
    setLastSubmittedMessage(trimmed);

    setSubmitting(true);

    try {
      if (!sessionId) {
        const sessionResponse = await startSessionMutation.mutateAsync({
          is_reset: false,
        });
        hydrateInitialSession(sessionResponse);

        if (appendUserMessage) {
          addUserMessage(trimmed);
        }

        const response = await continueSurveyMutation.mutateAsync({
          session_id: sessionResponse.session_id,
          user_answer: trimmed,
        });

        applyChatResponse(response);
      } else {
        if (appendUserMessage) {
          addUserMessage(trimmed);
        }

        const response = await continueSurveyMutation.mutateAsync({
          session_id: sessionId,
          user_answer: trimmed,
        });

        applyChatResponse(response);
      }

      return true;
    } catch (requestError) {
      setError(extractApiErrorMessage(requestError));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

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

    const isGameRelatedMessage = isLikelyGameRelatedMessage(nextMessage);
    const nextStrikeCount = isGameRelatedMessage
      ? nonGameStrikeCount
      : nonGameStrikeCount + 1;
    const shouldBlockAfterResponse =
      !isGameRelatedMessage && nextStrikeCount >= NON_GAME_CHAT_MAX_STRIKES;

    shouldRestoreFocusRef.current = true;
    setInputValue('');
    const didSubmitSucceed = await submitMessage({
      content: nextMessage,
      appendUserMessage: true,
    });

    if (!didSubmitSucceed) {
      return;
    }

    if (!isGameRelatedMessage) {
      setNonGameStrikeCount(nextStrikeCount);
    }

    if (shouldBlockAfterResponse) {
      setCurrentTime(Date.now());
      setChatBlockedUntil(Date.now() + NON_GAME_CHAT_BLOCK_DURATION_MS);
      shouldRestoreFocusRef.current = false;
    }
  };

  const handleRetry = async () => {
    shouldRestoreFocusRef.current = true;

    if (!lastSubmittedMessage) {
      await bootstrapSurvey(true);
      return;
    }

    if (isRecoverableMockSessionError(error)) {
      clearError();
      resetSurveyState();
      setHasBootstrapped(true);
      setLastSubmittedMessage(lastSubmittedMessage);
      setSubmitting(true);

      try {
        const sessionResponse = await startSessionMutation.mutateAsync({
          is_reset: true,
        });
        hydrateInitialSession(sessionResponse);
        addUserMessage(lastSubmittedMessage);

        const response = await continueSurveyMutation.mutateAsync({
          session_id: sessionResponse.session_id,
          user_answer: lastSubmittedMessage,
        });

        applyChatResponse(response);
      } catch (requestError) {
        setError(extractApiErrorMessage(requestError));
      } finally {
        setSubmitting(false);
      }

      return;
    }

    await submitMessage({
      content: lastSubmittedMessage,
      appendUserMessage: false,
    });
  };

  const handleReset = async () => {
    if (isSubmitting) {
      return;
    }

    clearError();

    if (!sessionId) {
      shouldRestoreFocusRef.current = true;
      setInputValue('');
      clearModerationState();
      resetSurveyState();
      await bootstrapSurvey();
      return;
    }

    shouldRestoreFocusRef.current = true;
    setSubmitting(true);

    try {
      const response = await resetSurveyMutation.mutateAsync({
        session_id: sessionId,
      });

      setInputValue('');
      clearModerationState();
      hydrateInitialSession(response);
    } catch (requestError) {
      const errorMessage = extractApiErrorMessage(requestError);

      if (isRecoverableMockSessionError(errorMessage)) {
        setInputValue('');
        resetSurveyState();
        setHasBootstrapped(false);
        await bootstrapSurvey(true);
        return;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveToRecommendation = () => {
    if (isRecommendationButtonDisabled) {
      return;
    }

    startTransition(() => {
      navigate(`/${ROUTES.RECOMMENDATION_LIST}?source=survey`);
    });
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const guardrailLauncher =
    shouldShowGuardrailPanel && typeof document !== 'undefined'
      ? createPortal(
          <div className="pointer-events-none fixed bottom-6 left-2 z-95 hidden lg:block">
            {isGuardrailPanelOpen ? (
              <aside className="pointer-events-auto mb-3 ml-3 w-75 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,20,0.84),rgba(8,8,9,0.94))] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.26)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-[#ff8a8a] uppercase">
                      Dev Guardrail
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-white">
                      설문 키워드 휴리스틱
                    </h3>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] font-medium text-white/64">
                      {guardrailStatusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsGuardrailPanelOpen(false)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/3 text-white/58 transition hover:bg-white/6 hover:text-white"
                      aria-label="개발용 가드레일 패널 닫기"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 break-keep text-white/54">
                  개발 환경에서만 보이는 설명 패널입니다. 현재 설문은 키워드
                  `includes()` 휴리스틱으로 게임 관련 질문 여부를 판정하고,
                  비게임 질문 3회 누적 시 5분 제한을 적용합니다.
                </p>

                <div className="mt-3 rounded-[18px] border border-white/8 bg-white/3 px-3 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-white/42 uppercase">
                    허용 키워드
                  </p>
                  <div className="mt-2 flex max-h-33 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {GAME_RELATED_KEYWORDS.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[11px] font-medium text-white/72"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </aside>
            ) : null}

            <button
              type="button"
              onClick={() => setIsGuardrailPanelOpen((current) => !current)}
              className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(255,53,53,0.94),rgba(130,11,11,0.96))] text-white shadow-[0_18px_40px_rgba(130,0,0,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              aria-label="개발용 설문 키워드 가이드 열기"
            >
              <BadgeInfo size={24} />
            </button>
          </div>,
          document.body,
        )
      : null;

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
              onClick={handleReset}
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
              <div className="flex w-full justify-start">
                <div className="rounded-3xl border border-white/8 bg-white/4 px-4 py-3.5 text-sm text-white/60">
                  AI가 첫 질문을 준비하고 있습니다...
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
                    추천 결과 바로 보기
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

      {guardrailLauncher}
    </section>
  );
}

export default SurveyChatPanel;
