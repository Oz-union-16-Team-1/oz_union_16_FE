import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

import { formatMatchingCandidateRating } from '../utils/matchingDetail';
import type {
  MatchingEvaluationValue,
  MatchingCandidateItem,
  MatchingRatingValue,
} from '../../../features/matching/types';
import MatchingRatingStars from './MatchingRatingStars';
import type { MatchingCandidateOverlayViewModel } from '../hooks/useMatchingCandidateOverlay';

const MATCHING_ICON_ACTION_BUTTON_BASE_CLASS =
  'mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d93737] disabled:opacity-60';

const MATCHING_SECONDARY_ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909] disabled:border-white/8 disabled:bg-white/2 disabled:text-white/28';

const MATCHING_PRIMARY_ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-full bg-[#c91818] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b11212] disabled:bg-[#5c1a1a] disabled:text-white/44';

export interface MatchingCandidatePanelProps {
  candidate: MatchingCandidateItem;
  currentEvaluation: MatchingEvaluationValue;
  candidateSummary: string;
  genreTitle: string;
  isLastCard: boolean;
  hasSelectedRating: boolean;
  canGoPrevious: boolean;
  allCandidatesRated: boolean;
  isLikePending: boolean;
  isSubmitPending: boolean;
  likeFeedbackMessage: string | null;
  submitErrorMessage: string | null;
  overlay: MatchingCandidateOverlayViewModel;
  onToggleLike: () => void;
  onRate: (rating: MatchingRatingValue) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

function MatchingCandidatePanel({
  candidate,
  currentEvaluation,
  candidateSummary,
  genreTitle,
  isLastCard,
  hasSelectedRating,
  canGoPrevious,
  allCandidatesRated,
  isLikePending,
  isSubmitPending,
  likeFeedbackMessage,
  submitErrorMessage,
  overlay,
  onToggleLike,
  onRate,
  onPrevious,
  onNext,
  onSubmit,
}: MatchingCandidatePanelProps) {
  const {
    titleRef,
    summaryRef,
    titleCollapsedHeightRem,
    summaryCollapsedHeightRem,
    isTitleOverflowing,
    isSummaryOverflowing,
    isTitlePreviewOpen,
    isSummaryOverlayOpen,
    openTitlePreview,
    closeTitlePreview,
    toggleSummaryOverlay,
    closeSummaryOverlay,
  } = overlay;
  const shouldShowTitleToggle = isTitleOverflowing;
  const shouldShowSummaryToggle = isSummaryOverflowing;

  return (
    <article className="survey-panel relative flex flex-col px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="relative"
            onMouseEnter={() =>
              shouldShowTitleToggle ? openTitlePreview() : undefined
            }
            onMouseLeave={closeTitlePreview}
          >
            <h2
              ref={titleRef}
              tabIndex={shouldShowTitleToggle ? 0 : undefined}
              className={`text-2xl leading-[1.28] font-semibold tracking-[-0.02em] break-keep text-white sm:text-[30px] ${
                shouldShowTitleToggle ? 'cursor-help' : ''
              }`}
              title={candidate.title}
              style={{
                maxHeight: `${titleCollapsedHeightRem}rem`,
                overflow: 'hidden',
              }}
              onFocus={() =>
                shouldShowTitleToggle ? openTitlePreview() : undefined
              }
              onBlur={closeTitlePreview}
            >
              {candidate.title}
            </h2>
            {shouldShowTitleToggle && isTitlePreviewOpen ? (
              <div className="pointer-events-none absolute top-full left-0 z-20 mt-3 w-full max-w-136 rounded-2xl border border-white/10 bg-[#0f0f11]/96 px-4 py-3 shadow-[0_20px_48px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                <p className="text-[15px] leading-6 break-keep text-white/92">
                  {candidate.title}
                </p>
              </div>
            ) : null}
          </div>
          <p
            ref={summaryRef}
            className="mt-3 text-sm leading-6 break-keep text-white/62"
            style={
              isSummaryOverlayOpen
                ? undefined
                : {
                    maxHeight: `${summaryCollapsedHeightRem}rem`,
                    overflow: 'hidden',
                  }
            }
          >
            {candidateSummary}
          </p>
          {shouldShowSummaryToggle ? (
            <button
              type="button"
              onClick={toggleSummaryOverlay}
              className="mt-2.5 text-sm font-semibold text-[#ff8d8d] transition hover:text-[#ffb1b1]"
            >
              줄거리 전체 보기
            </button>
          ) : null}
          <div className="mt-4 grid gap-1.5 border-t border-white/8 pt-2.5 sm:grid-cols-2">
            <div className="flex h-full flex-col rounded-[14px] border border-white/8 bg-white/3 px-2.5 py-2">
              <p className="text-[10px] font-medium text-white/38">장르</p>
              <p
                className="mt-1 text-[13px] leading-5 font-medium text-white/78"
                style={{
                  maxHeight: '1.25rem',
                  overflow: 'hidden',
                }}
                title={candidate.genres.join(' / ') || genreTitle}
              >
                {candidate.genres.join(' / ') || genreTitle}
              </p>
            </div>
            <div className="flex h-full flex-col rounded-[14px] border border-white/8 bg-white/3 px-2.5 py-2">
              <p className="text-[10px] font-medium text-white/38">평균 평점</p>
              <p className="mt-1 text-[13px] leading-5 font-medium text-white/78">
                {formatMatchingCandidateRating(candidate.rating)}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleLike}
          aria-pressed={candidate.is_liked}
          aria-label={candidate.is_liked ? '좋아요 해제' : '좋아요 추가'}
          disabled={isLikePending}
          className={`${MATCHING_ICON_ACTION_BUTTON_BASE_CLASS} ${
            candidate.is_liked
              ? 'border-[#c12626]/70 bg-[#220b0b] text-[#f25a5a]'
              : 'border-white/10 bg-white/3 text-white/54 hover:border-white/20 hover:text-white/80'
          }`}
        >
          <Heart
            size={20}
            fill={candidate.is_liked ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="mt-7">
        <p className="text-sm font-semibold text-white">
          이 게임이 내 취향에 얼마나 가까운가요?
        </p>
        <div className="mt-3">
          <MatchingRatingStars
            value={currentEvaluation.rating}
            onRate={onRate}
          />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 break-keep text-white/54">
        {isLastCard
          ? '별점을 매기면 제출 버튼을 사용할 수 있어요.'
          : '별점을 매기면 다음 게임으로 넘어갈 수 있어요.'}
      </p>

      {submitErrorMessage ? (
        <p className="mt-2.5 text-sm leading-6 break-keep text-[#ffc2c2]">
          {submitErrorMessage}
        </p>
      ) : null}

      {likeFeedbackMessage ? (
        <p className="mt-2.5 text-sm leading-6 break-keep text-[#ffc2c2]">
          {likeFeedbackMessage}
        </p>
      ) : null}

      {isLastCard ? (
        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className={MATCHING_SECONDARY_ACTION_BUTTON_CLASS}
            >
              <ChevronLeft size={16} />
              이전
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!allCandidatesRated || isSubmitPending || isLikePending}
              className={MATCHING_PRIMARY_ACTION_BUTTON_CLASS}
            >
              {isSubmitPending ? '제출 중...' : '제출하기'}
              {!isSubmitPending ? <ChevronRight size={16} /> : null}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={MATCHING_SECONDARY_ACTION_BUTTON_CLASS}
          >
            <ChevronLeft size={16} />
            이전
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasSelectedRating}
            className={MATCHING_PRIMARY_ACTION_BUTTON_CLASS}
          >
            다음
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {isSummaryOverlayOpen ? (
        <div className="absolute inset-0 z-10 rounded-4xl border border-white/10 bg-[#09090b]/96 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.44)] backdrop-blur-xl sm:p-6">
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#ff8d8d] uppercase">
                  Summary
                </p>
                <h3 className="mt-2 text-xl font-semibold break-keep text-white sm:text-2xl">
                  {candidate.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeSummaryOverlay}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/10 bg-white/4 px-3 py-2 text-sm font-medium text-white/86 transition hover:border-white/20 hover:bg-white/7"
              >
                닫기
              </button>
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 text-sm leading-7 break-keep text-white/72">
              {candidateSummary}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default MatchingCandidatePanel;
