const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Provider request failed (${response.status})`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeType = (value) => {
  const input = String(value || '').trim().toLowerCase();
  if (!input) return 'TV';

  const map = {
    tv: 'TV',
    television: 'TV',
    movie: 'Movie',
    film: 'Movie',
    ova: 'OVA',
    ona: 'ONA',
    special: 'Special',
  };

  return map[input] || 'TV';
};

const toSeasonEs = (value) => {
  const input = String(value || '').trim().toLowerCase();
  const map = {
    winter: 'Invierno',
    spring: 'Primavera',
    summer: 'Verano',
    fall: 'Otoño',
    autumn: 'Otoño',
  };

  return map[input] || undefined;
};

const fallbackDescription = (title) => `Ficha importada de API externa para ${title}.`;
const fallbackPoster = 'https://via.placeholder.com/300x450?text=Anime';

const safeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const animeShape = ({
  provider,
  externalId,
  title,
  description,
  posterUrl,
  bannerUrl,
  episodes,
  releaseDate,
  isOngoing,
  rating,
  genres,
  animeType,
  season,
}) => {
  const normalizedTitle = String(title || '').trim();
  const resolvedDate = releaseDate ? new Date(releaseDate) : new Date();
  const validDate = Number.isNaN(resolvedDate.getTime()) ? new Date() : resolvedDate;

  return {
    title: normalizedTitle || `Anime ${externalId}`,
    description: String(description || fallbackDescription(normalizedTitle || `Anime ${externalId}`)).slice(0, 1000),
    posterUrl: String(posterUrl || fallbackPoster),
    bannerUrl: bannerUrl || undefined,
    episodes: Math.max(1, safeNumber(episodes, 1)),
    releaseDate: validDate,
    isOngoing: Boolean(isOngoing),
    rating: Math.min(10, Math.max(0, safeNumber(rating, 0))),
    genres: Array.isArray(genres) && genres.length ? genres : ['Unknown'],
    animeType: normalizeType(animeType),
    season: toSeasonEs(season),
    sourceRefs: [{ provider, externalId: String(externalId) }],
  };
};

const fetchAniList = async ({ page = 1, limit = 50, query = '' }) => {
  const graphqlQuery = `
    query ($page: Int, $perPage: Int, $search: String) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
          id
          title {
            romaji
            english
            native
          }
          description(asHtml: false)
          episodes
          format
          status
          averageScore
          startDate {
            year
            month
            day
          }
          season
          genres
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
        }
      }
    }
  `;

  const payload = await fetchJsonWithTimeout('https://graphql.anilist.co', {
    method: 'POST',
    body: JSON.stringify({
      query: graphqlQuery,
      variables: {
        page,
        perPage: limit,
        search: query || undefined,
      },
    }),
  });

  const rows = payload?.data?.Page?.media || [];

  return rows.map((item) =>
    animeShape({
      provider: 'anilist',
      externalId: item.id,
      title: item?.title?.english || item?.title?.romaji || item?.title?.native,
      description: item.description,
      posterUrl: item?.coverImage?.extraLarge || item?.coverImage?.large || item?.coverImage?.medium,
      bannerUrl: item.bannerImage,
      episodes: item.episodes,
      releaseDate:
        item?.startDate?.year && item?.startDate?.month && item?.startDate?.day
          ? `${item.startDate.year}-${String(item.startDate.month).padStart(2, '0')}-${String(item.startDate.day).padStart(2, '0')}`
          : undefined,
      isOngoing: String(item.status || '').toUpperCase() === 'RELEASING',
      rating: safeNumber(item.averageScore, 0) / 10,
      genres: item.genres,
      animeType: item.format,
      season: item.season,
    })
  );
};

const fetchJikan = async ({ page = 1, limit = 50, query = '' }) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    order_by: 'score',
    sort: 'desc',
    sfw: 'true',
  });

  if (query) params.set('q', query);

  const payload = await fetchJsonWithTimeout(`https://api.jikan.moe/v4/anime?${params.toString()}`);
  const rows = payload?.data || [];

  return rows.map((item) =>
    animeShape({
      provider: 'jikan',
      externalId: item.mal_id,
      title: item.title_english || item.title || item.title_japanese,
      description: item.synopsis,
      posterUrl:
        item?.images?.webp?.large_image_url ||
        item?.images?.jpg?.large_image_url ||
        item?.images?.webp?.image_url ||
        item?.images?.jpg?.image_url,
      bannerUrl: item?.trailer?.images?.maximum_image_url,
      episodes: item.episodes,
      releaseDate: item?.aired?.from,
      isOngoing: String(item.status || '').toLowerCase().includes('airing'),
      rating: safeNumber(item.score, 0),
      genres: (item.genres || []).map((genre) => genre.name).filter(Boolean),
      animeType: item.type,
      season: item.season,
    })
  );
};

const fetchKitsu = async ({ page = 1, limit = 20, query = '' }) => {
  const offset = Math.max(0, (page - 1) * limit);
  const params = new URLSearchParams();
  params.set('page[limit]', String(limit));
  params.set('page[offset]', String(offset));
  if (query) {
    params.set('filter[text]', query);
  }

  const payload = await fetchJsonWithTimeout(`https://kitsu.io/api/edge/anime?${params.toString()}`);
  const rows = payload?.data || [];

  return rows.map((item) => {
    const attrs = item.attributes || {};
    return animeShape({
      provider: 'kitsu',
      externalId: item.id,
      title: attrs.titles?.en || attrs.canonicalTitle,
      description: attrs.synopsis,
      posterUrl: attrs?.posterImage?.original || attrs?.posterImage?.large,
      bannerUrl: attrs?.coverImage?.original || attrs?.coverImage?.large,
      episodes: attrs.episodeCount,
      releaseDate: attrs.startDate,
      isOngoing: String(attrs.status || '').toLowerCase() === 'current',
      rating: safeNumber(attrs.averageRating, 0) / 10,
      genres: attrs.subtype ? [String(attrs.subtype)] : ['Unknown'],
      animeType: attrs.subtype,
    });
  });
};

module.exports = {
  fetchAniList,
  fetchJikan,
  fetchKitsu,
};
