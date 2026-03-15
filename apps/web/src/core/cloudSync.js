import { authFetch, apiUrl, getAccessToken } from '../config.js';
import { createApiClient } from './api.js';

const api = createApiClient();

function normalizeStatus(value) {
  const raw = String(value || '').toLowerCase();
  if (raw === 'watching' || raw === 'completed' || raw === 'dropped') return raw;
  return 'plan';
}

function normalizeGenreNames(value) {
  return (Array.isArray(value) ? value : [])
    .map((genre) => (typeof genre === 'string' ? genre : genre?.name))
    .map((genre) => String(genre || '').trim())
    .filter(Boolean);
}

function toLibraryItem(row) {
  const malId = Number(row?.mal_id || 0);
  const progress = Math.max(0, Number(row?.next_episode || 0));
  return {
    malId,
    title: String(row?.title || `Anime #${malId}`),
    image: row?.image || '',
    status: normalizeStatus(row?.status),
    progress,
    watchedEpisodes: progress,
    episodes: Math.max(0, Number(row?.total_episodes || 0)),
    updatedAt: Date.parse(row?.last_checked || row?.created_at || '') || Date.now(),
    genres: normalizeGenreNames(row?.genres),
    studio: String(row?.studio || '').trim(),
    duration: String(row?.duration || '').trim(),
    year: Number(row?.year || 0) || 0,
    score: Number(row?.score || 0) || 0,
    userRating: Number(row?.user_rating || row?.userRating || 0) || null
  };
}

function signature(items = []) {
  return [...(items || [])]
    .map((item) => ({
      malId: Number(item?.malId || 0),
      status: normalizeStatus(item?.status),
      progress: Math.max(0, Number(item?.progress ?? item?.watchedEpisodes ?? 0))
    }))
    .filter((item) => item.malId)
    .sort((a, b) => a.malId - b.malId)
    .map((item) => `${item.malId}:${item.status}:${item.progress}`)
    .join('|');
}

async function backfillMissingImages(store) {
  const items = store.getAll();
  const missing = items.filter(item => !item.image);
  
  if (missing.length === 0) return;
  console.log(`[CloudSync] Backfilling images for ${missing.length} items...`);

  let updatedAny = false;
  for (const item of missing) {
    try {
      // Add a small delay to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 1000));
      
      const detailRes = await api.getAnimeDetail(item.malId);
      const data = detailRes?.data || detailRes;
      const imageUrl = data?.images?.jpg?.large_image_url || data?.images?.jpg?.image_url;
      
      if (imageUrl) {
        item.image = imageUrl;
        item.genres = normalizeGenreNames(data.genres);
        item.studio = String(data?.studios?.[0]?.name || item?.studio || '').trim();
        item.duration = String(data?.duration || item?.duration || '').trim();
        item.score = Number(data?.score || item?.score || 0) || 0;
        item.year = data.year || 0;
        
        // Update local store silently to prevent loops, then just persist
        store.upsert(item, item.status);
        updatedAny = true;
      }
    } catch (err) {
      console.warn(`[CloudSync] Failed to backfill image for ${item.malId}:`, err);
    }
  }
  
  if (updatedAny) {
    // Only push if we actually got new images
    pushLibrary(store.getAll()).catch(e => console.error('[CloudSync] Failed to push backfilled images', e));
  }
}

