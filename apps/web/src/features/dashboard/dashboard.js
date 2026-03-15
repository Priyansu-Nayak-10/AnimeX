import { STATUS } from "../../store.js";
import { getTopOngoingAnikoto } from "../../core/state.js";
import { authFetch, apiUrl } from "../../config.js";

const DEFAULT_INTERVAL_MS = 5000;
const NEWS_CACHE_KEY = "animex_live_news_cache_v1";
const NEWS_CACHE_TTL_MS = 30 * 60 * 1000;
const NEWS_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const NEWS_REQUEST_TIMEOUT_MS = 8000;
const NEWS_TOTAL_LIMIT = 5;
const NEWS_FRESH_WINDOW_HOURS = 48;
const NEWS_TREND_BADGE_MIN_SCORE = 12;
const NEWS_TREND_KEYWORDS = Object.freeze([
  "final", "promo", "trailer", "new", "season", "cast", "studio", "announced", "teaser", "opening"
]);
const NEWS_FEEDS = Object.freeze([
  { source: "ANN", url: "https://www.animenewsnetwork.com/all/rss.xml" },
  { source: "MAL", url: "https://myanimelist.net/rss/news.xml" },
  { source: "TOKYO OT", url: "https://otakumode.com/news/feed" }
]);
const NEWS_PROXY_ENDPOINTS = Object.freeze([
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://cors.isomorphic-git.org/${url}`
]);
const JIKAN_NEWS_FALLBACK_ENDPOINTS = Object.freeze([
  { source: "JIKAN", url: "https://api.jikan.moe/v4/watch/episodes?limit=10", kind: "episodes" },
  { source: "JIKAN", url: "https://api.jikan.moe/v4/watch/promos?limit=10", kind: "promos" }
]);
const DASHBOARD_CLIP_KEY = "animex_fav_clip";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


// Premium palette — rich gradient stops per slice
const DONUT_PALETTE = [
  { from: 'var(--chart-purple)', to: 'var(--chart-purple)' },
  { from: 'var(--chart-blue)', to: 'var(--chart-blue)' },
  { from: 'var(--chart-cyan)', to: 'var(--chart-cyan)' },
  { from: 'var(--chart-green)', to: 'var(--chart-green)' },
  { from: 'var(--chart-orange)', to: 'var(--chart-orange)' },
  { from: 'var(--chart-pink)', to: 'var(--chart-pink)' },
];

function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutArc(cx, cy, outerR, innerR, startDeg, endDeg) {
  const o1 = polarToCartesian(cx, cy, outerR, startDeg);
  const o2 = polarToCartesian(cx, cy, outerR, endDeg);
  const i1 = polarToCartesian(cx, cy, innerR, endDeg);
  const i2 = polarToCartesian(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z'
  ].join(' ');
}

/**
 * Render a premium donut ring chart into an SVG element.
 * @param {SVGElement} svgElement
 * @param {Array<[string, number]>} entries  - [label, count] pairs
 * @param {{ cx?: number, cy?: number, outerR?: number, innerR?: number, showCenter?: boolean }} [opts]
 */
