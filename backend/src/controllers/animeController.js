const Anime = require('../models/Anime');
const { fetchAniList, fetchJikan, fetchKitsu } = require('../services/importProviders');
const { getProviderPriority, normalizeAnimeType, scoreImageUrl } = require('../utils/animeExternal');

const toBoolean = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const sanitizeSortBy = (sortBy) => {
  const allowed = ['createdAt', 'rating', 'releaseDate', 'title', 'episodes'];
  return allowed.includes(sortBy) ? sortBy : 'createdAt';
};

const sanitizeSortOrder = (order) => (order === 'asc' ? 1 : -1);

const sanitizeSeason = (season) => {
  const map = {
    winter: 'Invierno',
    spring: 'Primavera',
    summer: 'Verano',
    fall: 'Otoño',
    invierno: 'Invierno',
    primavera: 'Primavera',
    verano: 'Verano',
    otoño: 'Otoño',
  };

  return map[String(season || '').trim().toLowerCase()] || undefined;
};

const buildAnimeFilters = (query) => {
  const filters = {};

  if (query.search) {
    filters.title = { $regex: query.search.trim(), $options: 'i' };
  }

  if (query.genre) {
    filters.genres = query.genre.trim();
  }

  const isOngoing = toBoolean(query.isOngoing);
  if (typeof isOngoing === 'boolean') {
    filters.isOngoing = isOngoing;
  }

  const inLibrary = toBoolean(query.inLibrary);
  if (typeof inLibrary === 'boolean') {
    filters.inLibrary = inLibrary;
  }

  const isFavorite = toBoolean(query.isFavorite);
  if (typeof isFavorite === 'boolean') {
    filters.isFavorite = isFavorite;
  }

  if (query.studioId) {
    filters.studio = query.studioId;
  }

  const season = sanitizeSeason(query.season);
  if (season) {
    filters.season = season;
  }

  if (query.year) {
    const year = parseInt(query.year, 10);
    if (!Number.isNaN(year)) {
      filters.year = year;
    }
  } else {
    const yearFrom = toNumber(query.yearFrom);
    const yearTo = toNumber(query.yearTo);
    if (typeof yearFrom === 'number' || typeof yearTo === 'number') {
      filters.year = {};
      if (typeof yearFrom === 'number') {
        filters.year.$gte = yearFrom;
      }
      if (typeof yearTo === 'number') {
        filters.year.$lte = yearTo;
      }
    }
  }

  const episodesMin = toNumber(query.episodesMin);
  const episodesMax = toNumber(query.episodesMax);
  if (typeof episodesMin === 'number' || typeof episodesMax === 'number') {
    filters.episodes = {};
    if (typeof episodesMin === 'number') {
      filters.episodes.$gte = episodesMin;
    }
    if (typeof episodesMax === 'number') {
      filters.episodes.$lte = episodesMax;
    }
  }

  if (query.animeType) {
    const animeType = String(query.animeType).trim();
    if (animeType) {
      filters.animeType = animeType;
    }
  }

  const minRating = toNumber(query.minRating);
  const maxRating = toNumber(query.maxRating);
  if (typeof minRating === 'number' || typeof maxRating === 'number') {
    filters.rating = {};
    if (typeof minRating === 'number') {
      filters.rating.$gte = minRating;
    }
    if (typeof maxRating === 'number') {
      filters.rating.$lte = maxRating;
    }
  }

  return filters;
};

const sanitizeExternalLimit = (limit) => Math.min(Math.max(limit, 1), 30);

const mapExternalAnimeToApi = (anime) => {
  const sourceRef = anime.sourceRefs?.[0];
  const provider = sourceRef?.provider || 'external';
  const externalId = String(sourceRef?.externalId || anime.title || Date.now());
  const releaseDate = anime.releaseDate ? new Date(anime.releaseDate) : null;

  return {
    _id: `external:${provider}:${externalId}`,
    external: true,
    title: anime.title,
    description: anime.description,
    posterUrl: anime.posterUrl,
    bannerUrl: anime.bannerUrl,
    episodes: anime.episodes,
    releaseDate,
    year: releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate.getUTCFullYear() : undefined,
    isOngoing: Boolean(anime.isOngoing),
    rating: Number.isFinite(Number(anime.rating)) ? Number(anime.rating) : 0,
    genres: Array.isArray(anime.genres) ? anime.genres : [],
    animeType: normalizeAnimeType(anime.animeType),
    season: anime.season,
    studio: null,
    sourceRefs: anime.sourceRefs,
  };
};

const filterExternalAnimes = (items, query) => {
  const minRating = toNumber(query.minRating);
  const maxRating = toNumber(query.maxRating);
  const episodesMin = toNumber(query.episodesMin);
  const episodesMax = toNumber(query.episodesMax);
  const yearFrom = toNumber(query.yearFrom);
  const yearTo = toNumber(query.yearTo);
  const yearExact = toNumber(query.year);
  const expectedType = query.animeType ? normalizeAnimeType(query.animeType) : null;
  const expectedGenre = query.genre ? String(query.genre).trim().toLowerCase() : null;
  const expectedStatus = toBoolean(query.isOngoing);

  return items.filter((anime) => {
    const rating = Number(anime.rating) || 0;
    const episodes = Number(anime.episodes) || 0;
    const year = Number(anime.year);
    const genres = Array.isArray(anime.genres)
      ? anime.genres.map((genre) => String(genre).trim().toLowerCase())
      : [];

    if (typeof minRating === 'number' && rating < minRating) return false;
    if (typeof maxRating === 'number' && rating > maxRating) return false;
    if (typeof episodesMin === 'number' && episodes < episodesMin) return false;
    if (typeof episodesMax === 'number' && episodes > episodesMax) return false;
    if (typeof expectedStatus === 'boolean' && Boolean(anime.isOngoing) !== expectedStatus) return false;
    if (expectedType && normalizeAnimeType(anime.animeType) !== expectedType) return false;
    if (expectedGenre && !genres.includes(expectedGenre)) return false;
    if (typeof yearExact === 'number' && year !== yearExact) return false;
    if (typeof yearFrom === 'number' && year < yearFrom) return false;
    if (typeof yearTo === 'number' && year > yearTo) return false;

    return true;
  });
};

