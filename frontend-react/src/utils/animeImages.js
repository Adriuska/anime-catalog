const encodeTitle = (title = '') => encodeURIComponent(String(title).trim() || 'anime');

export const getAnimeImageByTitle = (title, variant = 'poster') => {
  const size = variant === 'banner' ? '1600x600' : '600x900';
  return `https://source.unsplash.com/${size}/?anime,${encodeTitle(title)}`;
};

export const getPreferredAnimeImage = (anime, variant = 'poster') => {
  if (!anime) return getAnimeImageByTitle('anime', variant);
  if (variant === 'banner') {
    return anime.bannerUrl || anime.posterUrl || getAnimeImageByTitle(anime.title, 'banner');
  }
  return anime.posterUrl || getAnimeImageByTitle(anime.title, 'poster');
};
