/**
 * Automation Routes
 * Automation rules management
 */

import express from 'express'
import { dbGet, dbRun, dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res, next) => {
  try {
    const { boardId } = req.query
    let query = 'SELECT * FROM automation_rules WHERE 1=1'
    const params = []

    if (boardId) {
      query += ' AND (board_id = ? OR board_id IS NULL)'
      params.push(boardId)
    }

    query += ' ORDER BY created_at DESC'

    const rules = await dbAll(query, params)

    res.json(rules.map(rule => ({
      ...rule,
      enabled: rule.enabled === 1,
      conditions: JSON.parse(rule.conditions || '[]'),
      actions: JSON.parse(rule.actions || '[]')
    })))
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, enabled, boardId, trigger, conditions, actions } = req.body
    const id = `automation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await dbRun(
      `INSERT INTO automation_rules (id, board_id, name, enabled, trigger, conditions, actions)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, boardId || null, name, enabled ? 1 : 0, trigger,
        JSON.stringify(conditions || []),
        JSON.stringify(actions || [])
      ]
    )

    const rule = await dbGet('SELECT * FROM automation_rules WHERE id = ?', [id])

    res.status(201).json({
      ...rule,
      enabled: rule.enabled === 1,
      conditions: JSON.parse(rule.conditions),
      actions: JSON.parse(rule.actions)
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, enabled, trigger, conditions, actions } = req.body

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
    if (trigger !== undefined) {
      updates.push('trigger = ?')
      values.push(trigger)
    }
    if (conditions !== undefined) {
      updates.push('conditions = ?')
      values.push(JSON.stringify(conditions))
    }
    if (actions !== undefined) {
      updates.push('actions = ?')
      values.push(JSON.stringify(actions))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await dbRun(`UPDATE automation_rules SET ${updates.join(', ')} WHERE id = ?`, values)
    }

    const rule = await dbGet('SELECT * FROM automation_rules WHERE id = ?', [id])

    res.json({
      ...rule,
      enabled: rule.enabled === 1,
      conditions: JSON.parse(rule.conditions),
      actions: JSON.parse(rule.actions)
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await dbRun('DELETE FROM automation_rules WHERE id = ?', [id])
    res.json({ message: 'Automation rule deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