function renderGenreDonut(svgElement, entries, opts = {}) {
  if (!svgElement) return;
  const total = entries.reduce((s, [, c]) => s + Number(c || 0), 0);
  if (!total) { svgElement.innerHTML = ''; return; }

  const {
    cx = 100, cy = 100,
    outerR = 88, innerR = 52,
    showCenter = true
  } = opts;

  const GAP_DEG = 2.2;  // gap between slices in degrees
  const uid = `dnt-${Math.random().toString(36).slice(2, 7)}`;

  // Build gradient defs
  const gradientDefs = entries.map((_, i) => {
    const c = DONUT_PALETTE[i % DONUT_PALETTE.length];
    return `<linearGradient id="${uid}-g${i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.from}"/>
      <stop offset="100%" stop-color="${c.to}"/>
    </linearGradient>`;
  }).join('');

  // Glow filter
  const glowFilter = `<filter id="${uid}-glow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

  // Slices
  let angle = -90;  // start at 12 o'clock
  const slices = entries.map(([label, count], i) => {
    const value = Number(count || 0);
    const sweep = (value / total) * 360;
    const startDeg = angle + GAP_DEG / 2;
    const endDeg = angle + sweep - GAP_DEG / 2;
    angle += sweep;
    if (sweep < 1) return '';
    const pct = Math.round((value / total) * 100);
    const path = describeDonutArc(cx, cy, outerR, innerR, startDeg, endDeg);
    return `<path
      class="donut-slice"
      d="${path}"
      fill="url(#${uid}-g${i})"
      filter="url(#${uid}-glow)"
      data-tooltip="${escapeHtml(`${label} ${pct}% — ${count}`)}"
      style="animation-delay: ${i * 0.07}s"
    />`;
  }).join('');

  // Center label
  const center = showCenter ? `
    <circle cx="${cx}" cy="${cy}" r="${innerR - 4}"
      fill="rgba(39,23,74,0.7)" />
    <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="22"
      font-weight="800" fill="var(--text-primary)" font-family="inherit">${total}</text>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9"
      font-weight="600" fill="var(--text-muted)" font-family="inherit" letter-spacing="1">ANIME</text>
  ` : '';

  svgElement.innerHTML = `
    <defs>${gradientDefs}${glowFilter}</defs>
    ${slices}
    ${center}
  `;
}


function topGenres(items, limit = 3) {
  const counts = new Map();
  items.forEach((item) => {
    (item?.genres || []).forEach((genre) => {
      const key = String(genre || "").trim();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function topGenresWithOthers(items, limit = 3) {
  const sorted = topGenres(items, Number.MAX_SAFE_INTEGER);
  if (sorted.length <= limit) return sorted;
  const head = sorted.slice(0, limit);
  const othersCount = sorted
    .slice(limit)
    .reduce((sum, [, count]) => sum + Number(count || 0), 0);
  if (othersCount > 0) head.push(["Others", othersCount]);
  return head;
}

function topGenreNames(items) {
  const counts = new Map();
  items.forEach((item) => {
    (item?.genres || []).forEach((genre) => {
      const key = String(genre || "").trim();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

function derivePersonality(stats) {
  if (stats.completed >= 20) return { name: "Completionist", desc: "You close arcs and finish long runs consistently." };
  if (stats.watching >= 8) return { name: "Binge Explorer", desc: "You keep multiple ongoing stories active." };
  if (stats.plan >= 10) return { name: "Curator", desc: "You build deep queues before committing to a show." };
  return { name: "Rising Otaku", desc: "Your library is growing with a balanced watch pace." };
}

function initRecommendations({ store, libraryStore, selectors, toast = null }) {
  const dashboardRoot = document.getElementById("dashboard-view") || document;
  const refs = {
    recommendedList: document.getElementById("recommended-list"),
    quickTotal: document.getElementById("quick-total"),
    quickPlan: document.getElementById("quick-plan"),
    quickGenres: document.getElementById("quick-genres"),
    quickTopGenres: document.getElementById("quick-top-genres"),
    personalityName: document.getElementById("anime-personality-name"),
    personalityDesc: document.getElementById("anime-personality-desc"),
    dashboardGenreSvg: document.getElementById("completed-genre-pie"),
    dashboardGenreLegend: dashboardRoot.querySelector(".stats-container .legend")
  };

  // Personalized recommendations fetched from the backend (nightly cron)
  let backendRecs = null; // null = not yet fetched; [] = empty result

  // Fetch server-side personalized recommendations once on init
  async function fetchBackendRecs() {
    try {
      const res = await authFetch(apiUrl("/user/me/recommendations"));
      if (!res.ok) return;
      const { data } = await res.json();
      backendRecs = Array.isArray(data) ? data : [];
      if (backendRecs.length) render(); // Re-render with fresh personalized data
    } catch {
      backendRecs = []; // Mark as fetched (empty) so fallback kicks in
    }
  }

  function getLocalRecommendations(dataState, libraryItems) {
    const topGenresList = topGenreNames(libraryItems);
    const existingIds = new Set(libraryItems.map((item) => Number(item?.malId || 0)));
    let recs = selectors.getCombinedDiscoveryState(dataState).filter((anime) => !existingIds.has(Number(anime?.malId || 0)));
    if (topGenresList.length) {
      recs = recs.sort((left, right) => {
        const leftMatches = (left?.genres || []).filter((genre) => topGenresList.includes(genre)).length;
        const rightMatches = (right?.genres || []).filter((genre) => topGenresList.includes(genre)).length;
        if (rightMatches !== leftMatches) return rightMatches - leftMatches;
        return Number(right?.score || 0) - Number(left?.score || 0);
      });
    }
    return recs.slice(0, 10);
  }

  function renderRecommendedList(rows) {
    if (!refs.recommendedList) return;
    if (!rows.length) {
      refs.recommendedList.innerHTML = `
        <div class="tracker-empty" style="text-align: center; padding: 2rem 1rem;">
          <span class="material-icons" style="font-size: 2.5rem; color: var(--text-gray-600); margin-bottom: 0.5rem;">auto_awesome</span>
          <p class="anime-card-meta">Add anime to your watchlist to unlock personalized recommendations.</p>
        </div>
      `;
      return;
    }
    refs.recommendedList.innerHTML = rows.map((anime) => {
      const malId = Number(anime?.malId || anime?.mal_id || 0);
      const title = escapeHtml(anime?.title || "Unknown");
      const image = escapeHtml(anime?.image || "https://via.placeholder.com/120x168?text=No+Image");
      const genres = (anime?.genres || []).slice(0, 3).map((g) => escapeHtml(g)).join(", ") || "Genre TBD";

      return `
        <div class="reco-card" data-id="${malId}">
          <div class="reco-thumb-wrap">
            <img class="reco-thumb" src="${image}" alt="${title}">
          </div>
          <div class="reco-body">
            <div class="reco-title" title="${title}">${title}</div>
            <div class="reco-genres">${genres}</div>
            <button class="reco-add-btn" type="button" data-reco-action="add-plan" data-id="${malId}">
              Add to Plan
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  const GENRE_META = {
    action: { icon: "local_fire_department", color: "#8b5cf6" },
    adventure: { icon: "explore", color: "#a78bfa" },
    comedy: { icon: "sentiment_very_satisfied", color: "#c4b5fd" },
    drama: { icon: "theater_comedy", color: "#7c3aed" },
    fantasy: { icon: "auto_fix_high", color: "#9333ea" },
    romance: { icon: "favorite", color: "#d8b4fe" },
    "sci-fi": { icon: "rocket_launch", color: "#a78bfa" },
    slice: { icon: "local_cafe", color: "#c4b5fd" },
    mystery: { icon: "search", color: "#6d28d9" },
    thriller: { icon: "bolt", color: "#7e22ce" },
    horror: { icon: "psychology", color: "#581c87" },
    sports: { icon: "sports_baseball", color: "#9333ea" },
    supernatural: { icon: "visibility", color: "#8b5cf6" },
    isekai: { icon: "vpn_key", color: "#a78bfa" },
    mecha: { icon: "smart_toy", color: "#b7abd9" }
  };

  function getGenreConfig(genreName) {
    const norm = String(genreName).toLowerCase().replace(/_/g, " ");
    for (const [key, val] of Object.entries(GENRE_META)) {
      if (norm.includes(key)) return val;
    }
    return { icon: "local_offer", color: "#8b5cf6" };
  }

  function render() {
    const dataState = store.getState();
    const libraryItems = libraryStore.getAll();
    const completedItems = libraryItems.filter((item) => String(item?.status || "").toLowerCase() === "completed");
    const stats = libraryStore.getStats();
    const genres = topGenres(libraryItems, 3);
    const personality = derivePersonality(stats);
    const completedGenreEntries = topGenresWithOthers(completedItems, 3);

    if (refs.quickTotal) refs.quickTotal.textContent = String(stats.total);
    if (refs.quickPlan) refs.quickPlan.textContent = String(stats.plan);
    if (refs.quickGenres) refs.quickGenres.textContent = String(genres.length);
    if (refs.personalityName) refs.personalityName.textContent = personality.name;
    if (refs.personalityDesc) refs.personalityDesc.textContent = personality.desc;

    if (refs.quickTopGenres) {
      refs.quickTopGenres.innerHTML = genres.length
        ? genres.map(([genre]) => {
          const conf = getGenreConfig(genre);
          return `<div class="genre-chip" style="--accent: ${conf.color}">
            <span class="material-icons">${conf.icon}</span>
            <span>${escapeHtml(genre)}</span>
          </div>`;
        }).join("")
        : '<span class="anime-card-meta">No genre data yet</span>';
    }

    if (refs.dashboardGenreSvg && refs.dashboardGenreLegend) {
      if (!completedGenreEntries.length) {
        refs.dashboardGenreSvg.innerHTML = `<g transform="translate(100,100)"><circle r="95" fill="none" stroke="rgba(167, 139, 250, 0.14)" stroke-width="20" stroke-dasharray="10 10"></circle><text x="0" y="5" text-anchor="middle" fill="var(--text-muted)" font-size="0.8rem">No Data</text></g>`;
        refs.dashboardGenreLegend.innerHTML = '<div class="anime-card-meta" style="margin-bottom:0; text-align: center; width: 100%;">Complete anime to see distribution.</div>';
      } else {
        renderGenreDonut(refs.dashboardGenreSvg, completedGenreEntries);
        const total = completedGenreEntries.reduce((sum, [, count]) => sum + Number(count || 0), 0);
        const palette = ["var(--chart-purple)", "var(--chart-blue)", "var(--chart-cyan)", "var(--chart-green)", "var(--chart-orange)", "var(--chart-pink)"];
        refs.dashboardGenreLegend.innerHTML = completedGenreEntries.map(([name, count], i) => {
          const pct = Math.round((Number(count || 0) / total) * 100);
          const c = palette[i % palette.length];
          return `<div class="legend-item"><span class="legend-dot" style="background: ${c}"></span><div class="legend-label"><span class="anime-card-meta" style="margin-bottom:0;color:var(--text-primary); font-weight:600;">${escapeHtml(name)}</span><span class="anime-card-meta" style="margin-bottom:0;font-size:0.6rem;">${pct}%</span></div></div>`;
        }).join('');
      }
    }

    // Use backend personalized recs if available; otherwise fall back to local algorithm
    const rows = (backendRecs && backendRecs.length > 0)
      ? backendRecs
      : getLocalRecommendations(dataState, libraryItems);

    renderRecommendedList(rows);
  }

  function onRecommendedClick(event) {
    const button = event.target.closest("[data-reco-action='add-plan']");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const malId = Number(button.getAttribute("data-id") || 0);
    if (!malId) return;
    const state = store.getState();
    const anime = selectors.getCombinedDiscoveryState(state).find((row) => Number(row?.malId || 0) === malId);
    if (!anime) return;
    libraryStore.upsert({ ...anime, status: "plan" }, "plan");
    toast?.show?.("Added to watchlist");
  }

  refs.recommendedList?.addEventListener("click", onRecommendedClick);
  const unsubs = [store.subscribe(render), libraryStore.subscribe(render)];
  render();

  // Kick off backend fetch after initial render (non-blocking)
  fetchBackendRecs();

  return Object.freeze({
    render,
    destroy() {
      refs.recommendedList?.removeEventListener("click", onRecommendedClick);
      unsubs.forEach((fn) => fn());
    }
  });
}

