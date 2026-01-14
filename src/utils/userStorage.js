/**
 * User storage utility functions
 * Handles saving and loading user data from localStorage
 * Manages current user session
 */

const USERS_KEY = 'kanban-users'
const CURRENT_USER_KEY = 'kanban-current-user'

/**
 * Saves users array to localStorage
 * @param {Array} users - Array of user objects to save
 */
export const saveUsers = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch (error) {
    console.error('Error saving users to localStorage:', error)
  }
}

/**
 * Loads users array from localStorage
 * @returns {Array} Array of user objects, or empty array if none exist
 */
export const loadUsers = () => {
  try {
    const storedUsers = localStorage.getItem(USERS_KEY)
    return storedUsers ? JSON.parse(storedUsers) : []
  } catch (error) {
    console.error('Error loading users from localStorage:', error)
    return []
  }
}

/**
 * Saves the current logged-in user
 * @param {Object} user - User object
 */
export const saveCurrentUser = (user) => {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  } catch (error) {
    console.error('Error saving current user:', error)
  }
}

/**
 * Loads the current logged-in user
 * @returns {Object|null} Current user object or null
 */
export const loadCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch (error) {
    console.error('Error loading current user:', error)
    return null
  }
}

/**
 * Clears the current user session
 */
export const clearCurrentUser = () => {
  try {
    localStorage.removeItem(CURRENT_USER_KEY)
  } catch (error) {
    console.error('Error clearing current user:', error)
  }
}

/**
 * Generates a unique ID for new users
 * @returns {string} Unique identifier
 */
export const generateUserId = () => {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generates a default avatar color based on user ID
 * @param {string} userId - User ID
 * @returns {string} Hex color code
 */
export const generateAvatarColor = (userId) => {
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316'  // Orange-red
  ]
  
  // Use userId to consistently pick a color
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Gets user initials for avatar
 * @param {string} name - User's full name
 * @returns {string} Initials (e.g., "John Doe" -> "JD")
 */
export const getUserInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
