import React, { useState } from 'react'
import { authAPI, setAuthToken, setCurrentUser } from '../services/api'

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
  const [loading, setLoading] = useState(false)

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

    // Only validate name for signup
    if (isSignup && !formData.name.trim()) {
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
    const isValid = Object.keys(newErrors).length === 0
    console.log('Validation result:', { isValid, errors: newErrors, isSignup })
    return isValid
  }

  /**
   * Handles login
   */
  const handleLogin = async (e) => {
    e.preventDefault()
    console.log('Login form submitted', { email: formData.email })

    if (!validate()) {
      console.log('Validation failed')
      return
    }

    console.log('Starting login request...')
    setLoading(true)
    setErrors({})
    
    try {
      console.log('Calling authAPI.login...')
      const response = await authAPI.login(formData.email, formData.password)
      console.log('Login response:', response)
      
      if (response && response.user) {
        console.log('Login successful, calling onLogin')
        onLogin(response.user)
      } else {
        console.error('Invalid response:', response)
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Login error caught:', error)
      console.error('Error type:', typeof error)
      console.error('Error details:', {
        message: error.message,
        error: error.error,
        name: error.name,
        stack: error.stack
      })
      
      // Handle different error formats from API
      let errorMessage = 'Login failed. Please check your email and password.'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = error.error
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      console.log('Setting error message:', errorMessage)
      // Always set form error to display
      setErrors({ 
        form: errorMessage,
        email: errorMessage.toLowerCase().includes('email') ? errorMessage : '',
        password: errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('invalid') ? errorMessage : ''
      })
    } finally {
      console.log('Login attempt finished, setting loading to false')
      setLoading(false)
    }
  }

  /**
   * Handles signup
   * Phase 8: Use API for user registration
   */
  const handleSignup = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)
    setErrors({})
    try {
      const response = await authAPI.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      })
      onLogin(response.user)
    } catch (error) {
      console.error('Signup error:', error)
      // Handle different error formats from API
      let errorMessage = 'Registration failed'
      if (error.message) {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = error.error
      }
      
      // Check for specific error types
      const lowerMessage = errorMessage.toLowerCase()
      if (lowerMessage.includes('email') || lowerMessage.includes('already exists')) {
        setErrors({ 
          email: errorMessage,
          form: errorMessage
        })
      } else if (lowerMessage.includes('password')) {
        setErrors({ 
          password: errorMessage,
          form: errorMessage
        })
      } else if (error.errors && Array.isArray(error.errors)) {
        // Handle validation errors array
        const validationErrors = {}
        error.errors.forEach(err => {
          if (err.param === 'email') {
            validationErrors.email = err.msg
          } else if (err.param === 'password') {
            validationErrors.password = err.msg
          } else if (err.param === 'name') {
            validationErrors.name = err.msg
          }
        })
        setErrors({
          ...validationErrors,
          form: errorMessage
        })
      } else {
        setErrors({ 
          form: errorMessage
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Kanban Project Management</h1>
          <p>{isSignup ? 'Create an account' : 'Sign in to your account'}</p>
        </div>

        <form 
          onSubmit={(e) => {
            console.log('Form onSubmit triggered', { isSignup })
            e.preventDefault()
            if (isSignup) {
              handleSignup(e)
            } else {
              handleLogin(e)
            }
          }} 
          className="login-form" 
          noValidate
        >
          {/* Form-level error message */}
          {(errors.form || errors.email || errors.password) && (
            <div className="form-error-banner">
              <span className="error-icon">⚠️</span>
              <span>{errors.form || errors.email || errors.password || 'An error occurred'}</span>
            </div>
          )}
          
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
          <button 
            type="submit" 
            className="btn-login" 
            disabled={loading}
            onClick={(e) => {
              console.log('Button clicked!', { isSignup, loading })
              // Let the form onSubmit handle it
            }}
          >
            {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Sign In')}
          </button>
          
          {/* Debug: Show loading state */}
          {loading && (
            <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
              Processing...
            </div>
          )}
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
                setLoading(false)
              }}
              disabled={loading}
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
