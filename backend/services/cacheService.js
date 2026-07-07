// Cache disabled by user request
let cacheStats = { hits: 0, misses: 0 };

const getFromCache = async (key) => {
  // Always return null to bypass cache and fetch directly from DB
  return null;
};

const setInCache = async (key, data, ttlSeconds) => {
  // Do nothing
};

const invalidateCache = async (pattern) => {
  // Do nothing
};

const getCacheStats = () => cacheStats;

module.exports = { getFromCache, setInCache, invalidateCache, getCacheStats };

