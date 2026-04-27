type ResultsPage<T> =
  | {
      count?: number | null;
      next?: string | null;
      results?: T[] | null;
    }
  | null
  | undefined;

export const getPaginatedResults = <T>(page: ResultsPage<T>) =>
  Array.isArray(page?.results) ? page.results : [];

export const getPaginatedLoadedCount = <T>(pages: ResultsPage<T>[] = []) =>
  pages.reduce((count, page) => count + getPaginatedResults(page).length, 0);

export const getPaginatedCount = <T>(page: ResultsPage<T>, fallback = 0) => {
  if (typeof page?.count === 'number' && Number.isFinite(page.count)) {
    return page.count;
  }

  return fallback;
};

export const getPaginatedNext = <T>(page: ResultsPage<T>) =>
  typeof page?.next === 'string' && page.next.trim() ? page.next : null;
