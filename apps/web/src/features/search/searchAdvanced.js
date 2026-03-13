import { STATUS } from "../../store.js";
import { BACKEND_URL, withAuthHeaders } from "../../config.js";

const SEARCH_PAGE_SIZE = 25;
const LARGE_RENDER_THRESHOLD = 100;
const RENDER_CHUNK_SIZE = 40;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function debounce(fn, delayMs) {
  let timer = 0;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

function initSearchAdvanced({
  store,
  controller,
  libraryStore,
  selectors,
  toast = null,
  navigateToView = null
}) {
  const refs = {
    globalSearchInput: document.getElementById("global-search-input"),
    results: document.getElementById("search-results"),
    resultCount: document.getElementById("search-result-count"),
    pagination: document.getElementById("search-pagination"),
    submit: document.getElementById("search-submit-btn"),
    reset: document.getElementById("search-reset-btn"),
    genre: document.getElementById("search-genre"),
    tag: document.getElementById("search-tag"),
    status: document.getElementById("search-status"),
    language: document.getElementById("search-language"),
    season: document.getElementById("search-season"),
    year: document.getElementById("search-year"),
    rating: document.getElementById("search-rating"),
    type: document.getElementById("search-type"),
    suggestions: document.getElementById("search-suggestions")
  };

  const ui = {
    page: 1,
    pageSize: SEARCH_PAGE_SIZE,
    query: "",
    searchRequestSeq: 0,
    filters: {
      genre: "",
      tag: "",
      status: "",
      language: "",
      season: "",
      year: "",
      rating: "",
      type: ""
    }
  };
  let renderSeq = 0;
  let chunkFrameId = 0;

  function getSearchDataset() {
    const snapshot = store.getState();
    return Array.isArray(snapshot?.searchResults)
      ? snapshot.searchResults
      : [];
  }

  function getSearchMeta() {
    const snapshot = store.getState();
    const meta = snapshot?.searchMeta || {};
    return {
      currentPage: Math.max(1, Number(meta?.currentPage || 1)),
      hasNextPage: Boolean(meta?.hasNextPage),
      lastVisiblePage: Math.max(1, Number(meta?.lastVisiblePage || 1)),
      totalItems: Math.max(0, Number(meta?.totalItems || 0)),
      itemsPerPage: Math.max(1, Number(meta?.itemsPerPage || 25))
    };
  }

  function buildResultCards(items) {
    if (!items.length) {
      return `
        <div class="tracker-empty" style="grid-column: 1 / -1; margin: 4rem auto; text-align: center;">
          <span class="material-icons" style="font-size: 4rem; color: var(--text-gray-600); margin-bottom: 1rem;">search_off</span>
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">No results found</h3>
          <p class="anime-card-meta">Try adjusting your filters or search query.</p>
        </div>
      `;
    }
    return items.map((item) => {
      const score = Number(item?.score || 0);
      const scoreText = Number.isFinite(score) && score > 0 ? score.toFixed(1) : "N/A";
      const malId = Number(item.id || item.malId || item.mal_id || 0);
      const title = escapeHtml(String(item.title || "Unknown"));
      const genres = escapeHtml((item.genres || []).slice(0, 3).join(", ") || "Unknown");
      const image = escapeHtml(String(item.poster || item.image || ""));
      
      const totalEp = item.total_episodes || item.episodes || 0;
      const releasedEp = item.released_episodes || item.episodesReleased || 0;
      const status = String(item.airing_status || item.status || "").toLowerCase();
      
      const epLabel = totalEp > 0
        ? `Ep ${Math.min(releasedEp || totalEp, totalEp)} / ${totalEp}`
        : (status.includes("airing") ? `Ep ${releasedEp || 0} (Airing)` : "Ep ?");
      return `
        <div class="search-result-cell premium-card-wrapper">
          <div class="premium-cover-card" data-id="${malId}">
            <div class="cover-img-wrap" data-action="open-anime-modal" data-id="${malId}">
              <img class="cover-img" src="${image}" alt="${title}">
              <span class="cover-badge">★ ${scoreText}</span>
              <div class="cover-gradient"></div>
            </div>
            <div class="cover-info" data-action="open-anime-modal" data-id="${malId}">
              <h4 class="cover-title" title="${title}">${title}</h4>
              <p class="cover-genres">${genres} · ${epLabel}</p>
            </div>
            <div class="cover-actions">
              <button class="status-pill" type="button" data-search-action="add-plan" data-id="${malId}">Plan</button>
              <button class="status-pill" type="button" data-search-action="add-watching" data-id="${malId}">Watching</button>
              <button class="status-pill active" type="button" data-search-action="add-completed" data-id="${malId}">Completed</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function cancelChunkRender() {
    renderSeq += 1;
    if (!chunkFrameId) return;
    cancelAnimationFrame(chunkFrameId);
    chunkFrameId = 0;
  }

  function renderCards(items) {
    if (!refs.results) return;
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) {
      refs.results.innerHTML = buildResultCards([]);
      return;
    }
    if (rows.length <= LARGE_RENDER_THRESHOLD) {
      refs.results.innerHTML = buildResultCards(rows);
      return;
    }

    const currentRender = ++renderSeq;
    refs.results.innerHTML = "";
    let cursor = 0;
    function pump() {
      if (currentRender !== renderSeq) return;
      const slice = rows.slice(cursor, cursor + RENDER_CHUNK_SIZE);
      if (slice.length) refs.results.insertAdjacentHTML("beforeend", buildResultCards(slice));
      cursor += slice.length;
      if (cursor < rows.length) {
        chunkFrameId = requestAnimationFrame(pump);
        return;
      }
      chunkFrameId = 0;
    }
    pump();
  }

  function renderFooter(totalResults, meta) {
    if (refs.resultCount) {
      const pageInfo = `Page ${ui.page} / ${meta.lastVisiblePage}`;
      const totalItemsText = meta.totalItems > 0
        ? ` of ${meta.totalItems}`
        : "";
      refs.resultCount.textContent = totalResults
        ? `${pageInfo} - ${totalResults} results${totalItemsText}`
        : `${pageInfo} - No results`;
    }
    if (!refs.pagination) return;
    refs.pagination.innerHTML = `
      <button class="page-btn" data-search-action="page" data-page="${ui.page - 1}" ${ui.page > 1 ? "" : "disabled"}>Prev</button>
      <button class="page-btn active" type="button" aria-current="page">${ui.page}</button>
      <button class="page-btn" data-search-action="page" data-page="${ui.page + 1}" ${meta.hasNextPage ? "" : "disabled"}>Next</button>
    `;
  }

  function populateStaticFilters() {
    if (refs.season) refs.season.innerHTML = '<option value="">Select Season</option><option value="winter">Winter</option><option value="spring">Spring</option><option value="summer">Summer</option><option value="fall">Fall</option>';
    if (refs.status) refs.status.innerHTML = '<option value="">Select Status</option><option value="airing">Airing</option><option value="finished">Finished</option><option value="upcoming">Upcoming</option>';
    if (refs.rating) refs.rating.innerHTML = '<option value="">Select Rating</option><option value="g">G</option><option value="pg">PG</option><option value="pg13">PG-13</option><option value="r">R</option><option value="rplus">R+</option><option value="rx">Rx</option>';
    if (refs.type) refs.type.innerHTML = '<option value="">Select Type</option><option value="tv">TV</option><option value="movie">Movie</option><option value="ova">OVA</option><option value="ona">ONA</option><option value="special">Special</option>';
    if (refs.language) refs.language.innerHTML = '<option value="">Select Language</option><option value="japanese">Japanese</option><option value="english">English</option>';

    // Premium Curated Genres
    const coreGenres = [
      { id: 1, name: "Action" }, { id: 2, name: "Adventure" }, { id: 4, name: "Comedy" },
      { id: 8, name: "Drama" }, { id: 10, name: "Fantasy" }, { id: 14, name: "Horror" },
      { id: 7, name: "Mystery" }, { id: 22, name: "Romance" }, { id: 24, name: "Sci-Fi" },
      { id: 36, name: "Slice of Life" }, { id: 30, name: "Sports" }, { id: 37, name: "Supernatural" },
      { id: 41, name: "Suspense" }
    ];
    if (refs.genre) {
      refs.genre.innerHTML = '<option value="">Select Genre</option>' + coreGenres.sort((a, b) => a.name.localeCompare(b.name)).map(g => `<option value="${g.id}">${g.name}</option>`).join("");
    }

    // Premium Curated Tags / Themes
    const topTags = [
      { id: 43, name: "Josei" }, { id: 50, name: "Adult Cast" }, { id: 58, name: "Gore" }, { id: 62, name: "Isekai" },
      { id: 63, name: "Iyashikei" }, { id: 65, name: "Magical Sex Shift" }, { id: 17, name: "Martial Arts" },
      { id: 18, name: "Mecha" }, { id: 38, name: "Military" }, { id: 19, name: "Music" },
      { id: 20, name: "Parody" }, { id: 40, name: "Psychological" }, { id: 73, name: "Reincarnation" },
      { id: 23, name: "School" }, { id: 29, name: "Space" }, { id: 31, name: "Super Power" },
      { id: 78, name: "Time Travel" }, { id: 32, name: "Vampire" }, { id: 82, name: "Urban Fantasy" }
    ];
    if (refs.tag) {
      refs.tag.innerHTML = '<option value="">Select Tag</option>' + topTags.sort((a, b) => a.name.localeCompare(b.name)).map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    }

    // Dynamic Year list from 1990 to next year
    if (refs.year) {
      const currentYear = new Date().getFullYear();
      let yearsHtml = '<option value="">Select Year</option>';
      for (let y = currentYear + 1; y >= 1990; y--) {
        yearsHtml += `<option value="${y}">${y}</option>`;
      }
      refs.year.innerHTML = yearsHtml;
    }
  }

  function hideSuggestions() {
    if (!refs.suggestions) return;
    refs.suggestions.classList.remove('active');
    setTimeout(() => { if (refs.suggestions) refs.suggestions.style.display = 'none'; }, 200);
  }

  async function fetchLiveSuggestions(query) {
    if (!refs.suggestions) return;
    if (!query) {
      hideSuggestions();
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/anime/search?q=${encodeURIComponent(query)}&limit=5`, {
        headers: withAuthHeaders()
      });
      const payload = await res.json();
      const items = Array.isArray(payload?.data) ? payload.data : [];

      if (!items.length) {
        refs.suggestions.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-gray-400); font-size: 0.85rem;">No results found</div>';
      } else {
        refs.suggestions.innerHTML = items.map(item => {
          const malId = item.mal_id || 0;
          let engTitle = item.title_english;
          if (!engTitle && Array.isArray(item.titles)) {
            const eng = item.titles.find(t => t.type === 'English');
            if (eng) engTitle = eng.title;
          }
          const title = escapeHtml(engTitle || item.title || "Unknown");
          const img = escapeHtml(item.images?.jpg?.image_url || "");
          const type = escapeHtml(item.type || "TV");
          const year = item.year || item.aired?.prop?.from?.year || "";
          return `
            <a href="#" class="suggestion-item" data-action="open-anime-modal" data-id="${malId}">
              <img src="${img}" class="suggestion-img" alt="${title}" loading="lazy"/>
              <div class="suggestion-details">
                <span class="suggestion-title">${title}</span>
                <span class="suggestion-meta">${type} ${year ? '• ' + year : ''}</span>
              </div>
            </a>
          `;
        }).join('') + `
          <div class="suggestion-view-all" data-search-action="view-all-results">View all results for "${escapeHtml(query)}"</div>
        `;
      }
      refs.suggestions.style.display = 'flex';
      setTimeout(() => refs.suggestions.classList.add('active'), 10);
    } catch (e) {
      console.error("Live suggestion failed", e);
    }
  }

  async function performQuery(rawQuery, page = 1) {
    const query = String(rawQuery || "").trim();
    if (typeof navigateToView === "function") navigateToView("search-view");
    ui.query = query;
    ui.page = Math.max(1, Number(page) || 1);
    const reqId = ++ui.searchRequestSeq;

    hideSuggestions();

    store.setLoading("search", true);
    store.setError("search", "");
    render();
    try {
      // Delegate completely to server-side filtering
      await controller.performSearch(query, ui.page, ui.filters);
      if (reqId !== ui.searchRequestSeq) return;

      // Auto-Reset: Clear UI immediately after search succeeds but retain current results
      if (refs.globalSearchInput) refs.globalSearchInput.value = "";
      if (refs.genre) refs.genre.value = "";
      if (refs.tag) refs.tag.value = "";
      if (refs.status) refs.status.value = "";
      if (refs.language) refs.language.value = "";
      if (refs.season) refs.season.value = "";
      if (refs.year) refs.year.value = "";
      if (refs.rating) refs.rating.value = "";
      if (refs.type) refs.type.value = "";

      // We purposefully DO NOT wipe `ui.filters` variables here because pagination (Next Page) 
      // needs to remember the filters that produced this current set.

    } finally {
      if (reqId !== ui.searchRequestSeq) return;
      store.setLoading("search", false);
      render();
    }
  }

  function render() {
    if (!refs.results) return;
    cancelChunkRender();
    const snapshot = store.getState();
    const meta = getSearchMeta();
    const loading = Boolean(snapshot?.loading?.search);
    const error = String(snapshot?.errors?.search || "");
    if (!loading) ui.page = meta.currentPage;

    if (loading) {
      refs.results.innerHTML = Array.from({ length: Math.min(ui.pageSize, 10) }).map(() => `
        <article class="anime-card-v2" style="pointer-events: none;">
          <div class="anime-modal-skeleton" style="width: 100%; aspect-ratio: 2/3; border-radius: 0.5rem; margin-bottom: 0.75rem;"></div>
          <div class="anime-card-content">
            <div class="anime-modal-skeleton anime-modal-line-skeleton short" style="height: 14px; margin-bottom: 8px;"></div>
            <div class="anime-modal-skeleton anime-modal-line-skeleton" style="height: 12px; width: 60%;"></div>
          </div>
        </article>
      `).join("");
      renderFooter(0, meta);
      return;
    }

    if (error) {
      refs.results.innerHTML = `<div class="empty-state card"><p class="anime-card-meta">${escapeHtml(error)}</p></div>`;
      renderFooter(0, meta);
      return;
    }

    const rows = getSearchDataset();
    renderCards(rows);
    renderFooter(rows.length, meta);
  }

  function updateFilterStateFromInputs() {
    ui.filters.genre = refs.genre?.value || "";
    ui.filters.tag = refs.tag?.value || "";
    ui.filters.status = refs.status?.value || "";
    ui.filters.language = refs.language?.value || "";
    ui.filters.season = refs.season?.value || "";
    ui.filters.year = refs.year?.value || "";
    ui.filters.rating = refs.rating?.value || "";
    ui.filters.type = refs.type?.value || "";
  }

  async function onClick(event) {
    const actionBtn = event.target.closest("[data-search-action]");
    if (!actionBtn) return;
    const action = String(actionBtn.getAttribute("data-search-action") || "");

    if (action === "view-all-results") {
      event.preventDefault();
      performQuery(refs.globalSearchInput?.value || "", 1);
      return;
    }

    if (action === "page") {
      const nextPage = Number(actionBtn.getAttribute("data-page") || 1);
      if (!Number.isFinite(nextPage) || nextPage < 1) return;
      await performQuery(ui.query, Math.trunc(nextPage));
      refs.results?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const malId = Number(actionBtn.getAttribute("data-id") || 0);
    if (!malId) return;
    const source = getSearchDataset();
    const anime = source.find((row) => Number(row?.malId || 0) === malId);
    if (!anime) return;
    if (action === "add-plan") {
      libraryStore.upsert({ ...anime, status: STATUS.PLAN }, STATUS.PLAN);
      toast?.show?.("Added to watchlist");
    } else if (action === "add-watching") {
      libraryStore.upsert({ ...anime, status: STATUS.WATCHING }, STATUS.WATCHING);
      toast?.show?.("Marked as watching");
    } else if (action === "add-completed") {
      libraryStore.upsert({ ...anime, status: STATUS.COMPLETED }, STATUS.COMPLETED);
      toast?.show?.("Marked as completed");
    }
  }

  const onGlobalEnter = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void performQuery(refs.globalSearchInput?.value || "", 1);
    refs.globalSearchInput?.blur();
  };

  const debouncedSuggest = debounce(() => {
    fetchLiveSuggestions(refs.globalSearchInput?.value || "");
  }, 500);

  const onGlobalFocus = () => {
    document.querySelector(".search-wrapper")?.classList.add("is-open");
    if (refs.globalSearchInput?.value) fetchLiveSuggestions(refs.globalSearchInput.value);
  };

  refs.globalSearchInput?.addEventListener("input", debouncedSuggest);
  refs.globalSearchInput?.addEventListener("keydown", onGlobalEnter);
  refs.globalSearchInput?.addEventListener("focus", onGlobalFocus);

  // Close suggestions if clicked outside
  document.addEventListener("click", (e) => {
    if (refs.suggestions && !refs.suggestions.contains(e.target) && e.target !== refs.globalSearchInput) {
      hideSuggestions();
      document.querySelector(".search-wrapper")?.classList.remove("is-open");
    }
  });

  refs.submit?.addEventListener("click", () => {
    updateFilterStateFromInputs();
    void performQuery(refs.globalSearchInput?.value || "", 1);
  });

  refs.reset?.addEventListener("click", () => {
    if (refs.genre) refs.genre.value = "";
    if (refs.tag) refs.tag.value = "";
    if (refs.status) refs.status.value = "";
    if (refs.language) refs.language.value = "";
    if (refs.season) refs.season.value = "";
    if (refs.year) refs.year.value = "";
    if (refs.rating) refs.rating.value = "";
    if (refs.type) refs.type.value = "";
    if (refs.globalSearchInput) refs.globalSearchInput.value = "";
    ui.filters = { genre: "", tag: "", status: "", language: "", season: "", year: "", rating: "", type: "" };
    ui.query = "";
    ui.page = 1;
    ui.searchRequestSeq += 1;
    store.set("searchResults", []);
    store.set("searchMeta", {
      currentPage: 1,
      hasNextPage: false,
      lastVisiblePage: 1,
      totalItems: 0,
      itemsPerPage: 25
    });
    store.setError("search", "");
    store.setLoading("search", false);
    render();
  });

  [refs.genre, refs.tag, refs.status, refs.language, refs.season, refs.year, refs.rating, refs.type]
    .filter(Boolean)
    .forEach((el) => {
      el.addEventListener("change", updateFilterStateFromInputs);
      el.addEventListener("input", updateFilterStateFromInputs);
    });

  refs.results?.addEventListener("click", onClick);
  refs.pagination?.addEventListener("click", onClick);
  refs.suggestions?.addEventListener("click", onClick);

  populateStaticFilters();

  const unsubscribe = store.subscribe(() => {
    render();
  });

  render();

  return Object.freeze({
    render,
    destroy() {
      cancelChunkRender();
      unsubscribe();
      refs.globalSearchInput?.removeEventListener("input", debouncedSuggest);
      refs.globalSearchInput?.removeEventListener("keydown", onGlobalEnter);
      refs.globalSearchInput?.removeEventListener("focus", onGlobalFocus);
      refs.results?.removeEventListener("click", onClick);
      refs.pagination?.removeEventListener("click", onClick);
      refs.suggestions?.removeEventListener("click", onClick);
    }
  });
}

export { initSearchAdvanced };
