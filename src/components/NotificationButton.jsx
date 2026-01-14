import React, { useState, useEffect } from 'react'
import { getUnreadCount } from '../utils/notifications'

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
      setUnreadCount(getUnreadCount(userId))
      // Update count periodically
      const interval = setInterval(() => {
        setUnreadCount(getUnreadCount(userId))
      }, 5000)
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
