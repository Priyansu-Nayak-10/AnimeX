"use strict";

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timeout);
  showToast._timeout = setTimeout(() => toast.classList.remove("show"), 1700);
}

const ACTIVE_TAB_KEY = "activeDashboardTab";
const PROFILE_DATA_KEY = "profileData";
const THEME_PREFERENCE_KEY = "themePreference";
const DEFAULT_SORT_KEY = "defaultSortPreference";
const CONFIRM_BEFORE_DELETE_KEY = "confirmBeforeDelete";
const LAST_BACKUP_TIMESTAMP_KEY = "lastBackupCreatedAt";
const ANIME_STORAGE_KEY = "animeList";
const PROFILE_IMAGE_MAX_BYTES = Math.floor(1.5 * 1024 * 1024);
const PROFILE_VIDEO_MAX_BYTES = 2 * 1024 * 1024;
const PROFILE_BANNER_VIDEO_TYPES = ["video/mp4", "video/webm"];
const PROFILE_BANNER_HEIGHT_MIN = 180;
const PROFILE_BANNER_HEIGHT_MAX = 400;
const PROFILE_BANNER_HEIGHT_DEFAULT = 240;
const AUTH_TOKEN_KEYS = ["authToken", "sessionToken", "userSessionToken", "userSession"];
let embeddedSearchQuery = "";
let embeddedSearchPage = 1;
let embeddedHasNextPage = false;
let embeddedSearchResults = [];
let embeddedSearchTotalPages = 1;
let embeddedSearchTotalResults = 0;
let embeddedSearchMode = "query";
let embeddedClientResults = [];
const EMBEDDED_RESULTS_PER_PAGE = 12;
let watchlistRandomPickedId = null;
let completedSortMode = "recent";
let confirmBeforeDeleteEnabled = true;
let completedGenreChartInstance = null;
let insightsStatusChartInstance = null;
let insightsGenreChartInstance = null;
let insightsMonthlyChartInstance = null;
let embeddedModalFullDescription = "";
let embeddedModalDescExpanded = false;
let embeddedModalLastFocus = null;
let embeddedModalMode = "search";
const QUICK_SUGGEST_DEBOUNCE_MS = 300;
let quickSuggestTimer = null;
let quickSuggestItems = [];
let quickSuggestRequestId = 0;
let quickSuggestActiveIndex = -1;
let quickSuggestLockedUntilInput = false;
let isQuickSearchSubmitting = false;
let pendingImportFile = null;
let confirmResolver = null;
let profileModalAvatarData = "";
let profileModalBannerType = "";
let profileModalBannerData = "";
let profileModalBannerHeight = PROFILE_BANNER_HEIGHT_DEFAULT;
const SEARCH_FILTER_GENRE_ID = {
  Action: 1,
  Adventure: 2,
  Cars: 3,
  Comedy: 4,
  Dementia: 5,
  Demons: 6,
  Drama: 8,
  Ecchi: 9,
  Fantasy: 10,
  Game: 11,
  Harem: 35,
  Historical: 13,
  Horror: 14,
  Isekai: 62,
  Josei: 43,
  Kids: 15,
  Magic: 16,
  "Martial Arts": 17,
  Mecha: 18,
  Military: 38,
  Music: 19,
  Mystery: 7,
  Parody: 20,
  Police: 39,
  Psychological: 40,
  Romance: 22,
  Samurai: 21,
  School: 23,
  "Sci-Fi": 24,
  Seinen: 42,
  Shoujo: 25,
  "Shoujo Ai": 26,
  Shounen: 27,
  "Shounen Ai": 28,
  "Slice of Life": 36,
  Space: 29,
  Sports: 30,
  "Super Power": 31,
  Supernatural: 37,
  Thriller: 41,
  Vampire: 32
};
const EMPTY_HERO_POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360" viewBox="0 0 240 360">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1d2738"/>
          <stop offset="100%" stop-color="#141b29"/>
        </linearGradient>
      </defs>
      <rect width="240" height="360" fill="url(#g)"/>
      <g fill="#93a5c9" font-family="Inter, Arial, sans-serif" text-anchor="middle">
        <text x="120" y="170" font-size="16" font-weight="700">NO ANIME</text>
        <text x="120" y="192" font-size="12">CURRENTLY WATCHING</text>
      </g>
    </svg>`
  );
const REALTIME_NEWS_CACHE_KEY = "realtimeNewsCacheV1";
const NEWS_CACHE_TTL_MS = 5 * 60 * 1000;
const NEWS_AUTO_REFRESH_MS = 5 * 60 * 1000;
const NEWS_ITEMS_LIMIT = 10;
const HERO_CAROUSEL_CACHE_KEY = "animeHeroCarouselCacheV1";
const HERO_CAROUSEL_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const HERO_CAROUSEL_AUTO_REFRESH_MS = 20 * 60 * 1000;
const HERO_CAROUSEL_MIN_ITEMS = 5;
const HERO_CAROUSEL_MAX_ITEMS = 8;
const HERO_CAROUSEL_AUTOPLAY_MS = 6200;
const FEATURED_CLIP_STORAGE_KEY = "featuredClipUploadV1";
const FEATURED_CLIP_MAX_PERSIST_BYTES = 4 * 1024 * 1024;
const ACHIEVEMENTS_STORAGE_KEY = "animeAchievementsV1";
const ACHIEVEMENT_DEFINITIONS = [
  {
    key: "movie_collector",
    title: "Movie Collector",
    iconClass: "fa-solid fa-film",
    rarity: "Common",
    target: 5
  },
  {
    key: "shonen_addict",
    title: "Shonen Addict",
    iconClass: "fa-solid fa-fire",
    rarity: "Rare",
    target: 7
  },
  {
    key: "genre_master",
    title: "Genre Master",
    iconClass: "fa-solid fa-brain",
    rarity: "Epic",
    target: 10
  },
  {
    key: "completion_legend",
    title: "Completion Legend",
    iconClass: "fa-solid fa-crown",
    rarity: "Legendary",
    target: 20
  }
];
const INSIGHTS_ACHIEVEMENT_DEFINITIONS = [
  {
    key: "first_completed",
    title: "First Anime Completed",
    description: "Complete your first anime.",
    iconClass: "fa-solid fa-flag-checkered",
    target: 1,
    progressKey: "totalCompleted"
  },
  {
    key: "episodes_100",
    title: "100 Episodes Watched",
    description: "Reach 100 watched episodes.",
    iconClass: "fa-solid fa-tv",
    target: 100,
    progressKey: "totalEpisodesWatched"
  },
  {
    key: "completed_10",
    title: "10 Anime Completed",
    description: "Finish 10 anime entries.",
    iconClass: "fa-solid fa-medal",
    target: 10,
    progressKey: "totalCompleted"
  },
  {
    key: "episodes_500",
    title: "500 Episodes Watched",
    description: "Reach 500 watched episodes.",
    iconClass: "fa-solid fa-bolt",
    target: 500,
    progressKey: "totalEpisodesWatched"
  },
  {
    key: "month_five_completions",
    title: "5 Anime in One Month",
    description: "Complete five anime in a single month.",
    iconClass: "fa-solid fa-calendar-check",
    target: 5,
    progressKey: "bestCompletedMonthCount"
  },
  {
    key: "genre_five_streak",
    title: "Genre Specialist",
    description: "Complete five anime from the same genre.",
    iconClass: "fa-solid fa-layer-group",
    target: 5,
    progressKey: "maxGenreCompletionCount"
  }
];
const NEWS_PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#202c44"/>
          <stop offset="100%" stop-color="#141b29"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#g)"/>
      <text x="60" y="64" fill="#91a5c9" font-family="Inter, Arial, sans-serif" font-size="12" text-anchor="middle">NEWS</text>
    </svg>`
  );
const heroCarouselState = {
  items: [],
  index: 0,
  timer: null
};
const domCache = {
  news: null,
  heroCarousel: null,
  featuredClip: null
};
let featuredClipObjectUrl = null;
const API_CACHE_TTL_MS = {
  embeddedSearch: 5 * 60 * 1000,
  quickSuggestions: 2 * 60 * 1000,
  filterSearch: 5 * 60 * 1000,
  modalDetails: 60 * 60 * 1000
};
const apiCache = {
  embeddedSearchPages: new Map(),
  quickSuggestions: new Map(),
  filterSearch: new Map(),
  modalDetails: new Map()
};
const PERSONALIZED_RECOMMENDATION_LIMIT = 6;
const PERSONALIZED_RECOMMENDATION_CACHE_TTL_MS = 20 * 60 * 1000;
const recommendationSessionSalt = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const recommendationCache = {
  watchlist: new Map(),
  completed: new Map()
};
const requestState = {
  embeddedSearchId: 0,
  embeddedModalId: 0,
  newsPromise: null,
  modalPreloadTimer: null,
  newsAutoRefreshId: null,
  lastNewsFetchTimestamp: 0
};
const pendingRequests = {
  modalDetails: new Map()
};
let dashboardSnapshot = [];

function readTimedCache(cache, key, ttlMs) {
  if (!cache.has(key)) return { hit: false, value: null };
  const entry = cache.get(key);
  if (!entry || Date.now() - Number(entry.timestamp || 0) > ttlMs) {
    cache.delete(key);
    return { hit: false, value: null };
  }
  return { hit: true, value: entry.value };
}

function writeTimedCache(cache, key, value) {
  cache.set(key, { timestamp: Date.now(), value });
  return value;
}

function stableAnimeListKey(list) {
  return list
    .map((anime) => `${anime.id}:${anime.status}:${anime.watchedEpisodes}:${anime.updatedAt || ""}`)
    .join("|");
}

function normalizeAnimeTitleKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (_) {
    return fallback;
  }
}

function readJsonStorage(key, fallback) {
  return safeParseJson(localStorage.getItem(key), fallback);
}

function normalizeBannerHeight(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PROFILE_BANNER_HEIGHT_DEFAULT;
  return Math.max(PROFILE_BANNER_HEIGHT_MIN, Math.min(PROFILE_BANNER_HEIGHT_MAX, Math.round(parsed)));
}

function getDefaultProfileData() {
  return {
    username: "Shadow",
    email: "",
    bio: "",
    avatar: "",
    bannerType: "",
    bannerData: "",
    bannerHeight: PROFILE_BANNER_HEIGHT_DEFAULT
  };
}

async function getProfileData() {
    const session = await SupabaseAuth.getSession();
    if (!session) return getDefaultProfileData();

    const storedProfile = safeParseJson(localStorage.getItem(PROFILE_DATA_KEY), null);
    const base = getDefaultProfileData();
    const username =
        String(storedProfile?.username || session.user.user_metadata?.username || base.username).trim() || base.username;
    const email = String(storedProfile?.email || session.user.email || base.email).trim();
    const bio = String(storedProfile?.bio || base.bio).trim();
    const avatar = String(storedProfile?.avatar || base.avatar).trim();
    const requestedType =
        storedProfile?.bannerType === "video" || storedProfile?.bannerType === "image"
            ? storedProfile.bannerType
            : "";
    const requestedData = requestedType ? String(storedProfile?.bannerData || "").trim() : "";
    const bannerType = requestedData ? requestedType : "";
    const bannerData = bannerType ? requestedData : "";
    return {
        username,
        email,
        bio,
        avatar,
        bannerType,
        bannerData,
        bannerHeight: normalizeBannerHeight(storedProfile?.bannerHeight ?? base.bannerHeight)
    };
}

async function saveProfileData(profileData) {
    const session = await SupabaseAuth.getSession();
    if (!session) throw new Error("No active session");

    const base = getDefaultProfileData();
    const requestedType =
        profileData?.bannerType === "video" || profileData?.bannerType === "image" ? profileData.bannerType : "";
    const requestedData = requestedType ? String(profileData?.bannerData || "").trim() : "";
    const bannerType = requestedData ? requestedType : "";
    const bannerData = bannerType ? requestedData : "";
    const normalized = {
        username: String(profileData?.username || base.username).trim() || base.username,
        email: String(profileData?.email || session.user.email).trim(),
        bio: String(profileData?.bio || "").trim(),
        avatar: String(profileData?.avatar || "").trim(),
        bannerType,
        bannerData,
        bannerHeight: normalizeBannerHeight(profileData?.bannerHeight ?? base.bannerHeight)
    };

    localStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(normalized));
    return normalized;
}

function getThemePreference() {
  const raw = String(localStorage.getItem(THEME_PREFERENCE_KEY) || "").trim().toLowerCase();
  if (raw === "dark" || raw === "light" || raw === "system") return raw;
  return "system";
}

function getDefaultSortPreference() {
  const raw = String(localStorage.getItem(DEFAULT_SORT_KEY) || "").trim();
  if (["recent", "rating", "episodes"].includes(raw)) return raw;
  return "recent";
}

function getConfirmBeforeDeletePreference() {
  const raw = localStorage.getItem(CONFIRM_BEFORE_DELETE_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return true;
}

function resolveTheme(preference) {
  const value = String(preference || "system").toLowerCase();
  if (value === "dark" || value === "light") return value;
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  return prefersLight ? "light" : "dark";
}

function applyTheme(preference) {
  const normalized = ["light", "dark", "system"].includes(String(preference || "").toLowerCase())
    ? String(preference).toLowerCase()
    : "system";
  localStorage.setItem(THEME_PREFERENCE_KEY, normalized);
  const resolved = resolveTheme(normalized);
  document.body.classList.toggle("theme-light", resolved === "light");
}

function syncThemePreferenceControl() {
  const preferred = getThemePreference();
  const themeButtons = document.querySelectorAll("#settingsThemeSegmented [data-theme-value]");
  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeValue === preferred;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function formatTimestamp(isoValue) {
  if (!isoValue) return "Never";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setLastBackupTimestamp(isoValue) {
  if (!isoValue) {
    localStorage.removeItem(LAST_BACKUP_TIMESTAMP_KEY);
    return;
  }
  localStorage.setItem(LAST_BACKUP_TIMESTAMP_KEY, isoValue);
}

function getLastBackupTimestamp() {
  return String(localStorage.getItem(LAST_BACKUP_TIMESTAMP_KEY) || "").trim();
}

function updateImportModeVisual(mode) {
  const wrap = document.getElementById("importModeWrap");
  const card = document.getElementById("exportImportCard");
  const isReplace = mode === "replace";
  if (wrap) wrap.classList.toggle("is-replace", isReplace);
  if (card) card.classList.toggle("import-mode-replace", isReplace);
}

function setStatusMessage(targetId, message, isError = false) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.textContent = String(message || "");
  el.classList.toggle("hidden", !message);
  el.classList.toggle("is-error", Boolean(isError));
}

function openConfirmModal({ title, message, confirmLabel = "Confirm", danger = false }) {
  const modal = document.getElementById("confirmActionModal");
  const titleEl = document.getElementById("confirmActionTitle");
  const messageEl = document.getElementById("confirmActionMessage");
  const confirmBtn = document.getElementById("confirmActionConfirmBtn");
  if (!modal || !titleEl || !messageEl || !confirmBtn) return Promise.resolve(false);
  if (confirmResolver) {
    const resolve = confirmResolver;
    confirmResolver = null;
    resolve(false);
  }

  titleEl.textContent = title || "Confirm action";
  messageEl.textContent = message || "Are you sure?";
  confirmBtn.textContent = confirmLabel;
  confirmBtn.classList.toggle("btn-danger", Boolean(danger));
  confirmBtn.classList.toggle("btn-primary", !danger);

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function closeConfirmModal(confirmed = false) {
  const modal = document.getElementById("confirmActionModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  if (confirmResolver) {
    const resolve = confirmResolver;
    confirmResolver = null;
    resolve(Boolean(confirmed));
  }
}

function normalizeImportedAnime(item, fallbackId) {
  const idCandidate = Number(item?.id);
  const title = String(item?.title || "").trim();
  if ((!Number.isFinite(idCandidate) || idCandidate <= 0) && !title) return null;
  const now = new Date().toISOString();
  const id = Number.isFinite(idCandidate) && idCandidate > 0 ? idCandidate : fallbackId;
  const status = ["plan", "watching", "completed"].includes(String(item?.status || "").toLowerCase())
    ? String(item.status).toLowerCase()
    : "plan";
  const episodes = Math.max(0, Number(item?.episodes) || 0);
  let watchedEpisodes = Math.max(0, Number(item?.watchedEpisodes) || 0);
  if (episodes > 0) watchedEpisodes = Math.min(watchedEpisodes, episodes);
  return {
    id,
    title: title || `Anime ${id}`,
    genres: Array.isArray(item?.genres) ? item.genres.map((g) => String(g || "").trim()).filter(Boolean) : [],
    type: String(item?.type || item?.format || "Unknown"),
    episodes,
    watchedEpisodes,
    status,
    rating: Number.isFinite(Number(item?.rating)) ? Number(item.rating) : 0,
    year: Number.isFinite(Number(item?.year)) ? Number(item.year) : null,
    studio: String(item?.studio || "Unknown"),
    image: String(item?.image || ""),
    dubAvailable: typeof item?.dubAvailable === "boolean" ? item.dubAvailable : null,
    addedAt: String(item?.addedAt || now),
    updatedAt: String(item?.updatedAt || now),
    source: "local"
  };
}

function parseImportFileContent(rawText) {
  const parsed = safeParseJson(rawText, null);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.animeList)) return parsed.animeList;
  return [];
}

function isApiItemAiring(item) {
  const status = String(item?.status || "").toLowerCase();
  return status.includes("airing");
}

function normalizeRecord(anime) {
  const now = new Date().toISOString();
  return {
    ...anime,
    title: anime.title || "Untitled Anime",
    genres: Array.isArray(anime.genres) ? anime.genres : [],
    episodes: Number(anime.episodes) || 0,
    watchedEpisodes: Number(anime.watchedEpisodes) || 0,
    rating: Number(anime.rating) || 0,
    addedAt: anime.addedAt || now,
    updatedAt: anime.updatedAt || now,
    source: anime.source === "remote" ? "remote" : "local"
  };
}

function reconcileAnimeProgress(list) {
  let changed = false;
  const next = list.map((anime) => {
    const episodes = Number(anime.episodes) || 0;
    let watched = Math.max(0, Number(anime.watchedEpisodes) || 0);
    let status = anime.status;

    if (episodes > 0 && watched >= episodes) {
      watched = episodes;
      status = "completed";
    } else if (watched > 0) {
      status = "watching";
    } else {
      status = "plan";
    }

    if (watched !== anime.watchedEpisodes || status !== anime.status) {
      changed = true;
      return { ...anime, watchedEpisodes: watched, status, updatedAt: new Date().toISOString() };
    }
    return anime;
  });

  if (changed) saveAnimeList(next);
  return next;
}

function topGenres(list, limit) {
  const count = {};
  list.forEach((anime) => {
    anime.genres.forEach((genre) => {
      count[genre] = (count[genre] || 0) + 1;
    });
  });
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}

function hashStringToHue(value) {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

function hueDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function pickDistinctGenreHue(genre, usedHues) {
  let hue = hashStringToHue(genre);
  let attempts = 0;
  while (usedHues.some((usedHue) => hueDistance(usedHue, hue) < 34) && attempts < 12) {
    hue = (hue + 37) % 360;
    attempts += 1;
  }
  usedHues.push(hue);
  return hue;
}

function buildGenreChipStyle(genre, usedHues) {
  const hue = pickDistinctGenreHue(genre, usedHues);
  const hue2 = (hue + 28) % 360;
  const border = `hsla(${hue}, 88%, 70%, 0.62)`;
  const glow = `0 8px 18px hsla(${hue}, 88%, 55%, 0.24)`;
  return `--chip-grad-a: hsla(${hue}, 88%, 56%, 0.36); --chip-grad-b: hsla(${hue2}, 88%, 52%, 0.2); --chip-border: ${border}; --chip-shadow: ${glow};`;
}

function renderSidebar(completed) {
  const favorites = topGenres(completed, 3);
  const homeTopGenres = document.getElementById("homeTopGenres");
  if (homeTopGenres) {
    const usedHues = [];
    homeTopGenres.innerHTML = favorites
      .map((genre) => `<span class="chip chip-genre-dynamic" style="${buildGenreChipStyle(genre, usedHues)}">${genre}</span>`)
      .join("");
  }
}

function renderMetrics(completed, plan) {
  const miniWatched = document.getElementById("miniStatWatched");
  const miniPlan = document.getElementById("miniStatPlan");
  const miniGenresExplored = document.getElementById("miniStatGenresExplored");
  if (miniWatched) miniWatched.textContent = String(completed.length);
  if (miniPlan) miniPlan.textContent = String(plan.length);
  if (miniGenresExplored) miniGenresExplored.textContent = String(countUniqueCompletedGenres(completed));
}

function getDailySeed() {
  const now = new Date();
  return Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`);
}

function pickDailyItem(list, seedOffset = 0) {
  if (!list.length) return null;
  const seed = getDailySeed() + seedOffset;
  return list[Math.abs(seed) % list.length];
}

function clampFact(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= 130) return normalized;
  return `${normalized.slice(0, 127).trim()}...`;
}

function buildUserFactCandidates(completed, watching) {
  const candidates = [];
  const watchedPlusCompleted = watching.concat(completed);
  const watchedGenreCounts = {};

  completed.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      watchedGenreCounts[genre] = (watchedGenreCounts[genre] || 0) + 1;
    });
  });

  if (completed.length) {
    const topRated = completed
      .filter((anime) => Number.isFinite(Number(anime.rating)) && Number(anime.rating) > 0)
      .sort((a, b) => Number(b.rating) - Number(a.rating))[0];
    if (topRated) {
      candidates.push({
        text: `Do you know that your top rated completed anime is ${topRated.title} at ${Number(topRated.rating).toFixed(1)}?`,
        source: "From your completed list"
      });
    }

    const longestCompleted = completed
      .slice()
      .sort((a, b) => (Number(b.episodes) || 0) - (Number(a.episodes) || 0))[0];
    if (longestCompleted && Number(longestCompleted.episodes) > 0) {
      candidates.push({
        text: `Do you know that ${longestCompleted.title} is your longest completed watch with ${longestCompleted.episodes} episodes?`,
        source: longestCompleted.title
      });
    }

    const topGenreEntry = Object.entries(watchedGenreCounts).sort((a, b) => b[1] - a[1])[0];
    if (topGenreEntry) {
      const total = Object.values(watchedGenreCounts).reduce((sum, value) => sum + value, 0);
      const pct = total > 0 ? Math.round((topGenreEntry[1] / total) * 100) : 0;
      candidates.push({
        text: `Do you know that ${topGenreEntry[0]} is your most watched genre right now at ${pct}% of completed genre tags?`,
        source: "From your genre history"
      });
    }
  }

  if (watching.length) {
    const focus = watching
      .slice()
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];
    const total = Number(focus?.episodes) || 0;
    const watched = Number(focus?.watchedEpisodes) || 0;
    const remaining = Math.max(total - watched, 0);
    if (focus && total > 0) {
      candidates.push({
        text: `Do you know that you have ${remaining} episodes left to finish ${focus.title}?`,
        source: "From your currently watching list"
      });
    }
  }

  if (watchedPlusCompleted.length) {
    const oldest = watchedPlusCompleted
      .filter((anime) => Number.isFinite(Number(anime.year)) && Number(anime.year) > 0)
      .sort((a, b) => Number(a.year) - Number(b.year))[0];
    if (oldest) {
      candidates.push({
        text: `Do you know that ${oldest.title} is the oldest anime in your active history from ${oldest.year}?`,
        source: "From your anime history"
      });
    }
  }

  return candidates;
}

function buildFallbackFactCandidates() {
  const pool = ANIME_DB.slice();
  if (!pool.length) {
    return [
      {
        text: "Do you know that completing your first anime unlocks personalized fun facts here?",
        source: "AnimeTracker"
      }
    ];
  }

  const topRated = pool
    .filter((anime) => Number.isFinite(Number(anime.rating)) && Number(anime.rating) > 0)
    .sort((a, b) => Number(b.rating) - Number(a.rating))[0];
  const longest = pool.slice().sort((a, b) => (Number(b.episodes) || 0) - (Number(a.episodes) || 0))[0];
  const oldest = pool
    .filter((anime) => Number.isFinite(Number(anime.year)) && Number(anime.year) > 0)
    .sort((a, b) => Number(a.year) - Number(b.year))[0];
  const dailyPick = pickDailyItem(pool, 17);

  return [
    topRated
      ? {
        text: `Do you know that ${topRated.title} is one of the highest-rated anime in your local catalog at ${Number(topRated.rating).toFixed(1)}?`,
        source: "Popular catalog pick"
      }
      : null,
    longest && Number(longest.episodes) > 0
      ? {
        text: `Do you know that ${longest.title} is the longest title in your local catalog with ${longest.episodes} episodes?`,
        source: "Popular catalog pick"
      }
      : null,
    oldest
      ? {
        text: `Do you know that ${oldest.title} is the oldest release in your local catalog from ${oldest.year}?`,
        source: "Popular catalog pick"
      }
      : null,
    dailyPick
      ? {
        text: `Do you know that today's random popular pick is ${dailyPick.title}? Try adding it to your plan list.`,
        source: "Daily popular pick"
      }
      : null
  ].filter(Boolean);
}

