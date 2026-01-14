/**
 * LocalStorage utility functions for persisting task data
 * These functions handle saving and loading tasks from browser localStorage
 */

const STORAGE_KEY = 'kanban-tasks'

/**
 * Saves tasks array to localStorage
 * @param {Array} tasks - Array of task objects to save
 */
export const saveTasks = (tasks) => {
  try {
    // Convert tasks array to JSON string and store in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (error) {
    // Handle errors (e.g., localStorage quota exceeded)
    console.error('Error saving tasks to localStorage:', error)
  }
}

/**
 * Loads tasks array from localStorage
 * @returns {Array} Array of task objects, or empty array if none exist
 */
export const loadTasks = () => {
  try {
    // Retrieve tasks from localStorage
    const storedTasks = localStorage.getItem(STORAGE_KEY)
    
    // If tasks exist, parse JSON and return; otherwise return empty array
    return storedTasks ? JSON.parse(storedTasks) : []
  } catch (error) {
    // Handle errors (e.g., corrupted data)
    console.error('Error loading tasks from localStorage:', error)
    return []
  }
}

/**
 * Generates a unique ID for new tasks
 * Uses timestamp and random number to ensure uniqueness
 * @returns {string} Unique identifier
 */
export const generateId = () => {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
