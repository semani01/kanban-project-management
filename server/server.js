/**
 * Main Server File
 * Express server setup and route configuration
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './config/database.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logServerEnvironmentWarnings } from './utils/envValidation.js'

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import boardRoutes from './routes/boards.js'
import taskRoutes from './routes/tasks.js'
import activityRoutes from './routes/activities.js'
import notificationRoutes from './routes/notifications.js'
import automationRoutes from './routes/automations.js'
import recurringRoutes from './routes/recurring.js'
import filterRoutes from './routes/filters.js'
import customFieldRoutes from './routes/customFields.js'

// Load environment variables
dotenv.config()

// Validate environment variables
logServerEnvironmentWarnings()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/boards', boardRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/automations', automationRoutes)
app.use('/api/recurring', recurringRoutes)
app.use('/api/filters', filterRoutes)
app.use('/api/custom-fields', customFieldRoutes)

// Error handling middleware (must be last)
app.use(errorHandler)

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase()
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📊 API available at http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
