import {
  startTransition,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  TriangleAlert,
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

function SurveyChatPanel() {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const [inputValue, setInputValue] = useState('');

  const {
    sessionId,
    messages,
    progress,
    hasBootstrapped,
    isSubmitting,
    error,
    recommendationReady,
    lastSubmittedMessage,
    setHasBootstrapped,
    setSubmitting,
    setError,
    clearError,
    setLastSubmittedMessage,
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

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
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
      shouldRestoreFocusRef.current
    ) {
      shouldRestoreFocusRef.current = false;
      restoreTextareaFocus();
    }
  }, [isSubmitting, recommendationReady, restoreTextareaFocus]);

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
      return;
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
    } catch (requestError) {
      setError(extractApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextMessage = inputValue.trim();

    if (!nextMessage) {
      return;
    }

    shouldRestoreFocusRef.current = true;
    setInputValue('');
    await submitMessage({ content: nextMessage, appendUserMessage: true });
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

  return (
    <section className="survey-panel overflow-hidden">
      <div className="border-b border-white/8 px-4 py-4 sm:px-5 md:px-8 md:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6c2323] bg-[#1a0a0a] px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[#ff8f8f] uppercase">
              <Sparkles size={14} />
              {isMockServiceWorkerEnabled() ? '체험 모드' : '개인화 설문'}
            </div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              AI 취향 설문
            </h2>
            <p className="mt-2 text-sm leading-6 break-keep text-white/58 md:text-base">
              최근 재미있었던 게임 경험, 선호 장르, 원하는 플레이 감각을 편하게
              말해주시면 추천 결과로 자연스럽게 이어져요.
            </p>
            {isMockServiceWorkerEnabled() ? (
              <p className="mt-3 text-sm leading-6 text-[#ffb0b0]">
                체험 모드에서 설문 흐름을 먼저 확인할 수 있어요.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/88 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={16} />
              설문 초기화
            </button>

            <button
              type="button"
              onClick={handleMoveToRecommendation}
              disabled={!recommendationReady || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ee2525,#9b1010)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(150,0,0,0.32)] transition hover:translate-y-[-1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
            >
              추천 결과 보기
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="survey-grid gap-4 px-3 py-4 sm:px-4 sm:py-5 md:gap-6 md:px-8 md:py-8">
        <div className="space-y-4">
          <SurveyProgress progress={progress} />

          <section className="survey-panel px-4 py-4 sm:px-5 sm:py-5">
            <h3 className="text-sm font-semibold tracking-[0.18em] text-white/42 uppercase">
              안내사항
            </h3>
            <div className="mt-3 space-y-3 text-sm leading-6 text-white/60">
              <p>
                답변은 게임 취향, 플레이 스타일, 선호 장르처럼 게임과 관련된
                내용 위주로 작성해 주세요.
              </p>
              <p>
                최대한 자세히 답변을 적어주시면 빠르게 설문이 끝날 수 있습니다.
              </p>
              <p>
                게임과 관련없는 질문을 반복할시 일시적으로 계정이 정지될 수
                있습니다.
              </p>
            </div>
          </section>
        </div>

        <div className="survey-panel flex min-h-[640px] flex-col">
          <div
            ref={viewportRef}
            className="survey-message-scroll flex-1 space-y-5 px-4 py-4 sm:px-5 sm:py-5 md:px-6"
          >
            {!messages.length && isSubmitting ? (
              <div className="flex w-full justify-start">
                <div className="rounded-3xl border border-white/8 bg-white/[0.04] px-4 py-4 text-sm text-white/60">
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
          </div>

          <div className="border-t border-white/8 px-4 py-4 sm:px-5 sm:py-5 md:px-6">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-3 block text-sm font-semibold text-white/65">
                  {recommendationReady
                    ? '설문이 완료되었습니다.'
                    : '지금 떠오르는 취향이나 최근 즐긴 게임 이야기를 적어보세요.'}
                </span>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={
                    recommendationReady
                      ? "추천 결과가 준비되었어요. 우측 상단의 '추천 결과 보기' 버튼을 눌러 다음 단계로 이동해 주세요."
                      : '예: 도전적인 보스전은 좋아하지만, 분위기는 너무 어둡지 않고 탐험하는 재미가 있는 게임이 좋아요.'
                  }
                  className="min-h-[120px] w-full resize-none rounded-[24px] border border-white/10 bg-[#0e0e10] px-4 py-4 text-[15px] leading-7 text-white transition outline-none placeholder:text-white/26 focus:border-[#b42525] focus:bg-[#121214] sm:px-5"
                  disabled={isSubmitting || recommendationReady}
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/40">
                  {recommendationReady
                    ? "설문이 끝났습니다. 우측 상단의 '추천 결과 보기' 버튼을 누르면 바로 추천 리스트로 이동합니다."
                    : 'Enter 키로 전송하고, Shift + Enter로 줄바꿈할 수 있습니다.'}
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || recommendationReady}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#ff3535,#9f1212)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(139,0,0,0.28)] transition hover:translate-y-[-1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <SendHorizontal size={16} />
                  {recommendationReady
                    ? '설문 완료'
                    : isSubmitting
                      ? '응답 생성 중...'
                      : '메시지 보내기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SurveyChatPanel;
