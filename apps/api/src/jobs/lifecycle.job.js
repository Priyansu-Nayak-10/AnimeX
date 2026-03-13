const cron = require('node-cron');
const supabase = require('../database/supabase');
const { acquireLock, releaseLock } = require('./lock.js');
const { checkAnime } = require('../utils/helpers.js');
const { scanAnimeNews } = require('./news.job.js');
const { buildRecommendations } = require('./recommendations.job.js');

const PAGE_SIZE = 50;

async function scanActiveAnime() {
    const lockAcquired = await acquireLock('scan_active_anime', 5);
    if (!lockAcquired) {
        console.log('[Cron] Job skipped. Lock is active or overlapping.');
        return;
    }

    try {
        console.log('[Cron] Starting active anime scan...');
        let page = 0;
        while (true) {
            const { data: follows, error } = await supabase
                .from('anime_follows')
                .select('mal_id')
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (error) throw error;
            if (!follows || follows.length === 0) break;

            for (const anime of follows) {
                await checkAnime(anime);
                await new Promise((resolve) => setTimeout(resolve, 350));
            }

            page++;
        }
    } finally {
        await releaseLock('scan_active_anime');
        console.log('[Cron] Finished active anime scan.');
    }
}

function initScheduler() {
    cron.schedule('*/30 * * * *', scanActiveAnime);
    cron.schedule('0 * * * *', () => {
        void scanAnimeNews();
    });
    // Nightly recommendation engine — 3 AM server time
    cron.schedule('0 3 * * *', () => {
        void buildRecommendations();
    });
    console.log('[Scheduler] Cron initialized (lifecycle: every 30m, news: hourly, recommendations: nightly 3AM).');
}

module.exports = {
    scanActiveAnime,
    initScheduler
};
