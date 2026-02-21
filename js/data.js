"use strict";

const ANIME_DB = [
  { id: 1, title: "Attack on Titan (Season 1)", genres: ["Action", "Drama"], episodes: 25, status: "Finished", rating: 8.9, year: 2013, studio: "Wit Studio", image: "https://cdn.myanimelist.net/images/anime/10/47347.jpg", dubAvailable: true },
  { id: 2, title: "Demon Slayer", genres: ["Action", "Fantasy"], episodes: 63, status: "Airing", rating: 8.7, year: 2019, studio: "ufotable", image: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg", dubAvailable: true },
  { id: 3, title: "Fullmetal Alchemist: Brotherhood", genres: ["Action", "Adventure", "Drama"], episodes: 64, status: "Finished", rating: 9.1, year: 2009, studio: "Bones", image: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg", dubAvailable: true },
  { id: 4, title: "Death Note", genres: ["Mystery", "Psychological", "Thriller"], episodes: 37, status: "Finished", rating: 8.9, year: 2006, studio: "Madhouse", image: "https://cdn.myanimelist.net/images/anime/9/9453.jpg", dubAvailable: true },
  { id: 5, title: "Jujutsu Kaisen", genres: ["Action", "Supernatural"], episodes: 47, status: "Airing", rating: 8.6, year: 2020, studio: "MAPPA", image: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg", dubAvailable: true },
  { id: 6, title: "One Piece", genres: ["Adventure", "Comedy", "Action"], episodes: 1100, status: "Airing", rating: 8.8, year: 1999, studio: "Toei Animation", image: "https://cdn.myanimelist.net/images/anime/6/73245.jpg", dubAvailable: true },
  { id: 7, title: "Naruto (Season 1)", genres: ["Action", "Adventure"], episodes: 220, status: "Finished", rating: 8.4, year: 2002, studio: "Pierrot", image: "https://cdn.myanimelist.net/images/anime/13/17405.jpg", dubAvailable: true },
  { id: 8, title: "Naruto Shippuden", genres: ["Action", "Adventure"], episodes: 500, status: "Finished", rating: 8.5, year: 2007, studio: "Pierrot", image: "https://cdn.myanimelist.net/images/anime/5/17407.jpg", dubAvailable: true },
  { id: 9, title: "My Hero Academia", genres: ["Action", "School", "Superhero"], episodes: 159, status: "Airing", rating: 8.2, year: 2016, studio: "Bones", image: "https://cdn.myanimelist.net/images/anime/10/78745.jpg", dubAvailable: true },
  { id: 10, title: "Steins;Gate", genres: ["Sci-Fi", "Thriller"], episodes: 24, status: "Finished", rating: 9.1, year: 2011, studio: "White Fox", image: "https://cdn.myanimelist.net/images/anime/5/73199.jpg", dubAvailable: true },
  { id: 11, title: "Tokyo Ghoul", genres: ["Action", "Horror"], episodes: 48, status: "Finished", rating: 7.8, year: 2014, studio: "Pierrot", image: "https://cdn.myanimelist.net/images/anime/1498/134443.jpg", dubAvailable: true },
  { id: 12, title: "Blue Lock", genres: ["Sports", "Drama"], episodes: 24, status: "Airing", rating: 8.3, year: 2022, studio: "8bit", image: "https://cdn.myanimelist.net/images/anime/1258/126929.jpg", dubAvailable: true },
  { id: 13, title: "Haikyu!!", genres: ["Sports", "Comedy"], episodes: 85, status: "Finished", rating: 8.7, year: 2014, studio: "Production I.G", image: "https://cdn.myanimelist.net/images/anime/7/76014.jpg", dubAvailable: true },
  { id: 14, title: "Spy x Family", genres: ["Comedy", "Action"], episodes: 37, status: "Airing", rating: 8.5, year: 2022, studio: "Wit Studio", image: "https://cdn.myanimelist.net/images/anime/1441/122795.jpg", dubAvailable: true },
  { id: 15, title: "Vinland Saga", genres: ["Action", "Drama", "Historical"], episodes: 48, status: "Finished", rating: 8.8, year: 2019, studio: "MAPPA", image: "https://cdn.myanimelist.net/images/anime/1500/103005.jpg", dubAvailable: true },
  { id: 16, title: "Chainsaw Man", genres: ["Action", "Horror"], episodes: 12, status: "Airing", rating: 8.6, year: 2022, studio: "MAPPA", image: "https://cdn.myanimelist.net/images/anime/1806/126216.jpg", dubAvailable: true },
  { id: 17, title: "Mob Psycho 100", genres: ["Comedy", "Action", "Supernatural"], episodes: 37, status: "Finished", rating: 8.8, year: 2016, studio: "Bones", image: "https://cdn.myanimelist.net/images/anime/8/80356.jpg", dubAvailable: true },
  { id: 18, title: "Solo Leveling", genres: ["Action", "Fantasy"], episodes: 12, status: "Airing", rating: 8.7, year: 2024, studio: "A-1 Pictures", image: "https://cdn.myanimelist.net/images/anime/1337/138600.jpg", dubAvailable: true },
  { id: 19, title: "Frieren: Beyond Journey's End", genres: ["Adventure", "Drama", "Fantasy"], episodes: 28, status: "Finished", rating: 9.2, year: 2023, studio: "Madhouse", image: "https://cdn.myanimelist.net/images/anime/1015/138006.jpg", dubAvailable: true },
  { id: 20, title: "The Apothecary Diaries", genres: ["Drama", "Mystery"], episodes: 24, status: "Airing", rating: 8.8, year: 2023, studio: "OLM", image: "https://cdn.myanimelist.net/images/anime/1708/140792.jpg", dubAvailable: true },
  { id: 21, title: "Code Geass", genres: ["Mecha", "Drama", "Thriller"], episodes: 50, status: "Finished", rating: 8.9, year: 2006, studio: "Sunrise", image: "https://cdn.myanimelist.net/images/anime/5/50331.jpg", dubAvailable: true },
  { id: 22, title: "Cowboy Bebop", genres: ["Sci-Fi", "Action"], episodes: 26, status: "Finished", rating: 8.8, year: 1998, studio: "Sunrise", image: "https://cdn.myanimelist.net/images/anime/4/19644.jpg", dubAvailable: true },
  { id: 23, title: "Neon Genesis Evangelion", genres: ["Mecha", "Psychological"], episodes: 26, status: "Finished", rating: 8.3, year: 1995, studio: "Gainax", image: "https://cdn.myanimelist.net/images/anime/1314/108941.jpg", dubAvailable: true },
  { id: 24, title: "Dr. Stone", genres: ["Adventure", "Sci-Fi"], episodes: 57, status: "Airing", rating: 8.2, year: 2019, studio: "TMS Entertainment", image: "https://cdn.myanimelist.net/images/anime/1613/102576.jpg", dubAvailable: true },
  { id: 25, title: "Re:ZERO -Starting Life in Another World-", genres: ["Fantasy", "Psychological", "Drama"], episodes: 50, status: "Airing", rating: 8.3, year: 2016, studio: "White Fox", image: "https://cdn.myanimelist.net/images/anime/1522/128039.jpg", dubAvailable: true },
  { id: 26, title: "Kaguya-sama: Love Is War", genres: ["Romance", "Comedy", "School"], episodes: 37, status: "Finished", rating: 8.7, year: 2019, studio: "A-1 Pictures", image: "https://cdn.myanimelist.net/images/anime/1295/106551.jpg", dubAvailable: true },
  { id: 27, title: "Your Lie in April", genres: ["Drama", "Romance"], episodes: 22, status: "Finished", rating: 8.6, year: 2014, studio: "A-1 Pictures", image: "https://cdn.myanimelist.net/images/anime/3/67177.jpg", dubAvailable: true },
  { id: 28, title: "Hunter x Hunter", genres: ["Adventure", "Action"], episodes: 148, status: "Finished", rating: 9.0, year: 2011, studio: "Madhouse", image: "https://cdn.myanimelist.net/images/anime/1337/99013.jpg", dubAvailable: true },
  { id: 29, title: "Black Clover", genres: ["Action", "Fantasy"], episodes: 170, status: "Finished", rating: 8.1, year: 2017, studio: "Pierrot", image: "https://cdn.myanimelist.net/images/anime/2/88336.jpg", dubAvailable: true },
  { id: 30, title: "JoJo's Bizarre Adventure", genres: ["Action", "Adventure"], episodes: 190, status: "Airing", rating: 8.6, year: 2012, studio: "David Production", image: "https://cdn.myanimelist.net/images/anime/3/40409.jpg", dubAvailable: true },
  { id: 31, title: "Parasyte -the maxim-", genres: ["Horror", "Psychological", "Action"], episodes: 24, status: "Finished", rating: 8.3, year: 2014, studio: "Madhouse", image: "https://cdn.myanimelist.net/images/anime/3/73178.jpg", dubAvailable: true },
  { id: 32, title: "Erased", genres: ["Mystery", "Thriller"], episodes: 12, status: "Finished", rating: 8.5, year: 2016, studio: "A-1 Pictures", image: "https://cdn.myanimelist.net/images/anime/10/77957.jpg", dubAvailable: true },
  { id: 33, title: "Psycho-Pass", genres: ["Sci-Fi", "Thriller"], episodes: 41, status: "Finished", rating: 8.4, year: 2012, studio: "Production I.G", image: "https://cdn.myanimelist.net/images/anime/5/43399.jpg", dubAvailable: true },
  { id: 34, title: "Fruits Basket", genres: ["Drama", "Romance"], episodes: 63, status: "Finished", rating: 8.6, year: 2019, studio: "TMS Entertainment", image: "https://cdn.myanimelist.net/images/anime/1447/99827.jpg", dubAvailable: true },
  { id: 35, title: "Bocchi the Rock!", genres: ["Comedy", "Music"], episodes: 12, status: "Finished", rating: 8.7, year: 2022, studio: "CloverWorks", image: "https://cdn.myanimelist.net/images/anime/1448/127956.jpg", dubAvailable: false },
  { id: 36, title: "Attack on Titan (Season 2)", genres: ["Action", "Drama"], episodes: 12, status: "Finished", rating: 8.7, year: 2017, studio: "Wit Studio", image: "https://cdn.myanimelist.net/images/anime/4/84177.jpg", dubAvailable: true },
  { id: 37, title: "Attack on Titan (Season 3)", genres: ["Action", "Drama"], episodes: 22, status: "Finished", rating: 9.0, year: 2018, studio: "Wit Studio", image: "https://cdn.myanimelist.net/images/anime/1173/92110.jpg", dubAvailable: true },
  { id: 38, title: "Attack on Titan Final Season", genres: ["Action", "Drama"], episodes: 28, status: "Finished", rating: 9.1, year: 2020, studio: "MAPPA", image: "https://cdn.myanimelist.net/images/anime/1000/110531.jpg", dubAvailable: true },
  { id: 39, title: "Demon Slayer (Season 1)", genres: ["Action", "Fantasy"], episodes: 26, status: "Finished", rating: 8.7, year: 2019, studio: "ufotable", image: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg", dubAvailable: true },
  { id: 40, title: "Demon Slayer: Entertainment District Arc", genres: ["Action", "Fantasy"], episodes: 11, status: "Finished", rating: 8.8, year: 2021, studio: "ufotable", image: "https://cdn.myanimelist.net/images/anime/1908/120036.jpg", dubAvailable: true }
];

const STORAGE_KEY = "animeList";

function getAnimeList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveAnimeList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeTitle(anime) {
  return (anime.title || "").trim();
}

async function upsertAnime(anime, targetStatus) {
  const list = getAnimeList();
  const now = new Date().toISOString();
  const validStatus = ["plan", "watching", "completed"];
  const status = validStatus.includes(String(targetStatus)) ? targetStatus : "plan";
  const incoming = normalizeRecord(anime);
  const entryIndex = list.findIndex((item) => String(item.id) === String(incoming.id));

  const nextList = list.slice();
  const baseEntry = entryIndex >= 0 ? { ...nextList[entryIndex] } : null;
  const normalized = {
    ...incoming,
    ...baseEntry,
    status,
    updatedAt: now,
    source: "local",
    addedAt: baseEntry?.addedAt || incoming.addedAt || now
  };

  const clampWatched = (value, episodes) => {
    const maxEpisodes = Number.isFinite(Number(episodes)) ? Number(episodes) : 0;
    let clamped = Math.max(0, Number(value) || 0);
    if (maxEpisodes > 0) clamped = Math.min(clamped, maxEpisodes);
    return clamped;
  };

  if (status === "completed") {
    const episodes = Number.isFinite(Number(normalized.episodes)) ? Number(normalized.episodes) : 0;
    normalized.watchedEpisodes = episodes > 0 ? episodes : clampWatched(normalized.watchedEpisodes, episodes);
  } else {
    normalized.watchedEpisodes = clampWatched(normalized.watchedEpisodes, normalized.episodes);
  }

  if (entryIndex >= 0) {
    nextList[entryIndex] = normalized;
  } else {
    nextList.push(normalized);
  }

  try {
    saveAnimeList(nextList);
    window.dispatchEvent(new Event("animeDataUpdated"));
    return { success: true, data: normalized };
  } catch (error) {
    return { success: false, error: error?.message || "Unable to save anime locally." };
  }
}

function removeAnimeEntry(animeId) {
  const list = getAnimeList();
  const next = list.filter((item) => String(item.id) !== String(animeId));
  if (next.length === list.length) return false;
  saveAnimeList(next);
  window.dispatchEvent(new Event("animeDataUpdated"));
  return true;
}

function statusLabel(value) {
  if (value === "completed") return "Completed";
  if (value === "watching") return "Watching";
  return "Plan";
}
