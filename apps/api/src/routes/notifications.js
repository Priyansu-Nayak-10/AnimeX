const express = require('express');
const router = express.Router();
const supabase = require('../database/supabase');
const { apiResponse, apiError } = require('../utils/helpers');

/**
 * @swagger
 * /api/notifications/me:
 *   get:
 *     summary: Get the current user's notification inbox
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Array of notifications (latest 100)
 */
router.get('/me', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('id, user_id, is_read, created_at, event:events(type, message, mal_id)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        const normalized = (data || []).map((row) => ({
            id: row.id,
            user_id: row.user_id,
            is_read: row.is_read,
            created_at: row.created_at,
            type: row.event?.type || null,
            message: row.event?.message || '',
            mal_id: row.event?.mal_id || null
        }));
        return apiResponse(res, normalized, 200);
    } catch (err) {
        return apiError(res, 'Failed to fetch notifications', 500, err);
    }
});

/**
 * @swagger
 * /api/notifications/me/unread-count:
 *   get:
 *     summary: Get the count of unread notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: '{ count: number }'
 */
router.get('/me/unread-count', async (req, res) => {
    try {
        const { error, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .match({ user_id: req.user.id, is_read: false });

        if (error) throw error;
        return apiResponse(res, { count: count || 0 }, 200);
    } catch (err) {
        return apiError(res, 'Failed to count unread', 500, err);
    }
});

/**
 * @swagger
 * /api/notifications/news:
 *   get:
 *     summary: Get anime news events for followed anime
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Array of news events (latest 50)
 */
router.get('/news', async (req, res) => {
    try {
        const { data: follows, error: followsError } = await supabase
            .from('anime_follows')
            .select('mal_id')
            .eq('user_id', req.user.id);

        if (followsError) throw followsError;

        const malIds = [...new Set((follows || []).map((row) => Number(row?.mal_id)).filter(Boolean))];
        if (!malIds.length) return apiResponse(res, [], 200);

        const { data: rows, error } = await supabase
            .from('anime_events')
            .select('id, type, mal_id, message, source_url, created_at')
            .eq('type', 'NEWS')
            .in('mal_id', malIds)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return apiResponse(res, rows || [], 200);
    } catch (err) {
        return apiError(res, 'Failed to fetch news feed', 500, err);
    }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Marked as read
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', async (req, res) => {
    try {
        const { error, data } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select('id');

        if (error) throw error;
        if (!data || data.length === 0) return apiError(res, 'Notification not found', 404);
        return apiResponse(res, null, 200, 'Marked as read');
    } catch (err) {
        return apiError(res, 'Failed to mark as read', 500, err);
    }
});

/**
 * @swagger
 * /api/notifications/me/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: '{ updated: number }'
 */
router.patch('/me/read-all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .match({ user_id: req.user.id, is_read: false })
            .select('id');

        if (error) throw error;
        return apiResponse(res, { updated: data?.length || 0 }, 200, 'All marked as read');
    } catch (err) {
        return apiError(res, 'Failed to mark all as read', 500, err);
    }
});

/**
 * @swagger
 * /api/notifications/me/clear:
 *   delete:
 *     summary: Delete all notifications for the current user
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: '{ deleted: number }'
 */
router.delete('/me/clear', async (req, res) => {
    try {
        const { error, count } = await supabase
            .from('notifications')
            .delete({ count: 'exact' })
            .eq('user_id', req.user.id);

        if (error) throw error;
        return apiResponse(res, { deleted: count || 0 }, 200, 'Cleared');
    } catch (err) {
        return apiError(res, 'Failed to clear notifications', 500, err);
    }
});

module.exports = router;
