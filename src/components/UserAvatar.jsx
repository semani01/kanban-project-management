import React from 'react'
import { getUserInitials } from '../utils/userStorage'

/**
 * UserAvatar Component
 * Displays user avatar with initials or image
 * 
 * @param {Object} user - User object with id, name, avatarColor, avatarUrl (optional)
 * @param {number} size - Size of avatar in pixels (default: 40)
 * @param {boolean} showName - Whether to show user name below avatar
 */
const UserAvatar = ({ user, size = 40, showName = false }) => {
  if (!user) return null

  const initials = getUserInitials(user.name)
  const avatarColor = user.avatarColor || '#64748b'
  const avatarUrl = user.avatarUrl || null

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: avatarColor,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.4}px`,
    fontWeight: 600,
    flexShrink: 0,
    backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }

  return (
    <div className="user-avatar-container">
      <div className="user-avatar" style={avatarStyle} title={user.name}>
        {!avatarUrl && initials}
      </div>
      {showName && (
        <span className="user-avatar-name">{user.name}</span>
      )}
    </div>
  )
}

export default UserAvatar
