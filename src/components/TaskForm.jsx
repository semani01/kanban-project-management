import React, { useState, useEffect } from 'react'
import { CATEGORIES } from '../utils/categories'
import { formatDateForInput } from '../utils/dateUtils'

/**
 * TaskForm Component
 * Modal form for creating and editing tasks
 * Handles form validation and submission
 * 
 * @param {Object} task - Task object to edit (null for new tasks)
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback function to close the modal
 * @param {Function} onSubmit - Callback function to handle form submission
 */

const TaskForm = ({ task, isOpen, onClose, onSubmit }) => {
  // Form state - manages input values
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    category: 'other',
    comments: []
  })

  // New comment input state
  const [newComment, setNewComment] = useState('')

  // Validation errors state
  const [errors, setErrors] = useState({})

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
        comments: task.comments || []
      })
    } else {
      // If creating new task, reset form to defaults
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        category: 'other',
        comments: []
      })
    }
    // Clear errors and new comment when form opens
    setErrors({})
    setNewComment('')
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
    const submitData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
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
      comments: []
    })
    setNewComment('')
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
