const normalizeAnimeType = (value) => {
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

const providerPriority = {
  anilist: 3,
  jikan: 2,
  kitsu: 1,
};

const isPlaceholderUrl = (value) => /placeholder|placehold/i.test(String(value || ''));

const scoreImageUrl = (value) => {
  const input = String(value || '').trim().toLowerCase();
  if (!input) return 0;
  if (isPlaceholderUrl(input)) return 1;

  let score = 10;
  if (/extralarge|original|maximum|maxres|1920|1600|1280|1200|1080/.test(input)) score += 5;
  if (/large|large_image/.test(input)) score += 3;
  if (/medium|small|thumb/.test(input)) score -= 2;
  if (/webp/.test(input)) score += 1;
  return score;
};

const getBestProviderPriority = (sourceRefs) => {
  if (!Array.isArray(sourceRefs) || !sourceRefs.length) return 0;

  return sourceRefs.reduce((best, item) => {
    const provider = String(item?.provider || '').trim().toLowerCase();
    return Math.max(best, providerPriority[provider] || 0);
  }, 0);
};

const getProviderPriority = (provider) => providerPriority[String(provider || '').trim().toLowerCase()] || 0;

const choosePreferredImage = ({ currentUrl, incomingUrl, currentSourceRefs, incomingProvider }) => {
  const currentScore = scoreImageUrl(currentUrl);
  const incomingScore = scoreImageUrl(incomingUrl);

  if (!currentScore) return incomingUrl || currentUrl;
  if (!incomingScore) return currentUrl;

  const currentProviderScore = getBestProviderPriority(currentSourceRefs);
  const incomingProviderScore = getProviderPriority(incomingProvider);

  if (incomingProviderScore > currentProviderScore && incomingScore >= currentScore - 1) {
    return incomingUrl;
  }

  if (incomingScore > currentScore + 2) {
    return incomingUrl;
  }

  return currentUrl;
};

const normalizeSourceRef = (sourceRefs, provider, externalId) => {
  const items = Array.isArray(sourceRefs) ? [...sourceRefs] : [];
  const index = items.findIndex(
    (item) => item.provider === provider && String(item.externalId) === String(externalId)
  );

  if (index === -1) {
    items.push({ provider, externalId: String(externalId) });
  }

  return items;
};

module.exports = {
  choosePreferredImage,
  getProviderPriority,
  normalizeAnimeType,
  normalizeSourceRef,
  scoreImageUrl,
};
