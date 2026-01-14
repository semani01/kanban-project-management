import React, { useMemo } from 'react'
import { formatTime, calculateTimeProgress, getTimeTrackingStatus } from '../utils/timeTracking'
import { isOverdue, isDueSoon, isToday } from '../utils/dateUtils'
import { getCategoryById } from '../utils/categories'

/**
 * AnalyticsDashboard Component
 * Displays comprehensive analytics and insights about tasks and board performance
 * 
 * @param {Array} tasks - Array of all tasks
 * @param {Array} boards - Array of all boards
 */
const AnalyticsDashboard = ({ tasks = [], boards = [] }) => {
  // Calculate task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length
    const byStatus = {}
    const byPriority = { high: 0, medium: 0, low: 0 }
    const byCategory = {}
    const overdue = []
    const dueSoon = []
    const dueToday = []
    const completed = []
    const inProgress = []
    const notStarted = []
    
    // Time tracking stats
    let totalTimeEstimate = 0
    let totalTimeSpent = 0
    let tasksWithTimeTracking = 0
    const timeTrackingStatus = { 'on-track': 0, 'at-risk': 0, 'over-budget': 0 }
    
    tasks.forEach(task => {
      // Count by status
      const status = task.status || 'todo'
      byStatus[status] = (byStatus[status] || 0) + 1
      
      // Count by priority
      if (task.priority) {
        byPriority[task.priority] = (byPriority[task.priority] || 0) + 1
      }
      
      // Count by category
      if (task.category) {
        byCategory[task.category] = (byCategory[task.category] || 0) + 1
      }
      
      // Due date analysis
      if (task.dueDate) {
        if (isOverdue(task.dueDate)) {
          overdue.push(task)
        } else if (isToday(task.dueDate)) {
          dueToday.push(task)
        } else if (isDueSoon(task.dueDate)) {
          dueSoon.push(task)
        }
      }
      
      // Status grouping
      const statusLower = status.toLowerCase()
      if (statusLower === 'done' || statusLower === 'completed') {
        completed.push(task)
      } else if (statusLower === 'in progress' || statusLower === 'in-progress') {
        inProgress.push(task)
      } else {
        notStarted.push(task)
      }
      
      // Time tracking
      if (task.timeEstimate || task.timeSpent) {
        tasksWithTimeTracking++
        if (task.timeEstimate) {
          totalTimeEstimate += task.timeEstimate
        }
        if (task.timeSpent) {
          totalTimeSpent += task.timeSpent
        }
        
        if (task.timeEstimate) {
          const status = getTimeTrackingStatus(task.timeSpent || 0, task.timeEstimate)
          timeTrackingStatus[status] = (timeTrackingStatus[status] || 0) + 1
        }
      }
    })
    
    // Calculate completion percentage
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0
    
    // Calculate time efficiency
    const timeEfficiency = totalTimeEstimate > 0 
      ? Math.round((totalTimeSpent / totalTimeEstimate) * 100) 
      : 0
    
    return {
      total,
      byStatus,
      byPriority,
      byCategory,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      dueToday: dueToday.length,
      completed: completed.length,
      inProgress: inProgress.length,
      notStarted: notStarted.length,
      completionRate,
      totalTimeEstimate,
      totalTimeSpent,
      tasksWithTimeTracking,
      timeTrackingStatus,
      timeEfficiency
    }
  }, [tasks])
  
  // Calculate board statistics
  const boardStats = useMemo(() => {
    return {
      total: boards.length,
      active: boards.filter(b => !b.archived).length,
      archived: boards.filter(b => b.archived).length
    }
  }, [boards])
  
  // Get category names for display
  const getCategoryName = (categoryId) => {
    const category = getCategoryById(categoryId)
    return category ? category.name : categoryId
  }
  
  return (
    <div className="analytics-dashboard">
      <h2 className="analytics-title">Analytics Dashboard</h2>
      
      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="analytics-card">
          <div className="analytics-card-title">Total Tasks</div>
          <div className="analytics-card-value">{taskStats.total}</div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-card-title">Completion Rate</div>
          <div className="analytics-card-value">{taskStats.completionRate}%</div>
          <div className="analytics-card-subtitle">
            {taskStats.completed} of {taskStats.total} completed
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-card-title">In Progress</div>
          <div className="analytics-card-value">{taskStats.inProgress}</div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-card-title">Overdue</div>
          <div className="analytics-card-value overdue-count">{taskStats.overdue}</div>
        </div>
      </div>
      
      {/* Task Status Breakdown */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">Task Status Breakdown</h3>
        <div className="analytics-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-label">Not Started</span>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill" 
                style={{ 
                  width: `${taskStats.total > 0 ? (taskStats.notStarted / taskStats.total) * 100 : 0}%`,
                  backgroundColor: '#6b7280'
                }}
              />
            </div>
            <span className="breakdown-value">{taskStats.notStarted}</span>
          </div>
          
          <div className="breakdown-item">
            <span className="breakdown-label">In Progress</span>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill" 
                style={{ 
                  width: `${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}%`,
                  backgroundColor: '#3b82f6'
                }}
              />
            </div>
            <span className="breakdown-value">{taskStats.inProgress}</span>
          </div>
          
          <div className="breakdown-item">
            <span className="breakdown-label">Completed</span>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill" 
                style={{ 
                  width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%`,
                  backgroundColor: '#10b981'
                }}
              />
            </div>
            <span className="breakdown-value">{taskStats.completed}</span>
          </div>
        </div>
      </div>
      
      {/* Priority Distribution */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">Priority Distribution</h3>
        <div className="analytics-priority-grid">
          <div className="priority-stat">
            <div className="priority-stat-label">High</div>
            <div className="priority-stat-value" style={{ color: '#ef4444' }}>
              {taskStats.byPriority.high}
            </div>
          </div>
          <div className="priority-stat">
            <div className="priority-stat-label">Medium</div>
            <div className="priority-stat-value" style={{ color: '#f59e0b' }}>
              {taskStats.byPriority.medium}
            </div>
          </div>
          <div className="priority-stat">
            <div className="priority-stat-label">Low</div>
            <div className="priority-stat-value" style={{ color: '#10b981' }}>
              {taskStats.byPriority.low}
            </div>
          </div>
        </div>
      </div>
      
      {/* Due Date Alerts */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">Due Date Alerts</h3>
        <div className="analytics-alerts">
          <div className="alert-item overdue">
            <span className="alert-label">Overdue</span>
            <span className="alert-value">{taskStats.overdue}</span>
          </div>
          <div className="alert-item today">
            <span className="alert-label">Due Today</span>
            <span className="alert-value">{taskStats.dueToday}</span>
          </div>
          <div className="alert-item soon">
            <span className="alert-label">Due Soon</span>
            <span className="alert-value">{taskStats.dueSoon}</span>
          </div>
        </div>
      </div>
      
      {/* Time Tracking Statistics */}
      {taskStats.tasksWithTimeTracking > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-section-title">Time Tracking</h3>
          <div className="analytics-time-tracking">
            <div className="time-stat">
              <div className="time-stat-label">Total Estimated</div>
              <div className="time-stat-value">{formatTime(taskStats.totalTimeEstimate)}</div>
            </div>
            <div className="time-stat">
              <div className="time-stat-label">Total Spent</div>
              <div className="time-stat-value">{formatTime(taskStats.totalTimeSpent)}</div>
            </div>
            <div className="time-stat">
              <div className="time-stat-label">Efficiency</div>
              <div className="time-stat-value">{taskStats.timeEfficiency}%</div>
            </div>
          </div>
          
          <div className="time-tracking-status">
            <div className="time-status-item on-track">
              <span>On Track</span>
              <span>{taskStats.timeTrackingStatus['on-track']}</span>
            </div>
            <div className="time-status-item at-risk">
              <span>At Risk</span>
              <span>{taskStats.timeTrackingStatus['at-risk']}</span>
            </div>
            <div className="time-status-item over-budget">
              <span>Over Budget</span>
              <span>{taskStats.timeTrackingStatus['over-budget']}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Distribution */}
      {Object.keys(taskStats.byCategory).length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-section-title">Category Distribution</h3>
          <div className="analytics-categories">
            {Object.entries(taskStats.byCategory).map(([categoryId, count]) => {
              const category = getCategoryById(categoryId)
              return (
                <div key={categoryId} className="category-stat">
                  <div 
                    className="category-color" 
                    style={{ backgroundColor: category?.color || '#6b7280' }}
                  />
                  <span className="category-name">{getCategoryName(categoryId)}</span>
                  <span className="category-count">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Board Statistics */}
      <div className="analytics-section">
        <h3 className="analytics-section-title">Board Statistics</h3>
        <div className="analytics-boards">
          <div className="board-stat">
            <span className="board-stat-label">Total Boards</span>
            <span className="board-stat-value">{boardStats.total}</span>
          </div>
          <div className="board-stat">
            <span className="board-stat-label">Active</span>
            <span className="board-stat-value">{boardStats.active}</span>
          </div>
          <div className="board-stat">
            <span className="board-stat-label">Archived</span>
            <span className="board-stat-value">{boardStats.archived}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
