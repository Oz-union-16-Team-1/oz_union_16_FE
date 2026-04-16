export type MatchingGenreSlug =
  | 'action-fighting'
  | 'adventure-platform'
  | 'rpg-story'
  | 'strategy-simulation'
  | 'sports-racing'
  | 'brain-strategy'
  | 'shooting'
  | 'rhythm';

export type MatchingGenreCard = {
  slug: MatchingGenreSlug;
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
};