function formatScheduleText(anime) {
  if (String(anime?.status || "").toLowerCase().includes("airing")) return "Currently airing";
  return "Schedule unavailable";
}

function initHeroCarousel({
  store,
  libraryStore,
  toast = null,
  onViewDetails = null,
  intervalMs = DEFAULT_INTERVAL_MS,
  timers = globalThis
}) {
  const root = document.getElementById("hero-carousel");
  if (!root) return { render() { }, destroy() { } };

  const slidesHost = root.querySelector(".hero-slides");
  const indicatorsHost = root.querySelector(".hero-indicators");
  const prevBtn = root.querySelector(".hero-prev");
  const nextBtn = root.querySelector(".hero-next");

  let items = [];
  let index = 0;
  let intervalId = 0;

  function setActive(nextIndex) {
    const slides = root.querySelectorAll(".hero-slide");
    const dots = root.querySelectorAll(".hero-indicator");
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === nextIndex));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === nextIndex));
    index = nextIndex;
  }

  function render(topOngoingOverride = null) {
    const state = store.getState();
    const libraryItems = libraryStore?.getAll?.() || [];
    const topOngoing = Array.isArray(topOngoingOverride)
      ? topOngoingOverride
      : getTopOngoingAnikoto(state, 10, libraryItems);
    items = topOngoing;
    index = 0;
    if (!slidesHost || !indicatorsHost) return;

    if (!items.length) {
      slidesHost.innerHTML = '<article class="hero-slide is-active"><div class="hero-slide-overlay"></div><div class="hero-slide-content"><h2 class="hero-title">No currently airing anime available</h2><p class="hero-countdown">Try refreshing datasets.</p></div></article>';
      indicatorsHost.innerHTML = "";
      return;
    }

    slidesHost.innerHTML = items.map((anime, i) => {
      const title = escapeHtml(String(anime?.title || "Unknown Title"));
      const image = escapeHtml(String(anime?.image || ""));
      const score = Number.isFinite(Number(anime?.score)) ? Number(anime.score).toFixed(2) : "N/A";
      const episodes = (() => {
        const n = Number(anime?.episodes);
        if (Number.isFinite(n) && n > 0) return n;
        const st = String(anime?.status || '').toLowerCase();
        return st.includes('airing') ? 'Ongoing' : 'Unknown';
      })();

      const genres = (anime?.genres || []).slice(0, 4).map((genre) => `<span class="hero-genre-chip" data-genre="${escapeHtml(genre)}">${escapeHtml(genre)}</span>`).join("");
      return `<article class="hero-slide ${i === 0 ? "is-active" : ""}" data-index="${i}">
        <img class="hero-slide-bg" src="${image}" alt="${title}" loading="lazy" decoding="async" />
        <div class="hero-slide-overlay"></div>
        <div class="hero-slide-content">
          <p class="hero-subtitle">Top Currently Airing</p>
          <h2 class="hero-title">${title}</h2>
          <div class="hero-meta"><span class="hero-score-badge">Score ${score}</span><span class="hero-episodes">${episodes} eps</span></div>
          <p class="hero-countdown">${escapeHtml(formatScheduleText(anime))}</p>
          <div class="hero-genres">${genres}</div>
          <div class="hero-actions">
            <button class="hero-btn hero-add-watchlist" type="button" data-hero-action="add" data-id="${Number(anime?.malId || 0)}">Add to Watchlist</button>
            <button class="hero-btn hero-view-details" type="button" data-hero-action="details" data-id="${Number(anime?.malId || 0)}">View Details</button>
          </div>
        </div>
      </article>`;
    }).join("");

    indicatorsHost.innerHTML = items.map((_, i) => `<button class="hero-indicator ${i === 0 ? "active" : ""}" type="button" data-hero-dot="${i}" aria-label="Go to slide ${i + 1}"></button>`).join("");
    const images = slidesHost.querySelectorAll(".hero-slide-bg");
    images.forEach((image) => {
      const markLoaded = () => image.classList.add("is-loaded");
      if (image.complete && image.naturalWidth > 0) {
        markLoaded();
        return;
      }
      image.addEventListener("load", markLoaded, { once: true });
      image.addEventListener("error", markLoaded, { once: true });
    });
  }

  function goNext() {
    if (items.length < 2) return;
    setActive((index + 1) % items.length);
  }

  function goPrev() {
    if (items.length < 2) return;
    setActive((index - 1 + items.length) % items.length);
  }

  function restartAutoPlay() {
    if (intervalId) timers.clearInterval(intervalId);
    if (items.length < 2) return;
    intervalId = timers.setInterval(goNext, Math.max(1200, Number(intervalMs) || DEFAULT_INTERVAL_MS));
  }

  async function onClick(event) {
    const dot = event.target.closest("[data-hero-dot]");
    if (dot) {
      const nextIndex = Number(dot.getAttribute("data-hero-dot") || 0);
      if (Number.isFinite(nextIndex)) setActive(Math.max(0, Math.min(items.length - 1, nextIndex)));
      restartAutoPlay();
      return;
    }
    const actionBtn = event.target.closest("[data-hero-action]");
    if (!actionBtn) return;
    const action = String(actionBtn.getAttribute("data-hero-action") || "");
    const malId = Number(actionBtn.getAttribute("data-id") || 0);
    if (!malId) return;
    const anime = items.find((row) => Number(row?.malId || 0) === malId);
    if (!anime) return;
    if (action === "add") {
      libraryStore.upsert({ ...anime, status: STATUS.PLAN }, STATUS.PLAN);
      toast?.show?.("Added to watchlist");
      restartAutoPlay();
      return;
    }
    if (action === "details") {
      if (typeof onViewDetails === "function") await onViewDetails(anime);
      restartAutoPlay();
    }
  }

  prevBtn?.addEventListener("click", () => {
    goPrev();
    restartAutoPlay();
  });
  nextBtn?.addEventListener("click", () => {
    goNext();
    restartAutoPlay();
  });
  root.addEventListener("click", onClick);

  const unsubscribe = store.subscribe(() => {
    render();
    restartAutoPlay();
  });
  render();
  restartAutoPlay();

  return Object.freeze({
    render,
    destroy() {
      unsubscribe();
      root.removeEventListener("click", onClick);
      if (intervalId) timers.clearInterval(intervalId);
    }
  });
}

