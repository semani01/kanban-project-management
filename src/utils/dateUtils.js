/**
 * Date utility functions
 * Handles date formatting, parsing, and comparison for task due dates
 */

/**
 * Formats a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string (e.g., "Dec 25, 2024")
 */
export const formatDate = (dateString) => {
  if (!dateString) return null
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Formats a date to YYYY-MM-DD format for date input
 * @param {string} dateString - ISO date string
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Checks if a date is today
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if date is today
 */
export const isToday = (dateString) => {
  if (!dateString) return false
  
  const date = new Date(dateString)
  const today = new Date()
  
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Checks if a date is overdue (in the past)
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if date is overdue
 */
export const isOverdue = (dateString) => {
  if (!dateString) return false
  
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  
  return date < today
}

/**
 * Checks if a date is due soon (within next 3 days)
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if date is due soon
 */
export const isDueSoon = (dateString) => {
  if (!dateString) return false
  
  const date = new Date(dateString)
  const today = new Date()
  const threeDaysFromNow = new Date(today)
  threeDaysFromNow.setDate(today.getDate() + 3)
  
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  threeDaysFromNow.setHours(0, 0, 0, 0)
  
  return date >= today && date <= threeDaysFromNow
}
