const axios = require('axios');
const logger = require('./logger');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(clientFn, url, options = {}, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await clientFn(url, options);
            return response;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                logger.warn(`Rate limit hit on ${url}, retrying... (Attempt ${attempt}/${retries})`);
                await wait(2000 * attempt);
                continue;
            }
            if (attempt === retries) {
                logger.error(`HTTP request failed: ${url}`, { error: error.message });
                throw error;
            }
            await wait(1000 * attempt);
        }
    }
}

const activeJikanRequests = new Map();

const jikanClient = {
    get: async (url, config = {}) => {
        // Create a unique key based on URL and stringified config
        const key = `${url}|${JSON.stringify(config)}`;
        
        if (activeJikanRequests.has(key)) {
            logger.info(`[Deduplication] Returning active promise for ${url}`);
            return activeJikanRequests.get(key);
        }

        const promise = fetchWithRetry(axios.get, url, config, 3).then(response => {
            activeJikanRequests.delete(key);
            return response.data;
        }).catch(err => {
            activeJikanRequests.delete(key);
            throw err;
        });

        activeJikanRequests.set(key, promise);
        return promise;
    }
};

const anilistClient = {
    graphql: async (query, variables = {}, config = {}) => {
        const response = await fetchWithRetry(axios.post, 'https://graphql.anilist.co', {
            ...config,
            data: { query, variables }
        }, 3);
        return response.data;
    }
};

module.exports = { jikanClient, anilistClient, fetchWithRetry };
