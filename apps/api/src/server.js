require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { jikanClient } = require('./utils/httpClient');

const { DateTime } = require('luxon');
const { publicRouter: animePublicRoutes, privateRouter: animePrivateRoutes } = require('./routes/anime');
const userRoutes = require('./routes/user');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const { router: pushRoutes } = require('./routes/push');
const importRoutes = require('./routes/import');
const { authenticate } = require('./middleware/auth');
const { createRateLimiter } = require('./middleware/rateLimit');
const { checkCache, getCacheStats, flushCache } = require('./middleware/cache');
const { processAnimeList } = require('./utils/helpers');
const { initSocket } = require('./config/socket');
const { initScheduler } = require('./jobs/lifecycle.job.js');
const logger = require('./utils/logger');
const { mountSwagger } = require('./config/swagger');
const { nextAiringTimestamp } = require('./utils/helpers');

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

const PORT = Number(process.env.PORT || 5000);
const JIKAN = process.env.JIKAN_API_URL || 'https://api.jikan.moe/v4';

// Cache TTL
const TTL_12H = 12 * 60 * 60;



function normalizeUpcomingRow(row) {
  const malId = Number(row?.mal_id || 0);
  if (!malId) return null;

  const releaseTimestamp = nextAiringTimestamp({
    day: row?.broadcast?.day,
    time: row?.broadcast?.time
  });

  if (!releaseTimestamp) return null;

  return {
    malId,
    title: row?.title || `Anime #${malId}`,
    image: row?.images?.jpg?.large_image_url || row?.images?.jpg?.image_url || '',
    totalEpisodes: row?.episodes || null,
    releaseTimestamp: releaseTimestamp.timestamp || null,
    countdownSeconds: releaseTimestamp.countdownSeconds,
    isoUtc: releaseTimestamp.isoUtc || null,
    isoJst: releaseTimestamp.isoJst || null,
    source: 'jikan'
  };
}

function createApp() {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable ${key}`);
    }
  }

  const app = express();
  const helmet = require('helmet');
  const WEB_DIR = path.resolve(__dirname, '..', '..', '..', 'apps', 'web');

  // Trust proxy if behind a reverse proxy/load balancer
  if (process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  // Configure CORS with explicit allowlist
  const rawOrigins = String(process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || '').trim();
  const allowedOrigins = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const isProd = process.env.NODE_ENV === 'production';

  const corsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (origin === 'null') return callback(null, true); // allow file:// and similar origins
      if (!allowedOrigins.length) {
        if (isProd) return callback(null, false); // restrict in production if no allowlist
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Disallow without throwing to avoid 500 responses on static assets
      return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204
  };

  // Security Headers (CSP opt-in via ENABLE_CSP=1, default on in prod)
  const enableCsp = process.env.ENABLE_CSP === '1' || isProd;
  const connectSrc = (() => {
    const list = ["'self'"];
    for (const o of allowedOrigins) {
      try { list.push(new URL(o).origin); } catch {}
    }
    try { list.push(new URL(JIKAN).origin); } catch {}
    if (process.env.SUPABASE_URL) {
      try { list.push(new URL(process.env.SUPABASE_URL).origin); } catch {}
    }
    return Array.from(new Set(list));
  })();

  const helmetOptions = enableCsp
    ? {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc,
            objectSrc: ["'none'"]
          }
        },
        referrerPolicy: { policy: 'no-referrer' },
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginResourcePolicy: { policy: 'same-site' }
      }
    : {
        contentSecurityPolicy: false,
        referrerPolicy: { policy: 'no-referrer' }
      };

  app.use(helmet(helmetOptions));

  // CORS only for API routes to avoid affecting static asset delivery
  app.use('/api', cors(corsOptions));

  // Enforce strict JSON payload limits to prevent unbounded parsing DoS
  app.use(express.json({ limit: '10kb' }));

  app.get('/', (req, res) => res.redirect('/pages/signin.html'));
  app.use(express.static(WEB_DIR, { index: false }));

  app.get('/health', (req, res) => res.json({ status: 'Animex backend running' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 240 });
  const strictLimiter = createRateLimiter({ windowMs: 60_000, max: 90 });

  app.use('/api/anime', strictLimiter, animePublicRoutes);
  app.use('/api/anime', authenticate, strictLimiter, animePrivateRoutes);
  app.use('/api/users', authenticate, apiLimiter, userRoutes);
  // Alias: frontend uses /api/user (singular) — map it to the same router
  app.use('/api/user', authenticate, apiLimiter, userRoutes);
  app.use('/api/notifications', authenticate, apiLimiter, notificationRoutes);
  app.use('/api/push', authenticate, strictLimiter, pushRoutes);
  app.use('/api/admin', authenticate, strictLimiter, adminRoutes);
  app.use('/api/import', authenticate, strictLimiter, importRoutes);

  // Admin: cache stats & flush (authenticated admin routes)
  app.get('/api/admin/cache-stats', authenticate, strictLimiter, (_req, res) => {
    res.json({ success: true, data: getCacheStats() });
  });
  app.post('/api/admin/cache-flush', authenticate, strictLimiter, (_req, res) => {
    flushCache();
    res.json({ success: true, message: 'Cache flushed' });
  });

  app.get('/api/upcoming/live', strictLimiter, checkCache(TTL_12H), async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(100, Number(req.query.limit || 50)));
      const data = await jikanClient.get(`${JIKAN}/seasons/now`, { params: { limit } });
      const rows = Array.isArray(data?.data) ? data.data : [];
      const processedRows = processAnimeList(rows);
      const result = processedRows
        .map(normalizeUpcomingRow)
        .filter(Boolean)
        .sort((a, b) => a.releaseTimestamp - b.releaseTimestamp)
        .slice(0, limit);

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error(error, { route: '/api/upcoming/live' });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  mountSwagger(app);

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }

    const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|json|txt|map)$/i.test(req.path);
    if (isStaticAsset) return res.status(404).send('Not Found');

    return res.redirect('/pages/signin.html');
  });

  return app;
}

function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  try {
    initScheduler();
  } catch (err) {
    logger.error('Failed to initialize scheduler', { error: err.message });
  }
  
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  return { app, server };
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
