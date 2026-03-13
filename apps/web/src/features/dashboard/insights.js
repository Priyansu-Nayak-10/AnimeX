import { STATUS } from "../../store.js";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatWatchTime(totalMinutes) {
  const mins = Math.max(0, Math.floor(Number(totalMinutes || 0)));
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return `${hours}h ${rest}m`;
}

function parseDurationMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value || "").toLowerCase();
  const minutes = text.match(/(\d+)\s*min/);
  if (minutes) return Number(minutes[1]) || 24;
  const hours = text.match(/(\d+)\s*hr/);
  if (hours) return (Number(hours[1]) || 0) * 60;
  return 24;
}

const GENRE_COLOR_MAP = Object.freeze({
  action: "#3b82f6",
  fantasy: "#7dd3fc",
  adventure: "#22c55e",
  suspense: "#f97316",
  comedy: "#a855f7"
});
const GENRE_FALLBACK_COLORS = Object.freeze(["#3b82f6", "#7dd3fc", "#22c55e", "#f97316", "#a855f7", "#ef4444"]);

function getGenreColor(genreName, index = 0) {
  const key = String(genreName || "").trim().toLowerCase();
  if (GENRE_COLOR_MAP[key]) return GENRE_COLOR_MAP[key];
  return GENRE_FALLBACK_COLORS[index % GENRE_FALLBACK_COLORS.length];
}

function getEntryRating(item) {
  const candidates = [
    Number(item?.userRating),
    Number(item?.rating),
    Number(item?.score)
  ];
  return candidates.find((value) => Number.isFinite(value) && value > 0) || 0;
}

function pickTopCount(map) {
  const rows = Object.entries(map || {});
  if (!rows.length) return "No data";
  rows.sort((a, b) => b[1] - a[1]);
  return rows[0]?.[0] || "No data";
}

function toDateKey(timestamp) {
  const date = new Date(Number(timestamp || 0));
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calculateCompletionStreak(timestamps) {
  const uniqueDays = [...new Set((timestamps || []).map(toDateKey).filter(Boolean))]
    .sort()
    .reverse();
  if (!uniqueDays.length) return 0;
  let streak = 1;
  let cursor = new Date(uniqueDays[0]).getTime();
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const current = new Date(uniqueDays[i]).getTime();
    if ((cursor - current) === (24 * 60 * 60 * 1000)) {
      streak += 1;
      cursor = current;
    } else break;
  }
  return streak;
}

const DONUT_PALETTE = [
  { from: '#60a5fa', to: '#3b82f6' },
  { from: '#7dd3fc', to: '#0ea5e9' },
  { from: '#4ade80', to: '#16a34a' },
  { from: '#fb923c', to: '#ea580c' },
  { from: '#c084fc', to: '#9333ea' },
  { from: '#f87171', to: '#dc2626' },
  { from: '#34d399', to: '#059669' },
  { from: '#facc15', to: '#d97706' },
];

