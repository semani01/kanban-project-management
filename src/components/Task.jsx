import React from 'react'

/**
 * Task Component
 * Displays a single task card with title, description, priority, and action buttons
 * 
 * @param {Object} task - Task object containing id, title, description, priority, status
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

  return (
    <div className="task-card">
      {/* Priority indicator badge */}
      <div className="task-priority" style={{ backgroundColor: priorityColor }}>
        {priorityLabel}
      </div>
      
      {/* Task title */}
      <h3 className="task-title">{task.title}</h3>
      
      {/* Task description */}
      {task.description && (
        <p className="task-description">{task.description}</p>
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
