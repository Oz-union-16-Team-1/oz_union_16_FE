import { useEffect, useRef, useState, type RefObject } from 'react';

type UseMatchingCandidateOverlayParams = {
  currentCandidateId: number | null;
  currentCandidateSummary: string;
};

export interface MatchingCandidateOverlayViewModel {
  titleRef: RefObject<HTMLHeadingElement | null>;
  summaryRef: RefObject<HTMLParagraphElement | null>;
  titleCollapsedHeightRem: number;
  summaryCollapsedHeightRem: number;
  isTitleOverflowing: boolean;
  isSummaryOverflowing: boolean;
  isTitlePreviewOpen: boolean;
  isSummaryOverlayOpen: boolean;
  openTitlePreview: () => void;
  closeTitlePreview: () => void;
  toggleSummaryOverlay: () => void;
  closeSummaryOverlay: () => void;
}

const MATCHING_TITLE_COLLAPSED_HEIGHT_REM = 4.8;
const MATCHING_SUMMARY_COLLAPSED_HEIGHT_REM = 6;

const calculateHeightThreshold = (heightRem: number) => heightRem * 16 + 1;

export const useMatchingCandidateOverlay = ({
  currentCandidateId,
  currentCandidateSummary,
}: UseMatchingCandidateOverlayParams): MatchingCandidateOverlayViewModel => {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const summaryRef = useRef<HTMLParagraphElement | null>(null);
  const [previewTitleGameId, setPreviewTitleGameId] = useState<number | null>(
    null,
  );
  const [openSummaryOverlayGameId, setOpenSummaryOverlayGameId] = useState<
    number | null
  >(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const [isSummaryOverflowing, setIsSummaryOverflowing] = useState(false);

  useEffect(() => {
    const measureOverflow = () => {
      const titleElement = titleRef.current;
      const summaryElement = summaryRef.current;

      if (titleElement) {
        setIsTitleOverflowing(
          titleElement.scrollHeight >
            calculateHeightThreshold(MATCHING_TITLE_COLLAPSED_HEIGHT_REM),
        );
      }

      if (summaryElement) {
        setIsSummaryOverflowing(
          summaryElement.scrollHeight >
            calculateHeightThreshold(MATCHING_SUMMARY_COLLAPSED_HEIGHT_REM),
        );
      }
    };

    measureOverflow();
    window.addEventListener('resize', measureOverflow);

    return () => {
      window.removeEventListener('resize', measureOverflow);
    };
  }, [currentCandidateId, currentCandidateSummary]);

  return {
    titleRef,
    summaryRef,
    titleCollapsedHeightRem: MATCHING_TITLE_COLLAPSED_HEIGHT_REM,
    summaryCollapsedHeightRem: MATCHING_SUMMARY_COLLAPSED_HEIGHT_REM,
    isTitleOverflowing,
    isSummaryOverflowing,
    isTitlePreviewOpen:
      currentCandidateId !== null && previewTitleGameId === currentCandidateId,
    isSummaryOverlayOpen:
      currentCandidateId !== null &&
      openSummaryOverlayGameId === currentCandidateId,
    openTitlePreview: () => {
      if (currentCandidateId !== null) {
        setPreviewTitleGameId(currentCandidateId);
      }
    },
    closeTitlePreview: () => setPreviewTitleGameId(null),
    toggleSummaryOverlay: () => {
      if (currentCandidateId === null) {
        return;
      }

      setOpenSummaryOverlayGameId((current) =>
        current === currentCandidateId ? null : currentCandidateId,
      );
    },
    closeSummaryOverlay: () => setOpenSummaryOverlayGameId(null),
  };
};
