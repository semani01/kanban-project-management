import React, { useState } from 'react'
import { loadUsers } from '../utils/userStorage'
import { shareBoardWithUser, unshareBoardWithUser, PERMISSIONS } from '../utils/boardPermissions'
import UserAvatar from './UserAvatar'

/**
 * BoardSharing Component
 * Modal for sharing boards with other users
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {Object} board - Board object to share
 * @param {Object} currentUser - Current logged-in user
 * @param {Function} onShare - Callback when board is shared
 */
const BoardSharing = ({ isOpen, onClose, board, currentUser, onShare }) => {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedPermission, setSelectedPermission] = useState(PERMISSIONS.EDITOR)
  const [error, setError] = useState('')

  if (!isOpen || !board) return null

  const allUsers = loadUsers()
  // Filter out current user and users already shared
  const sharedUserIds = (board.sharedUsers || []).map(su => su.userId)
  const availableUsers = allUsers.filter(
    user => user.id !== currentUser?.id && !sharedUserIds.includes(user.id)
  )

  /**
   * Handles sharing board with selected user
   */
  const handleShare = () => {
    if (!selectedUserId) {
      setError('Please select a user')
      return
    }

    const updatedBoard = shareBoardWithUser(board, selectedUserId, selectedPermission)
    onShare(updatedBoard)
    setSelectedUserId('')
    setSelectedPermission(PERMISSIONS.EDITOR)
    setError('')
  }

  /**
   * Handles removing shared user
   */
  const handleUnshare = (userId) => {
    const updatedBoard = unshareBoardWithUser(board, userId)
    onShare(updatedBoard)
  }

  /**
   * Updates permission for shared user
   */
  const handlePermissionChange = (userId, newPermission) => {
    const updatedBoard = shareBoardWithUser(board, userId, newPermission)
    onShare(updatedBoard)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share Board: {board.name}</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="board-sharing-content">
          {/* Share with new user */}
          <div className="share-section">
            <h3>Share with User</h3>
            {availableUsers.length === 0 ? (
              <p className="no-users-message">No other users available to share with</p>
            ) : (
              <div className="share-form">
                <select
                  className="share-user-select"
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value)
                    setError('')
                  }}
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>

                <select
                  className="share-permission-select"
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value)}
                >
                  <option value={PERMISSIONS.EDITOR}>Editor (can edit)</option>
                  <option value={PERMISSIONS.VIEWER}>Viewer (read-only)</option>
                </select>

                <button className="btn-share" onClick={handleShare}>
                  Share
                </button>
              </div>
            )}

            {error && <div className="share-error">{error}</div>}
          </div>

          {/* Shared users list */}
          <div className="shared-users-section">
            <h3>Shared With</h3>
            {board.ownerId && (
              <div className="shared-user-item owner">
                <UserAvatar user={allUsers.find(u => u.id === board.ownerId)} size={32} />
                <div className="shared-user-info">
                  <div className="shared-user-name">
                    {allUsers.find(u => u.id === board.ownerId)?.name || 'Owner'}
                    <span className="owner-badge">Owner</span>
                  </div>
                </div>
              </div>
            )}

            {board.sharedUsers && board.sharedUsers.length > 0 ? (
              <div className="shared-users-list">
                {board.sharedUsers.map(sharedUser => {
                  const user = allUsers.find(u => u.id === sharedUser.userId)
                  if (!user) return null

                  return (
                    <div key={sharedUser.userId} className="shared-user-item">
                      <UserAvatar user={user} size={32} />
                      <div className="shared-user-info">
                        <div className="shared-user-name">{user.name}</div>
                        <div className="shared-user-email">{user.email}</div>
                      </div>
                      <select
                        className="shared-user-permission"
                        value={sharedUser.permission}
                        onChange={(e) => handlePermissionChange(sharedUser.userId, e.target.value)}
                      >
                        <option value={PERMISSIONS.EDITOR}>Editor</option>
                        <option value={PERMISSIONS.VIEWER}>Viewer</option>
                      </select>
                      <button
                        className="btn-unshare"
                        onClick={() => handleUnshare(sharedUser.userId)}
                        aria-label="Remove access"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="no-shared-users">No users shared with this board</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoardSharing
