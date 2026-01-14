import React, { useState } from 'react'
import { loadUsers, saveUsers, generateUserId, generateAvatarColor, getUserInitials } from '../utils/userStorage'
import { saveCurrentUser } from '../utils/userStorage'

/**
 * LoginForm Component
 * Handles user login and signup
 * 
 * @param {Function} onLogin - Callback when user successfully logs in
 */
const LoginForm = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})

  /**
   * Handles form input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  /**
   * Validates form data
   */
  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (isSignup) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handles login
   */
  const handleLogin = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const users = loadUsers()
    const user = users.find(u => u.email === formData.email)

    if (!user) {
      setErrors({ email: 'User not found' })
      return
    }

    // Simple password check (in production, use proper hashing)
    if (user.password !== formData.password) {
      setErrors({ password: 'Incorrect password' })
      return
    }

    // Save current user and call onLogin
    saveCurrentUser(user)
    onLogin(user)
  }

  /**
   * Handles signup
   */
  const handleSignup = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const users = loadUsers()
    
    // Check if email already exists
    if (users.find(u => u.email === formData.email)) {
      setErrors({ email: 'Email already registered' })
      return
    }

    // Create new user
    const userId = generateUserId()
    const newUser = {
      id: userId,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password, // In production, hash this
      avatarColor: generateAvatarColor(userId),
      initials: getUserInitials(formData.name),
      createdAt: new Date().toISOString()
    }

    // Save user
    users.push(newUser)
    saveUsers(users)
    saveCurrentUser(newUser)
    onLogin(newUser)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Kanban Project Management</h1>
          <p>{isSignup ? 'Create an account' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="login-form">
          {/* Name field (signup only) */}
          {isSignup && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
                placeholder="Enter your name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
          )}

          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Confirm password field (signup only) */}
          {isSignup && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'input-error' : ''}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          {/* Submit button */}
          <button type="submit" className="btn-login">
            {isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {/* Toggle between login and signup */}
        <div className="login-footer">
          <p>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsSignup(!isSignup)
                setFormData({ name: '', email: '', password: '', confirmPassword: '' })
                setErrors({})
              }}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
