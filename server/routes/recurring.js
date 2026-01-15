/**
 * Recurring Tasks Routes
 */

import express from 'express'
import { dbGet, dbRun, dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res, next) => {
  try {
    const { boardId } = req.query
    let query = 'SELECT * FROM recurring_tasks WHERE 1=1'
    const params = []

    if (boardId) {
      query += ' AND (board_id = ? OR board_id IS NULL)'
      params.push(boardId)
    }

    query += ' ORDER BY created_at DESC'

    const templates = await dbAll(query, params)

    res.json(templates.map(t => ({
      ...t,
      enabled: t.enabled === 1,
      taskTemplate: JSON.parse(t.task_template || '{}'),
      recurrence: JSON.parse(t.recurrence || '{}')
    })))
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, enabled, boardId, taskTemplate, recurrence } = req.body
    const id = `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await dbRun(
      `INSERT INTO recurring_tasks (id, board_id, name, enabled, task_template, recurrence)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id, boardId || null, name, enabled ? 1 : 0,
        JSON.stringify(taskTemplate || {}),
        JSON.stringify(recurrence || {})
      ]
    )

    const template = await dbGet('SELECT * FROM recurring_tasks WHERE id = ?', [id])

    res.status(201).json({
      ...template,
      enabled: template.enabled === 1,
      taskTemplate: JSON.parse(template.task_template),
      recurrence: JSON.parse(template.recurrence)
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, enabled, taskTemplate, recurrence } = req.body

    const updates = []
    const values = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (enabled !== undefined) {
      updates.push('enabled = ?')
      values.push(enabled ? 1 : 0)
    }
    if (taskTemplate !== undefined) {
      updates.push('task_template = ?')
      values.push(JSON.stringify(taskTemplate))
    }
    if (recurrence !== undefined) {
      updates.push('recurrence = ?')
      values.push(JSON.stringify(recurrence))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await dbRun(`UPDATE recurring_tasks SET ${updates.join(', ')} WHERE id = ?`, values)
    }

    const template = await dbGet('SELECT * FROM recurring_tasks WHERE id = ?', [id])

    res.json({
      ...template,
      enabled: template.enabled === 1,
      taskTemplate: JSON.parse(template.task_template),
      recurrence: JSON.parse(template.recurrence)
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await dbRun('DELETE FROM recurring_tasks WHERE id = ?', [id])
    res.json({ message: 'Recurring task template deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