function describeDonutArc(cx, cy, outerR, innerR, startDeg, endDeg) {
  const toRad = (d) => ((d - 90) * Math.PI) / 180;
  const pt = (r, d) => ({ x: cx + r * Math.cos(toRad(d)), y: cy + r * Math.sin(toRad(d)) });
  const o1 = pt(outerR, startDeg), o2 = pt(outerR, endDeg);
  const i1 = pt(innerR, endDeg), i2 = pt(innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
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
      data-tooltip="${escapeHtml(`${genre} — ${pct}% (${count} anime)`)}" style="animation-delay:${i * 0.08}s"/>`;
  }).join('');

  svgElement.innerHTML = `
    <defs>${gradientDefs}${glowFilter}</defs>
    ${slices}
    <circle cx="${cx}" cy="${cy}" r="${innerR - 5}" fill="rgba(15,23,42,0.75)"/>
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="20" font-weight="800" fill="#f1f5f9" font-family="inherit">${total}</text>
    <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="8.5" font-weight="600" fill="#94a3b8" font-family="inherit" letter-spacing="1">ANIME</text>
  `;
}

function renderDonutChart(container, segments, total, centerLabel) {
  if (!container) return;
  if (!total) {
    container.innerHTML = '<p class="anime-card-meta">No anime in library yet.</p>';
    return;
  }

  const uid = `cdnt-${Math.random().toString(36).slice(2, 7)}`;
  let offset = 0;

  // Build SVG donut instead of CSS conic-gradient so we get gradients + glow
  const cx = 60, cy = 60, outerR = 54, innerR = 33, GAP = 2.5;
  const segTotal = segments.reduce((s, seg) => s + Number(seg.value || 0), 0) || 1;

  const gradientDefs = segments.map((seg, i) => {
    const c = DONUT_PALETTE[i % DONUT_PALETTE.length];
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
      data-tooltip="${escapeHtml(`${seg.label}: ${seg.value} (${pct}%)`)}" style="animation-delay:${i * 0.08}s"/>`;
  }).join('');

  const svgMarkup = `<svg class="insight-donut-svg" viewBox="0 0 120 120" aria-hidden="true">
    <defs>${gradientDefs}${glowFilter}</defs>
    ${slices}
    <circle cx="${cx}" cy="${cy}" r="${innerR - 4}" fill="rgba(15,23,42,0.8)"/>
    <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="14" font-weight="800" fill="#f1f5f9" font-family="inherit">${total}</text>
    <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="6.5" font-weight="600" fill="#94a3b8" font-family="inherit" letter-spacing="1">${escapeHtml(String(centerLabel || 'TOTAL').toUpperCase())}</text>
  </svg>`;

  const legend = `<div class="insight-donut-legend">${segments.map((seg, i) => {
    const c = DONUT_PALETTE[i % DONUT_PALETTE.length];
    return `<div class="insight-legend-item" data-tooltip="${escapeHtml(`${seg.label}: ${seg.value}`)}"
      style="--legend-color:${c.from}">
      <span class="insight-legend-dot" style="background:linear-gradient(135deg,${c.from},${c.to});"></span>
      <span>${escapeHtml(seg.label)}: ${seg.value}</span>
    </div>`;
  }).join('')}</div>`;

  container.innerHTML = svgMarkup + legend;
}

function calculateInsights(items) {
  const rows = (items || []).map((item) => ({ ...item }));
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
      (item?.genres || []).forEach((genre) => {
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
        status: String(item?.status || ""),
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

  const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
  const topGenres = sortedGenres.slice(0, 3);
  const topGenreTotal = topGenres.reduce((sum, [, count]) => sum + count, 0);
  const allGenreTotal = sortedGenres.reduce((sum, [, count]) => sum + count, 0);
  const otherCount = Math.max(0, allGenreTotal - topGenreTotal);
  const topGenresWithOthers = otherCount > 0
    ? [...topGenres, ["Others", otherCount]]
    : topGenres;

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
    statusDistributionText: `Completed ${totalCompleted} • Watching ${totalWatching} • Plan ${totalPlan}`,
    statusBreakdown: {
      completed: totalCompleted,
      watching: totalWatching,
      plan: totalPlan
    },
    genreDistribution: {
      sorted: topGenresWithOthers,
      otherCount
    },
    recentActivity: recentActivity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8)
  };
}

