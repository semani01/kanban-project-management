import React, { useState, useEffect } from 'react'
import api from '../services/api'

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
    if (userId && isOpen) {
      api.notifications.getAll()
        .then(loaded => {
          setNotifications(loaded)
          return api.notifications.getUnreadCount()
        })
        .then(result => setUnreadCount(result.count || 0))
        .catch(err => console.error('Failed to load notifications:', err))
    }
  }, [userId, isOpen])

  /**
   * Handles notification click
   * Phase 8: Use API
   */
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await api.notifications.markAsRead(notification.id)
        const updated = await api.notifications.getAll()
        setNotifications(updated)
        const countResult = await api.notifications.getUnreadCount()
        setUnreadCount(countResult.count || 0)
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  /**
   * Marks all as read
   * Phase 8: Use API
   */
  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead()
      const updated = await api.notifications.getAll()
      setNotifications(updated)
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
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
