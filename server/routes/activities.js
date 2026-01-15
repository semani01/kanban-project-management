/**
 * Activity Routes
 * Activity log endpoints
 */

import express from 'express'
import { dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

/**
 * Get activities for a board
 * GET /api/activities?boardId=xxx
 */
router.get('/', async (req, res, next) => {
  try {
    const { boardId } = req.query

    if (!boardId) {
      return res.status(400).json({ error: 'boardId query parameter is required' })
    }

    const activities = await dbAll(
      `SELECT * FROM activity_log 
       WHERE board_id = ? 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [boardId]
    )

    res.json(activities.map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      userName: activity.user_name || 'Unknown User',
      action: activity.action,
      entityType: activity.entity_type,
      entityId: activity.entity_id,
      entityName: activity.entity_name || 'unnamed',
      details: activity.metadata ? JSON.parse(activity.metadata) : {},
      timestamp: activity.created_at
    })))
  } catch (error) {
    next(error)
  }
})

export default router
