import { withAuthHeaders, BACKEND_ORIGIN, BACKEND_URL } from '../config.js';
const BACKEND_BASE = BACKEND_URL || "/api";
const API_BASE = "https://api.jikan.moe/v4";
const CACHE_PREFIX = "animex_v3_cache_";
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_LIVE_UPCOMING_ENDPOINT = "/api/upcoming/live";

  function createApiClient(options = {}) {
    const baseUrl = options.baseUrl || API_BASE;
  const cacheTtlMs = Number(options.cacheTtlMs || DEFAULT_CACHE_TTL_MS);
  const liveUpcomingEndpoint = options.liveUpcomingEndpoint || DEFAULT_LIVE_UPCOMING_ENDPOINT;
  const fetchImpl = options.fetchImpl || fetch.bind(globalThis);
  const storage = options.storage || globalThis.localStorage;
  const activeControllers = new Map();
  const activePromises = new Map();
  let forceFailures = false;
  let forcedFailureRate = 0;
  let requestCount = 0;
  let failureCount = 0;
  let retryCount = 0;
  const maxRetries = Math.max(0, Number(options.maxRetries ?? 2));
  const retryBaseDelayMs = Math.max(50, Number(options.retryBaseDelayMs ?? 250));

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
  }

  function sweepCache() {
    if (!storage) return;
    try {
      const now = Date.now();
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          try {
            const raw = storage.getItem(key);
            const parsed = JSON.parse(raw);
            if (now - Number(parsed?.timestamp || 0) > cacheTtlMs) {
              storage.removeItem(key);
            }
          } catch {
            storage.removeItem(key);
          }
        }
      }
    } catch {}
  }
  
  Promise.resolve().then(sweepCache);

  function shouldSimulateFailure() {
    if (forceFailures) return true;
    if (forcedFailureRate <= 0) return false;
    return Math.random() < forcedFailureRate;
  }

  function cacheKey(endpoint) {
    return `${CACHE_PREFIX}${encodeURIComponent(endpoint)}`;
  }

  function readCache(endpoint) {
    if (!storage?.getItem) return null;
    const raw = storage.getItem(cacheKey(endpoint));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeCache(endpoint, data) {
    if (!storage?.setItem) return;
    try {
      storage.setItem(cacheKey(endpoint), JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch {
      // Ignore cache write failures.
    }
  }

  async function request(endpoint) {
    requestCount += 1;
    const cached = readCache(endpoint);
    if (cached && (Date.now() - Number(cached.timestamp || 0)) < cacheTtlMs) return cached.data;

    if (activePromises.has(endpoint)) {
      return activePromises.get(endpoint);
    }

    const prior = activeControllers.get(endpoint);
    if (prior) prior.abort();
    const controller = new AbortController();
    activeControllers.set(endpoint, controller);

    const promise = (async () => {
      try {
        let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          if (shouldSimulateFailure()) throw new Error("Simulated failure");
          const requestUrl = /^https?:\/\//i.test(String(endpoint || ""))
            ? String(endpoint)
            : (String(endpoint).startsWith('/') ? endpoint : `${baseUrl}${endpoint}`);
          const requestOptions = { signal: controller.signal };
          const resolvedUrl = new URL(requestUrl, globalThis.location?.origin || 'http://localhost');
          if (
            resolvedUrl.origin === (globalThis.location?.origin || resolvedUrl.origin) ||
            resolvedUrl.origin === BACKEND_ORIGIN
          ) {
            requestOptions.headers = withAuthHeaders();
          }
          const response = await fetchImpl(requestUrl, requestOptions);
          if (!response.ok) throw new Error(`Request failed (${response.status})`);
          const data = await response.json();
          writeCache(endpoint, data);
          return data;
        } catch (error) {
          if (controller.signal.aborted) throw error;
          if (attempt >= maxRetries) throw error;
          retryCount += 1;
          const delayMs = retryBaseDelayMs * (2 ** attempt);
          await wait(delayMs);
        }
        attempt += 1;
      }
      } catch (error) {
        failureCount += 1;
        if (cached?.data) return cached.data;
        throw error;
      } finally {
        if (activeControllers.get(endpoint) === controller) activeControllers.delete(endpoint);
        if (activePromises.get(endpoint) === promise) activePromises.delete(endpoint);
      }
    })();

    activePromises.set(endpoint, promise);
    return promise;
  }

  return Object.freeze({
    request,
    setFailureMode(enabled) {
      forceFailures = Boolean(enabled);
    },
    setFailureRate(rate) {
      const numeric = Number(rate);
      forcedFailureRate = Number.isFinite(numeric) ? Math.min(1, Math.max(0, numeric)) : 0;
    },
    getDiagnostics() {
      return {
        requestCount,
        failureCount,
        retryCount,
        forceFailures,
        forcedFailureRate
      };
    },
    getAiring(limit = 24) {
      return request(`${BACKEND_BASE}/anime/airing`);
    },
    getTrending(limit = 24) {
      return request(`${BACKEND_BASE}/anime/top?limit=${limit}`);
    },
    getSeasonal(limit = 24) {
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      let season = 'winter';
      if (month >= 3 && month <= 5) season = 'spring';
      else if (month >= 6 && month <= 8) season = 'summer';
      else if (month >= 9 && month <= 11) season = 'fall';
      return request(`${BACKEND_BASE}/anime/season/${year}/${season}?limit=${limit}`);
    },
    getSeasonalAnime(year, season, page = 1) {
      return request(`${BACKEND_BASE}/anime/season/${year}/${season}?page=${page}`);
    },
    getUpcomingAnime(page = 1) {
      return request(`${BACKEND_BASE}/anime/upcoming?page=${page}`);
    },
    getTop(limit = 24) {
      return request(`${BACKEND_BASE}/anime/top?limit=${limit}`);
    },
    searchAnime(query, page = 1, limit = 25, filters = {}) {
      const params = new URLSearchParams({ q: String(query || '').trim(), page, limit });
      if (filters.genre) params.append('genres', filters.genre);
      if (filters.tag) params.append('tags', filters.tag);
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.rating) params.append('rating', filters.rating);

      return request(`${BACKEND_BASE}/anime/search?${params.toString()}`);
    },
    getAnimeDetail(malId) {
      return request(`${BACKEND_BASE}/anime/${Number(malId)}`);
    },
    getLiveUpcoming(limit = 100) {
      const endpoint = String(liveUpcomingEndpoint || DEFAULT_LIVE_UPCOMING_ENDPOINT);
      if (endpoint.includes("?")) return request(`${endpoint}&limit=${Number(limit || 100)}`);
      return request(`${endpoint}?limit=${Number(limit || 100)}`);
    }
  });
}

export { API_BASE, DEFAULT_LIVE_UPCOMING_ENDPOINT, createApiClient };
