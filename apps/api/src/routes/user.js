const express = require('express');
const axios = require('axios');
const { jikanClient } = require('../utils/httpClient');
const supabase = require('../database/supabase');
const { apiResponse, apiError } = require('../utils/helpers');
const { validate } = require('../middleware/validate');
const { recordActivity, getRecentActivities } = require('../services/presence');

const router = express.Router();
const JIKAN = process.env.JIKAN_API_URL || 'https://api.jikan.moe/v4';

function clampText(value, max = 255) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.slice(0, max);
}

/**
 * @swagger
 * /api/users/me/followed:
 *   get:
 *     summary: Get all anime the current user is following
 *     tags: [Library]
 *     responses:
 *       200:
 *         description: Array of followed anime
 */
router.get('/me/followed', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('followed_anime')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    return apiResponse(res, data || [], 200);
  } catch (err) {
    return apiError(res, 'Failed to fetch followed list', 500, err);
  }
});

/**
 * @swagger
 * /api/users/me/follow:
 *   post:
 *     summary: Add an anime to the user's library
 *     tags: [Library]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [malId]
 *             properties:
 *               malId: { type: integer }
 *               status: { type: string, enum: [plan, watching, completed, dropped] }
 *     responses:
 *       201:
 *         description: Anime added to library
 */
router.post('/me/follow', async (req, res) => {
  try {
    let { malId, title, isAiring, totalEpisodes, status, nextEpisode } = req.body;
    if (!malId) return apiError(res, 'malId is required', 400);

    if (!title) {
      try {
        const data = await jikanClient.get(`${JIKAN}/anime/${malId}`);
        const anime = data?.data;
        let engTitle = anime?.title_english;
        if (!engTitle && Array.isArray(anime?.titles)) {
          const eng = anime.titles.find(t => t.type === 'English');
          if (eng) engTitle = eng.title;
        }
        title = engTitle || anime?.title || `Anime #${malId}`;
        isAiring = anime?.airing ?? isAiring ?? false;
        totalEpisodes = anime?.episodes ?? totalEpisodes ?? 0;
      } catch {
        title = `Anime #${malId}`;
      }
    }

    const xss = require('xss');
    title = clampText(xss(title), 255);

    const parsedMalId = Number.parseInt(malId, 10);
    const normalizedStatus = ['plan', 'watching', 'completed', 'dropped'].includes(String(status || '').toLowerCase())
      ? String(status).toLowerCase()
      : 'plan';
    const parsedNextEpisode = Math.max(0, Number.parseInt(nextEpisode, 10) || 0);
    const { data, error } = await supabase
      .from('followed_anime')
      .upsert({
        user_id: req.user.id,
        mal_id: parsedMalId,
        title,
        image: req.body?.image || '',
        status: normalizedStatus,
        next_episode: parsedNextEpisode,
        is_airing: Boolean(isAiring),
        total_episodes: Number.parseInt(totalEpisodes, 10) || 0
      }, { onConflict: 'user_id, mal_id' })
      .select();

    if (error) throw error;

    // Trigger Social Presence if status is active
    if (normalizedStatus === 'watching' || normalizedStatus === 'completed') {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, name, avatar')
          .eq('user_id', req.user.id)
          .maybeSingle();

        if (profile) {
          const actionText = normalizedStatus === 'watching' ? 'is watching' : 'completed';
          const payloadString = JSON.stringify({ 
            title, 
            malId: parsedMalId,
            image: req.body?.image || '' 
          });
          
          recordActivity(profile, actionText, payloadString);
        }
      } catch (err) {
        console.error('Failed to trigger presence activity:', err.message);
      }
    }

    return apiResponse(res, data?.[0] || null, 201, `Now following "${title}"`);
  } catch (err) {
    return apiError(res, 'Failed to follow anime', 500, err);
  }
});

/**
 * @swagger
 * /api/users/me/unfollow/{malId}:
 *   delete:
 *     summary: Remove an anime from the user's library
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: malId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Unfollowed successfully
 *       404:
 *         description: Entry not found
 */
router.delete('/me/unfollow/:malId', async (req, res) => {
  try {
    const parsedMalId = Number.parseInt(req.params.malId, 10);
    const { error, count } = await supabase
      .from('followed_anime')
      .delete({ count: 'exact' })
      .match({ user_id: req.user.id, mal_id: parsedMalId });

    if (error) throw error;
    if (!count) return apiError(res, 'Entry not found', 404);
    return apiResponse(res, null, 200, 'Unfollowed');
  } catch (err) {
    return apiError(res, 'Failed to unfollow', 500, err);
  }
});

/**
 * @swagger
 * /api/users/me/following/{malId}:
 *   get:
 *     summary: Check whether the user follows a specific anime
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: malId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: '{ following: boolean }'
 */
router.get('/me/following/:malId', async (req, res) => {
  try {
    const parsedMalId = Number.parseInt(req.params.malId, 10);
    const { data, error } = await supabase
      .from('followed_anime')
      .select('id')
      .match({ user_id: req.user.id, mal_id: parsedMalId })
      .maybeSingle();

    if (error) throw error;
    return apiResponse(res, { following: Boolean(data?.id) }, 200);
  } catch (err) {
    return apiError(res, 'Check failed', 500, err);
  }
});

