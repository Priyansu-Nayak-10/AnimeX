# API Documentation

## Overview

The backend API lives under `/api`.

Base URLs in the current project setup:

- local: `http://localhost:5000/api`
- hosted: `https://animex-api.onrender.com/api`

Swagger UI is mounted in development only:

- `/api/docs`
- `/api/docs.json`

## Auth

Most endpoints require:

- `Authorization: Bearer <access-token>`

Tokens are expected to be Supabase-compatible JWTs. Verification is handled in `apps/api/src/middleware/auth.js`.

Public endpoints currently include:

- `GET /api/health`
- anime discovery endpoints such as `GET /api/anime/top`
- `GET /api/anime/airing`
- `GET /api/anime/search`
- `GET /api/anime/season/:year/:season`
- `GET /api/anime/upcoming`
- `GET /api/anime/:malId`
- `GET /api/anime/:malId/relations`
- `GET /api/upcoming/live`

Authenticated endpoints include user library, notifications, import, push, and admin routes.

## Response shape

Most successful responses use:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Most error responses use:

```json
{
  "success": false,
  "error": "Message"
}
```

5xx responses are intentionally normalized to a generic internal server error.

## Main route groups

### Health

- `GET /api/health`

Returns service health and timestamp.

### Anime

- `GET /api/anime/top`
- `GET /api/anime/airing`
- `GET /api/anime/search`
- `GET /api/anime/season/:year/:season`
- `GET /api/anime/upcoming`
- `GET /api/anime/:malId`
- `GET /api/anime/:malId/relations`
- `POST /api/anime/follow`
- `DELETE /api/anime/follow/:malId`
- `GET /api/anime/following/:malId`

Common query params:

- `page`
- `limit`
- `q`
- `genres`
- `tags`
- `year`
- `type`
- `status`
- `rating`
- `min_score`
- `max_score`

Notes:

- `limit` is bounded to the Jikan-supported maximum used by the app
- search results are normalized before being returned

### Live upcoming

- `GET /api/upcoming/live`

Returns normalized airing countdown data used by the frontend live release widgets.

### Users

- `GET /api/users/me/followed`
- `POST /api/users/me/follow`
- `DELETE /api/users/me/unfollow/:malId`
- `GET /api/users/me/following/:malId`
- `GET /api/users/me/profile`
- `PUT /api/users/me/profile`
- `GET /api/users/me/settings`
- `PUT /api/users/me/settings`
- `GET /api/users/me/recommendations`
- `GET /api/users/community/activity`

There is also a singular alias:

- `/api/user/*`

This maps to the same router for frontend compatibility.

### Notifications

- `GET /api/notifications/me`
- `GET /api/notifications/me/unread-count`
- `GET /api/notifications/news`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/me/read-all`
- `DELETE /api/notifications/me/clear`

### Push

- `GET /api/push/public-key`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`

### Import

- `POST /api/import/mal`

Accepts a multipart XML upload from a MyAnimeList export and bulk-upserts library rows into Supabase.

### Admin

- `POST /api/admin/news/scan`
- `GET /api/admin/cache-stats`
- `POST /api/admin/cache-flush`

`/api/admin/news/scan` additionally checks `x-admin-key` against `ADMIN_SCAN_KEY`.

## Caching

Caching is handled in middleware:

- Redis when available
- in-memory fallback otherwise

Cached routes currently include several anime discovery endpoints and live upcoming data.

## Rate limiting

Rate limits are applied in `server.js` with two presets:

- standard API limiter
- stricter limiter for heavier endpoints

Rate-limit headers are returned with responses.

## Testing

Backend contract and route behavior are covered by Jest tests under:

- `apps/api/tests/api`
- `apps/api/tests/routes`
- `apps/api/tests/middleware`
- `apps/api/tests/jobs`
