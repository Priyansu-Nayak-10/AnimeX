const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function safeFetch(url, options = {}, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 429) {
                    await wait(2000 * attempt); // Backoff for Rate Limits
                    continue; // Retry on 429
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (attempt === retries) throw error;
            await wait(1000 * attempt); // Standard failure backoff
        }
    }
}

module.exports = { safeFetch };