async function fetchRemoteLibrary() {
  const res = await authFetch(apiUrl('/users/me/followed'));
  if (!res.ok) {
    const error = new Error(`Remote load failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  const json = await res.json();
  const rows = Array.isArray(json?.data) ? json.data : [];
  return rows.map(toLibraryItem).filter((item) => Number(item?.malId || 0));
}

async function pushLibrary(localItems) {
  const localById = new Map(
    (localItems || [])
      .map((item) => [Number(item?.malId || 0), item])
      .filter(([id]) => id)
  );

  const remoteRes = await authFetch(apiUrl('/users/me/followed'));
  if (!remoteRes.ok) {
    const error = new Error(`Remote diff load failed (${remoteRes.status})`);
    error.status = remoteRes.status;
    throw error;
  }
  const remoteJson = await remoteRes.json();
  const remoteRows = Array.isArray(remoteJson?.data) ? remoteJson.data : [];
  const remoteIds = new Set(remoteRows.map((row) => Number(row?.mal_id || 0)).filter(Boolean));

  for (const item of localById.values()) {
    const progress = Math.max(0, Number(item?.progress ?? item?.watchedEpisodes ?? 0));
    await authFetch(apiUrl('/users/me/follow'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        malId: Number(item?.malId || 0),
        title: item?.title || '',
        image: item?.image || '',
        status: normalizeStatus(item?.status),
        nextEpisode: progress,
        totalEpisodes: Number(item?.episodes || 0)
      })
    });
  }

  for (const malId of remoteIds) {
    if (localById.has(malId)) continue;
    await authFetch(apiUrl(`/users/me/unfollow/${malId}`), { method: 'DELETE' });
  }
}

export function initLibraryCloudSync({ libraryStore, toast = null, syncIntervalMs = 120000 } = {}) {
  if (!libraryStore) return { destroy() {} };

  let destroyed = false;
  let syncing = false;
  let suppressSync = false;
  let lastSyncedSig = '';
  let debounceTimer = 0;
  let intervalTimer = 0;
  let warnedUnavailable = false;

  function isAuthFailure(error) {
    const status = Number(error?.status || 0);
    return status === 401 || status === 403;
  }

  async function runSync({ force = false } = {}) {
    if (destroyed || syncing) return;
    if (!getAccessToken()) return;

    const current = libraryStore.getAll();
    const sig = signature(current);
    if (!force && sig === lastSyncedSig) return;

    syncing = true;
    try {
      await pushLibrary(current);
      lastSyncedSig = signature(libraryStore.getAll());
    } catch (error) {
      console.warn('[CloudSync] Push failed:', error?.message || error);
    } finally {
      syncing = false;
    }
  }

  // Handle incoming real-time library updates by marking them as "already synced"
  window.addEventListener('animex:library-sync-received', (e) => {
    lastSyncedSig = signature(libraryStore.getAll());
  });

  async function bootstrapSync() {
    if (!getAccessToken()) return;
    const local = libraryStore.getAll();

    try {
      const remote = await fetchRemoteLibrary();
      if (remote.length > 0) {
        // Merge: prefer local images for items the remote doesn't have
        const localByMalId = new Map(local.map(i => [Number(i.malId), i]));
        const merged = remote.map(r => {
          const loc = localByMalId.get(Number(r.malId));
          return {
            ...r,
            image: r.image || loc?.image || '',
            genres: r.genres || loc?.genres || [],
            year: r.year || loc?.year || 0
          };
        });

        suppressSync = true;
        libraryStore.init(merged);
        suppressSync = false;
        lastSyncedSig = signature(libraryStore.getAll());

        // Backfill images for items missing them (fire-and-forget)
        backfillMissingImages(libraryStore);
        return;
      }

      if (local.length > 0) {
        await runSync({ force: true });
      }
    } catch (error) {
      console.warn('[CloudSync] Bootstrap failed:', error?.message || error);
      if (isAuthFailure(error)) return;
      if (toast?.show && !warnedUnavailable) {
        warnedUnavailable = true;
        toast.show('Cloud sync unavailable. Using local library only.', 'error', 2400);
      }
    } finally {
      suppressSync = false;
    }
  }

  const unsubscribe = libraryStore.subscribe(() => {
    if (destroyed || suppressSync) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void runSync();
    }, 900);
  });

  intervalTimer = setInterval(() => {
    void runSync();
  }, Math.max(30000, Number(syncIntervalMs) || 120000));

  // Small delay avoids false negatives while auth state settles after load.
  setTimeout(() => {
    void bootstrapSync();
  }, 1200);

  return Object.freeze({
    syncNow() {
      return runSync({ force: true });
    },
    destroy() {
      destroyed = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (intervalTimer) clearInterval(intervalTimer);
      unsubscribe?.();
    }
  });
}
