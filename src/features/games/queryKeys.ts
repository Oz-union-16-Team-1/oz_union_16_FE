import type { GameGenreFilter } from './genres';

const gamesRootKey = ['games'] as const;
const gamesTop100RootKey = [...gamesRootKey, 'top100'] as const;
const gamesSearchRootKey = [...gamesRootKey, 'search'] as const;

export const gamesKeys = {
  all: gamesRootKey,
  top100Root: () => gamesTop100RootKey,
  top100: (genre: GameGenreFilter) => [...gamesTop100RootKey, genre] as const,
  searchRoot: () => gamesSearchRootKey,
  search: (searchText: string, genre: GameGenreFilter) =>
    [...gamesSearchRootKey, searchText, genre] as const,
  detail: (gameId: number) => [...gamesRootKey, 'detail', gameId] as const,
};
