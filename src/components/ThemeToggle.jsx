import React, { useState, useEffect } from 'react'
import { getTheme, saveTheme, applyTheme } from '../utils/theme'

/**
 * ThemeToggle Component
 * Toggle button for switching between light and dark mode
 */
const ThemeToggle = () => {
  const [theme, setTheme] = useState('light')

  // Load theme on mount
  useEffect(() => {
    const currentTheme = getTheme()
    setTheme(currentTheme)
    applyTheme(currentTheme)
  }, [])

  /**
   * Toggles between light and dark theme
   */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    saveTheme(newTheme)
    applyTheme(newTheme)
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}

export default ThemeToggle
