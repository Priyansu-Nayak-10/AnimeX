import { STATUS } from "../../store.js";

function escapeHtml(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
function formatWatchTime(totalMinutes) { const mins = Math.max(0, Math.floor(Number(totalMinutes || 0))); const hours = Math.floor(mins / 60); const rest = mins % 60; return `${hours}h ${rest}m`; }
function parseDurationMinutes(value) { if (typeof value === "number" && Number.isFinite(value)) return value; const text = String(value || "").toLowerCase(); const minutes = text.match(/(\d+)\s*min/); if (minutes) return Number(minutes[1]) || 24; const hours = text.match(/(\d+)\s*hr/); if (hours) return (Number(hours[1]) || 0) * 60; return 24; }
function toDateKey(timestamp) { const date = new Date(Number(timestamp || 0)); if (Number.isNaN(date.getTime())) return ""; return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function calculateCompletionStreak(timestamps) { const uniqueDays = [...new Set((timestamps || []).map(toDateKey).filter(Boolean))].sort().reverse(); if (!uniqueDays.length) return 0; let streak = 1; let cursor = new Date(uniqueDays[0]).getTime(); for (let i = 1; i < uniqueDays.length; i += 1) { const current = new Date(uniqueDays[i]).getTime(); if ((cursor - current) === (24 * 60 * 60 * 1000)) { streak += 1; cursor = current; } else break; } return streak; }
function describeDonutArc(cx, cy, outerR, innerR, startDeg, endDeg) { const toRad = (d) => ((d - 90) * Math.PI) / 180; const pt = (r, d) => ({ x: cx + r * Math.cos(toRad(d)), y: cy + r * Math.sin(toRad(d)) }); const o1 = pt(outerR, startDeg), o2 = pt(outerR, endDeg); const i1 = pt(innerR, endDeg), i2 = pt(innerR, startDeg); const large = endDeg - startDeg > 180 ? 1 : 0; return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`; }
function normalizeGenreNames(value) { return (Array.isArray(value) ? value : []).map((genre) => (typeof genre === "string" ? genre : genre?.name)).map((genre) => String(genre || "").trim()).filter(Boolean); }
function normalizeStudioName(item) { if (typeof item?.studio === "string" && item.studio.trim()) return item.studio.trim(); const studios = Array.isArray(item?.studios) ? item.studios : []; const firstStudio = studios.find((studio) => (typeof studio === "string" ? studio.trim() : studio?.name)); const studioName = typeof firstStudio === "string" ? firstStudio : firstStudio?.name; return String(studioName || "").trim(); }
function humanizeStatus(value) { const raw = String(value || "").trim().toLowerCase(); if (!raw) return "Updated"; return raw.charAt(0).toUpperCase() + raw.slice(1); }

const GENRE_COLOR_MAP = Object.freeze({ action: "var(--genre-action)", fantasy: "var(--genre-fantasy)", adventure: "var(--genre-adventure)", suspense: "var(--genre-mystery)", comedy: "var(--genre-comedy)" });
const GENRE_FALLBACK_COLORS = Object.freeze(["var(--chart-purple)", "var(--chart-blue)", "var(--chart-cyan)", "var(--chart-green)", "var(--chart-orange)", "var(--chart-pink)"]);
function getGenreColor(genreName, index = 0) { const key = String(genreName || "").trim().toLowerCase(); if (GENRE_COLOR_MAP[key]) return GENRE_COLOR_MAP[key]; return GENRE_FALLBACK_COLORS[index % GENRE_FALLBACK_COLORS.length]; }
function getEntryRating(item) { const candidates = [Number(item?.userRating), Number(item?.rating), Number(item?.score)]; return candidates.find((value) => Number.isFinite(value) && value > 0) || 0; }
function pickTopCount(map) { const rows = Object.entries(map || {}); if (!rows.length) return "No data"; rows.sort((a, b) => b[1] - a[1]); return rows[0]?.[0] || "No data"; }
const DONUT_PALETTE = [{ from: 'var(--chart-purple)', to: 'var(--chart-purple)' }, { from: 'var(--chart-blue)', to: 'var(--chart-blue)' }, { from: 'var(--chart-cyan)', to: 'var(--chart-cyan)' }, { from: 'var(--chart-green)', to: 'var(--chart-green)' }, { from: 'var(--chart-orange)', to: 'var(--chart-orange)' }, { from: 'var(--chart-pink)', to: 'var(--chart-pink)' }];

const LEVEL_TITLES = [
  { threshold: 50, title: "Sage of Six Paths" },
  { threshold: 30, title: "Anime Legend" },
  { threshold: 20, title: "Series Specialist" },
  { threshold: 10, title: "Seasoned Viewer" },
  { threshold: 0, title: "Rookie Otaku" }
];

function calculatePlayerStats(episodes, completed) {
  const xp = (episodes * 12) + (completed * 150);
  const level = Math.floor(Math.sqrt(xp / 100)) || 1;
  const currentLevelXp = Math.pow(level, 2) * 100;
  const nextLevelXp = Math.pow(level + 1, 2) * 100;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  const title = LEVEL_TITLES.find(t => level >= t.threshold)?.title || "Rookie Otaku";

  return { level, title, xp, nextLevelXp: Math.floor(nextLevelXp), progress: Math.min(100, Math.max(0, progress)) };
}

function renderHeatmap(container, items) {
  if (!container) return;
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const startDate = new Date(oneYearAgo);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);

  const activityMap = {};
  items.forEach(item => {
    const dates = [item.updatedAt, item.completedAt].filter(t => t > oneYearAgo.getTime());
    dates.forEach(t => {
      const key = toDateKey(t);
      activityMap[key] = (activityMap[key] || 0) + 1;
    });
  });

  const dates = [];
  for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(new Date(cursor));
  }

  const weeks = [];
  dates.forEach((date, index) => {
    const weekIndex = Math.floor(index / 7);
    if (!weeks[weekIndex]) weeks[weekIndex] = [];
    weeks[weekIndex].push(date);
  });

  let totalUpdates = 0;
  let busiestCount = 0;
  let busiestLabel = "No activity yet";

  const weekColumns = weeks.map((week) => {
    const cells = week.map((date) => {
      const key = toDateKey(date.getTime());
      const count = activityMap[key] || 0;
      totalUpdates += count;
      if (count > busiestCount) {
        busiestCount = count;
        busiestLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
      const level = count === 0 ? 0 : (count < 3 ? 1 : (count < 6 ? 2 : (count < 10 ? 3 : 4)));
      const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const isFuture = date > now;
      return `<div class="heatmap-cell level-${level}${isFuture ? ' is-future' : ''}" data-tooltip="${escapeHtml(`${dateLabel}: ${count} updates`)}"></div>`;
    }).join("");

    return `<div class="heatmap-week-column">${cells}</div>`;
  }).join("");

  let previousMonth = "";
  const monthLabels = weeks.map((week, index) => {
    const monthAnchor = week.find((date) => date.getDate() <= 7) || week[0];
    const monthLabel = monthAnchor.toLocaleDateString(undefined, { month: 'short' });
    if (index !== 0 && monthLabel === previousMonth) {
      return '<span class="heatmap-month-label is-empty"></span>';
    }
    previousMonth = monthLabel;
    return `<span class="heatmap-month-label">${monthLabel}</span>`;
  }).join("");

  const summaryText = totalUpdates > 0
    ? `${totalUpdates} activity updates in the last year`
    : "No activity recorded in the last year yet";
  const busiestText = busiestCount > 0
    ? `Busiest day: ${busiestLabel} (${busiestCount})`
    : "Busiest day will appear once you start updating your library";

  container.innerHTML = `
    <div class="heatmap-shell">
      <div class="heatmap-month-row" aria-hidden="true">${monthLabels}</div>
      <div class="heatmap-body">
        <div class="heatmap-weekday-rail" aria-hidden="true">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div class="heatmap-scroll custom-scrollbar">
          <div class="heatmap-grid" role="img" aria-label="${escapeHtml(summaryText)}">
            ${weekColumns}
          </div>
        </div>
      </div>
      <div class="heatmap-summary">
        <span>${escapeHtml(summaryText)}</span>
        <span>${escapeHtml(busiestText)}</span>
      </div>
    </div>
  `;
}

function renderPersonaRadar(svg, genreCount) {
  if (!svg) return;
  const dimensions = [
    { label: "Action", keys: ["Action", "Adventure", "Sports"] },
    { label: "Intellect", keys: ["Mystery", "Psychological", "Sci-Fi", "Suspense"] },
    { label: "Emotion", keys: ["Drama", "Romance", "Slice of Life"] },
    { label: "Wit", keys: ["Comedy", "Parody"] },
    { label: "Wonder", keys: ["Fantasy", "Supernatural", "Magic"] }
  ];

  const scores = dimensions.map(d => {
    const sum = d.keys.reduce((s, k) => s + (genreCount[k] || 0), 0);
    return Math.min(100, (sum * 20)); // Normalized
  });

  const cx = 100, cy = 100, r = 70;
  const angleStep = (Math.PI * 2) / dimensions.length;

  // Grid
  let gridHtml = [20, 40, 60, 80, 100].map(level => {
    const points = dimensions.map((_, i) => {
      const x = cx + (r * level / 100) * Math.cos(i * angleStep - Math.PI / 2);
      const y = cy + (r * level / 100) * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    }).join(" ");
    return `<polygon points="${points}" class="radar-grid-line" />`;
  }).join("");

  // Axes and Labels
  const axesHtml = dimensions.map((d, i) => {
    const x = cx + r * Math.cos(i * angleStep - Math.PI / 2);
    const y = cy + r * Math.sin(i * angleStep - Math.PI / 2);
    const lx = cx + (r + 15) * Math.cos(i * angleStep - Math.PI / 2);
    const ly = cy + (r + 15) * Math.sin(i * angleStep - Math.PI / 2);
    return `
      <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis-line" />
      <text x="${lx}" y="${ly}" class="radar-label" text-anchor="middle" alignment-baseline="middle">${d.label}</text>
    `;
  }).join("");

  // Polygon
  const polyPoints = scores.map((s, i) => {
    const x = cx + (r * Math.max(10, s) / 100) * Math.cos(i * angleStep - Math.PI / 2);
    const y = cy + (r * Math.max(10, s) / 100) * Math.sin(i * angleStep - Math.PI / 2);
    return `${x},${y}`;
  }).join(" ");

  svg.innerHTML = `
    ${gridHtml}
    ${axesHtml}
    <polygon points="${polyPoints}" class="radar-polygon" />
  `;

  const topDimension = dimensions[scores.indexOf(Math.max(...scores))].label;
  const personaType = {
    "Action": "The Adrenaline Seeker",
    "Intellect": "The Strategic Mind",
    "Emotion": "The Soul Searcher",
    "Wit": "The Joy Bringer",
    "Wonder": "The Dream Weaver"
  }[topDimension] || "Balanced Explorer";

  const personaEl = document.getElementById("insight-persona-type");
  if (personaEl) personaEl.textContent = personaType;
}

function renderStudioSpotlight(container, studioCount, items) {
  if (!container) return;
  const studioRatings = {};
  const studioItems = {};

  items.forEach(item => {
    const studio = String(item.studio || "").trim();
    if (!studio) return;
    const rating = getEntryRating(item);
    if (rating > 0) {
      if (!studioRatings[studio]) { studioRatings[studio] = []; studioItems[studio] = 0; }
      studioRatings[studio].push(rating);
      studioItems[studio]++;
    }
  });

  const sortedStudios = Object.entries(studioCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], idx) => {
      const ratings = studioRatings[name] || [];
      const avg = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : "N/A";
      return `<div class="studio-chip">
        <span class="studio-rank">#${idx + 1}</span>
        <div class="studio-info">
          <div class="studio-name">${escapeHtml(name)}</div>
          <div class="studio-rating">${count} anime • ${avg} avg rating</div>
        </div>
      </div>`;
    }).join("");

  container.innerHTML = sortedStudios || '<p class="anime-card-meta">Watch more anime to spotlight studios.</p>';
}

function renderGenreDonut(svgElement, entries) {
  if (!svgElement) return;
  const total = entries.reduce((s, c) => s + Number(c[1] || 0), 0);
  if (!total) { svgElement.innerHTML = ''; return; }

  const cx = 110, cy = 110, outerR = 100, innerR = 60, GAP = 2.2;
  const uid = `ins-${Math.random().toString(36).slice(2, 7)}`;

  const gradientDefs = entries.map((_, i) => {
    const c = DONUT_PALETTE[i % DONUT_PALETTE.length];
    return `<linearGradient id="${uid}-g${i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.from}"/>
      <stop offset="100%" stop-color="${c.to}"/>
    </linearGradient>`;
  }).join('');

  const glowFilter = `<filter id="${uid}-glow" x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

  let angle = -90;
  const slices = entries.map(([genre, count], i) => {
    const value = Number(count || 0);
    const sweep = (value / total) * 360;
    const startDeg = angle + GAP / 2;
    const endDeg = angle + sweep - GAP / 2;
    angle += sweep;
    if (sweep < 1) return '';
    const pct = Math.round((value / total) * 100);
    const path = describeDonutArc(cx, cy, outerR, innerR, startDeg, endDeg);
    return `<path class="donut-slice" d="${path}" fill="url(#${uid}-g${i})" filter="url(#${uid}-glow)"
      data-tooltip="${escapeHtml(`${genre} — ${pct}% (${count} anime)`)}" style="animation-delay:${i * 0.08}s"
      onclick="this.classList.toggle('slice-dimmed')" />`;
  }).join('');

  svgElement.innerHTML = `
    <defs>${gradientDefs}${glowFilter}</defs>
    ${slices}
    <circle cx="${cx}" cy="${cy}" r="${innerR - 5}" fill="var(--bg-main)"/>
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text-primary)" font-family="inherit">${total}</text>
    <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="8.5" font-weight="600" fill="var(--text-muted)" font-family="inherit" letter-spacing="1">ANIME</text>
  `;
}

function renderDonutChart(container, segments, total, centerLabel, showLegend = true) {
  if (!container) return;
  if (!total) {
    container.innerHTML = '<p class="anime-card-meta">No anime in library yet.</p>';
    return;
  }

  const uid = `cdnt-${Math.random().toString(36).slice(2, 7)}`;
  const cx = 60, cy = 60, outerR = 54, innerR = 33, GAP = 2.5;
  const segTotal = segments.reduce((s, seg) => s + Number(seg.value || 0), 0) || 1;

  const gradientDefs = segments.map((seg, i) => {
    const c = seg.color ? { from: seg.color, to: seg.color } : DONUT_PALETTE[i % DONUT_PALETTE.length];
    return `<linearGradient id="${uid}-sg${i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.from}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${c.to}"/>
    </linearGradient>`;
  }).join('');

  const glowFilter = `<filter id="${uid}-sglow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

  let angle = -90;
  const slices = segments.filter(s => s.value > 0).map((seg, i) => {
    const sweep = (seg.value / segTotal) * 360;
    const startDeg = angle + GAP / 2;
    const endDeg = angle + sweep - GAP / 2;
    angle += sweep;
    if (sweep < 1) return '';
    const pct = Math.round((seg.value / segTotal) * 100);
    const path = describeDonutArc(cx, cy, outerR, innerR, startDeg, endDeg);
    return `<path class="donut-slice" d="${path}" fill="url(#${uid}-sg${i})" filter="url(#${uid}-sglow)"
      data-tooltip="${escapeHtml(`${seg.label}: ${seg.value} (${pct}%)`)}" style="animation-delay:${i * 0.08}s"
      onclick="this.classList.toggle('slice-dimmed')" />`;
  }).join('');

  const svgMarkup = `<svg class="insight-donut-svg" viewBox="0 0 120 120" aria-hidden="true" style="width:100%; height:100%;">
    <defs>${gradientDefs}${glowFilter}</defs>
    ${slices}
    <circle cx="${cx}" cy="${cy}" r="${innerR - 4}" fill="var(--bg-main)"/>
    <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="14" font-weight="800" fill="var(--text-primary)" font-family="inherit">${total}</text>
    <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="6.5" font-weight="600" fill="var(--text-muted)" font-family="inherit" letter-spacing="1">${escapeHtml(String(centerLabel || 'TOTAL').toUpperCase())}</text>
  </svg>`;

  let legend = '';
  if (showLegend) {
    legend = `<div class="insight-donut-legend" onclick="event.stopPropagation()">${segments.map((seg, i) => {
      const c = DONUT_PALETTE[i % DONUT_PALETTE.length];
      return `<div class="insight-legend-item" data-tooltip="${escapeHtml(`${seg.label}: ${seg.value}`)}"
        style="--legend-color:${c.from}">
        <span class="insight-legend-dot" style="background:linear-gradient(135deg,${c.from},${c.to});"></span>
        <span>${escapeHtml(seg.label)}: ${seg.value}</span>
      </div>`;
    }).join('')}</div>`;
  }

  container.innerHTML = svgMarkup + legend;
}

function calculateInsights(items) {
  const rows = (items || []).map((item) => ({
    ...item,
    genres: normalizeGenreNames(item?.genres),
    studio: normalizeStudioName(item)
  }));
  let totalEpisodesWatched = 0;
  let totalWatchMinutes = 0;
  const ratingValues = [];
  const studioCount = {};
  const completedRows = [];
  const genreCount = {};
  let lastCompletedAnime = null;
  const recentActivity = [];

  rows.forEach((item) => {
    const watchedEpisodes = Math.max(0, Number(item?.watchedEpisodes ?? item?.progress ?? 0));
    const durationMinutes = parseDurationMinutes(item?.duration);
    totalEpisodesWatched += watchedEpisodes;
    totalWatchMinutes += watchedEpisodes * durationMinutes;

    const entryRating = getEntryRating(item);
    if (entryRating > 0) ratingValues.push(entryRating);

    const studio = String(item?.studio || "").trim();
    if (studio) studioCount[studio] = (studioCount[studio] || 0) + 1;

    if (item?.status === STATUS.COMPLETED) {
      completedRows.push(item);
      item.genres.forEach((genre) => {
        const key = String(genre || "").trim();
        if (!key) return;
        genreCount[key] = (genreCount[key] || 0) + 1;
      });
      const completedAt = Number(item?.completedAt || 0);
      if (completedAt > 0) {
        if (!lastCompletedAnime || completedAt > lastCompletedAnime.completedAt) {
          lastCompletedAnime = { title: String(item?.title || "Unknown"), completedAt };
        }
      }
    }

    const eventTime = item?.status === STATUS.COMPLETED ? Number(item?.completedAt || 0) : Number(item?.updatedAt || 0);
    if (eventTime > 0) {
      recentActivity.push({
        title: String(item?.title || "Unknown"),
        status: humanizeStatus(item?.status),
        timestamp: eventTime
      });
    }
  });

  const totalCompleted = rows.filter((item) => item?.status === STATUS.COMPLETED).length;
  const totalWatching = rows.filter((item) => item?.status === STATUS.WATCHING).length;
  const totalPlan = rows.filter((item) => item?.status === STATUS.PLAN).length;
  const averageUserRating = ratingValues.length
    ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length)
    : 0;
  const completionStreak = calculateCompletionStreak(completedRows.map((item) => Number(item?.completedAt || 0)));

  if (!Object.keys(genreCount).length) {
    rows.forEach((item) => {
      item.genres.forEach((genre) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
  }

  const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
  const topGenres = sortedGenres.slice(0, 3);
  const topGenreTotal = topGenres.reduce((sum, [, count]) => sum + count, 0);
  const allGenreTotal = sortedGenres.reduce((sum, [, count]) => sum + count, 0);
  const otherCount = Math.max(0, allGenreTotal - topGenreTotal);
  const topGenresWithOthers = otherCount > 0
    ? [...topGenres, ["Others", otherCount]]
    : topGenres;

  const playerStats = calculatePlayerStats(totalEpisodesWatched, totalCompleted);

  return {
    totalEpisodesWatched,
    estimatedWatchTime: formatWatchTime(totalWatchMinutes),
    averageUserRating: averageUserRating.toFixed(1),
    totalCompleted,
    totalWatching,
    totalPlan,
    completionStreak,
    favoriteStudio: pickTopCount(studioCount),
    lastCompletedAnime: lastCompletedAnime?.title || "No data",
    statusBreakdown: { completed: totalCompleted, watching: totalWatching, plan: totalPlan },
    genreDistribution: { sorted: topGenresWithOthers, otherCount, all: genreCount },
    recentActivity: recentActivity.sort((a, b) => b.timestamp - a.timestamp),
    playerStats,
    studioCount
  };
}

function renderDiscoveryIntelligence(refs, genreDistribution) {
  if (!refs.gapsText || !refs.suggestedGenre) return;

  const allGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Suspense", "Thriller"];
  const watchedGenres = Object.keys(genreDistribution.all || {});
  const missingGenres = allGenres.filter(g => !watchedGenres.includes(g));

  if (missingGenres.length > 0) {
    const genreGaps = missingGenres.slice(0, 2);
    refs.gapsText.textContent = `You haven't explored ${genreGaps.join(" or ")} much. Try diving into these for a fresh experience!`;
  } else {
    refs.gapsText.textContent = "You're a versatile viewer! You've explored almost every major genre.";
  }

  const sorted = genreDistribution.sorted.filter(g => g[0] !== "Others");
  if (sorted.length > 0) {
    const topGenre = sorted[0][0];
    const suggestions = {
      "Action": "Cyberpunk or Military",
      "Comedy": "Slice of Life or Parody",
      "Drama": "Psychological or Seinen",
      "Fantasy": "Isekai or Mythology",
      "Romance": "Shoujo or Josei",
      "Sci-Fi": "Mecha or Space Opera"
    };
    const next = suggestions[topGenre] || "Classic Masterpieces";
    refs.suggestedGenre.textContent = `Based on your love for ${topGenre}, we suggest exploring ${next} next.`;
  } else {
    refs.suggestedGenre.textContent = "Watch more to get personalized suggestions!";
  }
}

function initInsights({ libraryStore }) {
  const refs = {
    watchTime: document.getElementById("insight-watch-time"),
    averageRating: document.getElementById("insight-average-rating"),
    episodesWatched: document.getElementById("insight-episodes-watched"),
    completed: document.getElementById("insight-completed"),
    watching: document.getElementById("insight-watching"),
    plan: document.getElementById("insight-plan"),
    statusChart: document.getElementById("insight-status-chart"),
    genreChart: document.getElementById("insight-genre-chart"),
    genreAnalysisText: document.getElementById("insight-genre-analysis-text"),
    topGenres: document.getElementById("insight-top-genres"),
    recentActivity: document.getElementById("insight-recent-activity"),
    siCountCompleted: document.getElementById("si-count-completed"),
    siCountWatching: document.getElementById("si-count-watching"),
    siCountPlan: document.getElementById("si-count-plan"),
    longestStreak: document.getElementById("insight-longest-streak"),
    topGenreStat: document.getElementById("insight-top-genre-stat"),
    completionRate: document.getElementById("insight-completion-rate"),
    avgRatingSi: document.getElementById("insight-avg-rating-si"),
    // Advanced Insights refs
    levelTitle: document.getElementById("insight-level-title"),
    levelNumber: document.getElementById("insight-level-number"),
    xpCurrent: document.getElementById("insight-xp-current"),
    xpNext: document.getElementById("insight-xp-next"),
    xpBar: document.getElementById("insight-xp-bar"),
    heatmap: document.getElementById("insight-heatmap"),
    radarSvg: document.getElementById("insight-persona-radar"),
    studioList: document.getElementById("insight-studio-list"),
    favoriteStudio: document.getElementById("insight-favorite-studio"),
    lastCompletedAnime: document.getElementById("insight-last-completed"),
    gapsText: document.getElementById("insight-gaps-text"),
    suggestedGenre: document.getElementById("insight-suggested-genre")
  };

  function render() {
    const items = libraryStore.getAll();
    const insights = calculateInsights(items);

    if (refs.watchTime) refs.watchTime.textContent = insights.estimatedWatchTime;
    if (refs.averageRating) refs.averageRating.textContent = insights.averageUserRating;
    if (refs.episodesWatched) refs.episodesWatched.textContent = String(insights.totalEpisodesWatched);
    if (refs.completed) refs.completed.textContent = String(insights.totalCompleted);
    if (refs.watching) refs.watching.textContent = String(insights.totalWatching);
    if (refs.plan) refs.plan.textContent = String(insights.totalPlan);

    // Player Stats
    const ps = insights.playerStats;
    if (refs.levelTitle) refs.levelTitle.textContent = ps.title;
    if (refs.levelNumber) refs.levelNumber.textContent = `Level ${ps.level}`;
    if (refs.xpCurrent) refs.xpCurrent.textContent = String(ps.xp);
    if (refs.xpNext) refs.xpNext.textContent = String(ps.nextLevelXp);
    if (refs.xpBar) refs.xpBar.style.width = `${ps.progress}%`;
    if (refs.favoriteStudio) refs.favoriteStudio.textContent = insights.favoriteStudio || "No data";
    if (refs.lastCompletedAnime) refs.lastCompletedAnime.textContent = insights.lastCompletedAnime || "No data";

    // Activity Heatmap
    renderHeatmap(refs.heatmap, items);

    // Persona Radar
    renderPersonaRadar(refs.radarSvg, insights.genreDistribution.all);

    // Studio Spotlight
    renderStudioSpotlight(refs.studioList, insights.studioCount, items);

    // Discovery Intelligence
    renderDiscoveryIntelligence(refs, insights.genreDistribution);

    const breakdown = insights.statusBreakdown;
    if (refs.siCountCompleted) refs.siCountCompleted.textContent = String(breakdown.completed);
    if (refs.siCountWatching) refs.siCountWatching.textContent = String(breakdown.watching);
    if (refs.siCountPlan) refs.siCountPlan.textContent = String(breakdown.plan);
    if (refs.longestStreak) refs.longestStreak.textContent = `${insights.completionStreak || 0} day${insights.completionStreak !== 1 ? 's' : ''}`;
    
    const genreData = insights.genreDistribution.sorted;
    if (refs.topGenreStat) refs.topGenreStat.textContent = genreData[0]?.[0] || 'No data';

    const totalLib = (breakdown.completed || 0) + (breakdown.watching || 0) + (breakdown.plan || 0);
    const completionPct = totalLib > 0 ? Math.round(((breakdown.completed || 0) / totalLib) * 100) : 0;
    if (refs.completionRate) refs.completionRate.textContent = `${completionPct}%`;
    if (refs.avgRatingSi) refs.avgRatingSi.textContent = insights.averageUserRating || "0.0";

    renderDonutChart(refs.statusChart, [
      { label: "Completed", value: breakdown.completed, color: "var(--chart-purple)" },
      { label: "Watching", value: breakdown.watching, color: "var(--chart-blue)" },
      { label: "Plan", value: breakdown.plan, color: "var(--chart-green)" }
    ], totalLib, `${completionPct}%`, false);

    renderGenreDonut(refs.genreChart, genreData);
    if (refs.genreAnalysisText) {
      if (!genreData.length) refs.genreAnalysisText.textContent = "Complete anime to unlock genre insights.";
      else if (insights.genreDistribution.otherCount > 0) refs.genreAnalysisText.textContent = `Other Genres: ${insights.genreDistribution.otherCount} anime`;
      else refs.genreAnalysisText.textContent = "Your genre preferences are focused and consistent.";
    }

    if (refs.topGenres) {
      if (!genreData.length) refs.topGenres.innerHTML = '<p class="anime-card-meta">No genre data yet.</p>';
      else {
        const max = Math.max(...genreData.map(([, count]) => Number(count || 0)));
        refs.topGenres.innerHTML = genreData.map(([genre, count], idx) => {
          const width = Math.max(18, Math.round((Number(count || 0) / Math.max(1, max)) * 100));
          const color = getGenreColor(genre, idx);
          return `<div class="genre-bar-item" data-tooltip="${escapeHtml(`${genre} - ${count} anime`)}"><div class="genre-label">${escapeHtml(genre)}</div><div class="genre-track"><div class="genre-fill" style="width:${width}%; background: linear-gradient(90deg, ${color}, ${color}cc);"></div></div><div class="genre-count">${count}</div></div>`;
        }).join("");
      }
    }

    if (refs.recentActivity) {
      if (!insights.recentActivity.length) refs.recentActivity.innerHTML = '<p class="anime-card-meta">No activity yet.</p>';
      else {
        refs.recentActivity.innerHTML = insights.recentActivity.slice(0, 5).map((entry, idx) => {
          const date = new Date(entry.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
          const dots = ["blue", "gold", "green", "purple"];
          return `<div class="timeline-item"><span class="timeline-dot ${dots[idx % 4]}"></span><div class="timeline-content"><p><strong>${escapeHtml(entry.title)}</strong> • ${escapeHtml(entry.status)}</p><span class="timeline-time">${date}</span></div></div>`;
        }).join("");
      }
    }
  }

  const unsubscribe = libraryStore.subscribe(render);
  render();

  return Object.freeze({
    render,
    destroy() {
      unsubscribe();
    }
  });
}

export { initInsights };
