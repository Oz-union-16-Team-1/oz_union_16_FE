import { Navigate } from 'react-router';

import LazyHeader from '../../components/common/LazyHeader';
import { useMatchingCandidateOverlay } from '../../features/matching/hooks/useMatchingCandidateOverlay';
import { useMatchingGenreDetailPage } from '../../features/matching/hooks/useMatchingGenreDetailPage';
import {
  MatchingDetailEmptySection,
  MatchingDetailErrorSection,
  MatchingDetailInvalidSection,
  MatchingDetailReadySection,
  MatchingDetailSkeleton,
} from '../../features/matching/components/MatchingDetailSections';

function MatchingGenreDetailPage() {
  const detailPage = useMatchingGenreDetailPage();
  const overlay = useMatchingCandidateOverlay({
    currentCandidateId: detailPage.currentCandidate?.game_id ?? null,
    currentCandidateSummary: detailPage.currentCandidateSummary,
  });

  if (detailPage.viewState === 'unauthorized') {
    return (
      <Navigate to="/login" replace state={detailPage.redirectToLoginState} />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,25,25,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%)] opacity-90" />
      <LazyHeader fixed />

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-280 px-4 pt-[6.35rem] pb-10 sm:px-6 sm:pt-[6.8rem] sm:pb-12 md:px-8 md:pt-[7.35rem] md:pb-14">
        {detailPage.viewState === 'loading' ? (
          <MatchingDetailSkeleton />
        ) : detailPage.viewState === 'invalid' ? (
          <MatchingDetailInvalidSection />
        ) : detailPage.viewState === 'error' ? (
          <MatchingDetailErrorSection
            message={detailPage.matchCandidatesErrorMessage ?? ''}
            onRetry={detailPage.onRetry}
          />
        ) : detailPage.viewState === 'empty' ? (
          <MatchingDetailEmptySection />
        ) : detailPage.currentCandidate && detailPage.currentEvaluation ? (
          <MatchingDetailReadySection
            currentStep={detailPage.currentStep}
            totalSteps={detailPage.totalSteps}
            currentCandidate={detailPage.currentCandidate}
            candidatePanelProps={{
              candidate: detailPage.currentCandidate,
              currentEvaluation: detailPage.currentEvaluation,
              candidateSummary: detailPage.currentCandidateSummary,
              genreTitle: detailPage.genreTitle,
              isLastCard: detailPage.isLastCard,
              hasSelectedRating: detailPage.hasSelectedRating,
              canGoPrevious: detailPage.canGoPrevious,
              allCandidatesRated: detailPage.allCandidatesRated,
              isLikePending: detailPage.isLikePending,
              isSubmitPending: detailPage.isSubmitPending,
              likeFeedbackMessage: detailPage.likeFeedbackMessage,
              submitErrorMessage: detailPage.submitErrorMessage,
              overlay,
              onToggleLike: detailPage.onToggleLike,
              onRate: detailPage.onRate,
              onPrevious: detailPage.onPrevious,
              onNext: detailPage.onNext,
              onSubmit: () => void detailPage.onSubmit(),
            }}
          />
        ) : (
          <MatchingDetailEmptySection />
        )}
      </main>
    </div>
  );
}

export default MatchingGenreDetailPage;