/**
 * @swagger
 * /api/users/me/profile:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Profile object
 */
router.get('/me/profile', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    return apiResponse(res, data || {}, 200);
  } catch (err) {
    return apiError(res, 'Failed to fetch profile', 500, err);
  }
});

const profileValidator = validate({
  body: {
    name: { type: 'string', maxLength: 80 },
    bio: { type: 'string', maxLength: 500 },
    avatar: { type: 'string', maxLength: 1048576 }, // 1MB for base64
    banner: { type: 'string', maxLength: 1048576 }, // 1MB for base64
    mal: { type: 'string', maxLength: 255 },
    al: { type: 'string', maxLength: 255 },
  },
});

/**
 * @swagger
 * /api/users/me/profile:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:   { type: string, maxLength: 80 }
 *               bio:    { type: string, maxLength: 500 }
 *               avatar: { type: string, maxLength: 2048 }
 *               banner: { type: string, maxLength: 2048 }
 *               mal:    { type: string, maxLength: 255 }
 *               al:     { type: string, maxLength: 255 }
 *     responses:
 *       200:
 *         description: Updated profile
 *       400:
 *         description: Validation error
 */
router.put('/me/profile', profileValidator, async (req, res) => {
  try {
    const name = clampText(req.body?.name, 80);
    const bio = clampText(req.body?.bio, 500);
    const avatar = clampText(req.body?.avatar, 2048);
    const banner = clampText(req.body?.banner, 2048);
    const mal = clampText(req.body?.mal, 255);
    const al = clampText(req.body?.al, 255);
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: req.user.id,
        name,
        bio,
        avatar,
        banner,
        mal,
        al,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select();

    if (error) throw error;
    return apiResponse(res, data?.[0] || {}, 200, 'Profile synced');
  } catch (err) {
    return apiError(res, 'Failed to update profile', 500, err);
  }
});

/**
 * @swagger
 * /api/users/me/settings:
 *   get:
 *     summary: Get the current user's settings
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Settings object
 */
router.get('/me/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    return apiResponse(res, data || {}, 200);
  } catch (err) {
    return apiError(res, 'Failed to fetch settings', 500, err);
  }
});

const settingsValidator = validate({
  body: {
    title_lang: { type: 'string', enum: ['english', 'romaji', 'japanese'] },
    default_status: { type: 'string', enum: ['plan', 'watching', 'completed', 'dropped'] },
    accent_color: { type: 'string', maxLength: 24 },
  },
});

/**
 * @swagger
 * /api/users/me/settings:
 *   put:
 *     summary: Update the current user's settings
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dark_theme:     { type: boolean }
 *               notifications:  { type: boolean }
 *               autoplay:       { type: boolean }
 *               data_saver:     { type: boolean }
 *               title_lang:     { type: string, enum: [english, romaji, japanese] }
 *               default_status: { type: string, enum: [plan, watching, completed, dropped] }
 *               accent_color:   { type: string }
 *     responses:
 *       200:
 *         description: Updated settings
 *       400:
 *         description: Validation error
 */
router.put('/me/settings', settingsValidator, async (req, res) => {
  try {
    const dark_theme = Boolean(req.body?.dark_theme);
    const notifications = Boolean(req.body?.notifications);
    const autoplay = Boolean(req.body?.autoplay);
    const data_saver = Boolean(req.body?.data_saver);
    const title_lang = ['english', 'romaji', 'japanese'].includes(String(req.body?.title_lang || '').toLowerCase())
      ? String(req.body.title_lang).toLowerCase()
      : 'english';
    const default_status = ['plan', 'watching', 'completed', 'dropped'].includes(String(req.body?.default_status || '').toLowerCase())
      ? String(req.body.default_status).toLowerCase()
      : 'plan';
    // Only allow valid CSS hex colors (#RGB, #RRGGBB, #RRGGBBAA)
    const rawAccent = String(req.body?.accent_color || '').trim();
    const accent_color = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(rawAccent)
      ? rawAccent
      : '';

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: req.user.id,
        dark_theme,
        notifications,
        autoplay,
        data_saver,
        title_lang,
        default_status,
        accent_color,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select();

    if (error) throw error;
    return apiResponse(res, data?.[0] || {}, 200, 'Settings synced');
  } catch (err) {
    return apiError(res, 'Failed to update settings', 500, err);
  }
});

/**
 * @swagger
 * /api/users/me/recommendations:
 *   get:
 *     summary: Get personalized anime recommendations for the current user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Array of personalized recommendation objects
 */
router.get('/me/recommendations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_recommendations')
      .select('recommendations, updated_at')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    const recs = Array.isArray(data?.recommendations) ? data.recommendations : [];
    return apiResponse(res, recs, 200, 'Personalized recommendations');
  } catch (err) {
    return apiError(res, 'Failed to fetch recommendations', 500, err);
  }
});

/**
 * @swagger
 * /api/users/community/activity:
 *   get:
 *     summary: Get recent global community activities
 *     tags: [Community]
 *     responses:
 *       200:
 *         description: Array of recent activities
 */
router.get('/community/activity', async (req, res) => {
  try {
    const activities = await getRecentActivities();
    return apiResponse(res, activities, 200);
  } catch (err) {
    return apiError(res, 'Failed to fetch community activity', 500, err);
  }
});

module.exports = router;

