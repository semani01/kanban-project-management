/**
 * Database Initialization Script
 * Run this to initialize the database schema
 */

import { initDatabase, closeDatabase } from '../config/database.js'

async function main() {
  try {
    console.log('Initializing database...')
    await initDatabase()
    console.log('Database initialized successfully!')
    await closeDatabase()
    process.exit(0)
  } catch (error) {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  }
}

main()
