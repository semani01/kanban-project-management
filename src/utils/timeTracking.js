/**
 * Time Tracking Utility Functions
 * Handles time estimates and time spent tracking for tasks
 */

/**
 * Formats time in minutes to a human-readable string
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string (e.g., "2h 30m", "45m", "1d 4h")
 */
export const formatTime = (minutes) => {
  if (!minutes || minutes === 0) return '0m'
  
  const days = Math.floor(minutes / (24 * 60))
  const hours = Math.floor((minutes % (24 * 60)) / 60)
  const mins = minutes % 60
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (mins > 0) parts.push(`${mins}m`)
  
  return parts.length > 0 ? parts.join(' ') : '0m'
}

/**
 * Parses a time string to minutes
 * Supports formats like "2h 30m", "1d 4h", "45m", "2.5h"
 * @param {string} timeString - Time string to parse
 * @returns {number} Time in minutes, or 0 if invalid
 */
export const parseTimeString = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return 0
  
  const trimmed = timeString.trim().toLowerCase()
  if (!trimmed) return 0
  
  let totalMinutes = 0
  
  // Match patterns like "2d", "3h", "30m", "1.5h", "2h 30m"
  const dayMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*d(?:ays?)?/i)
  const hourMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/i)
  const minMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?/i)
  
  if (dayMatch) {
    totalMinutes += parseFloat(dayMatch[1]) * 24 * 60
  }
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60
  }
  if (minMatch) {
    totalMinutes += parseFloat(minMatch[1])
  }
  
  // If no matches but it's a number, assume it's hours
  if (!dayMatch && !hourMatch && !minMatch) {
    const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/)
    if (numMatch) {
      totalMinutes = parseFloat(numMatch[1]) * 60 // Assume hours
    }
  }
  
  return Math.round(totalMinutes)
}

/**
 * Calculates time progress percentage
 * @param {number} timeSpent - Time spent in minutes
 * @param {number} timeEstimate - Time estimate in minutes
 * @returns {number} Progress percentage (0-100, capped at 100)
 */
export const calculateTimeProgress = (timeSpent, timeEstimate) => {
  if (!timeEstimate || timeEstimate === 0) return 0
  if (!timeSpent || timeSpent === 0) return 0
  
  const progress = (timeSpent / timeEstimate) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
}

/**
 * Checks if a task is over the time estimate
 * @param {number} timeSpent - Time spent in minutes
 * @param {number} timeEstimate - Time estimate in minutes
 * @returns {boolean} True if over estimate
 */
export const isOverEstimate = (timeSpent, timeEstimate) => {
  if (!timeEstimate || timeEstimate === 0) return false
  return timeSpent > timeEstimate
}

/**
 * Gets time tracking status (on-track, at-risk, over-budget)
 * @param {number} timeSpent - Time spent in minutes
 * @param {number} timeEstimate - Time estimate in minutes
 * @returns {string} Status: 'on-track', 'at-risk', 'over-budget'
 */
export const getTimeTrackingStatus = (timeSpent, timeEstimate) => {
  if (!timeEstimate || timeEstimate === 0) return 'on-track'
  
  const progress = calculateTimeProgress(timeSpent, timeEstimate)
  
  if (progress >= 100) return 'over-budget'
  if (progress >= 80) return 'at-risk'
  return 'on-track'
}
