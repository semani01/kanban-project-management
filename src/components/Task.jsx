import React from 'react'
import { formatDate, isOverdue, isDueSoon, isToday } from '../utils/dateUtils'
import { getCategoryById } from '../utils/categories'
import { parseMarkdown } from '../utils/markdown'

/**
 * Task Component
 * Displays a single task card with title, description, priority, due date, category, and action buttons
 * 
 * @param {Object} task - Task object containing id, title, description, priority, status, dueDate, category, comments
 * @param {Function} onEdit - Callback function to handle task editing
 * @param {Function} onDelete - Callback function to handle task deletion
 */
const Task = ({ task, onEdit, onDelete }) => {
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

  return (
    <div className="task-card">
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
