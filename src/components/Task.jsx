import React, { useState, useMemo, useEffect } from 'react'
import { formatDate, isOverdue, isDueSoon, isToday } from '../utils/dateUtils'
import { getCategoryById } from '../utils/categories'
import { parseMarkdown } from '../utils/markdown'
import { formatTime, calculateTimeProgress, getTimeTrackingStatus } from '../utils/timeTracking'
import UserAvatar from './UserAvatar'

/**
 * Task Component
 * Displays a single task card with title, description, priority, due date, category, and action buttons
 * Supports selection for bulk operations
 * 
 * @param {Object} task - Task object containing id, title, description, priority, status, dueDate, category, comments
 * @param {Function} onEdit - Callback function to handle task editing
 * @param {Function} onDelete - Callback function to handle task deletion
 * @param {boolean} isSelected - Whether the task is selected for bulk operations
 * @param {Function} onToggleSelect - Callback to toggle task selection
 * @param {Array} users - Array of all users (for displaying assigned user)
 */
const Task = ({ task, onEdit, onDelete, isSelected = false, onToggleSelect, users = [] }) => {
  // Priority color mapping for visual indicators
  const priorityColors = {
    high: '#ef4444',    // Red for high priority
    medium: '#f59e0b',  // Orange/Amber for medium priority
    low: '#10b981'      // Green for low priority
  }

  // Priority label mapping for display
  const priorityLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  }

  // Get the color and label for the current task priority
  const priorityColor = priorityColors[task.priority] || priorityColors.medium
  const priorityLabel = priorityLabels[task.priority] || 'Medium'

  // Get category information
  const category = task.category ? getCategoryById(task.category) : null

  // Determine due date styling based on status
  const getDueDateClass = () => {
    if (!task.dueDate) return ''
    if (isOverdue(task.dueDate)) return 'due-date overdue'
    if (isToday(task.dueDate)) return 'due-date today'
    if (isDueSoon(task.dueDate)) return 'due-date due-soon'
    return 'due-date'
  }

  // Get comment count
  const commentCount = task.comments && task.comments.length > 0 ? task.comments.length : 0
  
  // Subtasks state - sync with task prop
  const [subtasks, setSubtasks] = useState(task.subtasks || [])
  const [showSubtasks, setShowSubtasks] = useState(false)
  
  // Sync subtasks when task prop changes
  useEffect(() => {
    setSubtasks(task.subtasks || [])
  }, [task.subtasks])
  
  // Calculate subtask completion
  const subtaskStats = useMemo(() => {
    if (!subtasks || subtasks.length === 0) {
      return { total: 0, completed: 0, percentage: 0 }
    }
    const completed = subtasks.filter(st => st.completed).length
    return {
      total: subtasks.length,
      completed,
      percentage: Math.round((completed / subtasks.length) * 100)
    }
  }, [subtasks])
  
  // Toggle subtask completion (local state only - parent should handle persistence)
  const toggleSubtask = (subtaskId) => {
    setSubtasks(prev => prev.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ))
  }
  
  // Time tracking info
  const timeTrackingInfo = useMemo(() => {
    if (!task.timeEstimate && !task.timeSpent) return null
    
    const progress = task.timeEstimate 
      ? calculateTimeProgress(task.timeSpent || 0, task.timeEstimate)
      : 0
    const status = task.timeEstimate
      ? getTimeTrackingStatus(task.timeSpent || 0, task.timeEstimate)
      : null
    
    return { progress, status }
  }, [task.timeEstimate, task.timeSpent])

  return (
    <div className={`task-card ${isSelected ? 'selected' : ''}`}>
      {/* Top section with checkbox and badges */}
      <div className="task-card-header">
        {/* Selection checkbox for bulk operations */}
        {onToggleSelect && (
          <div className="task-select-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(task.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select task: ${task.title}`}
            />
          </div>
        )}

        {/* Priority and Category badges */}
        <div className="task-badges">
          <div className="task-priority" style={{ backgroundColor: priorityColor }}>
            {priorityLabel}
          </div>
          {category && (
            <div 
              className="task-category" 
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </div>
          )}
        </div>
      </div>
      
      {/* Task title */}
      <h3 className="task-title">{task.title}</h3>
      
      {/* Task description with markdown support */}
      {task.description && (
        <div 
          className="task-description"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(task.description) }}
        />
      )}
      
      {/* Due date */}
      {task.dueDate && (
        <div className={getDueDateClass()}>
          <span className="due-date-icon">📅</span>
          <span>{formatDate(task.dueDate)}</span>
          {isOverdue(task.dueDate) && <span className="overdue-label">Overdue</span>}
          {isToday(task.dueDate) && <span className="today-label">Today</span>}
        </div>
      )}
      
      {/* Assigned user */}
      {task.assignedTo && (
        <div className="task-assigned">
          <span className="assigned-label">Assigned to:</span>
          <UserAvatar
            user={users.find(u => u.id === task.assignedTo)}
            size={24}
            showName={true}
          />
        </div>
      )}
      
      {/* Subtasks section */}
      {subtasks && subtasks.length > 0 && (
        <div className="task-subtasks">
          <div 
            className="task-subtasks-header"
            onClick={() => setShowSubtasks(!showSubtasks)}
          >
            <span className="subtasks-icon">{showSubtasks ? '▼' : '▶'}</span>
            <span className="subtasks-label">Subtasks</span>
            <span className="subtasks-progress">
              {subtaskStats.completed}/{subtaskStats.total} ({subtaskStats.percentage}%)
            </span>
            <div className="subtasks-progress-bar">
              <div 
                className="subtasks-progress-fill"
                style={{ width: `${subtaskStats.percentage}%` }}
              />
            </div>
          </div>
          
          {showSubtasks && (
            <div className="task-subtasks-list">
              {subtasks.map(subtask => (
                <div 
                  key={subtask.id} 
                  className={`subtask-item ${subtask.completed ? 'completed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(subtask.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="subtask-title">{subtask.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Time tracking section */}
      {timeTrackingInfo && (
        <div className="task-time-tracking">
          <div className="time-tracking-header">
            <span className="time-icon">⏱</span>
            <span className="time-label">Time Tracking</span>
          </div>
          <div className="time-tracking-details">
            {task.timeEstimate && (
              <span className="time-estimate">
                Est: {formatTime(task.timeEstimate)}
              </span>
            )}
            {task.timeSpent !== undefined && (
              <span className="time-spent">
                Spent: {formatTime(task.timeSpent)}
              </span>
            )}
            {timeTrackingInfo.progress > 0 && (
              <div className="time-progress-bar">
                <div 
                  className={`time-progress-fill ${timeTrackingInfo.status}`}
                  style={{ width: `${Math.min(100, timeTrackingInfo.progress)}%` }}
                />
              </div>
            )}
            {timeTrackingInfo.status && (
              <span className={`time-status ${timeTrackingInfo.status}`}>
                {timeTrackingInfo.status === 'on-track' ? '✓ On Track' :
                 timeTrackingInfo.status === 'at-risk' ? '⚠ At Risk' :
                 '⚠ Over Budget'}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Task dependencies indicator */}
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="task-dependencies">
          <span className="dependencies-icon">🔗</span>
          <span className="dependencies-label">
            {task.dependencies.length} {task.dependencies.length === 1 ? 'dependency' : 'dependencies'}
          </span>
        </div>
      )}
      
      {/* Comments indicator */}
      {commentCount > 0 && (
        <div className="task-comments-indicator">
          <span className="comments-icon">💬</span>
          <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
        </div>
      )}
      
      {/* Action buttons container */}
      <div className="task-actions">
        {/* Edit button - opens edit modal */}
        <button 
          className="btn-edit"
          onClick={() => onEdit(task)}
          aria-label={`Edit task: ${task.title}`}
        >
          Edit
        </button>
        
        {/* Delete button - removes task */}
        <button 
          className="btn-delete"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task: ${task.title}`}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default Task
