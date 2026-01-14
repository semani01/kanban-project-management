/**
 * Category utility functions
 * Defines available task categories with their colors and configurations
 */

// Available task categories with color coding
export const CATEGORIES = [
  { id: 'work', name: 'Work', color: '#3b82f6' },      // Blue
  { id: 'personal', name: 'Personal', color: '#10b981' }, // Green
  { id: 'shopping', name: 'Shopping', color: '#f59e0b' }, // Orange
  { id: 'health', name: 'Health', color: '#ef4444' },    // Red
  { id: 'education', name: 'Education', color: '#8b5cf6' }, // Purple
  { id: 'other', name: 'Other', color: '#64748b' }       // Gray
]

/**
 * Gets category object by ID
 * @param {string} categoryId - Category identifier
 * @returns {Object} Category object with id, name, and color
 */
export const getCategoryById = (categoryId) => {
  return CATEGORIES.find(cat => cat.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
}

/**
 * Gets all category names as an array
 * @returns {Array} Array of category names
 */
export const getCategoryNames = () => {
  return CATEGORIES.map(cat => cat.name)
}
