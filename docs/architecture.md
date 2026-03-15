# Architecture

## Overview

Animex is a JavaScript monorepo with two active applications:

- `apps/web`: a Vite-powered multi-page frontend using plain ES modules
- `apps/api`: an Express 5 backend that proxies anime data, manages user data, and drives notifications

There are also `packages/*` workspace entries, but they are currently placeholders and are not part of the live app runtime.

## Monorepo layout

- `apps/web`
  - static pages under `pages/`
  - browser code under `src/`
  - runtime config and assets under `public/`
- `apps/api`
  - server bootstrap in `src/server.js`
  - route handlers in `src/routes/`
  - middleware in `src/middleware/`
  - jobs in `src/jobs/`
  - Supabase helpers and SQL in `src/database/`
- `docs`
  - project documentation

## Frontend architecture

The web app is not React or Vue based. It uses:

- Vite for dev/build
- HTML pages under `apps/web/pages`
- plain ES modules under `apps/web/src`
- localStorage-backed state plus a custom in-memory store
- Supabase client auth in the browser

### Main frontend entry points

- `pages/signin.html`
- `pages/signup.html`
- `pages/reset-password.html`
- `pages/app.html`

`pages/app.html` is the main authenticated app shell. It loads `src/main.js`, which calls `startApp()` from `src/app.js`.

### Frontend state and data flow

- `src/store.js`
  - global UI/auth state
  - local library store
  - localStorage persistence and cross-tab sync
- `src/core/api.js`
  - browser API client
  - retry, deduplication, and local cache behavior
- `src/core/cloudSync.js`
  - synchronizes local library state with backend user library endpoints
- `src/features/*`
  - page and feature logic for auth, notifications, library, search, dashboard, season browser, and user settings

### Frontend runtime config

The browser reads config from `window.ENV` in `apps/web/public/env.js`.

Current keys:

- `API_BASE`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

The frontend uses:

- local backend in development: `http://localhost:5000/api`
- hosted backend in production: `https://animex-api.onrender.com/api`

## Backend architecture

The API is an Express application created in `apps/api/src/server.js`.

### Core responsibilities

- serves the built/static web app in backend-hosted mode
- exposes `/api/*` REST endpoints
- validates JWT bearer tokens for authenticated routes
- fetches anime data from Jikan and AniList
- stores user, library, notification, and recommendation data in Supabase
- runs scheduled jobs for lifecycle scans, news ingestion, and recommendations
- emits real-time events over Socket.IO

### Main backend modules

- `src/server.js`
  - app creation, CORS, Helmet, auth, route registration, static file serving
- `src/routes/anime.js`
  - top, airing, search, season, upcoming, details, follow/unfollow
- `src/routes/user.js`
  - profile, settings, library, recommendations, community activity
- `src/routes/notifications.js`
  - inbox, unread counts, read state, clear state, anime news feed
- `src/routes/import.js`
  - MyAnimeList XML import
- `src/routes/push.js`
  - web push subscription endpoints
- `src/config/socket.js`
  - Socket.IO setup, optional Redis adapter, socket auth
- `src/middleware/auth.js`
  - JWT verification against Supabase-compatible tokens
- `src/middleware/cache.js`
  - Redis-first cache with in-memory fallback
- `src/jobs/*.js`
  - scheduled background work

## Data and external services

### Supabase

Supabase is the main system of record for:

- user profiles
- user settings
- followed anime
- follow notifications
- push subscriptions
- recommendation snapshots
- job locking and RPC helpers

The backend uses the service role key. The frontend uses the anon key.

### Jikan

Jikan is the main anime data source for:

- top anime
- current season
- seasonal listings
- search
- title details
- relation lookups

### AniList

AniList is used as a supporting source for some recommendation and dub signal logic.

### Redis

Redis is optional.

If `REDIS_URL` is configured, it is used for:

- API response caching
- Socket.IO multi-instance adapter
- presence/activity storage

If it is not configured, the app falls back to in-memory behavior.

## Real-time and scheduled work

### Real-time

Socket.IO is used for:

- notification delivery
- live activity broadcasts

Authenticated sockets join `user:{id}` rooms. Unauthenticated sockets can connect but do not join user-specific rooms.

### Scheduled jobs

Defined in `apps/api/src/jobs/lifecycle.job.js`:

- active anime scan every 30 minutes
- anime news scan hourly
- recommendations build nightly at 3 AM server time

Jobs use DB-backed locks to avoid overlapping execution.

## Security model

- backend JWT auth is required for most `/api/*` routes
- CORS is allowlist based using `ALLOWED_ORIGINS` or `CLIENT_ORIGIN`
- Helmet is enabled, with CSP enabled by default in production
- request bodies are limited to 10 KB JSON payloads
- import uploads are limited and kept in memory
- rate limiting is applied at the route layer

## Current architectural notes

- backend tests are in much better shape than frontend verification
- the frontend is feature-rich but centered around a very large bootstrap module
- `docs/*` and `packages/*` were originally placeholders and should keep evolving to match the real codebase
