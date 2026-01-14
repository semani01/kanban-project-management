/**
 * Activity log utility functions
 * Tracks user actions and changes for audit trail
 */

/**
 * Creates an activity log entry
 * @param {string} userId - ID of user performing the action
 * @param {string} userName - Name of user performing the action
 * @param {string} action - Type of action (created, updated, deleted, moved, assigned, etc.)
 * @param {string} entityType - Type of entity (task, board, etc.)
 * @param {string} entityId - ID of the entity
 * @param {string} entityName - Name/title of the entity
 * @param {Object} details - Additional details about the action
 * @returns {Object} Activity log entry
 */
export const createActivityEntry = (userId, userName, action, entityType, entityId, entityName, details = {}) => {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName,
    action,
    entityType,
    entityId,
    entityName,
    details,
    timestamp: new Date().toISOString()
  }
}

/**
 * Formats activity message for display
 * @param {Object} activity - Activity log entry
 * @returns {string} Formatted message
 */
export const formatActivityMessage = (activity) => {
  const { userName, action, entityType, entityName, details } = activity
  
  const actionVerbs = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
    moved: 'moved',
    assigned: 'assigned',
    unassigned: 'unassigned',
    commented: 'commented on',
    archived: 'archived',
    unarchived: 'unarchived'
  }
  
  const verb = actionVerbs[action] || action
  let message = `${userName} ${verb} ${entityType} "${entityName}"`
  
  // Add details if available
  if (details.from && details.to) {
    message += ` from "${details.from}" to "${details.to}"`
  } else if (details.to) {
    message += ` to "${details.to}"`
  } else if (details.assignedTo) {
    message += ` to ${details.assignedTo}`
  }
  
  return message
}

/**
 * Formats timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time string
 */
export const formatActivityTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
