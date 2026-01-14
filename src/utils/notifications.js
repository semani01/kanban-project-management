/**
 * Notifications utility functions
 * Manages user notifications
 */

const NOTIFICATIONS_KEY = 'kanban-notifications'

/**
 * Creates a notification
 * @param {string} userId - ID of user to notify
 * @param {string} type - Notification type (task_assigned, task_mentioned, board_shared, etc.)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} entityId - Related entity ID (task, board, etc.)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Notification object
 */
export const createNotification = (userId, type, title, message, entityId = null, metadata = {}) => {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    entityId,
    metadata,
    read: false,
    createdAt: new Date().toISOString()
  }
}

/**
 * Saves notifications to localStorage
 * @param {string} userId - User ID
 * @param {Array} notifications - Array of notifications
 */
export const saveNotifications = (userId, notifications) => {
  try {
    const key = `${NOTIFICATIONS_KEY}-${userId}`
    localStorage.setItem(key, JSON.stringify(notifications))
  } catch (error) {
    console.error('Error saving notifications:', error)
  }
}

/**
 * Loads notifications from localStorage
 * @param {string} userId - User ID
 * @returns {Array} Array of notifications
 */
export const loadNotifications = (userId) => {
  try {
    const key = `${NOTIFICATIONS_KEY}-${userId}`
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading notifications:', error)
    return []
  }
}

/**
 * Marks notification as read
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID
 */
export const markNotificationRead = (userId, notificationId) => {
  const notifications = loadNotifications(userId)
  const updated = notifications.map(notif =>
    notif.id === notificationId ? { ...notif, read: true } : notif
  )
  saveNotifications(userId, updated)
}

/**
 * Marks all notifications as read
 * @param {string} userId - User ID
 */
export const markAllNotificationsRead = (userId) => {
  const notifications = loadNotifications(userId)
  const updated = notifications.map(notif => ({ ...notif, read: true }))
  saveNotifications(userId, updated)
}

/**
 * Deletes a notification
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID
 */
export const deleteNotification = (userId, notificationId) => {
  const notifications = loadNotifications(userId)
  const updated = notifications.filter(notif => notif.id !== notificationId)
  saveNotifications(userId, updated)
}

/**
 * Gets unread notification count
 * @param {string} userId - User ID
 * @returns {number} Count of unread notifications
 */
export const getUnreadCount = (userId) => {
  const notifications = loadNotifications(userId)
  return notifications.filter(notif => !notif.read).length
}
