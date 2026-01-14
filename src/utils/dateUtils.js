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

/**
 * Gets the first day of a month
 * @param {Date} date - Date object
 * @returns {Date} First day of the month
 */
export const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Gets the last day of a month
 * @param {Date} date - Date object
 * @returns {Date} Last day of the month
 */
export const getLastDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/**
 * Gets all days in a month as an array
 * @param {Date} date - Date object
 * @returns {Array} Array of Date objects for each day in the month
 */
export const getDaysInMonth = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }
  
  return days
}

/**
 * Checks if two dates are on the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1)
  const d2 = date2 instanceof Date ? date2 : new Date(date2)
  
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  )
}

/**
 * Gets the start of week (Sunday) for a given date
 * @param {Date} date - Date object
 * @returns {Date} Start of week
 */
export const getStartOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

/**
 * Gets the end of week (Saturday) for a given date
 * @param {Date} date - Date object
 * @returns {Date} End of week
 */
export const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}