function renderHomeFunFact(completed, watching) {
  const factText = document.getElementById("homeQuoteText");
  const factSource = document.getElementById("homeQuoteAnime");
  if (!factText || !factSource) return;

  const candidates = buildUserFactCandidates(completed, watching);
  const fallback = buildFallbackFactCandidates();
  const factPool = candidates.length ? candidates : fallback;
  const chosen = pickDailyItem(factPool) || fallback[0];

  factText.textContent = clampFact(chosen?.text || "Do you know that your next anime pick could become your all-time favorite?");
  factSource.textContent = chosen?.source || "AnimeTracker";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNewsUiElements() {
  if (!domCache.news) {
    domCache.news = {
      state: document.getElementById("homeNewsState"),
      list: document.getElementById("homeNewsList"),
      refreshBtn: document.getElementById("homeNewsRefreshBtn"),
      lastUpdated: document.getElementById("homeNewsLastUpdated")
    };
  }
  return domCache.news;
}

function setNewsRefreshLoading(isLoading) {
  const { refreshBtn } = getNewsUiElements();
  if (!refreshBtn) return;
  refreshBtn.disabled = isLoading;
  refreshBtn.classList.toggle("is-loading", isLoading);
}

function setNewsState(message, type = "info") {
  const { state, list } = getNewsUiElements();
  if (!state || !list) return;
  state.textContent = message;
  state.classList.remove("hidden", "is-error");
  if (type === "error") state.classList.add("is-error");
  list.classList.add("hidden");
  list.innerHTML = "";
}

function formatNewsDate(rawDate) {
  const date = new Date(rawDate || "");
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function clampNewsDescription(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Latest anime update from the news feed.";
  if (normalized.length <= 210) return normalized;
  return `${normalized.slice(0, 207).trim()}...`;
}

async function fetchRealTimeNews() {
  try {
    const rssUrl = encodeURIComponent("https://www.animenewsnetwork.com/news/rss.xml");
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
    if (!response.ok) throw new Error("rss-fetch-failed");

    const json = await response.json();
    const items = Array.isArray(json?.items) ? json.items : [];

    return items.map(item => ({
      id: item.guid || item.link,
      title: item.title,
      description: clampNewsDescription(item.description || item.content || ""),
      image: item.thumbnail || item.enclosure?.link || "",
      publishedAt: item.pubDate,
      url: item.link,
      animeTitle: "AnimeNewsNetwork"
    })).slice(0, NEWS_ITEMS_LIMIT);
  } catch (_) {
    throw _;
  }
}

function renderNewsFeed(items) {
  const { state, list } = getNewsUiElements();
  if (!state || !list) return;

  if (!Array.isArray(items) || !items.length) {
    setNewsState("No anime news available right now. Please try again soon.");
    return;
  }

  state.classList.add("hidden");
  list.classList.remove("hidden");
  list.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "news-item";

    const thumb = document.createElement("img");
    thumb.className = "news-thumb";
    thumb.src = item.image || NEWS_PLACEHOLDER_IMAGE;
    thumb.alt = item.title;
    thumb.loading = "lazy";

    const content = document.createElement("div");
    content.className = "news-content";

    const title = document.createElement("h4");
    title.className = "news-title";
    title.textContent = item.title;

    const date = document.createElement("p");
    date.className = "news-date";
    date.textContent = `${item.animeTitle} • ${formatNewsDate(item.publishedAt)}`;

    const desc = document.createElement("p");
    desc.className = "news-desc";
    desc.textContent = item.description;

    const link = document.createElement("a");
    link.className = "news-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Read More";

    content.append(title, date, desc, link);
    row.append(thumb, content);
    list.appendChild(row);
  });

  const { lastUpdated } = getNewsUiElements();
  if (lastUpdated && requestState.lastNewsFetchTimestamp) {
    const timeStr = new Date(requestState.lastNewsFetchTimestamp).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
    lastUpdated.textContent = `Last active: ${timeStr}`;
  }
}

async function renderLiveAnimeNews(forceRefresh = false) {
  if (requestState.newsPromise) return requestState.newsPromise;

  const run = async () => {
    const { state, list } = getNewsUiElements();
    if (!state || !list) return;

    let cached = null;
    if (!forceRefresh) {
      try {
        const raw = localStorage.getItem(REALTIME_NEWS_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.data) && Date.now() - Number(parsed.timestamp || 0) < NEWS_CACHE_TTL_MS) {
            cached = parsed.data;
            requestState.lastNewsFetchTimestamp = parsed.timestamp;
          }
        }
      } catch (_) { /* ignore */ }
    }

    if (cached) {
      renderNewsFeed(cached);
      return;
    }

    // Show loading skeleton approach (just a message for now, will improve later)
    if (!list.children.length) {
      setNewsState("Loading trending announcements...");
    }

    setNewsRefreshLoading(true);
    try {
      const fresh = await fetchRealTimeNews();
      if (!fresh.length) {
        if (!list.children.length) {
          setNewsState("No anime news available right now.");
        }
        return;
      }

      requestState.lastNewsFetchTimestamp = Date.now();
      localStorage.setItem(REALTIME_NEWS_CACHE_KEY, JSON.stringify({
        data: fresh,
        timestamp: requestState.lastNewsFetchTimestamp
      }));

      renderNewsFeed(fresh);
    } catch (_) {
      if (!list.children.length) {
        setNewsState("Unable to load latest anime news.", "error");
      }
    } finally {
      setNewsRefreshLoading(false);
    }
  };

  const pending = run().finally(() => {
    if (requestState.newsPromise === pending) {
      requestState.newsPromise = null;
    }
  });
  requestState.newsPromise = pending;
  return pending;
}

function startNewsAutoRefresh() {
  if (requestState.newsAutoRefreshId) return;

  const refreshAction = () => {
    const dashboard = document.getElementById("dashboardPanel");
    if (dashboard && !dashboard.classList.contains("hidden") && document.visibilityState === "visible") {
      renderLiveAnimeNews(true);
    }
  };

  // Start initial timer
  requestState.newsAutoRefreshId = setInterval(refreshAction, NEWS_AUTO_REFRESH_MS);

  // Visibility handling
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      const isStale = Date.now() - requestState.lastNewsFetchTimestamp > NEWS_CACHE_TTL_MS;
      if (isStale) refreshAction();
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
}

function normalizeHeroDescription(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Latest anime release now airing. Explore this title and continue your journey.";
  if (clean.length <= 220) return clean;
  return `${clean.slice(0, 217).trim()}...`;
}

function mapApiAnimeToHeroItem(item) {
  const airedFrom = item?.aired?.from || "";
  const year = Number(item?.year) || (airedFrom ? new Date(airedFrom).getFullYear() : null) || "N/A";
  return {
    id: Number(item?.mal_id) || `hero-${Math.random().toString(36).slice(2)}`,
    title: item?.title_english || item?.title || "Untitled Anime",
    image: item?.images?.jpg?.large_image_url || item?.images?.jpg?.image_url || "",
    rating: Number.isFinite(Number(item?.score)) ? Number(item.score).toFixed(1) : "N/A",
    year,
    episodes: Number(item?.episodes) > 0 ? Number(item.episodes) : "??",
    format: item?.type || "TV",
    description: normalizeHeroDescription(item?.synopsis)
  };
}

function buildFallbackHeroItems() {
  const localSorted = ANIME_DB.slice().sort((a, b) => {
    const airingA = String(a.status || "").toLowerCase() === "airing" ? 1 : 0;
    const airingB = String(b.status || "").toLowerCase() === "airing" ? 1 : 0;
    if (airingA !== airingB) return airingB - airingA;
    return (Number(b.year) || 0) - (Number(a.year) || 0);
  });
  return localSorted
    .slice(0, 12)
    .map((anime) => ({
      id: anime.id,
      title: anime.title,
      image: anime.image,
      rating: Number.isFinite(Number(anime.rating)) ? Number(anime.rating).toFixed(1) : "N/A",
      year: anime.year || "N/A",
      episodes: Number(anime.episodes) > 0 ? Number(anime.episodes) : "??",
      format: "TV",
      description: normalizeHeroDescription(
        `${anime.title} is currently one of the latest popular anime picks. Genres: ${(anime.genres || []).slice(0, 3).join(", ")}.`
      )
    }))
    .filter((item) => item.image);
}

function loadHeroCarouselCache() {
  try {
    const raw = localStorage.getItem(HERO_CAROUSEL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.items) ? parsed.items : null;
    if (!items || !items.length) return null;
    if (Date.now() - Number(parsed.timestamp || 0) > HERO_CAROUSEL_CACHE_TTL_MS) return null;
    return items;
  } catch (_) {
    return null;
  }
}

function saveHeroCarouselCache(items) {
  try {
    localStorage.setItem(
      HERO_CAROUSEL_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        items
      })
    );
  } catch (_) {
    // Ignore cache save failures.
  }
}

function getHeroCarouselElements() {
  if (!domCache.heroCarousel) {
    domCache.heroCarousel = {
      root: document.getElementById("homeHeroCarousel"),
      state: document.getElementById("homeHeroCarouselState"),
      track: document.getElementById("homeHeroCarouselTrack"),
      dots: document.getElementById("homeHeroCarouselDots")
    };
  }
  return domCache.heroCarousel;
}

function getFeaturedClipElements() {
  if (!domCache.featuredClip) {
    domCache.featuredClip = {
      card: document.getElementById("featuredClipCard"),
      video: document.getElementById("featuredClipVideo"),
      source: document.getElementById("featuredClipSource"),
      uploadInput: document.getElementById("featuredClipUpload"),
      emptyText: document.getElementById("featuredClipEmptyText")
    };
  }
  return domCache.featuredClip;
}

function isSupportedVideoFile(file) {
  if (!file) return false;
  if (String(file.type || "").toLowerCase().startsWith("video/")) return true;
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(file.name || "");
}

function readFileAsDataUrl(file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected."));
      return;
    }
    const maxBytes = Number(options.maxBytes) || 0;
    if (maxBytes > 0 && Number(file.size) > maxBytes) {
      const mb = (maxBytes / (1024 * 1024)).toFixed(1);
      reject(new Error(`File too large. Max size is ${mb} MB.`));
      return;
    }
    const fileType = String(file.type || "").toLowerCase();
    const fileName = String(file.name || "").toLowerCase();
    const fallbackType = fileName.endsWith(".mp4")
      ? "video/mp4"
      : fileName.endsWith(".webm")
        ? "video/webm"
        : fileName.endsWith(".png")
          ? "image/png"
          : fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
            ? "image/jpeg"
            : fileName.endsWith(".gif")
              ? "image/gif"
              : fileName.endsWith(".webp")
                ? "image/webp"
                : "";
    const effectiveType = fileType || fallbackType;
    if (Array.isArray(options.allowedTypes) && options.allowedTypes.length && !options.allowedTypes.includes(effectiveType)) {
      reject(new Error("Unsupported file type."));
      return;
    }
    if (options.allowedPrefix && !effectiveType.startsWith(options.allowedPrefix)) {
      reject(new Error("Unsupported file type."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to process file."));
    reader.readAsDataURL(file);
  });
}

function loadStoredFeaturedClip() {
  try {
    const raw = localStorage.getItem(FEATURED_CLIP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.src !== "string" || !parsed.src.startsWith("data:video")) return null;
    return {
      src: parsed.src,
      type: typeof parsed.type === "string" ? parsed.type : "video/mp4"
    };
  } catch (_) {
    return null;
  }
}

function releaseFeaturedClipObjectUrl() {
  if (!featuredClipObjectUrl) return;
  URL.revokeObjectURL(featuredClipObjectUrl);
  featuredClipObjectUrl = null;
}

function applyFeaturedClipSource(video, source, src, mimeType) {
  if (!video || !source || !src) return;
  source.src = src;
  source.type = mimeType || "video/mp4";
  video.load();
}

function clearFeaturedClipSource(video, source) {
  if (!video || !source) return;
  source.removeAttribute("src");
  source.type = "video/mp4";
  video.pause();
  try {
    video.currentTime = 0;
  } catch (_) {
    // Ignore seek reset failures.
  }
  video.load();
}

function setFeaturedClipEmptyState(card, emptyText, isEmpty) {
  if (!card) return;
  card.classList.toggle("featured-clip-empty", Boolean(isEmpty));
  if (emptyText) {
    emptyText.textContent = "Insert your fav clip";
  }
}

function ensureFeaturedClipPlayback(video) {
  if (!video) return;
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  const promise = video.play();
  if (promise && typeof promise.catch === "function") {
    promise.catch(() => { });
  }
}

function bindFeaturedClipUpload(card, video, source, uploadInput) {
  if (!card || !video || !source || !uploadInput || uploadInput.dataset.bound === "1") return;
  const { emptyText } = getFeaturedClipElements();

  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files?.[0];
    if (!file) return;

    if (!isSupportedVideoFile(file)) {
      showToast("Please choose a valid video file.");
      uploadInput.value = "";
      return;
    }

    releaseFeaturedClipObjectUrl();
    featuredClipObjectUrl = URL.createObjectURL(file);
    applyFeaturedClipSource(video, source, featuredClipObjectUrl, file.type || "video/mp4");
    setFeaturedClipEmptyState(card, emptyText, false);
    card.dataset.clipHasMedia = "1";
    video.hidden = false;
    ensureFeaturedClipPlayback(video);

    if (file.size <= FEATURED_CLIP_MAX_PERSIST_BYTES) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        localStorage.setItem(
          FEATURED_CLIP_STORAGE_KEY,
          JSON.stringify({
            src: dataUrl,
            type: file.type || "video/mp4",
            updatedAt: Date.now()
          })
        );
        showToast("Featured clip updated.");
      } catch (_) {
        localStorage.removeItem(FEATURED_CLIP_STORAGE_KEY);
        showToast("Clip loaded for this session.");
      }
    } else {
      localStorage.removeItem(FEATURED_CLIP_STORAGE_KEY);
      showToast("Clip loaded. File is too large to save.");
    }

    uploadInput.value = "";
  });

  uploadInput.dataset.bound = "1";
}

function setHeroCarouselMessage(message) {
  const { state, track, dots } = getHeroCarouselElements();
  if (!state || !track || !dots) return;
  state.textContent = message;
  state.classList.remove("hidden");
  track.classList.add("hidden");
  dots.classList.add("hidden");
}

function clearHeroCarouselTimer() {
  if (heroCarouselState.timer) {
    clearInterval(heroCarouselState.timer);
    heroCarouselState.timer = null;
  }
}

function setHeroCarouselIndex(index) {
  const { track, dots } = getHeroCarouselElements();
  if (!track || !dots || !heroCarouselState.items.length) return;

  heroCarouselState.index = (index + heroCarouselState.items.length) % heroCarouselState.items.length;

  track.querySelectorAll(".hero-slide").forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === heroCarouselState.index);
  });
  dots.querySelectorAll(".hero-dot").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === heroCarouselState.index);
  });
}

function startHeroCarouselTimer() {
  clearHeroCarouselTimer();
  if (heroCarouselState.items.length <= 1) return;
  heroCarouselState.timer = setInterval(() => {
    setHeroCarouselIndex(heroCarouselState.index + 1);
  }, HERO_CAROUSEL_AUTOPLAY_MS);
}

