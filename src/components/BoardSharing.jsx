import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { PERMISSIONS } from '../utils/boardPermissions'
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
const BoardSharing = ({ isOpen, onClose, board, currentUser, onShare, users = [] }) => {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedPermission, setSelectedPermission] = useState(PERMISSIONS.EDITOR)
  const [error, setError] = useState('')
  const [sharedUsers, setSharedUsers] = useState([])

  // Load shared users when board changes
  useEffect(() => {
    if (isOpen && board) {
      setSharedUsers(board.sharedUsers || board.shared_users || [])
    }
  }, [isOpen, board])

  if (!isOpen || !board) return null

  // Filter out current user and users already shared
  const sharedUserIds = sharedUsers.map(su => su.userId || su.user_id)
  const availableUsers = users.filter(
    user => user.id !== currentUser?.id && !sharedUserIds.includes(user.id)
  )

  /**
   * Handles sharing board with selected user
   * Phase 8: Use API
   */
  const handleShare = async () => {
    if (!selectedUserId) {
      setError('Please select a user')
      return
    }

    try {
      await api.boards.share(board.id, selectedUserId, selectedPermission)
      // Reload board data
      const updatedBoard = await api.boards.getById(board.id)
      setSharedUsers(updatedBoard.sharedUsers || updatedBoard.shared_users || [])
      if (onShare) onShare(updatedBoard)
      setSelectedUserId('')
      setSelectedPermission(PERMISSIONS.EDITOR)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to share board')
    }
  }

  /**
   * Handles removing shared user
   * Phase 8: Use API
   */
  const handleUnshare = async (userId) => {
    try {
      await api.boards.unshare(board.id, userId)
      // Reload board data
      const updatedBoard = await api.boards.getById(board.id)
      setSharedUsers(updatedBoard.sharedUsers || updatedBoard.shared_users || [])
      if (onShare) onShare(updatedBoard)
    } catch (err) {
      setError(err.message || 'Failed to remove sharing')
    }
  }

  /**
   * Updates permission for shared user
   * Phase 8: Use API
   */
  const handlePermissionChange = async (userId, newPermission) => {
    try {
      await api.boards.share(board.id, userId, newPermission)
      // Reload board data
      const updatedBoard = await api.boards.getById(board.id)
      setSharedUsers(updatedBoard.sharedUsers || updatedBoard.shared_users || [])
      if (onShare) onShare(updatedBoard)
    } catch (err) {
      setError(err.message || 'Failed to update permission')
    }
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
                <UserAvatar user={users.find(u => u.id === board.ownerId)} size={32} />
                <div className="shared-user-info">
                  <div className="shared-user-name">
                    {users.find(u => u.id === board.ownerId)?.name || 'Owner'}
                    <span className="owner-badge">Owner</span>
                  </div>
                </div>
              </div>
            )}

            {sharedUsers && sharedUsers.length > 0 ? (
              <div className="shared-users-list">
                {sharedUsers.map(sharedUser => {
                  const userId = sharedUser.userId || sharedUser.user_id
                  const user = users.find(u => u.id === userId)
                  if (!user) return null

                  return (
                    <div key={userId} className="shared-user-item">
                      <UserAvatar user={user} size={32} />
                      <div className="shared-user-info">
                        <div className="shared-user-name">{user.name}</div>
                        <div className="shared-user-email">{user.email}</div>
                      </div>
                      <select
                        className="shared-user-permission"
                        value={sharedUser.permission}
                        onChange={(e) => handlePermissionChange(userId, e.target.value)}
                      >
                        <option value={PERMISSIONS.EDITOR}>Editor</option>
                        <option value={PERMISSIONS.VIEWER}>Viewer</option>
                      </select>
                      <button
                        className="btn-unshare"
                        onClick={() => handleUnshare(userId)}
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
