import React, { useState, useEffect } from 'react'
import api from '../services/api'

/**
 * NotificationButton Component
 * Button with unread notification badge
 * 
 * @param {string} userId - Current user ID
 * @param {Function} onClick - Click handler
 */
const NotificationButton = ({ userId, onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (userId) {
      // Load initial count
      api.notifications.getUnreadCount()
        .then(result => setUnreadCount(result.count || 0))
        .catch(err => console.error('Failed to load unread count:', err))
      
      // Update count periodically
      const interval = setInterval(() => {
        api.notifications.getUnreadCount()
          .then(result => setUnreadCount(result.count || 0))
          .catch(err => console.error('Failed to load unread count:', err))
      }, 5000) // Check every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [userId])

  return (
    <button
      className="btn-icon notifications-btn"
      onClick={onClick}
      title="Notifications"
      aria-label="Notifications"
    >
      🔔
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </button>
  )
}

export default NotificationButton
