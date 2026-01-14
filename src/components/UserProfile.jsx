import React, { useState } from 'react'
import UserAvatar from './UserAvatar'
import { loadUsers, saveUsers, clearCurrentUser } from '../utils/userStorage'

/**
 * UserProfile Component
 * Displays and manages user profile
 * 
 * @param {Object} currentUser - Current logged-in user
 * @param {Function} onLogout - Callback when user logs out
 * @param {Function} onUpdate - Callback when user profile is updated
 */
const UserProfile = ({ currentUser, onLogout, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || ''
  })

  if (!currentUser) return null

  /**
   * Handles logout
   */
  const handleLogout = () => {
    clearCurrentUser()
    onLogout()
  }

  /**
   * Handles profile update
   */
  const handleUpdate = (e) => {
    e.preventDefault()
    
    const users = loadUsers()
    const updatedUsers = users.map(user =>
      user.id === currentUser.id
        ? { ...user, name: formData.name.trim(), email: formData.email.trim().toLowerCase() }
        : user
    )
    
    saveUsers(updatedUsers)
    const updatedUser = updatedUsers.find(u => u.id === currentUser.id)
    onUpdate(updatedUser)
    setIsEditing(false)
  }

  return (
    <div className="user-profile">
      <button
        className="user-profile-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User profile"
      >
        <UserAvatar user={currentUser} size={36} />
        <span className="user-profile-name">{currentUser.name}</span>
        <span className="user-profile-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="user-profile-overlay" onClick={() => setIsOpen(false)} />
          <div className="user-profile-menu">
            <div className="user-profile-header">
              <UserAvatar user={currentUser} size={64} />
              <div className="user-profile-info">
                <h3>{currentUser.name}</h3>
                <p>{currentUser.email}</p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="user-profile-edit">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Your email"
                  />
                </div>
                <div className="user-profile-actions">
                  <button type="submit" className="btn-save">Save</button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({ name: currentUser.name, email: currentUser.email })
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="user-profile-actions">
                <button
                  className="btn-edit-profile"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
                <button
                  className="btn-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default UserProfile