// ═══════════════════════════════════════════════════════
// TOP UPCOMING RELEASES MODULE
// ═══════════════════════════════════════════════════════

function initUpcomingWidget({ fetchImpl = fetch.bind(globalThis), storage = globalThis.localStorage, timers = globalThis }) {
  const CACHE_KEY = "animex_dashboard_upcoming_v1";
  const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
  const JIKAN_ENDPOINT = "https://api.jikan.moe/v4/seasons/upcoming?limit=6";
  const BACKEND_ENDPOINT = apiUrl("/anime/upcoming?limit=6");

  const listEl = document.getElementById("dashboard-upcoming-list");
  if (!listEl) return { render() { }, destroy() { } };

  let upcomingTimer = 0;
  let currentItems = [];

  const SKELETON_COUNT = 6;
  const SKELETON_MARKUP = Array(SKELETON_COUNT).fill(0).map(() => `
    <div class="news-item is-skeleton">
      <div class="news-thumb skeleton-thumb"></div>
      <div class="news-badge skeleton-badge"></div>
      <div>
        <h4 class="anime-card-title skeleton-title"></h4>
        <div class="flex items-center gap-1 anime-card-meta skeleton-meta"></div>
      </div>
    </div>
  `).join("");

  function renderRows(items) {
    currentItems = items;
    if (!items.length) {
      listEl.innerHTML = '<div class="tracker-empty">No upcoming anime found.</div>';
      return;
    }
    listEl.innerHTML = items.map(item => {
      const malId = Number(item.mal_id || 0);

      let title = item.title_english;
      if (!title && Array.isArray(item.titles)) {
        const eng = item.titles.find(t => t.type === 'English');
        if (eng) title = eng.title;
      }
      title = String(title || item.title || "Unknown Title");

      const img = String(item.images?.jpg?.image_url || "");
      const date = String(item.aired?.string || "TBA").split("to")[0].trim();
      const studio = Array.isArray(item.studios) && item.studios.length > 0 ? item.studios[0].name : "Unknown Studio";

      return `<div class="news-item" style="cursor:pointer;" data-action="open-anime-modal" data-id="${malId}">
        <div class="news-thumb">
          ${img ? `<img class="news-thumb-img" src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy" />` : '<div class="news-thumb-fallback">🎬</div>'}
        </div>
        <div class="news-badge news-badge-mal">Trending</div>
        <div>
          <h4 class="anime-card-title" style="font-size: 14px; font-weight: 700; line-height: 1.4; margin-bottom: 0.35rem;">${escapeHtml(title)}</h4>
          <div class="flex items-center gap-1 anime-card-meta" style="margin-top: 0.4rem; font-size: 0.7rem;">
            <span>${escapeHtml(date)} • ${escapeHtml(studio)}</span>
          </div>
        </div>
      </div>`;
    }).join("");
  }

  async function fetchData(url) {
    const controller = new AbortController();
    const timeoutId = timers.setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetchImpl(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Fetch failed from ${url}`);
      const payload = await res.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    } finally {
      timers.clearTimeout(timeoutId);
    }
  }

  async function loadData({ force = false } = {}) {
    let cachedData = null;
    let cacheExpired = true;

    try {
      const cachedStr = storage?.getItem?.(CACHE_KEY);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (Array.isArray(cached.data)) {
          cachedData = cached.data;
          cacheExpired = (Date.now() - cached.ts >= CACHE_TTL_MS);
        }
      }
    } catch (err) {
      console.error("Error reading upcoming cache:", err);
    }

    // Immediately render stale cache if available and not forcing a refresh
    if (cachedData && !force) {
      renderRows(cachedData);
      if (!cacheExpired) return; // No need to refresh if cache is fresh
    } else {
      // Show skeleton if no cache or forcing refresh
      listEl.innerHTML = SKELETON_MARKUP;
    }

    // Fetch new data in background
    let items = [];
    let source = "backend";
    try {
      items = await fetchData(BACKEND_ENDPOINT);
    } catch (backendErr) {
      console.warn("Backend upcoming fetch failed, falling back to Jikan:", backendErr);
      source = "jikan";
      try {
        items = await fetchData(JIKAN_ENDPOINT);
      } catch (jikanErr) {
        console.error("Jikan upcoming fetch also failed:", jikanErr);
        if (!cachedData) { // Only show error if no cache to fall back on
          listEl.innerHTML = '<div class="anime-card-meta">Unable to load upcoming anime right now.</div>';
        }
        return;
      }
    }

    // Only update if new data is different or if we just showed skeletons
    if (JSON.stringify(items) !== JSON.stringify(currentItems) || listEl.innerHTML === SKELETON_MARKUP) {
      renderRows(items);
    }

    try {
      storage?.setItem?.(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: items, source }));
    } catch (e) {
      console.error("Error writing upcoming cache:", e);
    }
  }

  void loadData(); // Initial load
  upcomingTimer = timers.setInterval(() => loadData({ force: true }), CACHE_TTL_MS); // Refresh periodically

  return Object.freeze({
    render() {
      // This render is primarily for initial load and internal updates.
      // External calls to render() might trigger a refresh if needed.
      if (!currentItems.length) {
        void loadData();
      } else {
        renderRows(currentItems);
      }
    },
    destroy() {
      if (upcomingTimer) timers.clearInterval(upcomingTimer);
    }
  });
}

