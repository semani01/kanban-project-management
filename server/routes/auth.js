/**
 * Authentication Routes
 * User registration and login
 */

import express from 'express'
import bcrypt from 'bcryptjs'
import { dbRun, dbGet } from '../config/database.js'
import { generateToken } from '../middleware/auth.js'
import { body, validationResult } from 'express-validator'

const router = express.Router()

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, email, password } = req.body

      // Check if user already exists
      const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email])
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Generate user ID
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Generate avatar color
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
      const avatarColor = colors[Math.floor(Math.random() * colors.length)]

      // Create user
      await dbRun(
        `INSERT INTO users (id, name, email, password_hash, avatar_color)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, name, email, passwordHash, avatarColor]
      )

      // Generate token
      const token = generateToken({ id: userId, email })

      res.status(201).json({
        user: {
          id: userId,
          name,
          email,
          avatarColor
        },
        token
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body

      // Find user
      const user = await dbGet(
        'SELECT id, name, email, password_hash, avatar_color FROM users WHERE email = ?',
        [email]
      )

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      // Generate token
      const token = generateToken({ id: user.id, email: user.email })

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatar_color
        },
        token
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
