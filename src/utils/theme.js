/**
 * Theme utility functions
 * Handles dark mode and theme management
 */

const THEME_KEY = 'kanban-theme'

/**
 * Gets the current theme from localStorage
 * @returns {string} 'light' or 'dark'
 */
export const getTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme
    }
    // Default to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  } catch (error) {
    console.error('Error getting theme:', error)
    return 'light'
  }
}

/**
 * Saves the theme to localStorage
 * @param {string} theme - 'light' or 'dark'
 */
export const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.error('Error saving theme:', error)
  }
}

/**
 * Applies the theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
export const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark-theme')
  } else {
    root.classList.remove('dark-theme')
  }
}
