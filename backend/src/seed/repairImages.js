'use strict';

/**
 * repairImages.js
 * Recorre todos los anime de la BD, busca cada uno en AniList y actualiza
 * posterUrl / bannerUrl con las URLs de mayor calidad disponibles.
 *
 * Uso:  node src/seed/repairImages.js
 *  o:   npm run repair-images   (desde backend/)
 */

const connectDB = require('../config/db');
const Anime = require('../models/Anime');

// ─── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const RATE_LIMIT_DELAY_MS = 2200;

/** Normaliza un título para comparación: minúsculas, sin puntuación, sin espacios dobles. */
const normalizeTitle = (title) =>
  String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');

/** Devuelve true si dos títulos normalizados se consideran la misma obra. */
const titlesMatch = (a, b) => {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Aceptamos si uno contiene al otro y la longitud es similar (evita falsos positivos)
  const longer = na.length >= nb.length ? na : nb;
  const shorter = na.length >= nb.length ? nb : na;
  return longer.includes(shorter) && shorter.length / longer.length >= 0.7;
};

/** Consulta AniList y devuelve { posterUrl, bannerUrl } del resultado que mejor coincida con el título. */
const fetchAniListImages = async (title, retries = 3) => {
  const graphql = `
    query ($search: String) {
      Page(page: 1, perPage: 5) {
        media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
          title { romaji english native }
          coverImage { extraLarge large }
          bannerImage
        }
      }
    }
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  let payload;
  for (let attempt = 1; attempt <= retries; attempt++) {
  try {
    const resp = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: graphql, variables: { search: title } }),
      signal: controller.signal,
    });
    if (resp.status === 429) {
      const wait = attempt * 30000; // 30s, 60s, 90s
      if (attempt < retries) {
        console.log(`      ⏳ Rate limit, esperando ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      throw new Error(`AniList HTTP 429 (${retries} intentos agotados)`);
    }
    if (!resp.ok) throw new Error(`AniList HTTP ${resp.status}`);
    payload = await resp.json();
    break;
  } catch (err) {
    if (attempt === retries) throw err;
    // solo reintenta en 429 (ya manejado arriba) u otros errores de red
  } finally {
    clearTimeout(timeout);
  }
  } // end for

  const results = payload?.data?.Page?.media || [];
  if (!results.length) return null;

  // Preferimos el resultado cuyo título (inglés o romaji) coincida con el título buscado
  const match =
    results.find((item) => {
      const en = item?.title?.english || '';
      const romaji = item?.title?.romaji || '';
      return titlesMatch(en, title) || titlesMatch(romaji, title);
    }) || results[0]; // fallback al primero si ninguno coincide exactamente

  return {
    posterUrl: match?.coverImage?.extraLarge || match?.coverImage?.large || null,
    bannerUrl: match?.bannerImage || null,
  };
};

// ─── Script principal ────────────────────────────────────────────────────────

const repairImages = async () => {
  await connectDB();

  const animes = await Anime.find({}, 'title posterUrl bannerUrl sourceRefs').lean();
  console.log(`\n🔧 Reparando imágenes de ${animes.length} anime...\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < animes.length; i++) {
    const anime = animes[i];
    const label = `[${String(i + 1).padStart(3, ' ')}/${animes.length}] ${anime.title}`;

    try {
      const images = await fetchAniListImages(anime.title);

      if (!images || (!images.posterUrl && !images.bannerUrl)) {
        console.log(`${label}  → sin resultados en AniList`);
        skipped++;
        await sleep(1000);
        continue;
      }

      const update = {};

      if (images.posterUrl && images.posterUrl !== anime.posterUrl) {
        update.posterUrl = images.posterUrl;
      }
      if (images.bannerUrl && images.bannerUrl !== anime.bannerUrl) {
        update.bannerUrl = images.bannerUrl;
      }

      if (Object.keys(update).length) {
        await Anime.updateOne({ _id: anime._id }, { $set: update });
        const campos = Object.keys(update).join(' + ');
        console.log(`${label}  ✓ ${campos} actualizado`);
        updated++;
      } else {
        console.log(`${label}  → ya tenía la mejor imagen`);
        skipped++;
      }
    } catch (err) {
      console.error(`${label}  ✗ ${err.message}`);
      errors++;
    }

    // Respetar el rate limit de AniList (~90 req/min). 800 ms ≈ 75 req/min.
    // Respetar el rate limit de AniList. 2200 ms ≈ 27 req/min, margen seguro.
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  console.log(`\n✅ Listo. Actualizados: ${updated}  Sin cambio: ${skipped}  Errores: ${errors}\n`);
  process.exit(0);
};

repairImages().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
