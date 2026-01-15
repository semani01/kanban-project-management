/**
 * Database Configuration and Setup
 * SQLite database connection and initialization
 */

import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/kanban.db')

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Connected to SQLite database')
  }
})

// Promisify database methods
export const dbRun = promisify(db.run.bind(db))
export const dbGet = promisify(db.get.bind(db))
export const dbAll = promisify(db.all.bind(db))

/**
 * Initialize database schema
 */
export const initDatabase = async () => {
  try {
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Boards table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT NOT NULL,
        columns TEXT NOT NULL,
        archived INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Board sharing table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS board_sharing (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        permission TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(board_id, user_id)
      )
    `)

    // Tasks table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        category TEXT,
        due_date DATETIME,
        assigned_to TEXT,
        time_estimate INTEGER,
        time_spent INTEGER,
        custom_fields TEXT,
        subtasks TEXT,
        dependencies TEXT,
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      )
    `)

    // Activity log table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        entity_name TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Notifications table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        entity_id TEXT,
        metadata TEXT,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Automation rules table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS automation_rules (
        id TEXT PRIMARY KEY,
        board_id TEXT,
        name TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        trigger TEXT NOT NULL,
        conditions TEXT NOT NULL,
        actions TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `)

    // Recurring tasks table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS recurring_tasks (
        id TEXT PRIMARY KEY,
        board_id TEXT,
        name TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        task_template TEXT NOT NULL,
        recurrence TEXT NOT NULL,
        last_generated DATETIME,
        occurrence_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `)

    // Saved filters table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS saved_filters (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        filter_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Custom fields table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS custom_fields (
        id TEXT PRIMARY KEY,
        board_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        required INTEGER DEFAULT 0,
        default_value TEXT,
        options TEXT,
        placeholder TEXT,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `)

    // Create indexes for better performance
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id)`)
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`)
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`)
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON boards(owner_id)`)
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_activity_board_id ON activity_log(board_id)`)
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`)
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`)

    console.log('Database schema initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

/**
 * Close database connection
 */
export const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err)
      } else {
        console.log('Database connection closed')
        resolve()
      }
    })
  })
}

export default db
