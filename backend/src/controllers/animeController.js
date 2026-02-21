const Anime = require('../models/Anime');

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

const getAnimeDiscover = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      hero,
      topRated,
      trending,
      ongoing,
      upcoming,
      total,
      ongoingCount,
      upcomingCount,
      genres,
    ] = await Promise.all([
      Anime.findOne().sort({ rating: -1, createdAt: -1 }).populate('studio'),
      Anime.find().sort({ rating: -1, createdAt: -1 }).limit(6).populate('studio'),
      Anime.find({ releaseDate: { $lte: now } })
        .sort({ releaseDate: -1, rating: -1 })
        .limit(6)
        .populate('studio'),
      Anime.find({ isOngoing: true }).sort({ rating: -1, createdAt: -1 }).limit(6).populate('studio'),
      Anime.find({ releaseDate: { $gt: now } })
        .sort({ releaseDate: 1, rating: -1 })
        .limit(6)
        .populate('studio'),
      Anime.countDocuments(),
      Anime.countDocuments({ isOngoing: true }),
      Anime.countDocuments({ releaseDate: { $gt: now } }),
      Anime.distinct('genres'),
    ]);

    res.status(200).json({
      hero,
      topRated,
      trending,
      ongoing,
      upcoming,
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
    const sortBy = sanitizeSortBy(req.query.sortBy);
    const order = sanitizeSortOrder(req.query.order);
    const sort = { [sortBy]: order };
    if (sortBy !== 'createdAt') {
      sort.createdAt = -1;
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
