/**
 * Saved Filters Routes
 */

import express from 'express'
import { dbGet, dbRun, dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res, next) => {
  try {
    const filters = await dbAll(
      'SELECT * FROM saved_filters WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    )

    res.json(filters.map(f => ({
      ...f,
      filterData: JSON.parse(f.filter_data || '{}')
    })))
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, description, filterData } = req.body
    const id = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await dbRun(
      `INSERT INTO saved_filters (id, user_id, name, description, filter_data)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.user.id, name, description || null, JSON.stringify(filterData || {})]
    )

    const filter = await dbGet('SELECT * FROM saved_filters WHERE id = ?', [id])

    res.status(201).json({
      ...filter,
      filterData: JSON.parse(filter.filter_data)
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, filterData } = req.body

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
    if (filterData !== undefined) {
      updates.push('filter_data = ?')
      values.push(JSON.stringify(filterData))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await dbRun(`UPDATE saved_filters SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, [...values, req.user.id])
    }

    const filter = await dbGet('SELECT * FROM saved_filters WHERE id = ? AND user_id = ?', [id, req.user.id])

    res.json({
      ...filter,
      filterData: JSON.parse(filter.filter_data)
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await dbRun('DELETE FROM saved_filters WHERE id = ? AND user_id = ?', [id, req.user.id])
    res.json({ message: 'Filter deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