function renderHeroCarousel(items) {
  const { root, state, track, dots } = getHeroCarouselElements();
  if (!root || !state || !track || !dots) return;

  heroCarouselState.items = Array.isArray(items) ? items : [];
  heroCarouselState.index = 0;
  clearHeroCarouselTimer();

  if (!heroCarouselState.items.length) {
    setHeroCarouselMessage("Latest carousel is unavailable right now.");
    return;
  }

  state.classList.add("hidden");
  track.classList.remove("hidden");
  dots.classList.remove("hidden");
  track.innerHTML = "";
  dots.innerHTML = "";

  heroCarouselState.items.forEach((item, index) => {
    const slide = document.createElement("article");
    slide.className = "hero-slide";
    if (index === 0) slide.classList.add("active");
    slide.style.backgroundImage = `url("${item.image}")`;

    const overlay = document.createElement("div");
    overlay.className = "hero-slide-overlay";

    const content = document.createElement("div");
    content.className = "hero-slide-content";

    const kicker = document.createElement("p");
    kicker.className = "hero-kicker";
    kicker.textContent = "Latest Airing";

    const title = document.createElement("h2");
    title.className = "hero-title";
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "hero-meta-row";
    [
      `Rating ${item.rating}`,
      "HD",
      String(item.year),
      `${item.episodes} eps`,
      item.format
    ].forEach((metaItem) => {
      const pill = document.createElement("span");
      pill.className = "hero-meta-pill";
      pill.textContent = metaItem;
      meta.appendChild(pill);
    });

    const desc = document.createElement("p");
    desc.className = "hero-description";
    desc.textContent = item.description;

    content.append(kicker, title, meta, desc);
    slide.append(overlay, content);
    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "hero-dot";
    if (index === 0) dot.classList.add("active");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}: ${item.title}`);
    dot.addEventListener("click", () => {
      setHeroCarouselIndex(index);
      startHeroCarouselTimer();
    });
    dots.appendChild(dot);
  });

  if (!root.dataset.carouselBound) {
    root.addEventListener("mouseenter", clearHeroCarouselTimer);
    root.addEventListener("mouseleave", startHeroCarouselTimer);
    root.addEventListener("focusin", clearHeroCarouselTimer);
    root.addEventListener("focusout", startHeroCarouselTimer);
    root.dataset.carouselBound = "1";
  }

  startHeroCarouselTimer();
}

async function fetchLatestHeroCarouselItems() {
  const [latestResponse, trendingResponse] = await Promise.all([
    fetch("https://api.jikan.moe/v4/seasons/now?limit=18"),
    fetch("https://api.jikan.moe/v4/top/anime?filter=airing&limit=18")
  ]);
  if (!latestResponse.ok && !trendingResponse.ok) {
    throw new Error("hero-carousel-fetch-failed");
  }

  const latestJson = latestResponse.ok ? await latestResponse.json() : {};
  const trendingJson = trendingResponse.ok ? await trendingResponse.json() : {};
  const latestItems = Array.isArray(latestJson?.data) ? latestJson.data : [];
  const trendingItems = Array.isArray(trendingJson?.data) ? trendingJson.data : [];

  const trendingRank = new Map();
  trendingItems.forEach((item, index) => {
    const malId = Number(item?.mal_id) || 0;
    if (malId > 0) trendingRank.set(malId, index + 1);
  });

  const mergedMap = new Map();
  latestItems.concat(trendingItems).forEach((item) => {
    if (!item || !isApiItemAiring(item)) return;
    const malId = Number(item.mal_id) || 0;
    if (malId <= 0) return;
    const existing = mergedMap.get(malId) || {};
    mergedMap.set(malId, { ...existing, ...item });
  });

  const scored = Array.from(mergedMap.values())
    .map((item) => {
      const malId = Number(item?.mal_id) || 0;
      const trendPosition = trendingRank.has(malId) ? trendingRank.get(malId) : 999;
      const trendScore = trendPosition < 999 ? 1000 - trendPosition : 0;
      const startTime = new Date(item?.aired?.from || 0).getTime();
      const latestScore = Number.isFinite(startTime) ? Math.max(startTime, 0) : 0;
      return {
        item,
        score: trendScore * 1_000_000_000_000 + latestScore
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => mapApiAnimeToHeroItem(entry.item))
    .filter((item) => item.image && item.title)
    .slice(0, HERO_CAROUSEL_MAX_ITEMS);

  const merged = scored.slice();
  if (merged.length < HERO_CAROUSEL_MIN_ITEMS) {
    const fallback = buildFallbackHeroItems();
    fallback.forEach((item) => {
      if (merged.length >= HERO_CAROUSEL_MIN_ITEMS) return;
      const exists = merged.some((existing) => normalizeAnimeTitleKey(existing.title) === normalizeAnimeTitleKey(item.title));
      if (!exists) merged.push(item);
    });
  }

  return merged.slice(0, HERO_CAROUSEL_MAX_ITEMS);
}

async function initHomeHeroCarousel(forceRefresh = false) {
  const { root } = getHeroCarouselElements();
  if (!root) return;

  if (forceRefresh) {
    localStorage.removeItem(HERO_CAROUSEL_CACHE_KEY);
  }

  const cached = forceRefresh ? null : loadHeroCarouselCache();
  if (cached && cached.length) {
    renderHeroCarousel(cached);
  } else {
    setHeroCarouselMessage("Loading latest anime...");
  }

  try {
    const latest = await fetchLatestHeroCarouselItems();
    if (!latest.length) {
      if (!cached || !cached.length) setHeroCarouselMessage("No latest anime available right now.");
      return;
    }
    saveHeroCarouselCache(latest);
    renderHeroCarousel(latest);
  } catch (_) {
    if (cached && cached.length) return;
    const fallback = buildFallbackHeroItems().slice(0, HERO_CAROUSEL_MIN_ITEMS);
    if (fallback.length) {
      renderHeroCarousel(fallback);
      return;
    }
    setHeroCarouselMessage("Unable to load carousel content right now.");
  }
}

function renderFeatured(watching) {
  const heroImage = document.getElementById("heroImage");
  const heroTitle = document.getElementById("heroTitle");
  const heroMeta = document.getElementById("heroMeta");
  const heroUpdateBtn = document.getElementById("heroUpdateBtn");
  const heroRing = document.getElementById("heroRing");
  const heroRingText = document.getElementById("heroRingText");
  if (!heroImage || !heroTitle || !heroMeta || !heroUpdateBtn || !heroRing || !heroRingText) return;

  if (!watching.length) {
    heroImage.classList.remove("hidden");
    heroImage.classList.add("is-placeholder");
    heroImage.src = EMPTY_HERO_POSTER;
    heroImage.alt = "No currently watching anime";
    heroUpdateBtn.classList.remove("hidden");
    heroUpdateBtn.disabled = true;
    heroUpdateBtn.textContent = "Update Progress";
    heroUpdateBtn.onclick = null;
    heroTitle.textContent = "No anime in progress yet";
    heroMeta.textContent = "Mark an anime as Watching to track live progress.";
    heroRing.style.setProperty("--ring-pct", "0%");
    heroRingText.textContent = "0%";
    return;
  }

  const featured = watching
    .slice()
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];
  const total = featured.episodes || 0;
  const watched = Math.min(featured.watchedEpisodes || 0, total || 1);
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;

  heroImage.classList.remove("hidden");
  heroImage.classList.remove("is-placeholder");
  heroUpdateBtn.classList.remove("hidden");
  heroUpdateBtn.disabled = false;
  heroUpdateBtn.textContent = "Update Progress";

  heroImage.src = featured.image;
  heroImage.alt = featured.title;
  heroTitle.textContent = featured.title;
  heroMeta.textContent = total > 0
    ? `${watched}/${total} watched - ${Math.max(total - watched, 0)} episodes remaining`
    : `${watched} watched`;
  heroRing.style.setProperty("--ring-pct", `${pct}%`);
  heroRingText.textContent = `${pct}%`;
  heroUpdateBtn.onclick = () => updateWatchingProgress(featured.id);
}

function renderFeaturedClipCard(completed, watching) {
  const { card, video, source, uploadInput, emptyText } = getFeaturedClipElements();
  if (!card || !video || !source) return;

  const stored = loadStoredFeaturedClip();
  if (stored?.src) {
    applyFeaturedClipSource(video, source, stored.src, stored.type);
    setFeaturedClipEmptyState(card, emptyText, false);
    card.dataset.clipHasMedia = "1";
  } else {
    clearFeaturedClipSource(video, source);
    setFeaturedClipEmptyState(card, emptyText, true);
    card.dataset.clipHasMedia = "0";
  }

  const hasMedia = card.dataset.clipHasMedia === "1";
  video.hidden = !hasMedia;

  bindFeaturedClipUpload(card, video, source, uploadInput);
  if (hasMedia) {
    ensureFeaturedClipPlayback(video);
  } else {
    video.pause();
  }
}

function updateWatchingProgress(animeId) {
  const list = getAnimeList().map(normalizeRecord);
  const idx = list.findIndex((anime) => anime.id === animeId);
  if (idx < 0) return;

  const anime = list[idx];
  const maxEpisodes = Number(anime.episodes) || 0;
  const current = Number(anime.watchedEpisodes) || 0;
  const limitLabel = maxEpisodes > 0 ? `0-${maxEpisodes}` : "any non-negative number";
  const raw = prompt(`Update watched episodes for "${anime.title}" (${limitLabel})`, String(current));
  if (raw === null) return;

  const nextWatched = Number(raw);
  if (!Number.isFinite(nextWatched) || nextWatched < 0 || (maxEpisodes > 0 && nextWatched > maxEpisodes)) {
    showToast("Invalid episode count.");
    return;
  }

  anime.watchedEpisodes = nextWatched;
  if (maxEpisodes > 0 && nextWatched >= maxEpisodes) {
    anime.status = "completed";
  } else if (nextWatched > 0) {
    anime.status = "watching";
  } else {
    anime.status = "plan";
  }
  anime.updatedAt = new Date().toISOString();
  list[idx] = anime;
  saveAnimeList(list);
  window.dispatchEvent(new Event("animeDataUpdated"));
}

function buildRecommendationProfile(completed, fullList) {
  const consumed = fullList.filter((anime) => ["completed", "watching", "plan"].includes(String(anime.status || "").toLowerCase()));
  const watchedHistory = fullList.filter((anime) => ["completed", "watching"].includes(String(anime.status || "").toLowerCase()));
  const genreSource = watchedHistory.length ? watchedHistory : completed;
  const favoriteGenres = topGenres(genreSource, 4);

  const watchedGenreCount = {};
  genreSource.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      const key = String(genre || "").trim();
      if (!key) return;
      watchedGenreCount[key] = (watchedGenreCount[key] || 0) + 1;
    });
  });
  const mostWatchedGenre = Object.entries(watchedGenreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  const highestRatedAnime =
    completed
      .filter((anime) => Number.isFinite(Number(anime.rating)) && Number(anime.rating) > 0)
      .sort((a, b) => Number(b.rating) - Number(a.rating))[0] ||
    watchedHistory
      .filter((anime) => Number.isFinite(Number(anime.rating)) && Number(anime.rating) > 0)
      .sort((a, b) => Number(b.rating) - Number(a.rating))[0] ||
    null;

  return {
    consumed,
    favoriteGenres,
    mostWatchedGenre,
    highestRatedAnime
  };
}

function scoreRecommendationCandidate(anime, profile) {
  let score = 0;
  const genres = Array.isArray(anime.genres) ? anime.genres : [];
  const favoriteGenres = profile.favoriteGenres || [];
  const mostWatchedGenre = profile.mostWatchedGenre || "";
  const highestRatedAnime = profile.highestRatedAnime;

  if (genres.length) {
    genres.forEach((genre) => {
      if (favoriteGenres.includes(genre)) score += 26;
      if (mostWatchedGenre && genre === mostWatchedGenre) score += 34;
    });
  }

  if (highestRatedAnime) {
    const topGenres = Array.isArray(highestRatedAnime.genres) ? highestRatedAnime.genres : [];
    const sharedGenres = genres.filter((genre) => topGenres.includes(genre)).length;
    score += sharedGenres * 20;

    const topRating = Number(highestRatedAnime.rating) || 0;
    const candidateRating = Number(anime.rating) || 0;
    if (topRating > 0 && candidateRating > 0) {
      score += Math.max(0, 16 - Math.abs(topRating - candidateRating) * 4);
    }

    if (
      highestRatedAnime.studio &&
      anime.studio &&
      String(highestRatedAnime.studio).toLowerCase() === String(anime.studio).toLowerCase()
    ) {
      score += 10;
    }
  }

  if (String(anime.status || "").toLowerCase() === "airing") score += 9;
  if (Number(anime.year) >= new Date().getFullYear() - 2) score += 6;
  return score;
}

function resolveRecommendationImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const hasHttp = /^https?:\/\//i.test(raw);
  const hasProtocolRelative = /^\/\//.test(raw);
  const isDataImage = /^data:image\/[a-z]+/i.test(raw);
  if (!hasHttp && !hasProtocolRelative && !isDataImage) return null;
  if (hasProtocolRelative) return `https:${raw}`;
  return raw;
}

function getRecommendationMetaText(anime) {
  const genres = Array.isArray(anime.genres) ? anime.genres : [];
  const filtered = genres.filter((genre) => Boolean(String(genre || "").trim()));
  return filtered.slice(0, 3).join(", ") || "Genres unavailable";
}

function renderRecommendations(completed, fullList) {
  const root = document.getElementById("recommendationList");
  const empty = document.getElementById("recommendationEmpty");
  if (!root || !empty) return;

  const profile = buildRecommendationProfile(completed, fullList);
  if (!profile.favoriteGenres.length && !profile.highestRatedAnime) {
    empty.textContent = "Start watching anime to unlock recommendations.";
    if (root.dataset.renderKey === "__empty__") return;
    root.innerHTML = "";
    empty.classList.remove("hidden");
    root.dataset.renderKey = "__empty__";
    return;
  }

  const consumedById = new Set(profile.consumed.map((anime) => Number(anime.id) || 0));
  const consumedTitleKeys = new Set(profile.consumed.map((anime) => normalizeAnimeTitleKey(anime.title)).filter(Boolean));
  const carouselTitleKeys = new Set(heroCarouselState.items.map((item) => normalizeAnimeTitleKey(item.title)).filter(Boolean));
  const seenTitleKeys = new Set();

  const picks = ANIME_DB
    .filter((anime) => !consumedById.has(Number(anime.id) || 0))
    .filter((anime) => {
      const key = normalizeAnimeTitleKey(anime.title);
      if (!key) return false;
      if (consumedTitleKeys.has(key) || carouselTitleKeys.has(key) || seenTitleKeys.has(key)) return false;
      seenTitleKeys.add(key);
      return true;
    })
    .map((anime) => ({
      anime,
      score: scoreRecommendationCandidate(anime, profile)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (Number(b.anime.rating) !== Number(a.anime.rating)) return Number(b.anime.rating) - Number(a.anime.rating);
      return Number(b.anime.year) - Number(a.anime.year);
    })
    .slice(0, 10)
    .map((entry) => entry.anime);

  if (!picks.length) {
    if (root.dataset.renderKey === "__none-left__") return;
    root.innerHTML = "";
    empty.textContent = "No recommendations left from local dataset.";
    empty.classList.remove("hidden");
    root.dataset.renderKey = "__none-left__";
    return;
  }

  const renderKey = picks.map((anime) => anime.id).join("|");
  if (root.dataset.renderKey === renderKey) {
    empty.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  root.dataset.renderKey = renderKey;
  root.innerHTML = picks
    .map((anime) => {
      const imageSrc = resolveRecommendationImageUrl(anime.image);
      const imageMarkup = imageSrc
        ? `<img loading="lazy" src="${imageSrc}" alt="${anime.title} cover">`
        : `<div class="recommend-item-placeholder" aria-hidden="true"><i class="fa-regular fa-image"></i></div>`;
      return `
      <article class="recommend-item">
        ${imageMarkup}
        <div>
          <h4>${anime.title}</h4>
          <p class="anime-meta">${getRecommendationMetaText(anime)}</p>
          <button class="btn btn-primary btn-sm js-add-plan" data-id="${anime.id}">Add to Plan</button>
        </div>
      </article>`;
    })
    .join("");
}

function loadAchievementState() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveAchievementState(state) {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    // Ignore localStorage write errors.
  }
}

function countCompletedMovies(completed) {
  return completed.filter((anime) => {
    const type = String(anime.type || "").toLowerCase().trim();
    if (type === "movie") return true;
    return /\bmovie\b/i.test(String(anime.title || ""));
  }).length;
}

function countCompletedShonen(completed) {
  return completed.filter((anime) => (anime.genres || []).some((genre) => String(genre).toLowerCase() === "shounen")).length;
}

function countUniqueCompletedGenres(completed) {
  const unique = new Set();
  completed.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      const normalized = String(genre || "").trim().toLowerCase();
      if (normalized) unique.add(normalized);
    });
  });
  return unique.size;
}

function getAchievementProgressByKey(completed) {
  return {
    movie_collector: countCompletedMovies(completed),
    shonen_addict: countCompletedShonen(completed),
    genre_master: countUniqueCompletedGenres(completed),
    completion_legend: completed.length
  };
}

function evaluateAchievements(previousState, progressByKey) {
  const prev = previousState || {};
  const progress = progressByKey || {};
  const next = {};

  ACHIEVEMENT_DEFINITIONS.forEach((achievement) => {
    const currentValue = Number(progress[achievement.key] || 0);
    next[achievement.key] = Boolean(prev[achievement.key]) || currentValue >= Number(achievement.target || 1);
  });

  const justUnlocked = Object.keys(next).filter((key) => next[key] && !prev[key]);
  return { next, justUnlocked };
}

function syncAchievementSnapshot(completed) {
  const previousState = loadAchievementState();
  const progressByKey = getAchievementProgressByKey(completed);
  const { next, justUnlocked } = evaluateAchievements(previousState, progressByKey);
  if (JSON.stringify(previousState) !== JSON.stringify(next)) {
    saveAchievementState(next);
  }
  return {
    state: next,
    justUnlocked,
    progressByKey
  };
}

function buildAchievementSnapshotRenderKey(snapshot) {
  const stateMap = snapshot?.state || {};
  const progressByKey = snapshot?.progressByKey || {};
  const freshSet = new Set(snapshot?.justUnlocked || []);
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    const key = achievement.key;
    const unlocked = stateMap[key] ? 1 : 0;
    const progress = Number(progressByKey[key] || 0);
    const fresh = freshSet.has(key) ? 1 : 0;
    return `${key}:${unlocked}:${progress}:${fresh}`;
  }).join("|");
}

function renderHomeAchievements(snapshot) {
  const grid = document.getElementById("homeAchievementsGrid");
  if (!grid || !snapshot) return;
  const renderKey = buildAchievementSnapshotRenderKey(snapshot);
  if (grid.dataset.renderKey === renderKey) return;
  const next = snapshot.state || {};
  const justUnlocked = snapshot.justUnlocked || [];

  grid.innerHTML = ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    const unlocked = Boolean(next[achievement.key]);
    const stateClass = unlocked ? "is-unlocked" : "is-locked";
    const freshClass = unlocked && justUnlocked.includes(achievement.key) ? " achievement-badge--fresh" : "";
    const tooltip = unlocked ? "Unlocked!" : "Locked - keep watching to unlock";
    return `
      <article class="achievement-badge ${stateClass}${freshClass}" title="${tooltip}" aria-label="${achievement.title}: ${tooltip}">
        <i class="${achievement.iconClass}" aria-hidden="true"></i>
        <p class="achievement-badge-title">${achievement.title}</p>
      </article>
    `;
  }).join("");
  grid.dataset.renderKey = renderKey;
}

function buildAnimeProgressMarkup(anime) {
  const total = Math.max(0, Number(anime.episodes) || 0);
  const watched = Math.max(0, Number(anime.watchedEpisodes) || 0);
  const safeWatched = total > 0 ? Math.min(watched, total) : watched;
  const pct = total > 0 ? Math.round((safeWatched / total) * 100) : watched > 0 ? 100 : 0;
  const progressLabel = total > 0 ? `${safeWatched}/${total} episodes (${pct}%)` : `${safeWatched} watched`;
  return `
    <div class="watchlist-progress-row">
      <p class="watchlist-progress-meta">Progress: ${progressLabel}</p>
      <div class="watchlist-progress-track" aria-hidden="true">
        <div class="watchlist-progress-fill" style="width:${pct}%;"></div>
      </div>
    </div>
  `;
}

function renderListPanel(list, status, gridId, emptyId, emptyText) {
  const grid = document.getElementById(gridId);
  const empty = document.getElementById(emptyId);
  if (!grid || !empty) return;

  const filtered = list.filter((anime) => anime.status === status);
  const baseKey = filtered.length ? stableAnimeListKey(filtered) : "__empty__";
  const renderKey = status === "plan" ? `${baseKey}|pick:${Number(watchlistRandomPickedId) || 0}` : baseKey;
  if (!filtered.length) {
    if (grid.dataset.renderKey === renderKey) return;
    grid.innerHTML = "";
    empty.textContent = emptyText;
    empty.classList.remove("hidden");
    grid.dataset.renderKey = renderKey;
    return;
  }

  if (grid.dataset.renderKey === renderKey) {
    empty.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  grid.dataset.renderKey = renderKey;
  grid.innerHTML = filtered
    .map((anime) => {
      const isWatchlistRandom = status === "plan" && Number(anime.id) === Number(watchlistRandomPickedId);
      return `
      <article class="result-card glass js-library-open${isWatchlistRandom ? " watchlist-random-picked" : ""}" data-id="${anime.id}" tabindex="0" role="button" aria-label="Open details for ${anime.title}">
        <div class="result-image-wrap">
          <img src="${anime.image}" alt="${anime.title}">
        </div>
        <h3 class="anime-title">${anime.title}</h3>
        <p class="result-desc">${(anime.genres || []).slice(0, 3).join(", ") || "Unknown genre"}</p>
        <p class="result-desc">${anime.year || "Year unknown"} - ${anime.studio || "Studio unknown"}</p>
        ${buildAnimeProgressMarkup(anime)}
      </article>
    `;
    })
    .join("");
}

function renderWatchlistMeta(planList) {
  const countBadge = document.getElementById("watchlistCountBadge");
  const result = document.getElementById("watchlistRandomPickResult");
  if (countBadge) {
    countBadge.textContent = String(planList.length);
  }
  if (!result) return;

  const picked = planList.find((anime) => Number(anime.id) === Number(watchlistRandomPickedId));
  if (!picked) {
    watchlistRandomPickedId = null;
    result.classList.add("hidden");
    result.textContent = "";
    return;
  }
  result.textContent = `Random pick: ${picked.title}`;
  result.classList.remove("hidden");
}

function normalizeGenreKey(genre) {
  return String(genre || "").trim().toLowerCase();
}

function collectGenreCounts(list) {
  const counts = {};
  list.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      const key = normalizeGenreKey(genre);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return counts;
}

function mostFrequentGenre(list) {
  const counts = collectGenreCounts(list);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function highestRatedGenre(list) {
  const stats = {};
  list
    .filter((anime) => Number.isFinite(Number(anime.rating)) && Number(anime.rating) > 0)
    .forEach((anime) => {
      const rating = Number(anime.rating) || 0;
      (anime.genres || []).forEach((genre) => {
        const key = normalizeGenreKey(genre);
        if (!key) return;
        if (!stats[key]) stats[key] = { sum: 0, count: 0 };
        stats[key].sum += rating;
        stats[key].count += 1;
      });
    });

  let bestGenre = "";
  let bestAverage = 0;
  Object.entries(stats).forEach(([genre, data]) => {
    const average = data.count > 0 ? data.sum / data.count : 0;
    if (average > bestAverage) {
      bestAverage = average;
      bestGenre = genre;
    }
  });
  return bestGenre;
}

function sessionRecommendationJitter(scope, anime) {
  const basis = `${scope}|${recommendationSessionSalt}|${anime.id}|${normalizeAnimeTitleKey(anime.title)}`;
  const hue = hashStringToHue(basis);
  return ((hue / 359) - 0.5) * 4;
}

function buildPersonalizedRecommendationProfile(sourceList, fullList) {
  const watchedHistory = fullList.filter((anime) => {
    const status = String(anime.status || "").toLowerCase();
    return status === "watching" || status === "completed";
  });
  const sourceCounts = collectGenreCounts(sourceList);
  const sourceGenres = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([genre]) => genre);

  return {
    sourceGenreSet: new Set(sourceGenres),
    mostWatchedGenre: mostFrequentGenre(watchedHistory) || sourceGenres[0] || "",
    highestRatedGenre: highestRatedGenre(watchedHistory.length ? watchedHistory : sourceList)
  };
}

function scorePersonalizedRecommendation(anime, profile, scope) {
  const genres = (anime.genres || []).map(normalizeGenreKey).filter(Boolean);
  if (!genres.length) return -999;

  const sharedTags = genres.filter((genre) => profile.sourceGenreSet.has(genre)).length;
  let score = sharedTags * 22;

  if (profile.mostWatchedGenre && genres.includes(profile.mostWatchedGenre)) score += 44;
  if (profile.highestRatedGenre && genres.includes(profile.highestRatedGenre)) score += 36;

  const rating = Number(anime.rating) || 0;
  if (rating > 0) score += rating * 2.4;
  if (String(anime.status || "").toLowerCase() === "airing") score += 5;
  if (Number(anime.year) >= new Date().getFullYear() - 2) score += 3;

  // Keep picks fresh between sessions while still ranking by preference.
  score += sessionRecommendationJitter(scope, anime);
  return score;
}

function buildPersonalizedRecommendationCacheKey(scope, sourceList, fullList) {
  return `${scope}|source:${stableAnimeListKey(sourceList)}|full:${stableAnimeListKey(fullList)}`;
}

function pickPersonalizedRecommendations(scope, sourceList, fullList) {
  if (!sourceList.length) return [];

  const cacheMap = recommendationCache[scope] || recommendationCache.watchlist;
  const cacheKey = buildPersonalizedRecommendationCacheKey(scope, sourceList, fullList);
  const cached = readTimedCache(cacheMap, cacheKey, PERSONALIZED_RECOMMENDATION_CACHE_TTL_MS);
  if (cached.hit) return cached.value;

  const profile = buildPersonalizedRecommendationProfile(sourceList, fullList);
  const activeStatuses = new Set(["plan", "watching", "completed"]);
  const excludedIds = new Set(
    fullList
      .filter((anime) => activeStatuses.has(String(anime.status || "").toLowerCase()))
      .map((anime) => Number(anime.id) || 0)
  );
  const excludedTitleKeys = new Set(
    fullList
      .filter((anime) => activeStatuses.has(String(anime.status || "").toLowerCase()))
      .map((anime) => normalizeAnimeTitleKey(anime.title))
      .filter(Boolean)
  );
  const seenTitleKeys = new Set();

  const pool = ANIME_DB.filter((anime) => {
    const animeId = Number(anime.id) || 0;
    const titleKey = normalizeAnimeTitleKey(anime.title);
    if (!titleKey) return false;
    if (excludedIds.has(animeId)) return false;
    if (excludedTitleKeys.has(titleKey)) return false;
    if (seenTitleKeys.has(titleKey)) return false;
    seenTitleKeys.add(titleKey);
    return true;
  });

  if (!pool.length) return writeTimedCache(cacheMap, cacheKey, []);

  const scored = pool
    .map((anime) => ({
      anime,
      score: scorePersonalizedRecommendation(anime, profile, scope)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (Number(b.anime.rating || 0) !== Number(a.anime.rating || 0)) return Number(b.anime.rating || 0) - Number(a.anime.rating || 0);
      return Number(b.anime.year || 0) - Number(a.anime.year || 0);
    });

  const selected = [];
  const selectedIds = new Set();
  scored.forEach((entry) => {
    if (selected.length >= PERSONALIZED_RECOMMENDATION_LIMIT) return;
    if (entry.score <= 0) return;
    selected.push(entry.anime);
    selectedIds.add(Number(entry.anime.id) || 0);
  });

  if (selected.length < PERSONALIZED_RECOMMENDATION_LIMIT) {
    scored.forEach((entry) => {
      if (selected.length >= PERSONALIZED_RECOMMENDATION_LIMIT) return;
      const animeId = Number(entry.anime.id) || 0;
      if (selectedIds.has(animeId)) return;
      selected.push(entry.anime);
      selectedIds.add(animeId);
    });
  }

  return writeTimedCache(cacheMap, cacheKey, selected.slice(0, PERSONALIZED_RECOMMENDATION_LIMIT));
}

function renderPersonalizedRecommendationGrid(root, empty, picks, emptyText, emptyKey, renderPrefix) {
  if (!root || !empty) return;
  if (!picks.length) {
    root.innerHTML = "";
    empty.textContent = emptyText;
    empty.classList.remove("hidden");
    root.dataset.renderKey = emptyKey;
    return;
  }

  const renderKey = `${renderPrefix}|${picks.map((anime) => anime.id).join("|")}`;
  if (root.dataset.renderKey === renderKey) {
    empty.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  root.dataset.renderKey = renderKey;
  root.innerHTML = picks
    .map(
      (anime) => `
      <article class="recommend-item recommend-item-compact" aria-label="${anime.title}">
        <img src="${anime.image}" alt="${anime.title}">
        <h4>${anime.title}</h4>
        <p class="anime-meta">${(anime.genres || []).slice(0, 2).join(", ") || "Unknown genre"}</p>
      </article>
    `
    )
    .join("");
}

function renderWatchlistRecommendations(planList, fullList) {
  const root = document.getElementById("watchlistRecommendList");
  const empty = document.getElementById("watchlistRecommendEmpty");
  if (!root || !empty) return;

  if (!planList.length) {
    renderPersonalizedRecommendationGrid(
      root,
      empty,
      [],
      "Add anime to your watchlist to unlock picks.",
      "__watchlist_empty__",
      "watchlist"
    );
    return;
  }

  const picks = pickPersonalizedRecommendations("watchlist", planList, fullList);
  renderPersonalizedRecommendationGrid(
    root,
    empty,
    picks,
    "No additional picks available right now.",
    "__watchlist_none__",
    "watchlist"
  );
}

function pickSomethingForWatchlist() {
  const planList = dashboardSnapshot.filter((anime) => anime.status === "plan");
  if (!planList.length) {
    showToast("Watchlist is empty.");
    return;
  }

  const picked = planList[Math.floor(Math.random() * planList.length)];
  watchlistRandomPickedId = picked.id;
  SectionModules.Watchlist.render(dashboardSnapshot);
  showToast(`Pick: ${picked.title}`);

  const card = document.querySelector(`#watchlistGrid .js-library-open[data-id="${picked.id}"]`);
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function completedSortTimestamp(anime) {
  const updated = new Date(anime?.updatedAt || 0).getTime();
  if (Number.isFinite(updated) && updated > 0) return updated;
  const added = new Date(anime?.addedAt || 0).getTime();
  if (Number.isFinite(added) && added > 0) return added;
  return 0;
}

function getCompletedSortComparator() {
  if (completedSortMode === "rating") {
    return (a, b) => {
      const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return completedSortTimestamp(b) - completedSortTimestamp(a);
    };
  }
  if (completedSortMode === "episodes") {
    return (a, b) => {
      const episodesDiff = Number(b.episodes || 0) - Number(a.episodes || 0);
      if (episodesDiff !== 0) return episodesDiff;
      return completedSortTimestamp(b) - completedSortTimestamp(a);
    };
  }
  return (a, b) => completedSortTimestamp(b) - completedSortTimestamp(a);
}

function estimateEpisodeMinutes(anime) {
  const normalizedType = String(anime?.type || "").toLowerCase();
  if (normalizedType === "movie") return 100;
  return 24;
}

function calculateTotalHoursWatched(completedList) {
  const totalMinutes = completedList.reduce((sum, anime) => {
    const episodes = Math.max(0, Number(anime.episodes) || 0);
    return sum + episodes * estimateEpisodeMinutes(anime);
  }, 0);
  return totalMinutes / 60;
}

function renderCompletedHours(completedList) {
  const el = document.getElementById("completedTotalHours");
  if (!el) return;
  const hours = calculateTotalHoursWatched(completedList);
  el.textContent = `${hours.toFixed(1)}h`;
}

function renderCompletedGenreBreakdownChart(completedList) {
  const wrap = document.getElementById("completedGenreChartWrap");
  const empty = document.getElementById("completedGenreEmptyText");
  const canvas = document.getElementById("completedGenreChart");
  if (!wrap || !empty || !canvas) return;

  const genreCount = {};
  completedList.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      const key = String(genre || "").trim();
      if (!key) return;
      genreCount[key] = (genreCount[key] || 0) + 1;
    });
  });

  const labels = Object.keys(genreCount);
  if (!labels.length) {
    if (completedGenreChartInstance) {
      completedGenreChartInstance.destroy();
      completedGenreChartInstance = null;
    }
    wrap.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  const values = labels.map((label) => genreCount[label]);
  wrap.classList.remove("hidden");
  empty.classList.add("hidden");

  if (completedGenreChartInstance) {
    completedGenreChartInstance.destroy();
    completedGenreChartInstance = null;
  }

  completedGenreChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ["#5b8dff", "#6fc7ff", "#39d98a", "#9cc9ff", "#8ca9ff", "#7fd5b0", "#7f8fff", "#5ca4ff"],
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    },
    options: {
      cutout: "64%",
      maintainAspectRatio: false,
      animation: { duration: 700, easing: "easeOutQuart" },
      plugins: {
        legend: {
          labels: {
            color: "#dbe6ff",
            usePointStyle: true,
            boxWidth: 9,
            font: { family: "Inter" }
          }
        }
      }
    }
  });
}

