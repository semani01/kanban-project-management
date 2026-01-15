/**
 * User Routes
 * User management endpoints
 */

import express from 'express'
import bcrypt from 'bcryptjs'
import { dbGet, dbRun, dbAll } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

/**
 * Get all users
 * GET /api/users
 */
router.get('/', async (req, res, next) => {
  try {
    const users = await dbAll(
      'SELECT id, name, email, avatar_color, created_at FROM users ORDER BY name'
    )
    res.json(users)
  } catch (error) {
    next(error)
  }
})

/**
 * Get current user profile
 * GET /api/users/me
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = await dbGet(
      'SELECT id, name, email, avatar_color, created_at FROM users WHERE id = ?',
      [req.user.id]
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    next(error)
  }
})

/**
 * Update user profile
 * PUT /api/users/me
 */
router.put('/me',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('avatarColor').optional().isString()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, email, avatarColor } = req.body
      const updates = []
      const values = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (email !== undefined) {
        // Check if email is already taken by another user
        const existingUser = await dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id])
        if (existingUser) {
          return res.status(400).json({ error: 'Email already in use' })
        }
        updates.push('email = ?')
        values.push(email)
      }
      if (avatarColor !== undefined) {
        updates.push('avatar_color = ?')
        values.push(avatarColor)
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(req.user.id)

      await dbRun(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      )

      const updatedUser = await dbGet(
        'SELECT id, name, email, avatar_color, created_at FROM users WHERE id = ?',
        [req.user.id]
      )

      res.json(updatedUser)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Change password
 * PUT /api/users/me/password
 */
router.put('/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { currentPassword, newPassword } = req.body

      // Get current user with password
      const user = await dbGet(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.id]
      )

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' })
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      // Update password
      await dbRun(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPasswordHash, req.user.id]
      )

      res.json({ message: 'Password updated successfully' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
