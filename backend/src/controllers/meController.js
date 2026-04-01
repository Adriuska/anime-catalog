const mongoose = require('mongoose');
const Anime = require('../models/Anime');
const UserList = require('../models/UserList');
const UserListItem = require('../models/UserListItem');
const UserFavorite = require('../models/UserFavorite');
const { choosePreferredImage, normalizeAnimeType, normalizeSourceRef } = require('../utils/animeExternal');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const validProviders = new Set(['anilist', 'jikan', 'kitsu']);

const fallbackPoster = 'https://via.placeholder.com/300x450?text=Anime';

const parseExternalAnimePayload = (payload) => {
  const input = payload && typeof payload === 'object' ? payload : null;
  if (!input) return null;

  const sourceRef = Array.isArray(input.sourceRefs) ? input.sourceRefs[0] : input.sourceRef;
  const provider = String(sourceRef?.provider || '').trim().toLowerCase();
  const externalId = String(sourceRef?.externalId || '').trim();
  const title = String(input.title || '').trim();

  if (!title || !provider || !externalId || !validProviders.has(provider)) {
    return null;
  }

  const releaseDateCandidate = input.releaseDate ? new Date(input.releaseDate) : new Date();
  const releaseDate = Number.isNaN(releaseDateCandidate.getTime()) ? new Date() : releaseDateCandidate;
  const descriptionRaw = String(input.description || '').trim();

  return {
    title,
    description: descriptionRaw.length >= 10 ? descriptionRaw : `Ficha importada de API externa para ${title}.`,
    posterUrl: String(input.posterUrl || fallbackPoster),
    bannerUrl: input.bannerUrl || undefined,
    episodes: Math.max(1, Number(input.episodes) || 1),
    releaseDate,
    isOngoing: Boolean(input.isOngoing),
    rating: Math.min(10, Math.max(0, Number(input.rating) || 0)),
    genres: Array.isArray(input.genres) && input.genres.length
      ? input.genres.map((genre) => String(genre).trim()).filter(Boolean)
      : ['Unknown'],
    animeType: normalizeAnimeType(input.animeType),
    season: input.season,
    sourceRefs: [{ provider, externalId }],
  };
};

const resolveAnimeFromInput = async ({ animeId, externalAnime }) => {
  if (animeId) {
    if (!isValidObjectId(animeId)) {
      const error = new Error('Invalid animeId');
      error.statusCode = 400;
      throw error;
    }

    const anime = await Anime.findById(animeId).select('_id');
    if (!anime) {
      const error = new Error('Anime not found');
      error.statusCode = 404;
      throw error;
    }

    return anime;
  }

  const normalizedExternal = parseExternalAnimePayload(externalAnime);
  if (!normalizedExternal) {
    const error = new Error('animeId or valid externalAnime is required');
    error.statusCode = 400;
    throw error;
  }

  const sourceRef = normalizedExternal.sourceRefs[0];
  const titleNormalized = normalizedExternal.title.trim().toLowerCase();

  let existing = await Anime.findOne({
    sourceRefs: {
      $elemMatch: {
        provider: sourceRef.provider,
        externalId: String(sourceRef.externalId),
      },
    },
  });

  if (!existing) {
    existing = await Anime.findOne({ titleNormalized });
  }

  if (!existing) {
    return Anime.create(normalizedExternal);
  }

  existing.title = normalizedExternal.title;
  existing.description = normalizedExternal.description;
  existing.posterUrl = choosePreferredImage({
    currentUrl: existing.posterUrl,
    incomingUrl: normalizedExternal.posterUrl,
    currentSourceRefs: existing.sourceRefs,
    incomingProvider: sourceRef.provider,
  });
  existing.bannerUrl = choosePreferredImage({
    currentUrl: existing.bannerUrl,
    incomingUrl: normalizedExternal.bannerUrl,
    currentSourceRefs: existing.sourceRefs,
    incomingProvider: sourceRef.provider,
  });
  existing.episodes = normalizedExternal.episodes;
  existing.releaseDate = normalizedExternal.releaseDate;
  existing.isOngoing = normalizedExternal.isOngoing;
  existing.rating = normalizedExternal.rating;
  existing.genres = normalizedExternal.genres;
  existing.animeType = normalizedExternal.animeType;
  if (normalizedExternal.season) {
    existing.season = normalizedExternal.season;
  }

  existing.sourceRefs = normalizeSourceRef(
    existing.sourceRefs,
    sourceRef.provider,
    sourceRef.externalId
  );

  await existing.save();
  return existing;
};

const mapFavorite = (favorite) => ({
  _id: favorite._id,
  animeId: favorite.animeId?._id || favorite.animeId,
  addedAt: favorite.addedAt,
  anime: favorite.animeId && favorite.animeId.title ? favorite.animeId : null,
});

const mapList = (list) => ({
  _id: list._id,
  name: list.name,
  isPrivate: list.isPrivate,
  createdAt: list.createdAt,
  updatedAt: list.updatedAt,
});

