/**
 * Board storage utility functions
 * Handles saving and loading boards from localStorage
 * Supports multiple boards with custom columns and configurations
 */

const STORAGE_KEY = 'kanban-boards'
const CURRENT_BOARD_KEY = 'kanban-current-board'

/**
 * Saves boards array to localStorage
 * @param {Array} boards - Array of board objects to save
 */
export const saveBoards = (boards) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
  } catch (error) {
    console.error('Error saving boards to localStorage:', error)
  }
}

/**
 * Loads boards array from localStorage
 * @returns {Array} Array of board objects, or empty array if none exist
 */
export const loadBoards = () => {
  try {
    const storedBoards = localStorage.getItem(STORAGE_KEY)
    return storedBoards ? JSON.parse(storedBoards) : []
  } catch (error) {
    console.error('Error loading boards from localStorage:', error)
    return []
  }
}

/**
 * Saves the current active board ID
 * @param {string} boardId - ID of the current board
 */
export const saveCurrentBoard = (boardId) => {
  try {
    localStorage.setItem(CURRENT_BOARD_KEY, boardId)
  } catch (error) {
    console.error('Error saving current board:', error)
  }
}

/**
 * Loads the current active board ID
 * @returns {string|null} ID of the current board, or null if none exists
 */
export const loadCurrentBoard = () => {
  try {
    return localStorage.getItem(CURRENT_BOARD_KEY)
  } catch (error) {
    console.error('Error loading current board:', error)
    return null
  }
}

/**
 * Generates a unique ID for new boards
 * @returns {string} Unique identifier
 */
export const generateBoardId = () => {
  return `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
