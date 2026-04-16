import { create } from 'zustand';

import type {
  MatchingCandidateItem,
  MatchingEvaluationsByGameId,
  MatchingEvaluationValue,
  MatchingGenreCard,
  MatchingGenreSlug,
  MatchingRatingValue,
} from '../types';

interface MatchingStoreState {
  selectedGenreSlug: MatchingGenreSlug | null;
  selectedGenreId: number | null;
  candidates: MatchingCandidateItem[];
  currentIndex: number;
  evaluationsByGameId: MatchingEvaluationsByGameId;
  initializeFlow: (
    genre: MatchingGenreCard,
    candidates: MatchingCandidateItem[],
  ) => void;
  setRating: (gameId: number, rating: MatchingRatingValue) => void;
  toggleLiked: (gameId: number) => void;
  goNext: () => void;
  goPrevious: () => void;
  resetFlow: () => void;
}

const initialState = {
  selectedGenreSlug: null as MatchingGenreSlug | null,
  selectedGenreId: null as number | null,
  candidates: [] as MatchingCandidateItem[],
  currentIndex: 0,
  evaluationsByGameId: {} as MatchingEvaluationsByGameId,
};

const createEvaluationMap = (
  candidates: MatchingCandidateItem[],
  previousEvaluations: MatchingEvaluationsByGameId = {},
  preserveExisting = false,
): MatchingEvaluationsByGameId =>
  Object.fromEntries(
    candidates.map((candidate) => {
      const previous = preserveExisting
        ? previousEvaluations[candidate.game_id]
        : undefined;

      const nextValue: MatchingEvaluationValue = previous
        ? previous
        : {
            rating: null,
            isLiked: candidate.is_liked,
          };

      return [candidate.game_id, nextValue];
    }),
  );

const hasSameCandidateOrder = (
  previousCandidates: MatchingCandidateItem[],
  nextCandidates: MatchingCandidateItem[],
) =>
  previousCandidates.length === nextCandidates.length &&
  previousCandidates.every(
    (candidate, index) => candidate.game_id === nextCandidates[index]?.game_id,
  );

export const useMatchingStore = create<MatchingStoreState>((set) => ({
  ...initialState,
  initializeFlow: (genre, candidates) =>
    set((state) => {
      const isSameGenre =
        state.selectedGenreSlug === genre.slug &&
        state.selectedGenreId === genre.genreId;
      const isSameCandidateOrder = hasSameCandidateOrder(
        state.candidates,
        candidates,
      );

      if (isSameGenre && isSameCandidateOrder) {
        return state;
      }

      return {
        selectedGenreSlug: genre.slug,
        selectedGenreId: genre.genreId,
        candidates,
        currentIndex: 0,
        evaluationsByGameId: createEvaluationMap(
          candidates,
          state.evaluationsByGameId,
          isSameGenre,
        ),
      };
    }),
  setRating: (gameId, rating) =>
    set((state) => ({
      evaluationsByGameId: {
        ...state.evaluationsByGameId,
        [gameId]: {
          ...(state.evaluationsByGameId[gameId] ?? {
            rating: null,
            isLiked: false,
          }),
          rating,
        },
      },
    })),
  toggleLiked: (gameId) =>
    set((state) => {
      const currentValue = state.evaluationsByGameId[gameId] ?? {
        rating: null,
        isLiked: false,
      };

      return {
        evaluationsByGameId: {
          ...state.evaluationsByGameId,
          [gameId]: {
            ...currentValue,
            isLiked: !currentValue.isLiked,
          },
        },
      };
    }),
  goNext: () =>
    set((state) => ({
      currentIndex:
        state.currentIndex < state.candidates.length - 1
          ? state.currentIndex + 1
          : state.currentIndex,
    })),
  goPrevious: () =>
    set((state) => ({
      currentIndex: state.currentIndex > 0 ? state.currentIndex - 1 : 0,
    })),
  resetFlow: () => ({ ...initialState }),
}));
