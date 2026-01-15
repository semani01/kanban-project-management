/**
 * Notification Routes
 * Notification management endpoints
 */

import express from 'express'
import { dbGet, dbRun, dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

/**
 * Get user notifications
 * GET /api/notifications
 */
router.get('/', async (req, res, next) => {
  try {
    const notifications = await dbAll(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    )

    res.json(notifications.map(notif => ({
      ...notif,
      metadata: notif.metadata ? JSON.parse(notif.metadata) : {},
      read: notif.read === 1
    })))
  } catch (error) {
    next(error)
  }
})

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params

    await dbRun(
      'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    )

    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    next(error)
  }
})

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
router.put('/read-all', async (req, res, next) => {
  try {
    await dbRun(
      'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0',
      [req.user.id]
    )

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    next(error)
  }
})

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const result = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
      [req.user.id]
    )

    res.json({ count: result.count || 0 })
  } catch (error) {
    next(error)
  }
})

export default router