const mapListItem = (item) => ({
  _id: item._id,
  listId: item.listId,
  animeId: item.animeId?._id || item.animeId,
  addedAt: item.addedAt,
  anime: item.animeId && item.animeId.title ? item.animeId : null,
});

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await UserFavorite.find({ userId: req.user._id })
      .populate('animeId')
      .sort({ addedAt: -1 });

    res.status(200).json({
      data: favorites.map(mapFavorite),
      total: favorites.length,
    });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { animeId, externalAnime } = req.body;
    const anime = await resolveAnimeFromInput({ animeId, externalAnime });
    const resolvedAnimeId = anime._id;

    const existing = await UserFavorite.findOne({ userId: req.user._id, animeId: resolvedAnimeId });
    if (existing) {
      const favorite = await UserFavorite.findById(existing._id).populate('animeId');
      return res.status(200).json(mapFavorite(favorite));
    }

    const favorite = await UserFavorite.create({
      userId: req.user._id,
      animeId: resolvedAnimeId,
    });

    const createdFavorite = await UserFavorite.findById(favorite._id).populate('animeId');
    return res.status(201).json(mapFavorite(createdFavorite));
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    return next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { animeId } = req.params;

    const result = await UserFavorite.deleteOne({
      userId: req.user._id,
      animeId,
    });

    if (!result.deletedCount) {
      res.status(404);
      throw new Error('Favorite not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getLists = async (req, res, next) => {
  try {
    const lists = await UserList.find({ userId: req.user._id }).sort({ updatedAt: -1, createdAt: -1 });

    res.status(200).json({
      data: lists.map(mapList),
      total: lists.length,
    });
  } catch (error) {
    next(error);
  }
};

const createList = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400);
      throw new Error('name is required');
    }

    const list = await UserList.create({
      userId: req.user._id,
      name: String(name).trim(),
    });

    res.status(201).json(mapList(list));
  } catch (error) {
    next(error);
  }
};

const updateList = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400);
      throw new Error('name is required');
    }

    const list = await UserList.findOne({
      _id: req.params.listId,
      userId: req.user._id,
    });

    if (!list) {
      res.status(404);
      throw new Error('List not found');
    }

    list.name = String(name).trim();
    await list.save();

    res.status(200).json(mapList(list));
  } catch (error) {
    next(error);
  }
};

const deleteList = async (req, res, next) => {
  try {
    const list = await UserList.findOne({
      _id: req.params.listId,
      userId: req.user._id,
    });

    if (!list) {
      res.status(404);
      throw new Error('List not found');
    }

    await Promise.all([
      UserListItem.deleteMany({ userId: req.user._id, listId: list._id }),
      list.deleteOne(),
    ]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getListItems = async (req, res, next) => {
  try {
    const list = await UserList.findOne({
      _id: req.params.listId,
      userId: req.user._id,
    }).select('_id name isPrivate');

    if (!list) {
      res.status(404);
      throw new Error('List not found');
    }

    const items = await UserListItem.find({
      userId: req.user._id,
      listId: list._id,
    })
      .populate('animeId')
      .sort({ addedAt: -1 });

    res.status(200).json({
      list,
      data: items.map(mapListItem),
      total: items.length,
    });
  } catch (error) {
    next(error);
  }
};

const addListItem = async (req, res, next) => {
  try {
    const { animeId, externalAnime } = req.body;

    const list = await UserList.findOne({
      _id: req.params.listId,
      userId: req.user._id,
    }).select('_id');

    if (!list) {
      res.status(404);
      throw new Error('List not found');
    }

    const anime = await resolveAnimeFromInput({ animeId, externalAnime });
    const resolvedAnimeId = anime._id;

    const existing = await UserListItem.findOne({
      userId: req.user._id,
      listId: list._id,
      animeId: resolvedAnimeId,
    });

    if (existing) {
      const item = await UserListItem.findById(existing._id).populate('animeId');
      return res.status(200).json(mapListItem(item));
    }

    const item = await UserListItem.create({
      userId: req.user._id,
      listId: list._id,
      animeId: resolvedAnimeId,
    });

    const createdItem = await UserListItem.findById(item._id).populate('animeId');
    return res.status(201).json(mapListItem(createdItem));
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    return next(error);
  }
};

const removeListItem = async (req, res, next) => {
  try {
    const list = await UserList.findOne({
      _id: req.params.listId,
      userId: req.user._id,
    }).select('_id');

    if (!list) {
      res.status(404);
      throw new Error('List not found');
    }

    const result = await UserListItem.deleteOne({
      userId: req.user._id,
      listId: list._id,
      animeId: req.params.animeId,
    });

    if (!result.deletedCount) {
      res.status(404);
      throw new Error('List item not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  getLists,
  createList,
  updateList,
  deleteList,
  getListItems,
  addListItem,
  removeListItem,
};