function initInsights({ libraryStore }) {
  const refs = {
    watchTime: document.getElementById("insight-watch-time"),
    averageRating: document.getElementById("insight-average-rating"),
    episodesWatched: document.getElementById("insight-episodes-watched"),
    completed: document.getElementById("insight-completed"),
    watching: document.getElementById("insight-watching"),
    plan: document.getElementById("insight-plan"),
    favoriteStudio: document.getElementById("insight-favorite-studio"),
    lastCompleted: document.getElementById("insight-last-completed"),
    statusDistribution: document.getElementById("insight-status-distribution"),
    statusChart: document.getElementById("insight-status-chart"),
    genreChart: document.getElementById("insight-genre-chart"),
    genreAnalysisText: document.getElementById("insight-genre-analysis-text"),
    topGenres: document.getElementById("insight-top-genres"),
    recentActivity: document.getElementById("insight-recent-activity")
  };

  function renderInsightsActivity(insights) {
    if (!refs.recentActivity) return;
    if (!insights.recentActivity.length) {
      refs.recentActivity.innerHTML = '<p class="anime-card-meta">No recent activity yet.</p>';
      return;
    }
    refs.recentActivity.innerHTML = insights.recentActivity.map((entry, index) => {
      const date = new Date(entry.timestamp);
      const timeText = Number.isNaN(date.getTime())
        ? "Unknown time"
        : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const dotClass = index % 4 === 0 ? "blue" : (index % 4 === 1 ? "gold" : (index % 4 === 2 ? "green" : "purple"));
      return `<div class="timeline-item"><span class="timeline-dot ${dotClass}"></span><div class="timeline-content"><p><strong>${escapeHtml(entry.title)}</strong> • ${escapeHtml(entry.status)}</p><span class="timeline-time">${escapeHtml(timeText)}</span></div></div>`;
    }).join("");
  }

  function render() {
    const items = libraryStore.getAll();
    const insights = calculateInsights(items);

    if (refs.watchTime) refs.watchTime.textContent = insights.estimatedWatchTime;
    if (refs.averageRating) refs.averageRating.textContent = insights.averageUserRating;
    if (refs.episodesWatched) refs.episodesWatched.textContent = String(insights.totalEpisodesWatched);
    if (refs.completed) refs.completed.textContent = String(insights.totalCompleted);
    if (refs.watching) refs.watching.textContent = String(insights.totalWatching);
    if (refs.plan) refs.plan.textContent = String(insights.totalPlan);
    if (refs.favoriteStudio) refs.favoriteStudio.textContent = insights.favoriteStudio;
    if (refs.lastCompleted) refs.lastCompleted.textContent = insights.lastCompletedAnime;
    if (refs.statusDistribution) refs.statusDistribution.textContent = insights.statusDistributionText;

    const statusTotal = insights.statusBreakdown.completed + insights.statusBreakdown.watching + insights.statusBreakdown.plan;
    renderDonutChart(refs.statusChart, [
      { label: "Completed", value: insights.statusBreakdown.completed, color: "#22c55e" },
      { label: "Watching", value: insights.statusBreakdown.watching, color: "#60a5fa" },
      { label: "Plan", value: insights.statusBreakdown.plan, color: "#a78bfa" }
    ], statusTotal, `Streak ${insights.completionStreak}`);

    renderGenreDonut(refs.genreChart, insights.genreDistribution.sorted);
    if (refs.genreAnalysisText) {
      if (!insights.genreDistribution.sorted.length) refs.genreAnalysisText.textContent = "Complete anime to unlock genre insights.";
      else if (insights.genreDistribution.otherCount > 0) refs.genreAnalysisText.textContent = `Other Genres: ${insights.genreDistribution.otherCount} anime`;
      else refs.genreAnalysisText.textContent = "Your genre preferences are focused and consistent.";
    }
    if (refs.topGenres) {
      if (!insights.genreDistribution.sorted.length) refs.topGenres.innerHTML = '<p class="anime-card-meta">No genre data yet.</p>';
      else {
        const top = insights.genreDistribution.sorted;
        const max = Math.max(...top.map(([, count]) => Number(count || 0)));
        refs.topGenres.innerHTML = top.map(([genre, count], idx) => {
          const width = Math.max(18, Math.round((Number(count || 0) / Math.max(1, max)) * 100));
          const color = getGenreColor(genre, idx);
          return `<div class="genre-bar-item" data-tooltip="${escapeHtml(`${genre} - ${count} anime`)}"><div class="genre-label">${escapeHtml(genre)}</div><div class="genre-track"><div class="genre-fill" style="width:${width}%; background: linear-gradient(90deg, ${color}, ${color}cc);"></div></div><div class="genre-count">${count}</div></div>`;
        }).join("");
      }
    }

    renderInsightsActivity(insights);
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
