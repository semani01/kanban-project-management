import React from 'react'
import { calculateBoardStats } from '../utils/boardUtils'
import { getCategoryById } from '../utils/categories'

/**
 * BoardStats Component
 * Displays statistics and analytics for the current board
 * 
 * @param {Object} board - Board object
 */
const BoardStats = ({ board }) => {
  if (!board) return null

  const stats = calculateBoardStats(board)

  return (
    <div className="board-stats">
      <h3 className="board-stats-title">Board Statistics</h3>
      
      <div className="stats-grid">
        {/* Total tasks */}
        <div className="stat-card">
          <div className="stat-value">{stats.totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>

        {/* Completed tasks */}
        <div className="stat-card">
          <div className="stat-value">{stats.completedTasks}</div>
          <div className="stat-label">Completed</div>
        </div>

        {/* In progress */}
        <div className="stat-card">
          <div className="stat-value">{stats.inProgressTasks}</div>
          <div className="stat-label">In Progress</div>
        </div>

        {/* Completion rate */}
        <div className="stat-card">
          <div className="stat-value">{stats.completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      {/* Tasks by priority */}
      <div className="stats-section">
        <h4 className="stats-section-title">Tasks by Priority</h4>
        <div className="stats-bars">
          <div className="stat-bar">
            <div className="stat-bar-label">High</div>
            <div className="stat-bar-container">
              <div 
                className="stat-bar-fill high" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.tasksByPriority.high / stats.totalTasks) * 100 : 0}%` }}
              >
                {stats.tasksByPriority.high}
              </div>
            </div>
          </div>
          <div className="stat-bar">
            <div className="stat-bar-label">Medium</div>
            <div className="stat-bar-container">
              <div 
                className="stat-bar-fill medium" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.tasksByPriority.medium / stats.totalTasks) * 100 : 0}%` }}
              >
                {stats.tasksByPriority.medium}
              </div>
            </div>
          </div>
          <div className="stat-bar">
            <div className="stat-bar-label">Low</div>
            <div className="stat-bar-container">
              <div 
                className="stat-bar-fill low" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.tasksByPriority.low / stats.totalTasks) * 100 : 0}%` }}
              >
                {stats.tasksByPriority.low}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue tasks */}
      {stats.overdueTasks > 0 && (
        <div className="stats-alert">
          <span className="stats-alert-icon">⚠️</span>
          <span>{stats.overdueTasks} overdue task{stats.overdueTasks !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Tasks by category */}
      {Object.keys(stats.tasksByCategory).length > 0 && (
        <div className="stats-section">
          <h4 className="stats-section-title">Tasks by Category</h4>
          <div className="stats-categories">
            {Object.entries(stats.tasksByCategory).map(([categoryId, count]) => {
              const category = getCategoryById(categoryId)
              return (
                <div key={categoryId} className="stat-category-item">
                  <span 
                    className="stat-category-badge" 
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </span>
                  <span className="stat-category-count">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default BoardStats
