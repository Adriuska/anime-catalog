const Anime = require('../models/Anime');
const { fetchAniList, fetchJikan, fetchKitsu } = require('../services/importProviders');
const { choosePreferredImage, normalizeSourceRef } = require('../utils/animeExternal');

const upsertImportedAnime = async (incoming) => {
  const sourceRef = incoming.sourceRefs?.[0];
  const titleNormalized = String(incoming.title || '').trim().toLowerCase();

  let existing = null;

  if (sourceRef) {
    existing = await Anime.findOne({
      sourceRefs: {
        $elemMatch: {
          provider: sourceRef.provider,
          externalId: String(sourceRef.externalId),
        },
      },
    });
  }

  if (!existing && titleNormalized) {
    existing = await Anime.findOne({ titleNormalized });
  }

  if (!existing) {
    const created = await Anime.create(incoming);
    return { type: 'created', anime: created };
  }

  existing.title = incoming.title;
  existing.description = incoming.description;
  existing.posterUrl = choosePreferredImage({
    currentUrl: existing.posterUrl,
    incomingUrl: incoming.posterUrl,
    currentSourceRefs: existing.sourceRefs,
    incomingProvider: sourceRef?.provider,
  });
  existing.bannerUrl = choosePreferredImage({
    currentUrl: existing.bannerUrl,
    incomingUrl: incoming.bannerUrl,
    currentSourceRefs: existing.sourceRefs,
    incomingProvider: sourceRef?.provider,
  });
  existing.episodes = incoming.episodes;
  existing.releaseDate = incoming.releaseDate;
  existing.isOngoing = incoming.isOngoing;
  existing.rating = incoming.rating;
  existing.genres = incoming.genres;
  existing.animeType = incoming.animeType;
  if (incoming.season) {
    existing.season = incoming.season;
  }

  if (sourceRef) {
    existing.sourceRefs = normalizeSourceRef(existing.sourceRefs, sourceRef.provider, sourceRef.externalId);
  }

  await existing.save();
  return { type: 'updated', anime: existing };
};

const parseImportInput = (req) => {
  const pageRaw = req.body.page ?? req.query.page;
  const limitRaw = req.body.limit ?? req.query.limit;
  const queryRaw = req.body.query ?? req.query.query ?? req.query.search;

  const page = Math.max(parseInt(pageRaw, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 25, 1), 100);

  return {
    page,
    limit,
    query: String(queryRaw || '').trim(),
  };
};

const runImport = async ({ provider, fetcher, req, res, next }) => {
  try {
    const input = parseImportInput(req);
    const payload = await fetcher(input);

    let created = 0;
    let updated = 0;

    for (const item of payload) {
      const result = await upsertImportedAnime(item);
      if (result.type === 'created') created += 1;
      if (result.type === 'updated') updated += 1;
    }

    res.status(200).json({
      provider,
      page: input.page,
      limit: input.limit,
      query: input.query,
      imported: created,
      updated,
      totalFetched: payload.length,
    });
  } catch (error) {
    next(error);
  }
};

const importFromAniList = (req, res, next) =>
  runImport({ provider: 'anilist', fetcher: fetchAniList, req, res, next });

const importFromJikan = (req, res, next) =>
  runImport({ provider: 'jikan', fetcher: fetchJikan, req, res, next });

const importFromKitsu = (req, res, next) =>
  runImport({ provider: 'kitsu', fetcher: fetchKitsu, req, res, next });

module.exports = {
  importFromAniList,
  importFromJikan,
  importFromKitsu,
};