const fetchExternalSearchResults = async ({ page, limit, search }) => {
  if (!search) return [];

  const externalLimit = sanitizeExternalLimit(Math.ceil(limit / 2) || 6);
  const input = { page, limit: externalLimit, query: search };

  const settled = await Promise.allSettled([
    fetchAniList(input),
    fetchJikan(input),
    fetchKitsu(input),
  ]);

  const merged = [];
  settled.forEach((result) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      merged.push(...result.value.map(mapExternalAnimeToApi));
    }
  });

  const deduped = [];
  const seen = new Map();

  for (const anime of merged) {
    const key = String(anime.title || '').trim().toLowerCase();
    if (!key) continue;

    const currentIndex = seen.get(key);
    if (typeof currentIndex === 'number') {
      const existing = deduped[currentIndex];
      const existingProvider = existing.sourceRefs?.[0]?.provider;
      const incomingProvider = anime.sourceRefs?.[0]?.provider;
      const existingRank = getProviderPriority(existingProvider) * 10 + scoreImageUrl(existing.posterUrl);
      const incomingRank = getProviderPriority(incomingProvider) * 10 + scoreImageUrl(anime.posterUrl);

      if (incomingRank > existingRank) {
        deduped[currentIndex] = anime;
      }
      continue;
    }

    seen.set(key, deduped.length);
    deduped.push(anime);
  }

  return deduped;
};

const getAnimeDiscover = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      topRated,
      total,
      ongoingCount,
      upcomingCount,
      genres,
    ] = await Promise.all([
      Anime.find().sort({ rating: -1, createdAt: -1 }).limit(6).populate('studio'),
      Anime.countDocuments(),
      Anime.countDocuments({ isOngoing: true }),
      Anime.countDocuments({ releaseDate: { $gt: now } }),
      Anime.distinct('genres'),
    ]);

    res.status(200).json({
      topRated,
      genres: genres.sort((left, right) => left.localeCompare(right)),
      stats: {
        total,
        ongoing: ongoingCount,
        upcoming: upcomingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAnimes = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    const filters = buildAnimeFilters(req.query);
    const includeExternal = req.query.includeExternal !== 'false';
    const hasSearchQuery = Boolean(String(req.query.search || '').trim());
    const sortBy = sanitizeSortBy(req.query.sortBy);
    const order = sanitizeSortOrder(req.query.order);
    const sort = { [sortBy]: order };
    if (sortBy !== 'createdAt') {
      sort.createdAt = -1;
    }

    if (includeExternal && hasSearchQuery) {
      const localSearchLimit = Math.min(500, Math.max(limit * 6, 60));

      const [localResults, externalRaw] = await Promise.all([
        Anime.find(filters).populate('studio').sort(sort).limit(localSearchLimit),
        fetchExternalSearchResults({ page, limit, search: req.query.search.trim() }),
      ]);

      const localKeys = new Set(
        localResults.map((anime) => String(anime.title || '').trim().toLowerCase()).filter(Boolean)
      );

      const externalFiltered = filterExternalAnimes(
        externalRaw.filter((anime) => !localKeys.has(String(anime.title || '').trim().toLowerCase())),
        req.query
      );

      const combined = [...localResults, ...externalFiltered];
      const total = combined.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const pagedData = combined.slice(skip, skip + limit);

      return res.status(200).json({
        data: pagedData,
        page,
        limit,
        total,
        totalPages,
        sortBy,
        order: order === 1 ? 'asc' : 'desc',
      });
    }

    const [data, total] = await Promise.all([
      Anime.find(filters)
        .populate('studio')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Anime.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      data,
      page,
      limit,
      total,
      totalPages,
      sortBy,
      order: order === 1 ? 'asc' : 'desc',
    });
  } catch (error) {
    next(error);
  }
};

const getAnimeById = async (req, res, next) => {
  try {
    const anime = await Anime.findById(req.params.id).populate('studio');
    if (!anime) {
      res.status(404);
      throw new Error('Anime not found');
    }
    res.status(200).json(anime);
  } catch (error) {
    next(error);
  }
};

const createAnime = async (req, res, next) => {
  try {
    const anime = await Anime.create(req.body);
    const createdAnime = await Anime.findById(anime._id).populate('studio');
    res.status(201).json(createdAnime);
  } catch (error) {
    next(error);
  }
};

const updateAnime = async (req, res, next) => {
  try {
    const anime = await Anime.findById(req.params.id);
    if (!anime) {
      res.status(404);
      throw new Error('Anime not found');
    }

    Object.assign(anime, req.body);
    await anime.save();
    const updatedAnime = await Anime.findById(anime._id).populate('studio');
    res.status(200).json(updatedAnime);
  } catch (error) {
    next(error);
  }
};

const deleteAnime = async (req, res, next) => {
  try {
    const anime = await Anime.findById(req.params.id);
    if (!anime) {
      res.status(404);
      throw new Error('Anime not found');
    }
    await anime.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnimeDiscover,
  getAnimes,
  getAnimeById,
  createAnime,
  updateAnime,
  deleteAnime,
};