function renderCompletedRecommendations(completedList, fullList) {
  const root = document.getElementById("completedRecommendList");
  const empty = document.getElementById("completedRecommendEmpty");
  if (!root || !empty) return;

  if (!completedList.length) {
    renderPersonalizedRecommendationGrid(
      root,
      empty,
      [],
      "Complete anime to unlock recommendations.",
      "__completed_empty__",
      "completed"
    );
    return;
  }

  const picks = pickPersonalizedRecommendations("completed", completedList, fullList);
  renderPersonalizedRecommendationGrid(
    root,
    empty,
    picks,
    "No additional recommendations available.",
    "__completed_none__",
    "completed"
  );
}

function apiToEmbeddedAnime(item) {
  return {
    id: 2000000 + Number(item.mal_id || 0),
    malId: Number(item.mal_id || 0),
    title: item.title_english || item.title || "Untitled Anime",
    genres: Array.isArray(item.genres) ? item.genres.map((g) => g.name).filter(Boolean) : [],
    type: item.type || "Unknown",
    episodes: Number(item.episodes) || 0,
    status: item.status || "Unknown",
    rating: item.score ?? null,
    year: item.year ?? null,
    studio: Array.isArray(item.studios) ? item.studios.map((s) => s.name).join(", ") : "Unknown",
    image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "",
    dubAvailable: null,
    watchedEpisodes: 0
  };
}

async function fetchEmbeddedSearchPage(query, page) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const cacheKey = `${normalizedQuery}::${Number(page) || 1}::${EMBEDDED_RESULTS_PER_PAGE}`;
  const cached = readTimedCache(apiCache.embeddedSearchPages, cacheKey, API_CACHE_TTL_MS.embeddedSearch);
  if (cached.hit) return cached.value;

  const q = encodeURIComponent(query.trim());
  const response = await fetch(
    `https://api.jikan.moe/v4/anime?q=${q}&limit=${EMBEDDED_RESULTS_PER_PAGE}&page=${page}&order_by=members&sort=desc`
  );
  if (!response.ok) throw new Error("Search API failed");
  const json = await response.json();
  const items = Array.isArray(json?.data) ? json.data : [];
  return writeTimedCache(apiCache.embeddedSearchPages, cacheKey, {
    results: items.map(apiToEmbeddedAnime).filter((a) => a.id > 2000000),
    hasNext: Boolean(json?.pagination?.has_next_page),
    currentPage: Number(json?.pagination?.current_page) || Number(page) || 1,
    totalPages: Number(json?.pagination?.last_visible_page) || 1,
    totalItems: Number(json?.pagination?.items?.total) || items.length
  });
}

function renderEmbeddedSearchResults() {
  const root = document.getElementById("embeddedSearchResults");
  const empty = document.getElementById("embeddedSearchEmpty");
  const paginationWrap = document.getElementById("embeddedPaginationWrap");
  const paginationInfo = document.getElementById("embeddedPaginationInfo");
  if (!root || !empty || !paginationWrap || !paginationInfo) return;

  const renderEmbeddedPagination = () => {
    const prevBtn = document.getElementById("embeddedPaginationPrev");
    const nextBtn = document.getElementById("embeddedPaginationNext");
    const pagesWrap = document.getElementById("embeddedPaginationPages");
    if (!prevBtn || !nextBtn || !pagesWrap) return;

    prevBtn.disabled = embeddedSearchPage <= 1;
    nextBtn.disabled = embeddedSearchPage >= embeddedSearchTotalPages;

    const buttons = [];
    const pageSet = new Set([1, embeddedSearchTotalPages, embeddedSearchPage - 1, embeddedSearchPage, embeddedSearchPage + 1]);
    Array.from(pageSet)
      .filter((page) => page >= 1 && page <= embeddedSearchTotalPages)
      .sort((a, b) => a - b)
      .forEach((page) => {
        buttons.push(
          `<button type="button" class="search-pagination-page${page === embeddedSearchPage ? " is-active" : ""}" data-page="${page}" aria-label="Go to page ${page}">${page}</button>`
        );
      });

    pagesWrap.innerHTML = buttons.join("");
    paginationInfo.textContent = `Page ${embeddedSearchPage} of ${embeddedSearchTotalPages} (${embeddedSearchTotalResults} results)`;
    paginationInfo.classList.remove("hidden");
    paginationWrap.classList.toggle("hidden", embeddedSearchTotalPages <= 1);
  };

  if (!embeddedSearchResults.length) {
    const emptyKey = `__empty__:${embeddedSearchQuery}:${embeddedSearchPage}`;
    if (root.dataset.renderKey !== emptyKey) {
      root.innerHTML = "";
      root.dataset.renderKey = emptyKey;
    }
    empty.textContent = embeddedSearchQuery ? "No matching anime found." : "Start typing to search anime.";
    empty.classList.remove("hidden");
    paginationWrap.classList.add("hidden");
    paginationInfo.classList.add("hidden");
    return;
  }

  const renderKey = `${embeddedSearchQuery}|${embeddedSearchPage}|${embeddedSearchTotalPages}|${embeddedSearchResults.map((anime) => anime.id).join(",")}`;
  if (root.dataset.renderKey === renderKey) {
    empty.classList.add("hidden");
    renderEmbeddedPagination();
    return;
  }

  empty.classList.add("hidden");
  root.dataset.renderKey = renderKey;
  root.innerHTML = embeddedSearchResults
    .map(
      (anime) => `
      <article class="result-card glass js-embedded-open" data-id="${anime.id}" tabindex="0" role="button" aria-label="Open details for ${anime.title}">
        <div class="result-image-wrap">
          <img src="${anime.image}" alt="${anime.title}">
        </div>
        <h3 class="anime-title">${anime.title}</h3>
        <p class="result-desc">${anime.genres.slice(0, 3).join(", ")}</p>
        <div class="result-actions">
          <button class="btn btn-secondary btn-sm js-embedded-add" data-id="${anime.id}" data-status="plan">Plan</button>
          <button class="btn btn-secondary btn-sm js-embedded-add" data-id="${anime.id}" data-status="watching">Watching</button>
          <button class="btn btn-primary btn-sm js-embedded-add" data-id="${anime.id}" data-status="completed">Completed</button>
        </div>
      </article>
    `
    )
    .join("");

  renderEmbeddedPagination();
}

function setEmbeddedClientResults(allResults, page = 1) {
  const list = Array.isArray(allResults) ? allResults : [];
  const totalPages = Math.max(1, Math.ceil(list.length / EMBEDDED_RESULTS_PER_PAGE));
  const nextPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (nextPage - 1) * EMBEDDED_RESULTS_PER_PAGE;
  const end = start + EMBEDDED_RESULTS_PER_PAGE;

  embeddedSearchMode = "client";
  embeddedClientResults = list;
  embeddedSearchPage = nextPage;
  embeddedSearchTotalPages = totalPages;
  embeddedSearchTotalResults = list.length;
  embeddedSearchResults = list.slice(start, end);
  embeddedHasNextPage = embeddedSearchPage < embeddedSearchTotalPages;
}

function goToEmbeddedSearchPage(page) {
  const targetPage = Number(page) || 1;
  if (targetPage < 1 || targetPage > embeddedSearchTotalPages) return;
  if (embeddedSearchMode === "client") {
    setEmbeddedClientResults(embeddedClientResults, targetPage);
    SectionModules.Search.renderResults();
    return;
  }
  runEmbeddedSearch(embeddedSearchQuery, targetPage);
}

async function runEmbeddedSearch(query, page) {
  const paginationWrap = document.getElementById("embeddedPaginationWrap");
  const prevBtn = document.getElementById("embeddedPaginationPrev");
  const nextBtn = document.getElementById("embeddedPaginationNext");
  const requestId = ++requestState.embeddedSearchId;
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  if (paginationWrap) paginationWrap.classList.add("hidden");
  try {
    const { results, hasNext, currentPage, totalPages, totalItems } = await fetchEmbeddedSearchPage(query, page);
    if (requestId !== requestState.embeddedSearchId) return;
    embeddedSearchMode = "query";
    embeddedClientResults = [];
    embeddedSearchQuery = String(query || "").trim();
    embeddedHasNextPage = hasNext;
    embeddedSearchPage = Number(currentPage) || Number(page) || 1;
    embeddedSearchTotalPages = Math.max(1, Number(totalPages) || 1);
    embeddedSearchTotalResults = Math.max(results.length, Number(totalItems) || 0);
    embeddedSearchResults = results;
  } catch (_) {
    if (requestId !== requestState.embeddedSearchId) return;
    const local = ANIME_DB.filter((anime) => (anime.title || "").toLowerCase().includes(String(query || "").toLowerCase()));
    setEmbeddedClientResults(local, page);
    showToast("Live API unavailable. Showing local results.");
  } finally {
    if (requestId !== requestState.embeddedSearchId) return;
    SectionModules.Search.renderResults();
  }
}

