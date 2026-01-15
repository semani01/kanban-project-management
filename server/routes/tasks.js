/**
 * Task Routes
 * Task management endpoints
 */

import express from 'express'
import { dbGet, dbRun, dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

/**
 * Get all tasks for a board
 * GET /api/tasks?boardId=xxx
 */
router.get('/', async (req, res, next) => {
  try {
    const { boardId } = req.query

    if (!boardId) {
      return res.status(400).json({ error: 'boardId query parameter is required' })
    }

    // Check board access
    const board = await dbGet(
      `SELECT owner_id FROM boards WHERE id = ?`,
      [boardId]
    )

    if (!board) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const hasAccess = board.owner_id === req.user.id ||
      await dbGet(
        'SELECT 1 FROM board_sharing WHERE board_id = ? AND user_id = ?',
        [boardId, req.user.id]
      )

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const tasks = await dbAll(
      'SELECT * FROM tasks WHERE board_id = ? ORDER BY created_at DESC',
      [boardId]
    )

    res.json(tasks.map(task => ({
      ...task,
      subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
      comments: task.comments ? JSON.parse(task.comments) : [],
      customFields: task.custom_fields ? JSON.parse(task.custom_fields) : {}
    })))
  } catch (error) {
    next(error)
  }
})

/**
 * Get single task
 * GET /api/tasks/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id])

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Check board access
    const board = await dbGet('SELECT owner_id FROM boards WHERE id = ?', [task.board_id])
    const hasAccess = board.owner_id === req.user.id ||
      await dbGet('SELECT 1 FROM board_sharing WHERE board_id = ? AND user_id = ?', [task.board_id, req.user.id])

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({
      ...task,
      subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
      comments: task.comments ? JSON.parse(task.comments) : [],
      customFields: task.custom_fields ? JSON.parse(task.custom_fields) : {}
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Create new task
 * POST /api/tasks
 */
router.post('/',
  [
    body('boardId').notEmpty().withMessage('Board ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const {
        boardId, title, description, status, priority, category,
        dueDate, assignedTo, timeEstimate, timeSpent,
        subtasks, dependencies, comments, customFields
      } = req.body

      // Check board access and permission
      const board = await dbGet('SELECT owner_id FROM boards WHERE id = ?', [boardId])
      if (!board) {
        return res.status(404).json({ error: 'Board not found' })
      }

      const sharing = await dbGet(
        'SELECT permission FROM board_sharing WHERE board_id = ? AND user_id = ?',
        [boardId, req.user.id]
      )

      const canEdit = board.owner_id === req.user.id || 
        (sharing && ['editor', 'owner'].includes(sharing.permission))

      if (!canEdit) {
        return res.status(403).json({ error: 'Permission denied' })
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await dbRun(
        `INSERT INTO tasks (
          id, board_id, title, description, status, priority, category,
          due_date, assigned_to, time_estimate, time_spent,
          subtasks, dependencies, comments, custom_fields
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          taskId, boardId, title, description || null, status || 'todo',
          priority || 'medium', category || null, dueDate || null,
          assignedTo || null, timeEstimate || null, timeSpent || null,
          JSON.stringify(subtasks || []),
          JSON.stringify(dependencies || []),
          JSON.stringify(comments || []),
          JSON.stringify(customFields || {})
        ]
      )

      // Log activity
      await dbRun(
        `INSERT INTO activity_log (id, board_id, user_id, user_name, action, entity_type, entity_id, entity_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          boardId, req.user.id, req.user.name || 'User',
          'created', 'task', taskId, title
        ]
      )

      const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId])

      res.status(201).json({
        ...task,
        subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
        dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
        comments: task.comments ? JSON.parse(task.comments) : [],
        customFields: task.custom_fields ? JSON.parse(task.custom_fields) : {}
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Update task
 * PUT /api/tasks/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Get task and check access
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id])
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const board = await dbGet('SELECT owner_id FROM boards WHERE id = ?', [task.board_id])
    const sharing = await dbGet(
      'SELECT permission FROM board_sharing WHERE board_id = ? AND user_id = ?',
      [task.board_id, req.user.id]
    )

    const canEdit = board.owner_id === req.user.id ||
      (sharing && ['editor', 'owner'].includes(sharing.permission))

    if (!canEdit) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    // Build update query
    const updateFields = []
    const values = []

    const fieldMap = {
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      category: 'category',
      dueDate: 'due_date',
      assignedTo: 'assigned_to',
      timeEstimate: 'time_estimate',
      timeSpent: 'time_spent',
      subtasks: 'subtasks',
      dependencies: 'dependencies',
      comments: 'comments',
      customFields: 'custom_fields'
    }

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        if (['subtasks', 'dependencies', 'comments', 'customFields'].includes(key)) {
          updateFields.push(`${dbField} = ?`)
          values.push(JSON.stringify(updates[key]))
        } else {
          updateFields.push(`${dbField} = ?`)
          values.push(updates[key])
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    await dbRun(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    )

    // Log activity
    await dbRun(
      `INSERT INTO activity_log (id, board_id, user_id, user_name, action, entity_type, entity_id, entity_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        task.board_id, req.user.id, req.user.name || 'User',
        'updated', 'task', id, updates.title || task.title
      ]
    )

    const updatedTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [id])

    res.json({
      ...updatedTask,
      subtasks: updatedTask.subtasks ? JSON.parse(updatedTask.subtasks) : [],
      dependencies: updatedTask.dependencies ? JSON.parse(updatedTask.dependencies) : [],
      comments: updatedTask.comments ? JSON.parse(updatedTask.comments) : [],
      customFields: updatedTask.custom_fields ? JSON.parse(updatedTask.custom_fields) : {}
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id])
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const board = await dbGet('SELECT owner_id FROM boards WHERE id = ?', [task.board_id])
    const sharing = await dbGet(
      'SELECT permission FROM board_sharing WHERE board_id = ? AND user_id = ?',
      [task.board_id, req.user.id]
    )

    const canEdit = board.owner_id === req.user.id ||
      (sharing && ['editor', 'owner'].includes(sharing.permission))

    if (!canEdit) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    await dbRun('DELETE FROM tasks WHERE id = ?', [id])

    // Log activity
    await dbRun(
      `INSERT INTO activity_log (id, board_id, user_id, user_name, action, entity_type, entity_id, entity_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        task.board_id, req.user.id, req.user.name || 'User',
        'deleted', 'task', id, task.title
      ]
    )

    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
