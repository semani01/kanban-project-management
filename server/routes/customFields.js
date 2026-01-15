/**
 * Custom Fields Routes
 */

import express from 'express'
import { dbGet, dbRun, dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res, next) => {
  try {
    const { boardId } = req.query
    let query = 'SELECT * FROM custom_fields WHERE 1=1'
    const params = []

    if (boardId) {
      query += ' AND (board_id = ? OR board_id IS NULL)'
      params.push(boardId)
    }

    query += ' ORDER BY display_order, created_at'

    const fields = await dbAll(query, params)

    res.json(fields.map(f => ({
      ...f,
      required: f.required === 1,
      options: f.options ? JSON.parse(f.options) : []
    })))
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, type, boardId, required, defaultValue, options, placeholder, description, order } = req.body
    const id = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await dbRun(
      `INSERT INTO custom_fields (id, board_id, name, type, required, default_value, options, placeholder, description, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, boardId || null, name, type, required ? 1 : 0,
        defaultValue || null, JSON.stringify(options || []),
        placeholder || null, description || null, order || 0
      ]
    )

    const field = await dbGet('SELECT * FROM custom_fields WHERE id = ?', [id])

    res.status(201).json({
      ...field,
      required: field.required === 1,
      options: field.options ? JSON.parse(field.options) : []
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, type, required, defaultValue, options, placeholder, description, order } = req.body

    const updates = []
    const values = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (type !== undefined) {
      updates.push('type = ?')
      values.push(type)
    }
    if (required !== undefined) {
      updates.push('required = ?')
      values.push(required ? 1 : 0)
    }
    if (defaultValue !== undefined) {
      updates.push('default_value = ?')
      values.push(defaultValue)
    }
    if (options !== undefined) {
      updates.push('options = ?')
      values.push(JSON.stringify(options))
    }
    if (placeholder !== undefined) {
      updates.push('placeholder = ?')
      values.push(placeholder)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (order !== undefined) {
      updates.push('display_order = ?')
      values.push(order)
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await dbRun(`UPDATE custom_fields SET ${updates.join(', ')} WHERE id = ?`, values)
    }

    const field = await dbGet('SELECT * FROM custom_fields WHERE id = ?', [id])

    res.json({
      ...field,
      required: field.required === 1,
      options: field.options ? JSON.parse(field.options) : []
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await dbRun('DELETE FROM custom_fields WHERE id = ?', [id])
    res.json({ message: 'Custom field deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
