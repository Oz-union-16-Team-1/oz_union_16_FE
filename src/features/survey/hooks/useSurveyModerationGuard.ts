import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSurveyStore } from '../store/useSurveyStore';

export const NON_GAME_CHAT_MAX_STRIKES = 3;
const NON_GAME_CHAT_BLOCK_DURATION_MS = 5 * 60 * 1000;

export const GAME_RELATED_KEYWORDS = [
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

export const isLikelyGameRelatedMessage = (content: string) => {
  const normalized = content.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return GAME_RELATED_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
};

export const formatRemainingBlockTime = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(1, '0')}:${String(seconds).padStart(2, '0')}`;
};

type UseSurveyModerationGuardOptions = {
  isHistoryView: boolean;
  isSubmitting: boolean;
  recommendationReady: boolean;
};

export const useSurveyModerationGuard = ({
  isHistoryView,
  isSubmitting,
  recommendationReady,
}: UseSurveyModerationGuardOptions) => {
  const nonGameStrikeCount = useSurveyStore(
    (state) => state.nonGameStrikeCount,
  );
  const chatBlockedUntil = useSurveyStore((state) => state.chatBlockedUntil);
  const setNonGameStrikeCount = useSurveyStore(
    (state) => state.setNonGameStrikeCount,
  );
  const setChatBlockedUntil = useSurveyStore(
    (state) => state.setChatBlockedUntil,
  );
  const [currentTime, setCurrentTime] = useState(() => Date.now());

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
  const guardrailStatusLabel = isChatTemporarilyBlocked
    ? `${formatRemainingBlockTime(remainingBlockTimeMs)} 남음`
    : hasExpiredChatBlock
      ? '제한 종료'
      : `${nonGameStrikeCount}/${NON_GAME_CHAT_MAX_STRIKES} 누적`;

  const inputPlaceholder = useMemo(() => {
    if (isHistoryView && recommendationReady) {
      return '완료된 설문 기록을 다시 보고 있어요.';
    }

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
  }, [
    hasExpiredChatBlock,
    isChatTemporarilyBlocked,
    isHistoryView,
    recommendationReady,
  ]);

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

  const applySuccessfulSubmissionModeration = useCallback(
    (
      content: string,
      options?: {
        onBlocked?: () => void;
      },
    ) => {
      const isGameRelatedMessage = isLikelyGameRelatedMessage(content);
      const nextStrikeCount = isGameRelatedMessage
        ? nonGameStrikeCount
        : nonGameStrikeCount + 1;
      const shouldBlockAfterResponse =
        !isGameRelatedMessage && nextStrikeCount >= NON_GAME_CHAT_MAX_STRIKES;

      if (!isGameRelatedMessage) {
        setNonGameStrikeCount(nextStrikeCount);
      }

      if (shouldBlockAfterResponse) {
        const now = Date.now();
        setCurrentTime(now);
        setChatBlockedUntil(now + NON_GAME_CHAT_BLOCK_DURATION_MS);
        options?.onBlocked?.();
      }
    },
    [nonGameStrikeCount, setChatBlockedUntil, setNonGameStrikeCount],
  );

  return {
    nonGameStrikeCount,
    remainingBlockTimeMs,
    hasReachedNonGameChatLimit,
    isChatTemporarilyBlocked,
    hasExpiredChatBlock,
    isTextareaDisabled,
    isRecommendationButtonDisabled,
    guardrailStatusLabel,
    inputPlaceholder,
    applySuccessfulSubmissionModeration,
  };
};