function setQuickSuggestionsVisible(isVisible) {
  const input = document.getElementById("homeQuickSearchInput");
  const box = document.getElementById("homeQuickSearchSuggestions");
  if (!input || !box) return;
  const shouldShow = Boolean(isVisible) && !quickSuggestLockedUntilInput;
  box.classList.toggle("hidden", !shouldShow);
  input.setAttribute("aria-expanded", String(shouldShow));
}

function hideQuickSuggestions() {
  setQuickSuggestionsVisible(false);
}

function clearQuickSuggestionHighlight() {
  const box = document.getElementById("homeQuickSearchSuggestions");
  const input = document.getElementById("homeQuickSearchInput");
  quickSuggestActiveIndex = -1;
  if (input) input.removeAttribute("aria-activedescendant");
  if (!box) return;
  box.querySelectorAll(".quick-search-suggestion.is-active").forEach((node) => {
    node.classList.remove("is-active");
    node.setAttribute("aria-selected", "false");
  });
}

function resetQuickSuggestionScroll() {
  const box = document.getElementById("homeQuickSearchSuggestions");
  if (!box) return;
  box.scrollTop = 0;
}

function clearQuickSuggestionDom() {
  const box = document.getElementById("homeQuickSearchSuggestions");
  if (!box) return;
  box.innerHTML = "";
  resetQuickSuggestionScroll();
}

function resetQuickSuggestionState(options = {}) {
  const lockUntilInput = Boolean(options.lockUntilInput);
  clearTimeout(quickSuggestTimer);
  quickSuggestTimer = null;
  quickSuggestRequestId += 1;
  quickSuggestItems = [];
  clearQuickSuggestionHighlight();
  clearQuickSuggestionDom();
  hideQuickSuggestions();
  quickSuggestLockedUntilInput = lockUntilInput;
}

function getQuickSuggestionButtons() {
  const box = document.getElementById("homeQuickSearchSuggestions");
  if (!box) return [];
  return Array.from(box.querySelectorAll(".quick-search-suggestion"));
}

function applyQuickSuggestionHighlight(index) {
  const buttons = getQuickSuggestionButtons();
  const input = document.getElementById("homeQuickSearchInput");
  if (!buttons.length) {
    clearQuickSuggestionHighlight();
    return;
  }

  const maxIndex = buttons.length - 1;
  const nextIndex = Math.max(0, Math.min(maxIndex, Number(index) || 0));
  quickSuggestActiveIndex = nextIndex;

  buttons.forEach((button, buttonIndex) => {
    const isActive = buttonIndex === nextIndex;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    if (isActive) button.scrollIntoView({ block: "nearest" });
  });

  if (input) {
    input.setAttribute("aria-activedescendant", buttons[nextIndex].id);
  }
}

function moveQuickSuggestionHighlight(delta) {
  const buttons = getQuickSuggestionButtons();
  if (!buttons.length) return;
  const direction = delta >= 0 ? 1 : -1;
  const startIndex = quickSuggestActiveIndex < 0 ? (direction > 0 ? -1 : buttons.length) : quickSuggestActiveIndex;
  const nextIndex = startIndex + direction;
  applyQuickSuggestionHighlight(nextIndex);
}

function renderQuickSuggestionState(message) {
  const box = document.getElementById("homeQuickSearchSuggestions");
  if (!box) return;
  if (quickSuggestLockedUntilInput) return;
  clearQuickSuggestionHighlight();
  resetQuickSuggestionScroll();
  box.innerHTML = `<p class="quick-search-state">${message}</p>`;
  setQuickSuggestionsVisible(true);
}

function renderQuickSuggestions(items) {
  const box = document.getElementById("homeQuickSearchSuggestions");
  if (!box) return;
  if (quickSuggestLockedUntilInput) return;
  clearQuickSuggestionHighlight();
  box.innerHTML = "";
  resetQuickSuggestionScroll();

  if (!items.length) {
    renderQuickSuggestionState("No matching anime found.");
    return;
  }

  items.forEach((anime, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-search-suggestion";
    button.dataset.id = String(anime.id);
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");
    button.setAttribute("aria-label", `Use ${anime.title}`);
    button.id = `quick-search-option-${index}-${anime.id}`;

    const thumb = document.createElement("img");
    thumb.src = anime.image || NEWS_PLACEHOLDER_IMAGE;
    thumb.alt = anime.title;
    thumb.loading = "lazy";

    const title = document.createElement("p");
    title.className = "quick-search-suggestion-title";
    title.textContent = anime.title;

    button.append(thumb, title);
    box.appendChild(button);
  });

  setQuickSuggestionsVisible(true);
}

async function fetchQuickSuggestions(query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const cacheHit = readTimedCache(apiCache.quickSuggestions, normalizedQuery, API_CACHE_TTL_MS.quickSuggestions);
  if (cacheHit.hit) return cacheHit.value;

  const q = encodeURIComponent(query.trim());
  const response = await fetch(`https://api.jikan.moe/v4/anime?q=${q}&limit=5&order_by=members&sort=desc`);
  if (!response.ok) throw new Error("quick-suggestions-failed");
  const json = await response.json();
  const items = Array.isArray(json?.data) ? json.data : [];
  return writeTimedCache(
    apiCache.quickSuggestions,
    normalizedQuery,
    items.map(apiToEmbeddedAnime).filter((anime) => anime.id > 2000000).slice(0, 5)
  );
}

async function executeQuickSearchSubmit(rawQuery, options = {}) {
  const clearInputAfter = options.clearInputAfter !== false;
  const quickInput = document.getElementById("homeQuickSearchInput");
  const query = String(rawQuery || "").trim();

  if (isQuickSearchSubmitting) return;

  resetQuickSuggestionState({ lockUntilInput: true });
  activateTab("searchPanel");
  if (!query) {
    if (quickInput && clearInputAfter) quickInput.value = "";
    return;
  }

  isQuickSearchSubmitting = true;
  try {
    const isSameQuery = embeddedSearchQuery && embeddedSearchQuery.toLowerCase() === query.toLowerCase();
    if (isSameQuery && embeddedSearchMode === "query" && embeddedSearchTotalResults) {
      SectionModules.Search.renderResults();
      showToast(`Found ${embeddedSearchTotalResults} result${embeddedSearchTotalResults === 1 ? "" : "s"}.`);
      return;
    }

    embeddedSearchQuery = query;
    await runEmbeddedSearch(query, 1);
    if (!embeddedSearchTotalResults) {
      showToast("No matching anime found.");
      return;
    }
    showToast(`Found ${embeddedSearchTotalResults} result${embeddedSearchTotalResults === 1 ? "" : "s"}.`);
  } catch (_) {
    showToast("Search is unavailable right now.");
  } finally {
    if (quickInput && clearInputAfter) {
      quickInput.value = "";
    }
    isQuickSearchSubmitting = false;
  }
}

function handleQuickSuggestionSelect(anime) {
  if (!anime) return;
  executeQuickSearchSubmit(anime.title, { clearInputAfter: false });
}

function scheduleQuickSuggestions(query) {
  if (quickSuggestLockedUntilInput) return;

  const normalized = String(query || "").trim();
  clearTimeout(quickSuggestTimer);
  quickSuggestTimer = null;

  if (!normalized) {
    resetQuickSuggestionState({ lockUntilInput: false });
    return;
  }

  if (normalized.length < 2) {
    quickSuggestItems = ANIME_DB.filter((anime) => (anime.title || "").toLowerCase().includes(normalized.toLowerCase())).slice(0, 5);
    renderQuickSuggestions(quickSuggestItems);
    return;
  }

  renderQuickSuggestionState("Loading suggestions...");

  quickSuggestTimer = setTimeout(async () => {
    const requestId = ++quickSuggestRequestId;
    try {
      quickSuggestItems = await fetchQuickSuggestions(normalized);
    } catch (_) {
      const fallback = ANIME_DB.filter((anime) => (anime.title || "").toLowerCase().includes(normalized.toLowerCase())).slice(0, 5);
      quickSuggestItems = fallback.map((anime) => ({ ...anime }));
    }

    const input = document.getElementById("homeQuickSearchInput");
    const liveValue = String(input?.value || "").trim();
    if (requestId !== quickSuggestRequestId) return;
    if (quickSuggestLockedUntilInput) return;
    if (!liveValue || liveValue.toLowerCase() !== normalized.toLowerCase()) return;

    renderQuickSuggestions(quickSuggestItems);
  }, QUICK_SUGGEST_DEBOUNCE_MS);
}

function getPrimarySearchQuery() {
  const quickInput = document.getElementById("homeQuickSearchInput");
  const currentInput = String(quickInput?.value || "").trim();
  if (currentInput) return currentInput;
  return String(embeddedSearchQuery || "").trim();
}

function getSearchFilterValues() {
  return {
    query: getPrimarySearchQuery(),
    genre: document.getElementById("searchFilterGenre")?.value || "",
    language: document.getElementById("searchFilterLanguage")?.value || "",
    season: document.getElementById("searchFilterSeason")?.value || "",
    year: document.getElementById("searchFilterYear")?.value || "",
    status: document.getElementById("searchFilterStatus")?.value || "",
    rating: document.getElementById("searchFilterRating")?.value || "",
    type: document.getElementById("searchFilterType")?.value || ""
  };
}

function mapFilterStatusToApi(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "airing") return "airing";
  if (normalized === "finished") return "complete";
  if (normalized === "upcoming") return "upcoming";
  return "";
}

function mapFilterRatingToApi(value) {
  if (!value) return "";
  if (value.startsWith("G -")) return "g";
  if (value.startsWith("PG -")) return "pg";
  if (value.startsWith("PG-13 -")) return "pg13";
  if (value.startsWith("R -")) return "r17";
  if (value.startsWith("R+ -")) return "r";
  return "";
}

function applyExtraFilterChecks(items, filters) {
  const normalizedQuery = String(filters.query || "").toLowerCase().trim();
  const normalizedType = String(filters.type || "").toLowerCase();
  const normalizedSeason = String(filters.season || "").toLowerCase();
  const normalizedLanguage = String(filters.language || "").toLowerCase();

  return items.filter((item) => {
    if (normalizedQuery) {
      const englishTitle = String(item.title_english || "").toLowerCase();
      const defaultTitle = String(item.title || "").toLowerCase();
      if (!englishTitle.includes(normalizedQuery) && !defaultTitle.includes(normalizedQuery)) return false;
    }

    if (normalizedType && String(item.type || "").toLowerCase() !== normalizedType) return false;

    if (filters.year && Number(item.year) !== Number(filters.year)) return false;
    if (normalizedSeason && String(item.season || "").toLowerCase() !== normalizedSeason) return false;

    if (normalizedLanguage === "english" && !item.title_english) return false;
    if (normalizedLanguage === "japanese" && !item.title_japanese) return false;

    if (filters.status) {
      const statusValue = String(item.status || "").toLowerCase();
      if (String(filters.status).toLowerCase() === "airing" && !statusValue.includes("air")) return false;
      if (String(filters.status).toLowerCase() === "finished" && !statusValue.includes("finished")) return false;
      if (String(filters.status).toLowerCase() === "upcoming" && !statusValue.includes("not yet")) return false;
    }

    return true;
  });
}

function dedupeApiItemsByMalId(items) {
  const map = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const malId = Number(item?.mal_id) || 0;
    if (malId <= 0) return;
    if (!map.has(malId)) {
      map.set(malId, item);
    }
  });
  return Array.from(map.values());
}

async function fetchPagedApiItems(urlBuilder, maxPages = 6) {
  const combined = [];
  let page = 1;
  let hasNext = true;

  while (page <= maxPages && hasNext) {
    const response = await fetch(urlBuilder(page));
    if (!response.ok) {
      if (response.status === 429) {
        await sleep(420);
      }
      throw new Error("filter-fetch-failed");
    }

    const json = await response.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    combined.push(...data);

    if (!json?.pagination) {
      hasNext = false;
    } else {
      hasNext = Boolean(json.pagination.has_next_page);
    }

    page += 1;
    if (hasNext) await sleep(120);
  }

  return dedupeApiItemsByMalId(combined);
}

async function fetchFilterSearchResults(filters) {
  const query = String(filters.query || "").trim();
  const genreId = SEARCH_FILTER_GENRE_ID[filters.genre] || "";
  const status = mapFilterStatusToApi(filters.status);
  const rating = mapFilterRatingToApi(filters.rating);
  const type = String(filters.type || "").toLowerCase();
  const season = String(filters.season || "").toLowerCase();
  const year = Number(filters.year) || 0;
  const cacheKey = JSON.stringify({
    query: query.toLowerCase(),
    genre: String(filters.genre || ""),
    language: String(filters.language || "").toLowerCase(),
    season,
    year,
    status,
    rating,
    type
  });
  const cached = readTimedCache(apiCache.filterSearch, cacheKey, API_CACHE_TTL_MS.filterSearch);
  if (cached.hit) return cached.value;

  let apiItems = [];

  if (season && year > 0) {
    apiItems = await fetchPagedApiItems(
      (page) => `https://api.jikan.moe/v4/seasons/${year}/${season}?limit=24&page=${page}`,
      6
    );
  } else {
    apiItems = await fetchPagedApiItems((page) => {
      const params = new URLSearchParams({
        limit: "24",
        page: String(page),
        order_by: "score",
        sort: "desc"
      });
      if (type) params.set("type", type);
      if (query) params.set("q", query);
      if (status) params.set("status", status);
      if (rating) params.set("rating", rating);
      if (genreId) params.set("genres", String(genreId));
      if (year > 0) {
        params.set("start_date", `${year}-01-01`);
        params.set("end_date", `${year}-12-31`);
      }
      return `https://api.jikan.moe/v4/anime?${params.toString()}`;
    }, 8);
  }

  const refined = applyExtraFilterChecks(apiItems, filters);
  return writeTimedCache(
    apiCache.filterSearch,
    cacheKey,
    refined.map(apiToEmbeddedAnime).filter((anime) => anime.id > 2000000)
  );
}

async function runFilterSearch() {
  const searchBtn = document.getElementById("searchFilterSearchBtn");
  const filters = getSearchFilterValues();
  const query = String(filters.query || "").trim();
  const hasExtraFilters = ["genre", "language", "season", "year", "status", "rating", "type"].some((key) => Boolean(filters[key]));

  if (searchBtn) {
    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";
  }

  try {
    if (query && !hasExtraFilters) {
      embeddedSearchMode = "query";
      embeddedSearchQuery = query;
      await runEmbeddedSearch(query, 1);
      if (!embeddedSearchTotalResults) {
        showToast("No matching anime found.");
      } else {
        showToast(`Found ${embeddedSearchTotalResults} result${embeddedSearchTotalResults === 1 ? "" : "s"}.`);
      }
      return;
    }

    const results = await fetchFilterSearchResults(filters);
    embeddedSearchQuery = query;
    setEmbeddedClientResults(results, 1);
    SectionModules.Search.renderResults();
    if (!results.length) {
      showToast("No anime found for selected filters.");
      return;
    }
    showToast(`Found ${results.length} result${results.length === 1 ? "" : "s"}.`);
  } catch (_) {
    showToast("Unable to search with filters right now.");
  } finally {
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.textContent = "Search";
    }
  }
}

function setEmbeddedModalLoading(isLoading) {
  const modal = document.getElementById("embeddedAnimeModal");
  if (!modal) return;
  modal.classList.toggle("is-loading", Boolean(isLoading));
}

function renderEmbeddedModalSkeleton(anime) {
  const imageEl = document.getElementById("embeddedModalImage");
  const titleEl = document.getElementById("embeddedModalTitle");
  const altEl = document.getElementById("embeddedModalAltTitle");
  const descEl = document.getElementById("embeddedModalDescription");
  const readMoreBtn = document.getElementById("embeddedModalReadMoreBtn");
  const metaGrid = document.getElementById("embeddedModalMetaGrid");
  if (!imageEl || !titleEl || !altEl || !descEl || !readMoreBtn || !metaGrid) return;

  imageEl.src = anime?.image || NEWS_PLACEHOLDER_IMAGE;
  imageEl.alt = anime?.title || "Anime poster";
  titleEl.textContent = anime?.title || "Loading...";
  altEl.classList.add("hidden");
  descEl.innerHTML = '<span class="modal-skeleton-line w-100"></span><span class="modal-skeleton-line w-90"></span><span class="modal-skeleton-line w-70"></span>';
  readMoreBtn.classList.add("hidden");
  metaGrid.innerHTML = Array.from({ length: 8 })
    .map(() => '<div class="meta-item skeleton-meta"><span></span><strong></strong></div>')
    .join("");
}

function mapEmbeddedModalDetails(apiData, anime) {
  if (!apiData) {
    const localSynopsis = anime.synopsis || anime.description || buildLocalAnimeSynopsis(anime);
    return {
      title: anime.title,
      altTitle: "",
      synopsis: localSynopsis,
      type: "TV",
      episodes: anime.episodes || "Unknown",
      duration: "Unknown",
      status: anime.status || "Unknown",
      genres: anime.genres || [],
      studio: anime.studio || "Unknown",
      year: anime.year || "Unknown",
      score: anime.rating || "N/A",
      image: anime.image
    };
  }
  return {
    title: apiData.title_english || apiData.title || anime.title,
    altTitle: apiData.title || "",
    synopsis: apiData.synopsis || "No description available.",
    type: apiData.type || "Unknown",
    episodes: apiData.episodes || anime.episodes || "Unknown",
    duration: apiData.duration || "Unknown",
    status: apiData.status || anime.status || "Unknown",
    genres: (apiData.genres || []).map((g) => g.name),
    studio: (apiData.studios || []).map((s) => s.name).join(", ") || anime.studio || "Unknown",
    year: apiData.year || anime.year || "Unknown",
    score: apiData.score || anime.rating || "N/A",
    image: apiData.images?.jpg?.large_image_url || anime.image
  };
}

function normalizeModalTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildLocalAnimeSynopsis(anime) {
  const genres = (anime.genres || []).slice(0, 3).join(", ");
  const descriptor = genres ? `${genres} anime` : "Anime series";
  const yearPart = anime.year ? ` from ${anime.year}` : "";
  const studioPart = anime.studio && anime.studio !== "Unknown" ? ` by ${anime.studio}` : "";
  const episodes = Number(anime.episodes) || 0;
  const episodesPart = episodes > 0 ? ` with ${episodes} episodes` : "";
  const listStatus = anime.status ? ` Current list status: ${statusLabel(anime.status)}.` : "";
  return `${descriptor}${yearPart}${studioPart}${episodesPart}.${listStatus}`.trim();
}

async function fetchEmbeddedModalApiByTitle(title) {
  const normalized = normalizeModalTitle(title);
  if (!normalized) return null;
  try {
    const q = encodeURIComponent(String(title || "").trim());
    const searchResponse = await fetch(`https://api.jikan.moe/v4/anime?q=${q}&limit=5&order_by=members&sort=desc`);
    if (!searchResponse.ok) throw new Error("title-search-failed");
    const searchJson = await searchResponse.json();
    const items = Array.isArray(searchJson?.data) ? searchJson.data : [];
    if (!items.length) return null;

    const matched =
      items.find((item) => normalizeModalTitle(item.title_english || item.title) === normalized) ||
      items.find((item) => normalizeModalTitle(item.title) === normalized) ||
      items[0];

    if (!matched?.mal_id) return matched;

    const fullResponse = await fetch(`https://api.jikan.moe/v4/anime/${matched.mal_id}/full`);
    if (!fullResponse.ok) return matched;
    const fullJson = await fullResponse.json();
    return fullJson?.data || matched;
  } catch (_) {
    return null;
  }
}

