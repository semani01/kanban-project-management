/**
 * Undo/Redo utility functions
 * Manages history stack for undo/redo functionality
 */

/**
 * Creates a history manager for undo/redo operations
 * @param {number} maxHistory - Maximum number of history entries (default: 50)
 * @returns {Object} History manager object
 */
export const createHistoryManager = (maxHistory = 50) => {
  let history = []
  let currentIndex = -1

  /**
   * Adds a new state to history
   * @param {any} state - State to save
   */
  const push = (state) => {
    // Remove any states after current index (when undoing and then making new changes)
    history = history.slice(0, currentIndex + 1)
    
    // Add new state
    history.push(JSON.parse(JSON.stringify(state))) // Deep clone
    currentIndex = history.length - 1
    
    // Limit history size
    if (history.length > maxHistory) {
      history.shift()
      currentIndex--
    }
  }

  /**
   * Undo - returns previous state
   * @returns {any|null} Previous state or null if can't undo
   */
  const undo = () => {
    if (currentIndex > 0) {
      currentIndex--
      return JSON.parse(JSON.stringify(history[currentIndex])) // Deep clone
    }
    return null
  }

  /**
   * Redo - returns next state
   * @returns {any|null} Next state or null if can't redo
   */
  const redo = () => {
    if (currentIndex < history.length - 1) {
      currentIndex++
      return JSON.parse(JSON.stringify(history[currentIndex])) // Deep clone
    }
    return null
  }

  /**
   * Checks if undo is possible
   * @returns {boolean}
   */
  const canUndo = () => currentIndex > 0

  /**
   * Checks if redo is possible
   * @returns {boolean}
   */
  const canRedo = () => currentIndex < history.length - 1

  /**
   * Gets current state
   * @returns {any|null}
   */
  const getCurrent = () => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return JSON.parse(JSON.stringify(history[currentIndex])) // Deep clone
    }
    return null
  }

  /**
   * Clears history
   */
  const clear = () => {
    history = []
    currentIndex = -1
  }

  return {
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrent,
    clear
  }
}
