/**
 * Board Routes
 * Board management endpoints
 */

import express from 'express'
import { dbGet, dbRun, dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

/**
 * Get all boards accessible to user
 * GET /api/boards
 */
router.get('/', async (req, res, next) => {
  try {
    // Get boards owned by user
    const ownedBoards = await dbAll(
      `SELECT b.*, 
       (SELECT COUNT(*) FROM tasks WHERE board_id = b.id) as task_count
       FROM boards b 
       WHERE b.owner_id = ? AND b.archived = 0
       ORDER BY b.updated_at DESC`,
      [req.user.id]
    )

    // Get boards shared with user
    const sharedBoards = await dbAll(
      `SELECT b.*, bs.permission,
       (SELECT COUNT(*) FROM tasks WHERE board_id = b.id) as task_count
       FROM boards b
       INNER JOIN board_sharing bs ON b.id = bs.board_id
       WHERE bs.user_id = ? AND b.archived = 0
       ORDER BY b.updated_at DESC`,
      [req.user.id]
    )

    // Parse JSON columns
    const parseBoards = (boards) => {
      return boards.map(board => ({
        ...board,
        columns: JSON.parse(board.columns || '[]'),
        task_count: board.task_count || 0
      }))
    }

    res.json({
      owned: parseBoards(ownedBoards),
      shared: parseBoards(sharedBoards)
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Get single board by ID
 * GET /api/boards/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if user has access
    const board = await dbGet(
      `SELECT b.*, 
       CASE WHEN b.owner_id = ? THEN 'owner'
            WHEN EXISTS (SELECT 1 FROM board_sharing WHERE board_id = b.id AND user_id = ?) THEN 'shared'
            ELSE NULL END as access_level
       FROM boards b
       WHERE b.id = ?`,
      [req.user.id, req.user.id, id]
    )

    if (!board || !board.access_level) {
      return res.status(404).json({ error: 'Board not found or access denied' })
    }

    // Get tasks
    const tasks = await dbAll(
      'SELECT * FROM tasks WHERE board_id = ? ORDER BY created_at DESC',
      [id]
    )

    // Get sharing info
    const sharing = await dbAll(
      `SELECT bs.*, u.name, u.email, u.avatar_color
       FROM board_sharing bs
       INNER JOIN users u ON bs.user_id = u.id
       WHERE bs.board_id = ?`,
      [id]
    )

    // Get activities
    const activities = await dbAll(
      'SELECT * FROM activity_log WHERE board_id = ? ORDER BY created_at DESC LIMIT 50',
      [id]
    )

    res.json({
      ...board,
      columns: JSON.parse(board.columns || '[]'),
      tasks: tasks.map(task => ({
        ...task,
        subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
        dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
        comments: task.comments ? JSON.parse(task.comments) : [],
        customFields: task.custom_fields ? JSON.parse(task.custom_fields) : {}
      })),
      sharedUsers: sharing,
      activities: activities.map(activity => ({
        ...activity,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
      }))
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Create new board
 * POST /api/boards
 */
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Board name is required'),
    body('columns').isArray().withMessage('Columns must be an array')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, description, columns } = req.body
      const boardId = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await dbRun(
        `INSERT INTO boards (id, name, description, owner_id, columns)
         VALUES (?, ?, ?, ?, ?)`,
        [boardId, name, description || null, req.user.id, JSON.stringify(columns || [])]
      )

      const board = await dbGet('SELECT * FROM boards WHERE id = ?', [boardId])

      res.status(201).json({
        ...board,
        columns: JSON.parse(board.columns)
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Update board
 * PUT /api/boards/:id
 */
router.put('/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('columns').optional().isArray()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const { name, description, columns, archived } = req.body

      // Check ownership
      const board = await dbGet('SELECT owner_id FROM boards WHERE id = ?', [id])
      if (!board || board.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Only board owner can update board' })
      }

      const updates = []
      const values = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (description !== undefined) {
        updates.push('description = ?')
        values.push(description)
      }
      if (columns !== undefined) {
        updates.push('columns = ?')
        values.push(JSON.stringify(columns))
      }
      if (archived !== undefined) {
        updates.push('archived = ?')
        values.push(archived ? 1 : 0)
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)

      await dbRun(
        `UPDATE boards SET ${updates.join(', ')} WHERE id = ?`,
        values
      )

      const updatedBoard = await dbGet('SELECT * FROM boards WHERE id = ?', [id])

      res.json({
        ...updatedBoard,
        columns: JSON.parse(updatedBoard.columns)
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Delete board
 * DELETE /api/boards/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Check ownership
    const board = await dbGet('SELECT owner_id FROM boards WHERE id = ?', [id])
    if (!board || board.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only board owner can delete board' })
    }

    await dbRun('DELETE FROM boards WHERE id = ?', [id])

    res.json({ message: 'Board deleted successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * Share board with user
 * POST /api/boards/:id/share
 */
router.post('/:id/share',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('permission').isIn(['viewer', 'editor', 'owner']).withMessage('Invalid permission')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const { userId, permission } = req.body

      // Check ownership
      const board = await dbGet('SELECT owner_id FROM boards WHERE id = ?', [id])
      if (!board || board.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Only board owner can share board' })
      }

      // Check if user exists
      const user = await dbGet('SELECT id FROM users WHERE id = ?', [userId])
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await dbRun(
        `INSERT OR REPLACE INTO board_sharing (id, board_id, user_id, permission)
         VALUES (?, ?, ?, ?)`,
        [shareId, id, userId, permission]
      )

      const sharing = await dbGet(
        `SELECT bs.*, u.name, u.email, u.avatar_color
         FROM board_sharing bs
         INNER JOIN users u ON bs.user_id = u.id
         WHERE bs.board_id = ? AND bs.user_id = ?`,
        [id, userId]
      )

      res.status(201).json(sharing)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Remove board sharing
 * DELETE /api/boards/:id/share/:userId
 */
router.delete('/:id/share/:userId', async (req, res, next) => {
  try {
    const { id, userId } = req.params

    // Check ownership
    const board = await dbGet('SELECT owner_id FROM boards WHERE id = ?', [id])
    if (!board || board.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only board owner can remove sharing' })
    }

    await dbRun(
      'DELETE FROM board_sharing WHERE board_id = ? AND user_id = ?',
      [id, userId]
    )

    res.json({ message: 'Sharing removed successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
