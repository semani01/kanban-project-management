import React from 'react'
import { formatActivityMessage, formatActivityTime } from '../utils/activityLog'
import UserAvatar from './UserAvatar'

/**
 * ActivityLog Component
 * Displays activity log/audit trail for a board
 * 
 * @param {Array} activities - Array of activity log entries
 * @param {Array} users - Array of all users (for avatar display)
 * @param {boolean} isOpen - Whether the activity log is visible
 * @param {Function} onClose - Callback to close the activity log
 */
const ActivityLog = ({ activities = [], users = [], isOpen, onClose }) => {
  if (!isOpen) return null

  // Get user object for activity
  const getUserForActivity = (userId) => {
    return users.find(u => u.id === userId) || { id: userId, name: 'Unknown User' }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content activity-log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Activity Log</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="activity-log-content">
          {activities.length === 0 ? (
            <div className="activity-log-empty">
              <p>No activity yet</p>
            </div>
          ) : (
            <div className="activity-log-list">
              {activities.map(activity => {
                const user = getUserForActivity(activity.userId)
                return (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-avatar">
                      <UserAvatar user={user} size={32} />
                    </div>
                    <div className="activity-content">
                      <div className="activity-message">
                        {formatActivityMessage(activity)}
                      </div>
                      <div className="activity-time">
                        {formatActivityTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityLog
