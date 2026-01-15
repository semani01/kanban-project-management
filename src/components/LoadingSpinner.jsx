import React from 'react'

/**
 * Loading Spinner Component
 * Displays a loading indicator with optional message
 * 
 * @param {string} message - Optional loading message
 * @param {string} size - Size of spinner: 'small', 'medium', 'large'
 */
const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="loading-spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
