import React, { useState, useEffect } from 'react'
import { CATEGORIES } from '../utils/categories'
import { formatDateForInput } from '../utils/dateUtils'
import { getTaskTemplates, createTaskFromTemplate } from '../utils/taskTemplates'
import { parseTimeString, formatTime } from '../utils/timeTracking'
import { generateId } from '../utils/storage'

/**
 * TaskForm Component
 * Modal form for creating and editing tasks
 * Handles form validation and submission
 * Supports task templates
 * 
 * @param {Object} task - Task object to edit (null for new tasks)
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback function to close the modal
 * @param {Function} onSubmit - Callback function to handle form submission
 * @param {Array} users - Array of all users (for task assignment)
 * @param {Object} currentUser - Current logged-in user
 * @param {Array} allTasks - Array of all tasks (for dependencies)
 */

const TaskForm = ({ task, isOpen, onClose, onSubmit, users = [], currentUser = null, allTasks = [] }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  // Form state - manages input values
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    category: 'other',
    assignedTo: null,
    comments: [],
    subtasks: [],
    timeEstimate: null,
    timeSpent: null,
    dependencies: []
  })

  // New comment input state
  const [newComment, setNewComment] = useState('')
  
  // Subtask input state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  
  // Time tracking input states (as strings for user input)
  const [timeEstimateInput, setTimeEstimateInput] = useState('')
  const [timeSpentInput, setTimeSpentInput] = useState('')

  // Validation errors state
  const [errors, setErrors] = useState({})

  const taskTemplates = getTaskTemplates()
  
  // Get available users for assignment (all users except current user, or all if no current user)
  const availableUsers = users.filter(user => !currentUser || user.id !== currentUser.id)

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    if (templateId && !task) { // Only allow templates when creating new tasks
      const templateData = createTaskFromTemplate(templateId)
      if (templateData) {
        setFormData(prev => ({
          ...prev,
          ...templateData
        }))
      }
    }
    setSelectedTemplate(templateId)
  }

  // Update form data when task prop changes (for editing)
  useEffect(() => {
    if (task) {
      // If editing, populate form with existing task data
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
        category: task.category || 'other',
        assignedTo: task.assignedTo || null,
        comments: task.comments || [],
        subtasks: task.subtasks || [],
        timeEstimate: task.timeEstimate || null,
        timeSpent: task.timeSpent || null,
        dependencies: task.dependencies || []
      })
      // Set time tracking inputs
      setTimeEstimateInput(task.timeEstimate ? formatTime(task.timeEstimate) : '')
      setTimeSpentInput(task.timeSpent ? formatTime(task.timeSpent) : '')
    } else {
      // If creating new task, reset form to defaults
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        category: 'other',
        assignedTo: null,
        comments: [],
        subtasks: [],
        timeEstimate: null,
        timeSpent: null,
        dependencies: []
      })
      setTimeEstimateInput('')
      setTimeSpentInput('')
    }
    // Clear errors and new comment when form opens
    setErrors({})
    setNewComment('')
    setNewSubtaskTitle('')
    setSelectedTemplate('')
  }, [task, isOpen])

  /**
   * Handles input field changes
   * Updates form state as user types
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  /**
   * Validates form data before submission
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validate = () => {
    const newErrors = {}

    // Title is required
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    // Title should not be too long
    if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }

    // Description should not be too long
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handles adding a new comment
   */
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: newComment.trim(),
        createdAt: new Date().toISOString()
      }
      
      setFormData(prev => ({
        ...prev,
        comments: [...prev.comments, comment]
      }))
      
      setNewComment('')
    }
  }

  /**
   * Handles deleting a comment
   * @param {string} commentId - ID of the comment to delete
   */
  const handleDeleteComment = (commentId) => {
    setFormData(prev => ({
      ...prev,
      comments: prev.comments.filter(comment => comment.id !== commentId)
    }))
  }
  
  /**
   * Handles adding a new subtask
   */
  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const subtask = {
        id: generateId(),
        title: newSubtaskTitle.trim(),
        completed: false
      }
      
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, subtask]
      }))
      
      setNewSubtaskTitle('')
    }
  }
  
  /**
   * Handles deleting a subtask
   * @param {string} subtaskId - ID of the subtask to delete
   */
  const handleDeleteSubtask = (subtaskId) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(subtask => subtask.id !== subtaskId)
    }))
  }
  
  /**
   * Handles toggling subtask completion
   * @param {string} subtaskId - ID of the subtask to toggle
   */
  const handleToggleSubtask = (subtaskId) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }))
  }
  
  /**
   * Handles adding a dependency
   * @param {string} taskId - ID of the task to depend on
   */
  const handleAddDependency = (taskId) => {
    if (taskId && !formData.dependencies.includes(taskId) && taskId !== task?.id) {
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, taskId]
      }))
    }
  }
  
  /**
   * Handles removing a dependency
   * @param {string} taskId - ID of the dependency to remove
   */
  const handleRemoveDependency = (taskId) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(id => id !== taskId)
    }))
  }
  
  // Get available tasks for dependencies (exclude current task)
  const availableDependencyTasks = allTasks.filter(t => t.id !== task?.id)

  /**
   * Handles form submission
   * Validates data and calls onSubmit callback
   */
  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate form before submitting
    if (!validate()) {
      return
    }

    // Convert dueDate to ISO string if provided
    // Parse time tracking inputs to minutes
    const submitData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      timeEstimate: timeEstimateInput ? parseTimeString(timeEstimateInput) : null,
      timeSpent: timeSpentInput ? parseTimeString(timeSpentInput) : null
    }

    // Call parent's onSubmit function with form data
    onSubmit(submitData)
    
    // Reset form after successful submission
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      category: 'other',
      assignedTo: null,
      comments: [],
      subtasks: [],
      timeEstimate: null,
      timeSpent: null,
      dependencies: []
    })
    setNewComment('')
    setNewSubtaskTitle('')
    setTimeEstimateInput('')
    setTimeSpentInput('')
  }

  // Don't render if modal is not open
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="task-form">
          {/* Task templates (only when creating new task) */}
          {!task && taskTemplates.length > 0 && (
            <div className="form-group">
              <label htmlFor="task-template">Use Template (optional)</label>
              <select
                id="task-template"
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
              >
                <option value="">No template</option>
                {taskTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title input */}
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? 'input-error' : ''}
              placeholder="Enter task title"
              maxLength={100}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Description textarea */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'input-error' : ''}
              placeholder="Enter task description (optional)"
              rows="4"
              maxLength={500}
            />
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
          </div>

          {/* Priority select */}
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due date input */}
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Category select */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assign to user */}
          {availableUsers.length > 0 && (
            <div className="form-group">
              <label htmlFor="assignedTo">Assign To</label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo || ''}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtasks section */}
          <div className="form-group">
            <label>Subtasks</label>
            <div className="subtasks-section">
              {/* Existing subtasks */}
              {formData.subtasks && formData.subtasks.length > 0 && (
                <div className="subtasks-list">
                  {formData.subtasks.map(subtask => (
                    <div key={subtask.id} className="subtask-item-form">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleToggleSubtask(subtask.id)}
                      />
                      <span className={subtask.completed ? 'subtask-completed' : ''}>
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        className="btn-delete-subtask"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        aria-label="Delete subtask"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add new subtask */}
              <div className="add-subtask">
                <input
                  type="text"
                  className="subtask-input"
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSubtask()
                    }
                  }}
                  maxLength={100}
                />
                <button
                  type="button"
                  className="btn-add-subtask"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          
          {/* Time tracking section */}
          <div className="form-group">
            <label>Time Tracking</label>
            <div className="time-tracking-section">
              <div className="time-input-group">
                <label htmlFor="timeEstimate">Time Estimate</label>
                <input
                  type="text"
                  id="timeEstimate"
                  className="time-input"
                  placeholder="e.g., 2h 30m, 1d 4h, 45m"
                  value={timeEstimateInput}
                  onChange={(e) => setTimeEstimateInput(e.target.value)}
                />
                <small className="time-input-hint">Format: 2h 30m, 1d 4h, 45m</small>
              </div>
              
              <div className="time-input-group">
                <label htmlFor="timeSpent">Time Spent</label>
                <input
                  type="text"
                  id="timeSpent"
                  className="time-input"
                  placeholder="e.g., 2h 30m, 1d 4h, 45m"
                  value={timeSpentInput}
                  onChange={(e) => setTimeSpentInput(e.target.value)}
                />
                <small className="time-input-hint">Format: 2h 30m, 1d 4h, 45m</small>
              </div>
            </div>
          </div>
          
          {/* Dependencies section */}
          {availableDependencyTasks.length > 0 && (
            <div className="form-group">
              <label>Dependencies</label>
              <div className="dependencies-section">
                {/* Existing dependencies */}
                {formData.dependencies && formData.dependencies.length > 0 && (
                  <div className="dependencies-list">
                    {formData.dependencies.map(depId => {
                      const depTask = allTasks.find(t => t.id === depId)
                      return depTask ? (
                        <div key={depId} className="dependency-item">
                          <span className="dependency-task-title">{depTask.title}</span>
                          <button
                            type="button"
                            className="btn-remove-dependency"
                            onClick={() => handleRemoveDependency(depId)}
                            aria-label="Remove dependency"
                          >
                            ×
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
                
                {/* Add new dependency */}
                <select
                  className="dependency-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddDependency(e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">Add dependency...</option>
                  {availableDependencyTasks
                    .filter(t => !formData.dependencies.includes(t.id))
                    .map(depTask => (
                      <option key={depTask.id} value={depTask.id}>
                        {depTask.title} ({depTask.status})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
          
          {/* Comments section */}
          <div className="form-group">
            <label>Comments</label>
            <div className="comments-section">
              {/* Existing comments */}
              {formData.comments && formData.comments.length > 0 && (
                <div className="comments-list">
                  {formData.comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <p className="comment-text">{comment.text}</p>
                      <button
                        type="button"
                        className="btn-delete-comment"
                        onClick={() => handleDeleteComment(comment.id)}
                        aria-label="Delete comment"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add new comment */}
              <div className="add-comment">
                <textarea
                  className="comment-input"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="2"
                  maxLength={200}
                />
                <button
                  type="button"
                  className="btn-add-comment"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