async function fetchEmbeddedModalApiDetails(anime) {
  const malId = Number(anime?.malId) || 0;
  const titleKey = normalizeModalTitle(anime?.title);
  const cacheKey = malId > 0 ? `mal:${malId}` : `title:${titleKey}`;
  const cached = readTimedCache(apiCache.modalDetails, cacheKey, API_CACHE_TTL_MS.modalDetails);
  if (cached.hit) return cached.value;

  if (pendingRequests.modalDetails.has(cacheKey)) {
    return pendingRequests.modalDetails.get(cacheKey);
  }

  const task = (async () => {
    let details = null;
    if (malId > 0) {
      try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/full`);
        if (!response.ok) throw new Error("api");
        const json = await response.json();
        if (json?.data) {
          details = json.data;
        }
      } catch (_) {
        // Continue to title-based fallback.
      }
    }

    if (!details) {
      details = await fetchEmbeddedModalApiByTitle(anime?.title);
    }

    writeTimedCache(apiCache.modalDetails, cacheKey, details);
    if (titleKey) {
      writeTimedCache(apiCache.modalDetails, `title:${titleKey}`, details);
    }
    if (malId > 0) {
      writeTimedCache(apiCache.modalDetails, `mal:${malId}`, details);
    }
    return details;
  })();

  pendingRequests.modalDetails.set(cacheKey, task);
  return task.finally(() => {
    if (pendingRequests.modalDetails.get(cacheKey) === task) {
      pendingRequests.modalDetails.delete(cacheKey);
    }
  });
}

function scheduleModalDetailsPreload(items, limit = 8) {
  if (requestState.modalPreloadTimer) {
    clearTimeout(requestState.modalPreloadTimer);
    requestState.modalPreloadTimer = null;
  }
  const preloadList = (Array.isArray(items) ? items : []).slice(0, limit);
  if (!preloadList.length) return;

  requestState.modalPreloadTimer = setTimeout(() => {
    preloadList.forEach((anime) => {
      fetchEmbeddedModalApiDetails(anime).catch(() => { });
    });
    requestState.modalPreloadTimer = null;
  }, 40);
}

function updateEmbeddedModalDescription() {
  const desc = document.getElementById("embeddedModalDescription");
  const btn = document.getElementById("embeddedModalReadMoreBtn");
  if (!desc || !btn) return;

  const text = embeddedModalFullDescription || "No description available.";
  if (text.length <= 260) {
    desc.textContent = text;
    btn.classList.add("hidden");
    return;
  }
  if (embeddedModalDescExpanded) {
    desc.textContent = text;
    btn.textContent = "Show less";
  } else {
    desc.textContent = `${text.slice(0, 260).trim()}...`;
    btn.textContent = "Read more";
  }
  btn.classList.remove("hidden");
}

function fillEmbeddedModal(details) {
  document.getElementById("embeddedModalImage").src = details.image;
  document.getElementById("embeddedModalImage").alt = details.title;
  document.getElementById("embeddedModalTitle").textContent = details.title;

  const alt = document.getElementById("embeddedModalAltTitle");
  if (details.altTitle && details.altTitle !== details.title) {
    alt.textContent = details.altTitle;
    alt.classList.remove("hidden");
  } else {
    alt.classList.add("hidden");
  }

  embeddedModalFullDescription = details.synopsis || "No description available.";
  embeddedModalDescExpanded = false;
  updateEmbeddedModalDescription();

  const meta = [
    ["Type", details.type],
    ["Episodes", details.episodes],
    ["Duration", details.duration],
    ["Status", details.status],
    ["Genres", (details.genres || []).join(", ") || "Unknown"],
    ["Studio", details.studio],
    ["Year", details.year],
    ["Rating", details.score]
  ];
  document.getElementById("embeddedModalMetaGrid").innerHTML = meta
    .map(([label, value]) => `<div class="meta-item"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function setEmbeddedModalActionState(animeId) {
  const existing = getAnimeList().find((item) => item.id === animeId);
  const status = existing?.status || null;
  const planBtn = document.getElementById("embeddedModalPlanBtn");
  const watchingBtn = document.getElementById("embeddedModalWatchingBtn");
  const completedBtn = document.getElementById("embeddedModalCompletedBtn");
  const removeBtn = document.getElementById("embeddedModalRemoveBtn");
  if (!planBtn || !watchingBtn || !completedBtn || !removeBtn) return;

  const isSearchMode = embeddedModalMode === "search";
  planBtn.classList.toggle("hidden", !isSearchMode);
  watchingBtn.classList.toggle("hidden", !isSearchMode);
  completedBtn.classList.toggle("hidden", !isSearchMode);
  removeBtn.classList.toggle("hidden", isSearchMode);

  if (!isSearchMode) {
    removeBtn.disabled = !existing;
    removeBtn.textContent = "Remove";
    return;
  }

  planBtn.disabled = status === "plan";
  watchingBtn.disabled = status === "watching";
  completedBtn.disabled = status === "completed";
  planBtn.textContent = status === "plan" ? "In Plan" : "Add to Plan";
  watchingBtn.textContent = status === "watching" ? "Watching" : "Mark as Watching";
  completedBtn.textContent = status === "completed" ? "Completed" : "Mark as Completed";
}

async function bindEmbeddedModalActions(anime) {
  const planBtn = document.getElementById("embeddedModalPlanBtn");
  const watchingBtn = document.getElementById("embeddedModalWatchingBtn");
  const completedBtn = document.getElementById("embeddedModalCompletedBtn");
  const removeBtn = document.getElementById("embeddedModalRemoveBtn");
  if (!planBtn || !watchingBtn || !completedBtn || !removeBtn) return;

  planBtn.onclick = null;
  watchingBtn.onclick = null;
  completedBtn.onclick = null;
  removeBtn.onclick = null;

  const setStatus = async (targetStatus) => {
    let btn = targetStatus === "plan" ? planBtn : targetStatus === "watching" ? watchingBtn : completedBtn;
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    const result = await upsertAnime(anime, targetStatus);
    if (result.success) {
      showToast(`Saved "${anime.title}" as ${statusLabel(targetStatus)}.`);
      await refreshDashboard();
      setEmbeddedModalActionState(anime.id);
    } else {
      showToast(result.error || "Failed to save anime.");
    }

    btn.disabled = false;
    btn.innerHTML = originalHtml;
  };

  planBtn.onclick = () => setStatus("plan");
  watchingBtn.onclick = () => setStatus("watching");
  completedBtn.onclick = () => setStatus("completed");

  removeBtn.onclick = async () => {
    if (confirmBeforeDeleteEnabled) {
      const approved = await openConfirmModal({
        title: "Delete anime entry",
        message: `Remove "${anime.title}" from your list?`,
        confirmLabel: "Remove",
        danger: true
      });
      if (!approved) return;
    }

    removeBtn.disabled = true;
    const success = removeAnimeEntry(anime.id);
    if (success) {
      showToast(`Removed "${anime.title}".`);
      closeEmbeddedAnimeModal();
      await refreshDashboard();
    } else {
      showToast("Anime not found.");
    }
    removeBtn.disabled = false;
  };
}

async function openEmbeddedAnimeModal(animeId) {
  const anime = embeddedSearchResults.find((item) => item.id === animeId);
  await openEmbeddedAnimeModalWithAnime(anime, "search");
}

async function openEmbeddedAnimeModalWithAnime(anime, mode = "search") {
  const modal = document.getElementById("embeddedAnimeModal");
  if (!anime || !modal) return;
  const requestId = ++requestState.embeddedModalId;
  embeddedModalMode = mode;
  embeddedModalLastFocus = document.activeElement;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  const closeBtn = document.getElementById("embeddedAnimeModalClose");
  if (closeBtn) closeBtn.focus();

  renderEmbeddedModalSkeleton(anime);
  bindEmbeddedModalActions(anime);
  setEmbeddedModalActionState(anime.id);
  setEmbeddedModalLoading(true);

  const apiData = await fetchEmbeddedModalApiDetails(anime);
  if (requestId !== requestState.embeddedModalId || modal.classList.contains("hidden")) return;
  const details = mapEmbeddedModalDetails(apiData, anime);
  fillEmbeddedModal(details);
  setEmbeddedModalLoading(false);
}

function closeEmbeddedAnimeModal() {
  const modal = document.getElementById("embeddedAnimeModal");
  if (!modal) return;
  requestState.embeddedModalId += 1;
  setEmbeddedModalLoading(false);
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  embeddedModalMode = "search";
  if (embeddedModalLastFocus && typeof embeddedModalLastFocus.focus === "function") {
    embeddedModalLastFocus.focus();
  }
}

function normalizeStatLabel(value, fallback = "No data") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function titleFromKey(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatWatchTimeFromEpisodes(totalEpisodes) {
  const totalMinutes = Math.max(0, Number(totalEpisodes) || 0) * 24;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function buildChartPalette(length) {
  const size = Math.max(0, Number(length) || 0);
  return Array.from({ length: size }, (_, index) => `hsl(${(index * 47) % 360} 78% 62%)`);
}

function getMonthKey(rawDate) {
  const date = new Date(rawDate || "");
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-");
  const date = new Date(Number(year), Math.max(0, Number(month) - 1), 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function findFavoriteGenre(list) {
  const counts = {};
  const labels = {};
  list.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      const key = normalizeGenreKey(genre);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
      labels[key] = labels[key] || String(genre || "").trim();
    });
  });

  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!topEntry) return "";
  const [key] = topEntry;
  return normalizeStatLabel(labels[key], titleFromKey(key));
}

function findFavoriteStudio(list) {
  const counts = {};
  list.forEach((anime) => {
    const studio = String(anime.studio || "").trim();
    if (!studio) return;
    counts[studio] = (counts[studio] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function calculateStatistics(animeList) {
  const list = Array.isArray(animeList) ? animeList : [];
  const completed = list.filter((anime) => anime.status === "completed");
  const watching = list.filter((anime) => anime.status === "watching");
  const plan = list.filter((anime) => anime.status === "plan");
  const watchedHistory = list.filter((anime) => Number(anime.watchedEpisodes) > 0 || anime.status === "completed" || anime.status === "watching");

  const totalEpisodesWatched = list.reduce((sum, anime) => sum + Math.max(0, Number(anime.watchedEpisodes) || 0), 0);
  const ratedEntries = list.filter((anime) => Number.isFinite(Number(anime.rating)) && Number(anime.rating) > 0);
  const averageRating = ratedEntries.length
    ? ratedEntries.reduce((sum, anime) => sum + Number(anime.rating), 0) / ratedEntries.length
    : 0;

  const genreCounts = {};
  watchedHistory.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      const key = normalizeGenreKey(genre);
      if (!key) return;
      genreCounts[key] = (genreCounts[key] || 0) + 1;
    });
  });

  const genreEntries = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  const genreLabels = genreEntries.map(([key]) => titleFromKey(key));
  const genreValues = genreEntries.map(([, value]) => value);

  const episodesByMonthMap = {};
  watchedHistory.forEach((anime) => {
    const monthKey = getMonthKey(anime.updatedAt || anime.addedAt);
    if (!monthKey) return;
    episodesByMonthMap[monthKey] = (episodesByMonthMap[monthKey] || 0) + Math.max(0, Number(anime.watchedEpisodes) || 0);
  });
  const sortedMonthKeys = Object.keys(episodesByMonthMap).sort();

  const completedByMonthMap = {};
  completed.forEach((anime) => {
    const monthKey = getMonthKey(anime.updatedAt || anime.addedAt);
    if (!monthKey) return;
    completedByMonthMap[monthKey] = (completedByMonthMap[monthKey] || 0) + 1;
  });

  const completedGenreCounts = {};
  completed.forEach((anime) => {
    (anime.genres || []).forEach((genre) => {
      const key = normalizeGenreKey(genre);
      if (!key) return;
      completedGenreCounts[key] = (completedGenreCounts[key] || 0) + 1;
    });
  });

  return {
    totalCompleted: completed.length,
    currentlyWatching: watching.length,
    planToWatch: plan.length,
    totalEpisodesWatched,
    estimatedWatchTimeLabel: formatWatchTimeFromEpisodes(totalEpisodesWatched),
    averageRatingLabel: averageRating > 0 ? averageRating.toFixed(1) : "0.0",
    favoriteGenre: normalizeStatLabel(findFavoriteGenre(watchedHistory)),
    favoriteStudio: normalizeStatLabel(findFavoriteStudio(watchedHistory)),
    statusBreakdown: {
      completed: completed.length,
      watching: watching.length,
      plan: plan.length
    },
    genreDistribution: {
      labels: genreLabels,
      values: genreValues
    },
    episodesByMonth: {
      labels: sortedMonthKeys.map(getMonthLabel),
      values: sortedMonthKeys.map((key) => episodesByMonthMap[key] || 0)
    },
    bestCompletedMonthCount: Math.max(0, ...Object.values(completedByMonthMap)),
    maxGenreCompletionCount: Math.max(0, ...Object.values(completedGenreCounts))
  };
}

function calculateAchievements(statistics) {
  const stats = statistics || {};
  const items = INSIGHTS_ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    const progress = Math.max(0, Number(stats[achievement.progressKey] || 0));
    const target = Math.max(1, Number(achievement.target) || 1);
    const unlocked = progress >= target;
    const pct = Math.max(0, Math.min(100, Math.round((Math.min(progress, target) / target) * 100)));
    return {
      ...achievement,
      progress,
      target,
      pct,
      unlocked
    };
  });

  return {
    items,
    unlockedCount: items.filter((item) => item.unlocked).length
  };
}

function calculateProfileStats(animeList) {
  const list = Array.isArray(animeList) ? animeList : [];
  const completed = list.filter((anime) => anime.status === "completed");
  const watching = list.filter((anime) => anime.status === "watching");
  const plan = list.filter((anime) => anime.status === "plan");
  const watchedHistory = list.filter((anime) => Number(anime.watchedEpisodes) > 0 || anime.status === "completed" || anime.status === "watching");
  const totalEpisodesWatched = list.reduce((sum, anime) => sum + Math.max(0, Number(anime.watchedEpisodes) || 0), 0);
  const rated = list.filter((anime) => Number.isFinite(Number(anime.rating)) && Number(anime.rating) > 0);
  const averageRating = rated.length ? rated.reduce((sum, anime) => sum + Number(anime.rating), 0) / rated.length : 0;
  const yearCounts = {};
  watchedHistory.forEach((anime) => {
    const year = Number(anime.year) || 0;
    if (!year) return;
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  const mostWatchedYear = Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  return {
    totalCompleted: completed.length,
    currentlyWatching: watching.length,
    planToWatch: plan.length,
    totalEpisodesWatched,
    averageRating: averageRating > 0 ? averageRating.toFixed(1) : "0.0",
    favoriteGenre: normalizeStatLabel(findFavoriteGenre(watchedHistory)),
    favoriteStudio: normalizeStatLabel(findFavoriteStudio(watchedHistory)),
    mostWatchedYear: mostWatchedYear || "No data",
    totalWatchTime: formatWatchTimeFromEpisodes(totalEpisodesWatched)
  };
}

function renderProfileStats(stats) {
  const root = document.getElementById("profileStatsGrid");
  if (!root) return;
  const items = [
    ["Total Completed", stats.totalCompleted, "fa-solid fa-circle-check"],
    ["Currently Watching", stats.currentlyWatching, "fa-solid fa-tv"],
    ["Plan to Watch", stats.planToWatch, "fa-solid fa-bookmark"],
    ["Total Episodes Watched", stats.totalEpisodesWatched, "fa-solid fa-film"],
    ["Average Rating Given", stats.averageRating, "fa-solid fa-star"]
  ];
  const renderKey = items.map(([label, value, icon]) => `${label}:${value}:${icon}`).join("|");
  if (root.dataset.renderKey === renderKey) return;

  root.innerHTML = items
    .map(([label, value, iconClass], index) => `
      <article class="profile-stat-card" style="--card-index:${index};">
        <div class="profile-stat-top">
          <p class="label">${label}</p>
          <span class="profile-stat-icon"><i class="${iconClass}" aria-hidden="true"></i></span>
        </div>
        <p class="value">${value}</p>
      </article>
    `)
    .join("");
  root.dataset.renderKey = renderKey;
}

function renderProfileTaste(stats) {
  const root = document.getElementById("profileTasteTags");
  if (!root) return;
  const items = [
    ["Favorite Genre", stats.favoriteGenre],
    ["Favorite Studio", stats.favoriteStudio],
    ["Most Watched Year", stats.mostWatchedYear],
    ["Total Watch Time", stats.totalWatchTime]
  ];
  const renderKey = items.map(([label, value]) => `${label}:${value}`).join("|");
  if (root.dataset.renderKey === renderKey) return;

  root.innerHTML = items
    .map(([label, value]) => `
      <div class="profile-taste-pill">
        <span class="pill-label">${label}</span>
        <span class="pill-value">${value}</span>
      </div>
    `)
    .join("");
  root.dataset.renderKey = renderKey;
}

function getProfileAvatarSource(profileData) {
  if (profileData?.avatar) return profileData.avatar;
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <rect width="160" height="160" rx="80" fill="#1b2a4b"/>
        <circle cx="80" cy="62" r="28" fill="#89a0cf"/>
        <path d="M34 136c6-22 24-34 46-34s40 12 46 34" fill="#89a0cf"/>
      </svg>`
    )
  );
}

function setProfileUploadStatus(message, isError = false, isLoading = false) {
  const statusEl = document.getElementById("profileUploadStatus");
  if (!statusEl) return;
  const text = String(message || "").trim();
  statusEl.textContent = text;
  statusEl.classList.toggle("hidden", !text);
  statusEl.classList.toggle("is-error", Boolean(isError));
  statusEl.classList.toggle("is-loading", Boolean(isLoading));
}

function applyProfileHeroBannerHeight(heightValue) {
  const bannerEl = document.getElementById("profileHeroBanner");
  if (!bannerEl) return;
  const height = normalizeBannerHeight(heightValue);
  bannerEl.style.setProperty("--profile-banner-height", `${height}px`);
  bannerEl.classList.add("custom-height");
}

function setProfileBannerHeightControl(heightValue) {
  const height = normalizeBannerHeight(heightValue);
  const preview = document.getElementById("profileBannerPreview");
  const slider = document.getElementById("profileBannerHeightInput");
  const valueEl = document.getElementById("profileBannerHeightValue");
  if (preview) preview.style.setProperty("--profile-banner-preview-height", `${height}px`);
  if (slider && Number(slider.value) !== height) slider.value = String(height);
  if (valueEl) valueEl.textContent = `${height}px`;
  return height;
}

function renderProfileHeroBanner(profileData, animate = false) {
  const bannerEl = document.getElementById("profileHeroBanner");
  if (!bannerEl) return;
  const type = profileData?.bannerType === "video" || profileData?.bannerType === "image" ? profileData.bannerType : "";
  const data = type ? String(profileData?.bannerData || "").trim() : "";
  const key = type && data ? `${type}:${data.slice(0, 32)}:${data.length}` : "";

  if (bannerEl.dataset.bannerKey === key) return;
  bannerEl.dataset.bannerKey = key;
  bannerEl.classList.toggle("has-media", Boolean(key));
  bannerEl.innerHTML = "";

  if (!key) return;
  if (animate) {
    bannerEl.classList.add("is-updating");
    setTimeout(() => bannerEl.classList.remove("is-updating"), 420);
  }

  if (type === "video") {
    const media = document.createElement("video");
    media.className = "profile-hero-banner-media";
    media.src = data;
    media.autoplay = true;
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    media.setAttribute("aria-hidden", "true");
    bannerEl.appendChild(media);
    return;
  }

  const media = document.createElement("img");
  media.className = "profile-hero-banner-media";
  media.src = data;
  media.alt = "";
  media.setAttribute("aria-hidden", "true");
  bannerEl.appendChild(media);
}

function renderProfileAvatarUploadPreview(avatarData) {
  const avatarEl = document.getElementById("profileAvatarUploadPreview");
  if (!avatarEl) return;
  avatarEl.src = getProfileAvatarSource({ avatar: avatarData });
}

function renderProfileBannerUploadPreview(bannerType, bannerData) {
  const preview = document.getElementById("profileBannerPreview");
  if (!preview) return;
  preview.innerHTML = "";

  const type = bannerType === "video" || bannerType === "image" ? bannerType : "";
  const data = type ? String(bannerData || "").trim() : "";
  if (!type || !data) {
    const placeholder = document.createElement("span");
    placeholder.className = "profile-banner-placeholder";
    placeholder.textContent = "No custom banner selected.";
    preview.appendChild(placeholder);
    return;
  }

  if (type === "video") {
    const media = document.createElement("video");
    media.className = "profile-banner-preview-media";
    media.src = data;
    media.autoplay = true;
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    preview.appendChild(media);
    return;
  }
  const media = document.createElement("img");
  media.className = "profile-banner-preview-media";
  media.src = data;
  media.alt = "Banner preview";
  preview.appendChild(media);
}

async function handleProfileAvatarFileSelection(file) {
  if (!file) return;
  setProfileUploadStatus("Processing avatar...", false, true);
  try {
    const dataUrl = await readFileAsDataUrl(file, { maxBytes: PROFILE_IMAGE_MAX_BYTES, allowedPrefix: "image/" });
    profileModalAvatarData = dataUrl;
    renderProfileAvatarUploadPreview(profileModalAvatarData);
    setProfileUploadStatus("");
  } catch (error) {
    const message = error.message || "Unable to process avatar file.";
    setProfileUploadStatus(message, true, false);
    showToast(message);
  }
}

async function handleProfileBannerFileSelection(file, bannerType) {
  if (!file) return;
  const type = bannerType === "video" ? "video" : "image";
  setProfileUploadStatus("Processing banner...", false, true);
  try {
    const dataUrl = await readFileAsDataUrl(file, {
      maxBytes: type === "video" ? PROFILE_VIDEO_MAX_BYTES : PROFILE_IMAGE_MAX_BYTES,
      allowedPrefix: type === "video" ? "video/" : "image/",
      allowedTypes: type === "video" ? PROFILE_BANNER_VIDEO_TYPES : null
    });
    profileModalBannerType = type;
    profileModalBannerData = dataUrl;
    renderProfileBannerUploadPreview(profileModalBannerType, profileModalBannerData);
    setProfileUploadStatus("");
  } catch (error) {
    const message = error.message || "Unable to process banner file.";
    setProfileUploadStatus(message, true, false);
    showToast(message);
  }
}

async function renderProfile(animeList) {
  const profile = await getProfileData();
  const avatar = document.getElementById("profileAvatarPreview");
  const topAvatar = document.querySelector(".top-avatar");
  const nameEl = document.getElementById("profileDisplayName");
  const bioEl = document.getElementById("profileDisplayBio");
  const emailEl = document.getElementById("profileDisplayEmail");

  const avatarSource = getProfileAvatarSource(profile);
  if (avatar) avatar.src = avatarSource;
  if (topAvatar) topAvatar.src = avatarSource;
  if (nameEl) nameEl.textContent = profile.username || "Shadow";
  if (bioEl) bioEl.textContent = profile.bio || "No bio yet. Add your anime personality.";
  if (emailEl) {
    emailEl.textContent = profile.email;
    emailEl.classList.toggle("hidden", !profile.email);
  }
  applyProfileHeroBannerHeight(profile.bannerHeight);
  renderProfileHeroBanner(profile);

  const stats = calculateProfileStats(animeList);
  renderProfileStats(stats);
  renderProfileTaste(stats);
}

async function openProfileEditModal() {
  const modal = document.getElementById("profileEditModal");
  const usernameInput = document.getElementById("profileUsernameInput");
  const emailInput = document.getElementById("profileEmailInput");
  const bioInput = document.getElementById("profileBioInput");
  const avatarFileInput = document.getElementById("profileAvatarFileInput");
  const bannerImageInput = document.getElementById("profileBannerImageInput");
  const bannerVideoInput = document.getElementById("profileBannerVideoInput");
  const bannerHeightInput = document.getElementById("profileBannerHeightInput");
  if (!modal || !usernameInput || !emailInput || !bioInput) return;

  const profile = await getProfileData();
  profileModalAvatarData = String(profile.avatar || "");
  profileModalBannerType = profile.bannerType === "video" || profile.bannerType === "image" ? profile.bannerType : "";
  profileModalBannerData = profileModalBannerType ? String(profile.bannerData || "") : "";
  profileModalBannerHeight = normalizeBannerHeight(profile.bannerHeight);
  usernameInput.value = profile.username;
  emailInput.value = profile.email;
  bioInput.value = profile.bio;
  if (avatarFileInput) avatarFileInput.value = "";
  if (bannerImageInput) bannerImageInput.value = "";
  if (bannerVideoInput) bannerVideoInput.value = "";
  if (bannerHeightInput) bannerHeightInput.value = String(profileModalBannerHeight);
  renderProfileAvatarUploadPreview(profileModalAvatarData);
  setProfileBannerHeightControl(profileModalBannerHeight);
  renderProfileBannerUploadPreview(profileModalBannerType, profileModalBannerData);
  setProfileUploadStatus("");

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  usernameInput.focus();
}

function closeProfileEditModal() {
  const modal = document.getElementById("profileEditModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  setProfileUploadStatus("");
}

async function saveProfileFromModal() {
  const usernameInput = document.getElementById("profileUsernameInput");
  const emailInput = document.getElementById("profileEmailInput");
  const bioInput = document.getElementById("profileBioInput");
  if (!usernameInput || !emailInput || !bioInput) return;

  let saved;
  try {
    saved = await saveProfileData({
      username: usernameInput.value,
      email: emailInput.value,
      bio: bioInput.value,
      avatar: profileModalAvatarData,
      bannerType: profileModalBannerType,
      bannerData: profileModalBannerData,
      bannerHeight: profileModalBannerHeight
    });
  } catch (err) {
    setProfileUploadStatus(err.message || "Unable to save profile data.", true, false);
    showToast("Profile save failed.");
    return;
  }
  const topAvatar = document.querySelector(".top-avatar");
  if (topAvatar) topAvatar.src = getProfileAvatarSource(saved);
  applyProfileHeroBannerHeight(saved.bannerHeight);
  renderProfileHeroBanner(saved, true);
  closeProfileEditModal();
  renderProfile(dashboardSnapshot);
  showToast("Profile updated.");
}

function renderSettings() {
  const defaultSortSelect = document.getElementById("settingsDefaultSortSelect");
  const confirmDeleteToggle = document.getElementById("settingsConfirmDeleteToggle");
  syncThemePreferenceControl();
  if (defaultSortSelect) defaultSortSelect.value = completedSortMode;
  if (confirmDeleteToggle) confirmDeleteToggle.checked = confirmBeforeDeleteEnabled;
}

function renderExportPage() {
  const importBtn = document.getElementById("importDataBtn");
  const restoreBtn = document.getElementById("exportRestoreBackupBtn");
  const importInput = document.getElementById("importDataInput");
  const fileText = document.getElementById("importSelectedFile");
  const importModeSelect = document.getElementById("importModeSelect");
  const lastBackupText = document.getElementById("exportLastBackupText");
  if (importBtn) importBtn.disabled = !pendingImportFile;
  if (restoreBtn) restoreBtn.disabled = !pendingImportFile;
  if (importInput && !pendingImportFile) importInput.value = "";
  if (fileText) fileText.textContent = pendingImportFile ? pendingImportFile.name : "No file selected.";
  if (importModeSelect) updateImportModeVisual(importModeSelect.value);
  if (lastBackupText) lastBackupText.textContent = `Last backup created: ${formatTimestamp(getLastBackupTimestamp())}`;
}

async function resetProgress() {
  const approved = await openConfirmModal({
    title: "Reset watch progress",
    message: "Reset watched episodes for all anime and move entries back to Plan?",
    confirmLabel: "Reset",
    danger: true
  });
  if (!approved) return;

  const list = getAnimeList();
  const now = new Date().toISOString();
  const next = list.map((item) => ({
    ...item,
    watchedEpisodes: 0,
    status: "plan",
    updatedAt: now
  }));
  saveAnimeList(next);
  localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
  window.dispatchEvent(new Event("animeDataUpdated"));
  setStatusMessage("settingsStatusMessage", "Watch progress reset.");
  showToast("Watch progress reset.");
}

async function clearAllData() {
  const approved = await openConfirmModal({
    title: "Clear all data",
    message: "Delete all local anime data and profile data? This cannot be undone.",
    confirmLabel: "Clear",
    danger: true
  });
  if (!approved) return;

  [
    ANIME_STORAGE_KEY,
    PROFILE_DATA_KEY,
    ACHIEVEMENTS_STORAGE_KEY,
    FEATURED_CLIP_STORAGE_KEY,
    NEWS_CACHE_KEY,
    HERO_CAROUSEL_CACHE_KEY
  ].forEach((key) => localStorage.removeItem(key));
  setLastBackupTimestamp("");
  pendingImportFile = null;
  closeProfileEditModal();
  window.dispatchEvent(new Event("animeDataUpdated"));
  setStatusMessage("settingsStatusMessage", "All local data cleared.");
  showToast("All local data cleared.");
}

function dedupeAnimeList(list) {
  const unique = [];
  list.forEach((item, index) => {
    const normalized = normalizeImportedAnime(item, 2000000 + index + 1);
    if (!normalized) return;
    const existingIndex = unique.findIndex(
      (entry) =>
        Number(entry.id) === Number(normalized.id) ||
        normalizeAnimeTitleKey(entry.title) === normalizeAnimeTitleKey(normalized.title)
    );
    if (existingIndex < 0) {
      unique.push(normalized);
      return;
    }
    unique[existingIndex] = { ...unique[existingIndex], ...normalized };
  });
  return unique;
}

async function restoreBackup(file) {
  if (!file) {
    setStatusMessage("exportStatusMessage", "Choose a backup file first.", true);
    showToast("Select a backup file first.");
    return;
  }
  const approved = await openConfirmModal({
    title: "Restore backup",
    message: "Replace current anime data with this backup file?",
    confirmLabel: "Restore",
    danger: true
  });
  if (!approved) return;

  try {
    const text = await file.text();
    const rawList = parseImportFileContent(text);
    const normalized = dedupeAnimeList(rawList);
    if (!normalized.length) {
      setStatusMessage("exportStatusMessage", "Backup file is empty or invalid.", true);
      showToast("Restore failed: invalid JSON.");
      return;
    }
    saveAnimeList(normalized);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    window.dispatchEvent(new Event("animeDataUpdated"));
    pendingImportFile = null;
    renderExportPage();
    setStatusMessage("exportStatusMessage", `Backup restored (${normalized.length} entries).`);
    showToast("Backup restored.");
  } catch (_) {
    setStatusMessage("exportStatusMessage", "Unable to restore backup file.", true);
    showToast("Restore failed.");
  }
}

function exportAsJSON() {
  const animeList = getAnimeList();
  const nowIso = new Date().toISOString();
  const payload = JSON.stringify(animeList, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anime-list-${nowIso.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  setLastBackupTimestamp(nowIso);
  renderExportPage();
  setStatusMessage("exportStatusMessage", `Exported ${animeList.length} entries as JSON.`);
  showToast("Backup exported as JSON.");
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
  return text;
}

function exportAsCSV() {
  const animeList = getAnimeList();
  const nowIso = new Date().toISOString();
  const headers = ["id", "title", "status", "episodes", "watchedEpisodes", "rating", "year", "studio", "genres"];
  const rows = animeList.map((item) => [
    item.id,
    item.title,
    item.status,
    item.episodes,
    item.watchedEpisodes,
    item.rating,
    item.year,
    item.studio,
    Array.isArray(item.genres) ? item.genres.join("|") : ""
  ]);
  const csv = [headers.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anime-list-${nowIso.slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  setLastBackupTimestamp(nowIso);
  renderExportPage();
  setStatusMessage("exportStatusMessage", `Exported ${animeList.length} entries as CSV.`);
  showToast("Spreadsheet exported as CSV.");
}

function mergeAnimeLists(existing, incoming) {
  const next = existing.slice();
  incoming.forEach((anime) => {
    const idx = next.findIndex(
      (item) => Number(item.id) === Number(anime.id) || normalizeAnimeTitleKey(item.title) === normalizeAnimeTitleKey(anime.title)
    );
    if (idx < 0) {
      next.push(anime);
      return;
    }
    next[idx] = { ...next[idx], ...anime };
  });
  return dedupeAnimeList(next);
}

async function importData(file, mode = "merge") {
  if (!file) {
    setStatusMessage("exportStatusMessage", "Choose a file before importing.", true);
    showToast("Select a file before import.");
    return;
  }

  const importMode = mode === "replace" ? "replace" : "merge";
  if (importMode === "replace") {
    const approved = await openConfirmModal({
      title: "Replace data",
      message: "Replace all existing anime data with imported data?",
      confirmLabel: "Replace",
      danger: true
    });
    if (!approved) return;
  }

  try {
    const text = await file.text();
    const rawList = parseImportFileContent(text);
    const incoming = dedupeAnimeList(rawList);
    if (!incoming.length) {
      setStatusMessage("exportStatusMessage", "Invalid or empty import file.", true);
      showToast("Import failed: invalid JSON.");
      return;
    }

    const current = getAnimeList();
    const next = importMode === "replace" ? incoming : mergeAnimeLists(current, incoming);
    saveAnimeList(next);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    window.dispatchEvent(new Event("animeDataUpdated"));
    pendingImportFile = null;
    const importInput = document.getElementById("importDataInput");
    if (importInput) importInput.value = "";
    const importButton = document.getElementById("importDataBtn");
    if (importButton) importButton.disabled = true;
    const restoreButton = document.getElementById("exportRestoreBackupBtn");
    if (restoreButton) restoreButton.disabled = true;
    renderExportPage();
    setStatusMessage("exportStatusMessage", `Imported ${incoming.length} entries (${importMode}).`);
    showToast("Import complete.");
  } catch (_) {
    setStatusMessage("exportStatusMessage", "Import failed. Please use a valid JSON file.", true);
    showToast("Import failed.");
  }
}

async function handleLogout() {
  const approved = await openConfirmModal({
    title: "Logout",
    message: "Are you sure you want to logout?",
    confirmLabel: "Logout",
    danger: true
  });
  if (!approved) return;

  const success = await SupabaseAuth.signOut();
  if (success) {
    closeMobileSidebar();
    showToast("Logged out successfully.");
    window.location.href = "login.html";
  } else {
    showToast("Logout failed. Please try again.");
  }
}

function initializeAppPreferences() {
  completedSortMode = getDefaultSortPreference();
  confirmBeforeDeleteEnabled = getConfirmBeforeDeletePreference();
  applyTheme(getThemePreference());
  syncThemePreferenceControl();
}

function renderInsightsDoughnut(canvasId, emptyId, wrapId, labels, values, colors, instanceKey) {
  const wrap = document.getElementById(wrapId);
  const empty = document.getElementById(emptyId);
  const canvas = document.getElementById(canvasId);
  if (!wrap || !empty || !canvas) return;

  const hasData = Array.isArray(values) && values.some((value) => Number(value) > 0);
  if (!hasData) {
    if (instanceKey === "status" && insightsStatusChartInstance) insightsStatusChartInstance.destroy();
    if (instanceKey === "genre" && insightsGenreChartInstance) insightsGenreChartInstance.destroy();
    if (instanceKey === "status") insightsStatusChartInstance = null;
    if (instanceKey === "genre") insightsGenreChartInstance = null;
    wrap.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  wrap.classList.remove("hidden");
  empty.classList.add("hidden");

  if (instanceKey === "status" && insightsStatusChartInstance) insightsStatusChartInstance.destroy();
  if (instanceKey === "genre" && insightsGenreChartInstance) insightsGenreChartInstance.destroy();

  const chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      cutout: "63%",
      plugins: {
        legend: {
          labels: {
            color: "#dbe6ff",
            usePointStyle: true,
            boxWidth: 8
          }
        }
      }
    }
  });

  if (instanceKey === "status") insightsStatusChartInstance = chart;
  if (instanceKey === "genre") insightsGenreChartInstance = chart;
}

function renderInsightsEpisodesByMonth(statistics) {
  const wrap = document.getElementById("insightEpisodesByMonthWrap");
  const empty = document.getElementById("insightEpisodesByMonthEmpty");
  const canvas = document.getElementById("insightEpisodesByMonthChart");
  if (!wrap || !empty || !canvas) return;

  const labels = statistics?.episodesByMonth?.labels || [];
  const values = statistics?.episodesByMonth?.values || [];
  const hasData = labels.length > 0 && values.some((value) => Number(value) > 0);

  if (!hasData) {
    if (insightsMonthlyChartInstance) insightsMonthlyChartInstance.destroy();
    insightsMonthlyChartInstance = null;
    wrap.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  wrap.classList.remove("hidden");
  empty.classList.add("hidden");
  if (insightsMonthlyChartInstance) insightsMonthlyChartInstance.destroy();

  insightsMonthlyChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Episodes",
          data: values,
          backgroundColor: "rgba(111, 199, 255, 0.7)",
          borderColor: "rgba(111, 199, 255, 1)",
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: "#dbe6ff", font: { family: "Inter" } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#b8c7e7", precision: 0, stepSize: 1 },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function renderStatistics(statistics) {
  const valueById = {
    insightTotalCompleted: statistics.totalCompleted,
    insightCurrentlyWatching: statistics.currentlyWatching,
    insightPlanToWatch: statistics.planToWatch,
    insightTotalEpisodesWatched: statistics.totalEpisodesWatched,
    insightEstimatedWatchTime: statistics.estimatedWatchTimeLabel,
    insightAverageRating: statistics.averageRatingLabel,
    insightFavoriteGenre: statistics.favoriteGenre,
    insightFavoriteStudio: statistics.favoriteStudio
  };

  Object.entries(valueById).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  });

  renderInsightsDoughnut(
    "insightStatusBreakdownChart",
    "insightStatusBreakdownEmpty",
    "insightStatusBreakdownWrap",
    ["Completed", "Watching", "Plan"],
    [statistics.statusBreakdown.completed, statistics.statusBreakdown.watching, statistics.statusBreakdown.plan],
    ["#39d98a", "#6fc7ff", "#8fa8ff"],
    "status"
  );

  renderInsightsDoughnut(
    "insightGenreDistributionChart",
    "insightGenreDistributionEmpty",
    "insightGenreDistributionWrap",
    statistics.genreDistribution.labels,
    statistics.genreDistribution.values,
    buildChartPalette(statistics.genreDistribution.values.length),
    "genre"
  );

  renderInsightsEpisodesByMonth(statistics);
}

function renderAchievements(achievementData) {
  const grid = document.getElementById("insightAchievementsGrid");
  const empty = document.getElementById("insightAchievementsEmpty");
  if (!grid || !empty) return;

  const items = achievementData?.items || [];
  if (!items.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  const renderKey = items.map((item) => `${item.key}:${item.progress}:${item.unlocked ? 1 : 0}`).join("|");
  if (grid.dataset.renderKey === renderKey) return;

  grid.innerHTML = items
    .map((item) => {
      const stateClass = item.unlocked ? "is-unlocked" : "is-locked";
      const stateLabel = item.unlocked ? "Unlocked" : "Locked";
      return `
      <article class="insight-achievement-card ${stateClass}" aria-label="${item.title} ${stateLabel}">
        <div class="insight-achievement-head">
          <span class="insight-achievement-icon"><i class="${item.iconClass}" aria-hidden="true"></i></span>
          <p class="insight-achievement-title">${item.title}</p>
        </div>
        <p class="insight-achievement-desc">${item.description}</p>
        <p class="insight-achievement-progress-text">${Math.min(item.progress, item.target)} / ${item.target}</p>
        <div class="insight-achievement-progress-track" aria-hidden="true">
          <div class="insight-achievement-progress-fill" style="width:${item.pct}%"></div>
        </div>
        <p class="insight-achievement-state">${stateLabel}</p>
      </article>`;
    })
    .join("");
  grid.dataset.renderKey = renderKey;
}

const SectionModules = {
  Dashboard: {
    render(completed, watching, plan, fullList, achievementSnapshot) {
      renderSidebar(completed);
      renderMetrics(completed, plan);
      renderWatchedGenreChart(completed);
      renderFeatured(watching);
      renderHomeFunFact(completed, watching);
      renderRecommendations(completed, fullList);
      renderHomeAchievements(achievementSnapshot);
      renderFeaturedClipCard(completed, watching);
    }
  },
  Search: {
    renderResults() {
      renderEmbeddedSearchResults();
    },
    resetResults() {
      embeddedSearchQuery = "";
      embeddedSearchPage = 1;
      embeddedHasNextPage = false;
      embeddedSearchTotalPages = 1;
      embeddedSearchTotalResults = 0;
      embeddedSearchMode = "query";
      embeddedClientResults = [];
      embeddedSearchResults = [];
      renderEmbeddedSearchResults();
    }
  },
  Watchlist: {
    render(fullList) {
      const planList = fullList.filter((anime) => anime.status === "plan");
      renderListPanel(fullList, "plan", "watchlistGrid", "watchlistEmptyText", "No anime in watchlist.");
      renderWatchlistMeta(planList);
      renderWatchlistRecommendations(planList, fullList);
      scheduleModalDetailsPreload(planList, 10);
    }
  },
  Completed: {
    render(fullList) {
      const completedSorted = fullList
        .filter((anime) => anime.status === "completed")
        .slice()
        .sort(getCompletedSortComparator());
      renderListPanel(completedSorted, "completed", "completedGrid", "completedEmptyText", "No completed anime yet.");
      renderCompletedHours(completedSorted);
      renderCompletedGenreBreakdownChart(completedSorted);
      renderCompletedRecommendations(completedSorted, fullList);
      scheduleModalDetailsPreload(completedSorted, 10);
    }
  },
  Insights: {
    render(fullList) {
      const statistics = calculateStatistics(fullList);
      const achievements = calculateAchievements(statistics);
      renderStatistics(statistics);
      renderAchievements(achievements);
    }
  },
  Account: {
    async render(fullList) {
      await renderProfile(fullList);
      renderSettings();
      renderExportPage();
    }
  }
};

async function refreshDashboard() {
  const localList = getAnimeList().map(normalizeRecord);
  const reconciledList = reconcileAnimeProgress(localList);
  const watching = reconciledList.filter((anime) => anime.status === "watching");
  const planList = reconciledList.filter((anime) => anime.status === "plan");
  const completedList = reconciledList.filter((anime) => anime.status === "completed");
  const achievementSnapshot = syncAchievementSnapshot(completedList);
  dashboardSnapshot = reconciledList;

  SectionModules.Dashboard.render(completedList, watching, planList, reconciledList, achievementSnapshot);
  SectionModules.Insights.render(reconciledList);
  SectionModules.Watchlist.render(reconciledList);
  SectionModules.Completed.render(reconciledList);
  await SectionModules.Account.render(reconciledList);
}

function closeMobileSidebar() {
  document.body.classList.remove("sidebar-open");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (backdrop) backdrop.classList.add("hidden");
}

function openMobileSidebar() {
  if (window.innerWidth > 980) return;
  document.body.classList.add("sidebar-open");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (backdrop) backdrop.classList.remove("hidden");
}

function toggleMobileSidebar() {
  if (window.innerWidth > 980) return;
  const isOpen = document.body.classList.contains("sidebar-open");
  if (isOpen) {
    closeMobileSidebar();
    return;
  }
  openMobileSidebar();
}

function activateTab(targetId) {
  resetQuickSuggestionState({ lockUntilInput: true });
  closeProfileEditModal();
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
  const target = document.getElementById(targetId);
  if (target) target.classList.remove("hidden");
  document.querySelectorAll(".sidebar [data-tab-target]").forEach((tab) => tab.classList.remove("active"));
  const activeTab = document.querySelector(`.sidebar [data-tab-target="${targetId}"]`);
  if (activeTab) activeTab.classList.add("active");
  localStorage.setItem(ACTIVE_TAB_KEY, targetId);
  closeMobileSidebar();
}

function bindControls() {
  document.querySelectorAll("[data-tab-target]").forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tabTarget));
  });

  const quickSearchForm = document.getElementById("homeQuickSearchForm");
  const quickSearchInput = document.getElementById("homeQuickSearchInput");
  const quickSearchSuggestions = document.getElementById("homeQuickSearchSuggestions");
  const searchFilterResetBtn = document.getElementById("searchFilterResetBtn");
  const searchFilterSearchBtn = document.getElementById("searchFilterSearchBtn");
  const embeddedPaginationPrev = document.getElementById("embeddedPaginationPrev");
  const embeddedPaginationNext = document.getElementById("embeddedPaginationNext");
  const embeddedPaginationPages = document.getElementById("embeddedPaginationPages");
  const embeddedResultsRoot = document.getElementById("embeddedSearchResults");
  const recommendationList = document.getElementById("recommendationList");
  const watchlistRandomPickBtn = document.getElementById("watchlistRandomPickBtn");
  const completedSortSelect = document.getElementById("completedSortSelect");
  const watchlistGrid = document.getElementById("watchlistGrid");
  const completedGrid = document.getElementById("completedGrid");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const sidebarProfileBtn = document.getElementById("sidebarProfileBtn");
  const sidebarSettingsBtn = document.getElementById("sidebarSettingsBtn");
  const sidebarExportBtn = document.getElementById("sidebarExportBtn");
  const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
  const profileEditBtn = document.getElementById("profileEditBtn");
  const profileEditBackdrop = document.getElementById("profileEditBackdrop");
  const profileEditCancelBtn = document.getElementById("profileEditCancelBtn");
  const profileEditSaveBtn = document.getElementById("profileEditSaveBtn");
  const profileAvatarUploadBtn = document.getElementById("profileAvatarUploadBtn");
  const profileAvatarRemoveBtn = document.getElementById("profileAvatarRemoveBtn");
  const profileAvatarFileInput = document.getElementById("profileAvatarFileInput");
  const profileBannerImageUploadBtn = document.getElementById("profileBannerImageUploadBtn");
  const profileBannerVideoUploadBtn = document.getElementById("profileBannerVideoUploadBtn");
  const profileBannerRemoveBtn = document.getElementById("profileBannerRemoveBtn");
  const profileBannerImageInput = document.getElementById("profileBannerImageInput");
  const profileBannerVideoInput = document.getElementById("profileBannerVideoInput");
  const profileBannerHeightInput = document.getElementById("profileBannerHeightInput");
  const settingsThemeButtons = Array.from(document.querySelectorAll("#settingsThemeSegmented [data-theme-value]"));
  const settingsDefaultSortSelect = document.getElementById("settingsDefaultSortSelect");
  const settingsConfirmDeleteToggle = document.getElementById("settingsConfirmDeleteToggle");
  const settingsResetProgressBtn = document.getElementById("settingsResetProgressBtn");
  const settingsClearAllDataBtn = document.getElementById("settingsClearAllDataBtn");
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const importDataInput = document.getElementById("importDataInput");
  const importDataBtn = document.getElementById("importDataBtn");
  const importModeSelect = document.getElementById("importModeSelect");
  const exportRestoreBackupBtn = document.getElementById("exportRestoreBackupBtn");
  const logoutActionBtn = document.getElementById("logoutActionBtn");
  const profileShortcutBtn = document.getElementById("profileShortcutBtn");
  const confirmActionBackdrop = document.getElementById("confirmActionBackdrop");
  const confirmActionCancelBtn = document.getElementById("confirmActionCancelBtn");
  const confirmActionConfirmBtn = document.getElementById("confirmActionConfirmBtn");
  if (quickSearchForm && quickSearchInput) {
    quickSearchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      executeQuickSearchSubmit(quickSearchInput.value, { clearInputAfter: true });
    });

    quickSearchInput.addEventListener("input", () => {
      quickSuggestLockedUntilInput = false;
      scheduleQuickSuggestions(quickSearchInput.value);
    });

    quickSearchInput.addEventListener("keydown", (event) => {
      const suggestionsVisible = quickSearchSuggestions && !quickSearchSuggestions.classList.contains("hidden");

      if (event.key === "Escape") {
        resetQuickSuggestionState({ lockUntilInput: true });
        return;
      }
      if (!suggestionsVisible) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveQuickSuggestionHighlight(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveQuickSuggestionHighlight(-1);
        return;
      }

      if (event.key === "Enter" && quickSuggestActiveIndex >= 0) {
        const selected = quickSuggestItems[quickSuggestActiveIndex];
        if (!selected) return;
        event.preventDefault();
        handleQuickSuggestionSelect(selected);
      }
    });

    quickSearchForm.addEventListener("focusout", () => {
      setTimeout(() => {
        if (!quickSearchForm.contains(document.activeElement)) {
          resetQuickSuggestionState({ lockUntilInput: true });
        }
      }, 0);
    });
  }

  if (quickSearchSuggestions) {
    quickSearchSuggestions.addEventListener("click", (event) => {
      const target = event.target.closest(".quick-search-suggestion");
      if (!target) return;
      const animeId = Number(target.dataset.id);
      const anime = quickSuggestItems.find((item) => Number(item.id) === animeId);
      if (!anime) return;
      handleQuickSuggestionSelect(anime);
    });
  }

  if (embeddedResultsRoot) {
    embeddedResultsRoot.addEventListener("click", (event) => {
      const addBtn = event.target.closest(".js-embedded-add");
      if (addBtn) {
        event.preventDefault();
        const anime = embeddedSearchResults.find((item) => item.id === Number(addBtn.dataset.id));
        if (!anime) return;
        upsertAnime(anime, addBtn.dataset.status);
        showToast(`Saved "${anime.title}" as ${statusLabel(addBtn.dataset.status)}.`);
        return;
      }

      const card = event.target.closest(".js-embedded-open");
      if (!card) return;
      event.preventDefault();
      openEmbeddedAnimeModal(Number(card.dataset.id));
    });

    embeddedResultsRoot.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest(".js-embedded-add")) return;
      const card = event.target.closest(".js-embedded-open");
      if (!card) return;
      event.preventDefault();
      openEmbeddedAnimeModal(Number(card.dataset.id));
    });
  }

  const openLibraryAnime = (animeId) => {
    const anime = dashboardSnapshot.find((item) => item.id === animeId);
    if (!anime) return;
    openEmbeddedAnimeModalWithAnime(anime, "library");
  };
  const bindLibraryGrid = (gridEl) => {
    if (!gridEl) return;
    gridEl.addEventListener("click", (event) => {
      const card = event.target.closest(".js-library-open");
      if (!card) return;
      event.preventDefault();
      openLibraryAnime(Number(card.dataset.id));
    });
    gridEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest(".js-library-open");
      if (!card) return;
      event.preventDefault();
      openLibraryAnime(Number(card.dataset.id));
    });
  };
  bindLibraryGrid(watchlistGrid);
  bindLibraryGrid(completedGrid);

  if (recommendationList) {
    recommendationList.addEventListener("click", async (event) => {
      const btn = event.target.closest(".js-add-plan");
      if (!btn) return;
      const anime = ANIME_DB.find((item) => item.id === Number(btn.dataset.id));
      if (!anime) return;

      btn.disabled = true;
      const payload = { ...anime, watchedEpisodes: 0, status: "plan" };
      const result = await upsertAnime(payload, "watching");
      if (result.success) {
        showToast(`Added "${anime.title}" to Currently Watching.`);
        await refreshDashboard();
      } else {
        showToast(result.error || "Unable to add anime to Currently Watching.");
      }
      btn.disabled = false;
    });
  }

  if (watchlistRandomPickBtn) {
    watchlistRandomPickBtn.addEventListener("click", () => {
      pickSomethingForWatchlist();
    });
  }

  if (completedSortSelect) {
    completedSortSelect.value = completedSortMode;
    completedSortSelect.addEventListener("change", () => {
      completedSortMode = completedSortSelect.value || "recent";
      localStorage.setItem(DEFAULT_SORT_KEY, completedSortMode);
      const settingsDefaultSortSelect = document.getElementById("settingsDefaultSortSelect");
      if (settingsDefaultSortSelect) settingsDefaultSortSelect.value = completedSortMode;
      SectionModules.Completed.render(dashboardSnapshot);
    });
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      toggleMobileSidebar();
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => {
      closeMobileSidebar();
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMobileSidebar();
  });

  [sidebarProfileBtn, sidebarSettingsBtn, sidebarExportBtn, sidebarLogoutBtn].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => closeMobileSidebar());
  });

  if (profileShortcutBtn) {
    profileShortcutBtn.addEventListener("click", () => {
      activateTab("profilePanel");
    });
  }

  if (profileEditBtn) {
    profileEditBtn.addEventListener("click", () => {
      openProfileEditModal();
    });
  }
  if (profileEditBackdrop) {
    profileEditBackdrop.addEventListener("click", closeProfileEditModal);
  }
  if (profileEditCancelBtn) {
    profileEditCancelBtn.addEventListener("click", closeProfileEditModal);
  }
  if (profileEditSaveBtn) {
    profileEditSaveBtn.addEventListener("click", saveProfileFromModal);
  }
  if (profileAvatarUploadBtn && profileAvatarFileInput) {
    profileAvatarUploadBtn.addEventListener("click", () => profileAvatarFileInput.click());
  }
  if (profileAvatarFileInput) {
    profileAvatarFileInput.addEventListener("change", async () => {
      await handleProfileAvatarFileSelection(profileAvatarFileInput.files?.[0] || null);
      profileAvatarFileInput.value = "";
    });
  }
  if (profileAvatarRemoveBtn) {
    profileAvatarRemoveBtn.addEventListener("click", () => {
      profileModalAvatarData = "";
      renderProfileAvatarUploadPreview(profileModalAvatarData);
      setProfileUploadStatus("");
    });
  }
  if (profileBannerImageUploadBtn && profileBannerImageInput) {
    profileBannerImageUploadBtn.addEventListener("click", () => profileBannerImageInput.click());
  }
  if (profileBannerVideoUploadBtn && profileBannerVideoInput) {
    profileBannerVideoUploadBtn.addEventListener("click", () => profileBannerVideoInput.click());
  }
  if (profileBannerImageInput) {
    profileBannerImageInput.addEventListener("change", async () => {
      await handleProfileBannerFileSelection(profileBannerImageInput.files?.[0] || null, "image");
      profileBannerImageInput.value = "";
    });
  }
  if (profileBannerVideoInput) {
    profileBannerVideoInput.addEventListener("change", async () => {
      await handleProfileBannerFileSelection(profileBannerVideoInput.files?.[0] || null, "video");
      profileBannerVideoInput.value = "";
    });
  }
  if (profileBannerRemoveBtn) {
    profileBannerRemoveBtn.addEventListener("click", () => {
      profileModalBannerType = "";
      profileModalBannerData = "";
      renderProfileBannerUploadPreview(profileModalBannerType, profileModalBannerData);
      setProfileUploadStatus("");
    });
  }
  if (profileBannerHeightInput) {
    profileBannerHeightInput.addEventListener("input", () => {
      profileModalBannerHeight = setProfileBannerHeightControl(profileBannerHeightInput.value);
    });
  }

  if (settingsThemeButtons.length) {
    settingsThemeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextTheme = button.dataset.themeValue || "system";
        applyTheme(nextTheme);
        syncThemePreferenceControl();
      });
    });
  }

  if (settingsDefaultSortSelect) {
    settingsDefaultSortSelect.addEventListener("change", () => {
      const nextSort = ["recent", "rating", "episodes"].includes(settingsDefaultSortSelect.value)
        ? settingsDefaultSortSelect.value
        : "recent";
      completedSortMode = nextSort;
      localStorage.setItem(DEFAULT_SORT_KEY, nextSort);
      SectionModules.Completed.render(dashboardSnapshot);
      setStatusMessage("settingsStatusMessage", "Default sorting updated.");
    });
  }

  if (settingsConfirmDeleteToggle) {
    settingsConfirmDeleteToggle.addEventListener("change", () => {
      confirmBeforeDeleteEnabled = Boolean(settingsConfirmDeleteToggle.checked);
      localStorage.setItem(CONFIRM_BEFORE_DELETE_KEY, String(confirmBeforeDeleteEnabled));
      setStatusMessage("settingsStatusMessage", "Delete confirmation preference updated.");
    });
  }

  if (settingsResetProgressBtn) {
    settingsResetProgressBtn.addEventListener("click", () => {
      resetProgress();
    });
  }

  if (settingsClearAllDataBtn) {
    settingsClearAllDataBtn.addEventListener("click", () => {
      clearAllData();
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      exportAsJSON();
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      exportAsCSV();
    });
  }

  if (importDataInput) {
    importDataInput.addEventListener("change", () => {
      pendingImportFile = importDataInput.files?.[0] || null;
      if (importDataBtn) importDataBtn.disabled = !pendingImportFile;
      if (exportRestoreBackupBtn) exportRestoreBackupBtn.disabled = !pendingImportFile;
      renderExportPage();
      setStatusMessage("exportStatusMessage", "");
    });
  }

  if (importModeSelect) {
    importModeSelect.addEventListener("change", () => {
      updateImportModeVisual(importModeSelect.value || "merge");
    });
  }

  if (importDataBtn) {
    importDataBtn.addEventListener("click", () => {
      const mode = importModeSelect?.value || "merge";
      importData(pendingImportFile, mode);
    });
  }

  if (exportRestoreBackupBtn) {
    exportRestoreBackupBtn.addEventListener("click", () => {
      restoreBackup(pendingImportFile);
    });
  }

  if (logoutActionBtn) {
    logoutActionBtn.addEventListener("click", () => {
      handleLogout();
    });
  }

  if (confirmActionBackdrop) {
    confirmActionBackdrop.addEventListener("click", () => closeConfirmModal(false));
  }
  if (confirmActionCancelBtn) {
    confirmActionCancelBtn.addEventListener("click", () => closeConfirmModal(false));
  }
  if (confirmActionConfirmBtn) {
    confirmActionConfirmBtn.addEventListener("click", () => closeConfirmModal(true));
  }

  if (quickSearchForm) {
    document.addEventListener("click", (event) => {
      if (!quickSearchForm.contains(event.target)) {
        resetQuickSuggestionState({ lockUntilInput: true });
      }
    });
  }

  if (searchFilterResetBtn) {
    searchFilterResetBtn.addEventListener("click", () => {
      const panel = document.getElementById("searchPanel");
      if (panel) {
        panel.querySelectorAll("select").forEach((selectEl) => {
          selectEl.value = "";
        });
      }
      SectionModules.Search.resetResults();
    });
  }

  if (searchFilterSearchBtn) {
    searchFilterSearchBtn.addEventListener("click", () => {
      runFilterSearch();
    });
  }

  if (embeddedPaginationPrev) {
    embeddedPaginationPrev.addEventListener("click", () => {
      if (embeddedSearchPage <= 1) return;
      goToEmbeddedSearchPage(embeddedSearchPage - 1);
    });
  }

  if (embeddedPaginationNext) {
    embeddedPaginationNext.addEventListener("click", () => {
      if (embeddedSearchPage >= embeddedSearchTotalPages) return;
      goToEmbeddedSearchPage(embeddedSearchPage + 1);
    });
  }

  if (embeddedPaginationPages) {
    embeddedPaginationPages.addEventListener("click", (event) => {
      const target = event.target.closest(".search-pagination-page");
      if (!target) return;
      const page = Number(target.dataset.page);
      if (!page) return;
      goToEmbeddedSearchPage(page);
    });
  }

  const newsRefreshBtn = document.getElementById("homeNewsRefreshBtn");
  if (newsRefreshBtn) {
    newsRefreshBtn.addEventListener("click", () => {
      renderLiveAnimeNews(true);
    });
  }

  const modalClose = document.getElementById("embeddedAnimeModalClose");
  const modalBackdrop = document.getElementById("embeddedAnimeModalBackdrop");
  const modalReadMore = document.getElementById("embeddedModalReadMoreBtn");
  if (modalClose) modalClose.addEventListener("click", closeEmbeddedAnimeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeEmbeddedAnimeModal);
  if (modalReadMore) {
    modalReadMore.addEventListener("click", () => {
      embeddedModalDescExpanded = !embeddedModalDescExpanded;
      updateEmbeddedModalDescription();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!document.getElementById("confirmActionModal")?.classList.contains("hidden")) {
        closeConfirmModal(false);
      }
      if (!document.getElementById("profileEditModal")?.classList.contains("hidden")) {
        closeProfileEditModal();
      }
      resetQuickSuggestionState({ lockUntilInput: true });
      closeMobileSidebar();
    }
    if (event.key === "Escape" && !document.getElementById("embeddedAnimeModal")?.classList.contains("hidden")) {
      closeEmbeddedAnimeModal();
    }
  });

}

document.addEventListener("DOMContentLoaded", async () => {
  // Session Protection
  const session = await SupabaseAuth.protectPage();
  if (!session) return; // protectPage handles redirect

  initializeAppPreferences();
  bindControls();
  SectionModules.Search.renderResults();
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get("tab");
  const requestedQuery = String(urlParams.get("q") || "").trim();
  const tabFromUrl = requestedTab && document.getElementById(requestedTab) ? requestedTab : null;
  const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
  const validTab = tabFromUrl || (savedTab && document.getElementById(savedTab) ? savedTab : "dashboardPanel");
  activateTab(validTab);
  initHomeHeroCarousel();
  setInterval(() => initHomeHeroCarousel(true), HERO_CAROUSEL_AUTO_REFRESH_MS);
  refreshDashboard();
  if (validTab === "searchPanel" && requestedQuery) {
    const quickSearchInput = document.getElementById("homeQuickSearchInput");
    if (quickSearchInput) quickSearchInput.value = requestedQuery;
    runEmbeddedSearch(requestedQuery, 1).catch(() => {
      showToast("Search is unavailable right now.");
    });
  }
  renderLiveAnimeNews();
  startNewsAutoRefresh();
  window.addEventListener("animeDataUpdated", refreshDashboard);
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === ANIME_STORAGE_KEY || event.key === PROFILE_DATA_KEY) refreshDashboard();
    if (event.key === THEME_PREFERENCE_KEY) {
      applyTheme(getThemePreference());
      syncThemePreferenceControl();
    }
    if (event.key === DEFAULT_SORT_KEY) {
      completedSortMode = getDefaultSortPreference();
      SectionModules.Completed.render(dashboardSnapshot);
      renderSettings();
    }
    if (event.key === CONFIRM_BEFORE_DELETE_KEY) {
      confirmBeforeDeleteEnabled = getConfirmBeforeDeletePreference();
      renderSettings();
    }
    if (event.key === LAST_BACKUP_TIMESTAMP_KEY) {
      renderExportPage();
    }
  });

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const onThemeChange = () => {
      if (getThemePreference() === "system") applyTheme("system");
    };
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onThemeChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(onThemeChange);
    }
  }
});
