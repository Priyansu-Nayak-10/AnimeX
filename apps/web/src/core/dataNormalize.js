/**
 * dataNormalize.js — Anime data normalization utilities
 *
 * Extracted from app.js to keep bootstrap logic thin.
 * Used by createDataController to normalize raw Jikan API payloads.
 */

/**
 * Resolve an episode count to a human-readable value.
 *
 * Priority:
 *  1. episode count exists and > 0  → return the number
 *  2. episodes null + status airing → return "Ongoing"
 *  3. episodes null + any other     → return "Unknown"
 *
 * @param {number|null|undefined} rawEpisodes
 * @param {string} [rawStatus] - Jikan status string, e.g. "Currently Airing"
 * @returns {number|string}
 */
export function resolveEpisodes(rawEpisodes, rawStatus = "") {
    const n = Number(rawEpisodes);
    if (Number.isFinite(n) && n > 0) return n;
    const status = String(rawStatus || "").toLowerCase();
    if (status.includes("airing") || status.includes("ongoing")) return "Ongoing";
    return "Unknown";
}

/**
 * For numeric-only contexts (e.g. progress clamping), return a safe integer
 * WITHOUT faking a 1 when the real count is unknown.
 * Returns 0 when count is genuinely unknown (caller must handle 0 specially).
 *
 * @param {number|null|undefined} rawEpisodes
 * @returns {number}
 */
export function resolveEpisodesNumeric(rawEpisodes) {
    const n = Number(rawEpisodes);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

export function normalizeTitle(title) {
    if (typeof title !== "string") return "";
    let cleaned = title.replace(/\s+/g, " ").trim();
    cleaned = cleaned.replace(/\s*[-:]\s*Part\s+\d+\s*$/i, "");
    cleaned = cleaned.replace(/\s+Part\s+\d+\s*$/i, "");
    cleaned = cleaned.replace(/\s*[-:]\s*$/g, "").trim();
    return cleaned;
}

export function getDisplayTitle(anime) {
    const titles = Array.isArray(anime?.titles) ? anime.titles : [];
    const findByType = (type) => titles.find((t) => String(t?.type || "").toLowerCase() === type)?.title || "";

    const candidates = [
        anime?.title_english,
        findByType("english"),
        anime?.title, // romaji/default
        findByType("default"),
        anime?.title_japanese,
        findByType("japanese")
    ];

    for (const candidate of candidates) {
        const normalized = normalizeTitle(candidate);
        if (normalized) return normalized;
    }
    return "Unknown Title";
}

export function normalizeAnime(item) {
    const ratingRaw = String(item?.rating || "").toLowerCase();
    let ratingCategory = "";
    if (ratingRaw.includes("pg-13")) ratingCategory = "pg13";
    else if (ratingRaw.includes("r -") || ratingRaw.startsWith("r ")) ratingCategory = "r";
    else if (ratingRaw.includes("r+")) ratingCategory = "rplus";
    else if (ratingRaw.includes("rx")) ratingCategory = "rx";
    else if (ratingRaw.startsWith("pg")) ratingCategory = "pg";
    else if (ratingRaw.startsWith("g")) ratingCategory = "g";

    const episodesTotal = resolveEpisodesNumeric(item?.episodes);
    const episodesAiredRaw = Number(item?.episodes_aired || item?.released_episodes);
    const statusStr = String(item?.status || item?.airing_status || "").toLowerCase();
    const isAiring = statusStr.includes("airing") || Boolean(item?.airing);
    const isFinished = statusStr.includes("finished");

    const episodesReleased = Number.isFinite(episodesAiredRaw)
        ? Math.max(0, episodesAiredRaw)
        : (isFinished ? episodesTotal : episodesTotal);

    return {
        malId: item?.mal_id || item?.id,
        title: getDisplayTitle(item),
        title_english: item?.title_english || "",
        titles: Array.isArray(item?.titles) ? item.titles : [],
        image: item?.poster || item?.images?.jpg?.large_image_url || item?.images?.jpg?.image_url || "",
        poster: item?.poster || item?.images?.jpg?.large_image_url || "",
        score: typeof item?.score === "number" ? item.score : 0,
        year: item?.year || item?.aired?.prop?.from?.year || 0,
        episodes: episodesTotal,
        total_episodes: episodesTotal,
        released_episodes: episodesReleased,
        episodesReleased,
        next_episode: item.next_episode || null,
        next_airing: item.next_airing || null,
        airing_status: statusStr,
        airing_day: item.airing_day || (item?.broadcast?.day ? item.broadcast.day.toLowerCase() : ""),
        duration: item?.duration || "",
        type: String(item?.type || "").toLowerCase(),
        season: String(item?.season || "").toLowerCase(),
        status: statusStr,
        genres: (item?.genres || []).map((genre) => (typeof genre === 'string' ? genre : genre.name)),
        studio: item?.studios?.[0]?.name || item.studio || "",
        ratingCategory,
        language: (item?.title_english || item.title_english) ? "english" : "japanese",
        popularity: item?.popularity || 999999,
        broadcastDay: item?.broadcast?.day ? item.broadcast.day.toLowerCase() : "",
        broadcastTime: item?.broadcast?.time || "",
        broadcastString: item?.broadcast?.string || ""
    };
}

export function dedupeAnimeList(list) {
    const byKey = new Map();
    for (const item of list) {
        if (!item) continue;
        const key = item.malId || `${normalizeTitle(item.title).toLowerCase()}_${item.season || ""}`;
        const existing = byKey.get(key);
        if (!existing) {
            byKey.set(key, item);
            continue;
        }
        // prefer better image and higher score
        const hasBetterImage = (candidate) => typeof candidate?.image === "string" && candidate.image.length > 10;
        const chosen = { ...existing };
        if (!hasBetterImage(existing) && hasBetterImage(item)) chosen.image = item.image;
        if ((item.score || 0) > (existing.score || 0)) chosen.score = item.score;
        if ((item.episodesReleased || 0) > (existing.episodesReleased || 0)) chosen.episodesReleased = item.episodesReleased;
        if ((item.episodes || 0) > (existing.episodes || 0)) chosen.episodes = item.episodes;
        if (item.title && existing.title === "Unknown Title") chosen.title = item.title;
        byKey.set(key, chosen);
    }
    return Array.from(byKey.values());
}