function readClipValue(storage) {
  return String(storage?.getItem?.(DASHBOARD_CLIP_KEY) || "").trim();
}

function inferMediaTagFromDataUrl(value) {
  if (String(value || "").startsWith("data:video/")) return "video";
  return "img";
}

function initClipCard({ storage = globalThis.localStorage } = {}) {
  const card = document.querySelector(".clip-placeholder-card");
  if (!card) return { render() { }, destroy() { } };

  let clipSignature = "";
  let livePreviewUrl = "";
  let livePreviewTag = "img";

  function clearLivePreview() {
    if (!livePreviewUrl) return;
    URL.revokeObjectURL(livePreviewUrl);
    livePreviewUrl = "";
    livePreviewTag = "img";
  }

  function render() {
    const saved = livePreviewUrl || readClipValue(storage);
    const nextSignature = saved ? `filled:${saved.length}:${saved.slice(0, 96)}` : "empty";
    if (clipSignature === nextSignature) return;
    clipSignature = nextSignature;

    if (!saved) {
      card.innerHTML = `
        <input type="file" id="clip-upload" accept="video/*,image/*" hidden />
        <span class="placeholder-text">Insert Your Favorite Clip</span>
      `;
      card.classList.remove("has-media");
      return;
    }

    const mediaTag = livePreviewUrl ? livePreviewTag : inferMediaTagFromDataUrl(saved);
    const mediaMarkup = mediaTag === "video"
      ? `<video class="clip-media" src="${saved}" autoplay muted loop playsinline preload="metadata" aria-label="Favorite clip preview"></video>`
      : `<img class="clip-media" src="${saved}" alt="Favorite clip preview" loading="lazy" />`;
    card.innerHTML = `
      ${mediaMarkup}
      <button type="button" class="remove-clip" aria-label="Remove favorite clip">Remove</button>
    `;
    card.classList.add("has-media");
  }

  function onClick(event) {
    const removeButton = event.target.closest(".remove-clip");
    if (removeButton) {
      event.preventDefault();
      clearLivePreview();
      storage?.removeItem?.(DASHBOARD_CLIP_KEY);
      render();
      return;
    }
    const uploadInput = card.querySelector("#clip-upload");
    if (!uploadInput) return;
    uploadInput.click();
  }

  function onChange(event) {
    const input = event.target.closest("#clip-upload");
    if (!input) return;
    const file = input.files?.[0];
    if (!file) return;
    clearLivePreview();
    livePreviewUrl = URL.createObjectURL(file);
    livePreviewTag = String(file.type || "").toLowerCase().startsWith("video/") ? "video" : "img";

    // Keep persistence for images only; avoid storage quota failures for large videos.
    if (livePreviewTag === "img") {
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result || "");
        if (value) storage?.setItem?.(DASHBOARD_CLIP_KEY, value);
      };
      reader.readAsDataURL(file);
    } else {
      storage?.removeItem?.(DASHBOARD_CLIP_KEY);
    }
    render();
    input.value = "";
  }

  card.addEventListener("click", onClick);
  card.addEventListener("change", onChange);
  render();

  return Object.freeze({
    render,
    destroy() {
      clearLivePreview();
      card.removeEventListener("click", onClick);
      card.removeEventListener("change", onChange);
    }
  });
}

