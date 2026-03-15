# Deployment Guide

## Overview

Animex is currently set up to deploy as:

- frontend on Vercel
- backend on a Node host such as Render
- data and auth on Supabase
- optional Redis for cache and real-time scale-out

This guide reflects the code that exists in the repo today.

## Frontend deployment

Frontend app path:

- `apps/web`

### Build

From the repo root:

```bash
npm run build --workspace=apps/web
```

Vite entry points are configured in:

- `apps/web/vite.config.js`

Built pages:

- `index.html`
- `pages/app.html`
- `pages/signin.html`
- `pages/signup.html`
- `pages/reset-password.html`

### Vercel notes

There is a minimal Vercel config in:

- `apps/web/vercel.json`

Current behavior:

- `/` rewrites to `/index.html`

### Frontend runtime config

The frontend reads runtime config from:

- `apps/web/public/env.js`

Current keys:

- `API_BASE`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Important note:

- `SUPABASE_ANON_KEY` is safe to expose to the browser
- service keys and private backend credentials must never be placed in `env.js`

If you want environment-specific frontend config, update `env.js` at deploy time or replace it with platform-managed injection.

## Backend deployment

Backend app path:

- `apps/api`

### Start commands

Development:

```bash
npm run dev --workspace=apps/api
```

Production:

```bash
npm run start --workspace=apps/api
```

### Required backend environment variables

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Common optional variables:

- `PORT`
- `NODE_ENV`
- `ALLOWED_ORIGINS`
- `CLIENT_ORIGIN`
- `TRUST_PROXY`
- `ENABLE_CSP`
- `JIKAN_API_URL`
- `REDIS_URL`
- `CACHE_NAMESPACE`
- `JWT_SECRET`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_JWT_PUBLIC_KEY`
- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `ADMIN_SCAN_KEY`

### Backend hosting notes

The backend currently defaults to port `5000` locally and expects a normal Node HTTP environment.

The server:

- serves static web assets if hosted together
- exposes `/health` and `/api/health`
- mounts Swagger docs only outside production

## Supabase setup

Supabase is required for:

- browser auth
- backend auth verification
- user/library/profile/settings tables
- notifications and recommendations
- SQL RPC functions for job locks and event fanout

Relevant SQL artifacts in the repo:

- `apps/api/src/config/schema.sql`
- `apps/api/src/database/functions/process_anime_event.sql`
- `apps/api/src/database/functions/user_sync_schema.sql`

Before deploying the backend, make sure the required tables, RPC functions, and policies exist in Supabase.

## Redis setup

Redis is optional but recommended for production.

If `REDIS_URL` is configured, it is used for:

- cache storage
- Socket.IO adapter
- live activity persistence

If not configured, the app falls back to in-memory behavior. That works for development and single-instance hosting, but is not ideal for horizontal scaling.

## Push notifications

Web push support requires:

- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

Without these values, push subscription endpoints will not work correctly.

## Post-deploy checks

After deployment, verify:

1. frontend pages load correctly
2. sign-in and sign-up succeed against Supabase
3. authenticated app shell loads at `/pages/app.html`
4. API health responds at `/api/health`
5. anime search and seasonal endpoints return data
6. notifications and library sync work for an authenticated user
7. scheduled jobs are enabled on the backend host

## Current repo caveats

- the frontend build could not be fully validated in this environment because `vite build` hit an `esbuild` spawn permission issue here
- backend tests are passing and are the strongest deployment confidence signal right now
- only the `apps/web` and `apps/api` workspaces are part of the current deployment surface
