/**
 * Utilidades de imagen simples y fiables.
 */

const PLACEHOLDER_POSTER = 'https://placehold.co/600x900/1a1a2e/00d4ff?text=No+Image';
const PLACEHOLDER_BANNER = 'https://placehold.co/1600x600/1a1a2e/00d4ff?text=Banner+Not+Available';

/**
 * Obtiene imagen con fallbacks progresivos
 */
export const getAnimeImageByTitle = (title, variant = 'poster') => {
  return variant === 'banner' ? PLACEHOLDER_BANNER : PLACEHOLDER_POSTER;
};

/**
 * Obtiene imagen preferida desde datos del anime
 * Prioridad:
 * 1. URL original (posterUrl/bannerUrl)
 * 2. Placeholder fiable
 * 3. Placeholder
 */
export const getPreferredAnimeImage = (anime, variant = 'poster') => {
  if (!anime) return getAnimeImageByTitle('anime', variant);

  const isBanner = variant === 'banner';
  const primaryUrl = isBanner ? anime.bannerUrl : anime.posterUrl;
  const secondaryUrl = isBanner ? anime.posterUrl : anime.bannerUrl;

  // Prioridad 1: URL primaria
  if (primaryUrl && isValidUrl(primaryUrl)) {
    return primaryUrl;
  }

  // Prioridad 2: URL secundaria
  if (secondaryUrl && isValidUrl(secondaryUrl)) {
    return secondaryUrl;
  }

  // Prioridad 3: Placeholder fiable
  return isBanner ? PLACEHOLDER_BANNER : PLACEHOLDER_POSTER;
};

/**
 * Valida que una URL sea válida y segura
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