function initDashboardModules(ctx) {
  const heroCarousel = initHeroCarousel(ctx);
  const recommendations = initRecommendations(ctx);
  const upcomingWidget = initUpcomingWidget(ctx);
  const clipCard = initClipCard(ctx);

  return Object.freeze({
    heroCarousel,
    recommendations,
    upcomingWidget,
    clipCard,
    render() {
      const state = ctx?.store?.getState?.() || {};
      const libraryItems = ctx?.libraryStore?.getAll?.() || [];
      const topOngoing = getTopOngoingAnikoto(state, 10, libraryItems);
      heroCarousel?.render?.(topOngoing);
      recommendations?.render?.();
      upcomingWidget?.render?.();
      clipCard?.render?.();
    },
    destroy() {
      clipCard?.destroy?.();
      upcomingWidget?.destroy?.();
      recommendations?.destroy?.();
      heroCarousel?.destroy?.();
    }
  });
}


// ═══════════════════════════════════════════════════════
// MY JOURNEY — MILESTONE TRACKER
// ═══════════════════════════════════════════════════════

const MILESTONE_NOTIF_KEY = "animex_notif_cache_v1";

function loadCachedNotifications() {
  try {
    const raw = localStorage.getItem(MILESTONE_NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCachedNotifications(items) {
  try { localStorage.setItem(MILESTONE_NOTIF_KEY, JSON.stringify(items)); } catch { }
}

const MILESTONES_DEF = [
  {
    key: "lost_found",
    icon: "🔍",
    name: "Lost & Found",
    desc: "Save your first anime",
    check: (stats) => stats.total >= 1
  },
  {
    key: "sequel_hunter",
    icon: "📺",
    name: "Sequel Hunter",
    desc: "Receive a sequel alert",
    check: (_, notifs) => notifs.some((n) => n.type === "SEQUEL_ANNOUNCED")
  },
  {
    key: "dub_scout",
    icon: "🔊",
    name: "Dub Scout",
    desc: "Get a dub notification",
    check: (_, notifs) => notifs.some((n) => n.type === "DUB_AVAILABLE")
  },
  {
    key: "series_finished",
    icon: "✅",
    name: "Series Finished",
    desc: "Complete your first series",
    check: (stats) => stats.completed >= 1
  },
  {
    key: "archivist",
    icon: "🗂️",
    name: "The Archivist",
    desc: "Save 10+ anime",
    check: (stats) => stats.total >= 10
  },
  {
    key: "active_tracker",
    icon: "👁️",
    name: "Active Tracker",
    desc: "Follow 3+ airing anime",
    check: (stats) => stats.watching >= 3
  }
];

function initMilestones({ libraryStore }) {
  const grid = document.getElementById("milestone-grid");
  if (!grid) return { destroy() { } };

  let cachedNotifs = loadCachedNotifications();

  function render() {
    const stats = libraryStore.getStats();
    const tiles = MILESTONES_DEF.map((m) => {
      const isCompleted = m.check(stats, cachedNotifs);
      
      let isUnlocked = false;
      if (!isCompleted) {
         if (m.key === "lost_found" || m.key === "archivist") isUnlocked = stats.total > 0;
         if (m.key === "active_tracker") isUnlocked = stats.watching > 0;
         if (m.key === "series_finished") isUnlocked = stats.watching > 0;
      }
      
      const stateClass = isCompleted ? "completed" : (isUnlocked ? "unlocked" : "locked");
      const checkmark = isCompleted ? `<div class="milestone-checkmark"><span class="material-icons" style="font-size:0.75rem; font-weight:bold;">check</span></div>` : '';

      return `<div class="milestone-tile ${stateClass}" title="${escapeHtml(m.desc)}">
        <div style="position:relative;">
          <span class="milestone-icon">${m.icon}</span>
          ${checkmark}
        </div>
        <span class="milestone-name">${escapeHtml(m.name)}</span>
        <span class="milestone-desc">${escapeHtml(m.desc)}</span>
      </div>`;
    });
    grid.innerHTML = tiles.join("");
  }

  // Called by initTrackerFeed when backend notifications arrive
  function onNotificationsLoaded(notifs) {
    cachedNotifs = notifs;
    saveCachedNotifications(notifs);
    render();
  }

  const unsub = libraryStore.subscribe(render);
  render();

  return Object.freeze({ render, onNotificationsLoaded, destroy() { unsub(); } });
}

// ═══════════════════════════════════════════════════════
// MY TRACKER FEED
// ═══════════════════════════════════════════════════════

const TRACKER_NOTIF_CACHE_KEY = "animex_tracker_notifs_v1";

const TRACKER_TYPE_META = {
  SEQUEL_ANNOUNCED: { icon: "📺", cls: "sequel", label: "SEQUEL" },
  DUB_AVAILABLE: { icon: "🔊", cls: "dub", label: "DUB" },
  FINISHED_AIRING: { icon: "✅", cls: "finished", label: "FINISHED" },
  WATCH_REMINDER: { icon: "⏰", cls: "reminder", label: "REMINDER" },
  TRACKING: { icon: "👁", cls: "tracking", label: "TRACKING" }
};

function relativeTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - Number(ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function renderTrackerItems(container, items) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<div class="tracker-empty" style="text-align: center; padding: 2.5rem 1rem;">
      <span style="font-size:2.2rem; opacity: 0.5;">🎯</span>
      <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.85rem;">No recent activities detected on the HUD.</p>
    </div>`;
    return;
  }

  container.innerHTML = items.slice(0, 20).map((item) => {
    const type = item.type || "TRACKING";
    const meta = TRACKER_TYPE_META[type] || TRACKER_TYPE_META.TRACKING;
    const time = relativeTime(item.created_at || item.ts);
    
    // Determine terminal label
    let label = meta.label;
    let labelClass = `label-${type.toLowerCase().replace('_', '-')}`;
    
    // Format message for terminal style
    // Example: [ LIVE ] Tracking Naruto → Episode 12 / 220
    let message = escapeHtml(item.title || item.message || "Update");
    if (type === "TRACKING") {
      const parts = message.split(' — ');
      if (parts.length > 1) {
        message = `${parts[0]} <span class="terminal-arrow">→</span> ${parts[1]}`;
      }
    } else if (message.includes(' for ')) {
       const parts = message.split(' for ');
       message = `${parts[1]} <span class="terminal-arrow">→</span> ${parts[0]}`;
    }

    return `<div class="terminal-entry">
      <span class="terminal-label ${labelClass}">[ ${label} ]</span>
      <div class="terminal-content">${message}</div>
      <div class="terminal-time">${time}</div>
    </div>`;
  }).join("");
}

function initTrackerFeed({ libraryStore, milestones = null, userId = null }) {
  const listEl = document.getElementById("tracker-feed-list");
  const countBadge = document.getElementById("tracker-count-badge");
  const liveBadge = document.getElementById("tracker-live-badge");
  if (!listEl) return { destroy() { }, addEvent() { } };

  let backendItems = [];
  let localItems = [];

  // ── Build local tracking items from library (watching status) ──────────
  function buildLocalItems() {
    const watching = libraryStore.getByStatus("watching");
    return watching.map((a) => ({
      type: "TRACKING",
      title: String(a?.title || "Unknown"),
      message: `Tracking "${a?.title}" — ${a?.episodes ? `${a.progress || 0}/${a.episodes} eps` : "airing"}`,
      ts: a?.updatedAt || 0
    }));
  }

  // ── Merge: backend events first, then local tracking items ─────────────
  function merge() {
    const all = [
      ...backendItems.map((n) => ({
        type: n.type || "TRACKING",
        title: n.message || String(n.type || ""),
        message: n.message,
        created_at: n.created_at ? new Date(n.created_at).getTime() : Date.now()
      })),
      ...localItems
    ];
    // Dedupe by title
    const seen = new Set();
    return all.filter((item) => {
      const key = item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function render() {
    localItems = buildLocalItems();
    const items = merge();
    renderTrackerItems(listEl, items);

    // Update count badge
    if (countBadge) {
      const count = items.length;
      if (count > 0) {
        countBadge.textContent = count > 99 ? "99+" : String(count);
        countBadge.hidden = false;
      } else {
        countBadge.hidden = true;
      }
    }

    // Show Live badge in header if any tracking entry exists
    if (liveBadge) {
      if (localItems.length > 0) {
        liveBadge.innerHTML = `<span class="live-badge-glow"></span>LIVE HUD`;
        liveBadge.hidden = false;
        liveBadge.classList.add('label-live');
      } else {
        liveBadge.hidden = true;
      }
    }
  }

  // ── Fetch backend notifications ────────────────────────────────────────
  async function fetchFromBackend() {
    try {
      const res = await authFetch(apiUrl('/notifications/me'), {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) return;
      const json = await res.json();
      backendItems = Array.isArray(json?.data) ? json.data : [];
      // Persist for milestones
      try { localStorage.setItem(TRACKER_NOTIF_CACHE_KEY, JSON.stringify(backendItems)); } catch { }
      milestones?.onNotificationsLoaded?.(backendItems);
    } catch {
      // Offline — restore from cache
      try {
        const raw = localStorage.getItem(TRACKER_NOTIF_CACHE_KEY);
        backendItems = raw ? JSON.parse(raw) : [];
      } catch { backendItems = []; }
    }
    render();
  }

  // ── Add a live event (called by socket listener) ───────────────────────
  function addEvent(eventData) {
    if (!eventData) return;
    backendItems.unshift({
      type: eventData.type || "SEQUEL_ANNOUNCED",
      message: eventData.message || "New update",
      created_at: new Date().toISOString()
    });
    milestones?.onNotificationsLoaded?.(backendItems);
    render();
  }

  const unsub = libraryStore.subscribe(render);
  render();
  void fetchFromBackend();

  return Object.freeze({ render, addEvent, destroy() { unsub(); } });
}

export {
  NEWS_CACHE_KEY,
  NEWS_CACHE_TTL_MS,
  NEWS_REFRESH_INTERVAL_MS,
  NEWS_TOTAL_LIMIT,
  DASHBOARD_CLIP_KEY,
  initDashboardModules,
  initMilestones,
  initTrackerFeed
};
