import React from 'react'

/**
 * Loading Skeleton Component
 * Displays skeleton placeholders while content is loading
 * 
 * @param {string} type - Type of skeleton: 'task', 'board', 'list'
 * @param {number} count - Number of skeleton items to display
 */
const LoadingSkeleton = ({ type = 'task', count = 3 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'task':
        return (
          <div className="skeleton-task">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-text"></div>
            <div className="skeleton-line skeleton-text-short"></div>
          </div>
        )
      case 'board':
        return (
          <div className="skeleton-board">
            <div className="skeleton-line skeleton-header"></div>
            <div className="skeleton-line skeleton-text"></div>
          </div>
        )
      case 'list':
        return (
          <div className="skeleton-list-item">
            <div className="skeleton-line skeleton-text"></div>
          </div>
        )
      default:
        return <div className="skeleton-line"></div>
    }
  }

  return (
    <div className="loading-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-item">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  )
}

export default LoadingSkeleton
