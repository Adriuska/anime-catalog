const encodeTitle = (title: string = ''): string => encodeURIComponent((title || '').trim() || 'anime');

export const getAnimeImageByTitle = (title: string, variant: 'poster' | 'banner' = 'poster'): string => {
  const size = variant === 'banner' ? '1600x600' : '600x900';
  return `https://source.unsplash.com/${size}/?anime,${encodeTitle(title)}`;
};

export const getPreferredAnimeImage = (
  anime: { title?: string; posterUrl?: string; bannerUrl?: string } | null | undefined,
  variant: 'poster' | 'banner' = 'poster'
): string => {
  if (!anime) return getAnimeImageByTitle('anime', variant);

  if (variant === 'banner') {
    return anime.bannerUrl || anime.posterUrl || getAnimeImageByTitle(anime.title || 'anime', 'banner');
  }

  return anime.posterUrl || getAnimeImageByTitle(anime.title || 'anime', 'poster');
};
