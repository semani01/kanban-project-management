import React, { useState, useEffect } from 'react'
import { loadNotifications as loadNotificationsUtil, markNotificationRead, markAllNotificationsRead, deleteNotification, getUnreadCount } from '../utils/notifications'

/**
 * NotificationsPanel Component
 * Displays user notifications
 * 
 * @param {string} userId - Current user ID
 * @param {boolean} isOpen - Whether the panel is visible
 * @param {Function} onClose - Callback to close the panel
 * @param {Function} onNotificationClick - Callback when notification is clicked
 */
const NotificationsPanel = ({ userId, isOpen, onClose, onNotificationClick }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications
  useEffect(() => {
    if (userId) {
      const loaded = loadNotificationsUtil(userId)
      setNotifications(loaded)
      setUnreadCount(getUnreadCount(userId))
    }
  }, [userId, isOpen])

  /**
   * Handles notification click
   */
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
        markNotificationRead(userId, notification.id)
        const updated = loadNotificationsUtil(userId)
        setNotifications(updated)
        setUnreadCount(getUnreadCount(userId))
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  /**
   * Marks all as read
   */
  const handleMarkAllRead = () => {
    markAllNotificationsRead(userId)
    const updated = loadNotificationsUtil(userId)
    setNotifications(updated)
    setUnreadCount(getUnreadCount(userId))
  }

  /**
   * Deletes a notification
   */
  const handleDelete = (notificationId, e) => {
    e.stopPropagation()
    deleteNotification(userId, notificationId)
    const updated = loadNotificationsUtil(userId)
    setNotifications(updated)
    setUnreadCount(getUnreadCount(userId))
  }

  if (!isOpen) return null

  const unreadNotifications = notifications.filter(n => !n.read)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Notifications</h2>
          <div className="notifications-header-actions">
            {unreadNotifications.length > 0 && (
              <button
                className="btn-mark-all-read"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
            <button className="btn-close" onClick={onClose} aria-label="Close modal">
              ×
            </button>
          </div>
        </div>

        <div className="notifications-content">
          {notifications.length === 0 ? (
            <div className="notifications-empty">
              <p>No notifications</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className="btn-delete-notification"
                    onClick={(e) => handleDelete(notification.id, e)}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPanel
