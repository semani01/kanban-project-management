import React, { useState, useEffect } from 'react'
import api from '../services/api'
import {
  formatRecurrence,
  RECURRENCE_TYPES
} from '../utils/recurringTasks'
import { CATEGORIES } from '../utils/categories'
import { formatDateForInput } from '../utils/dateUtils'

/**
 * RecurringTasks Component
 * Manages recurring task templates
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {string} boardId - Current board ID
 * @param {Array} users - Array of all users
 */
const RecurringTasks = ({ isOpen, onClose, boardId, users = [] }) => {
  const [templates, setTemplates] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    enabled: true,
    taskTemplate: {
      title: '',
      description: '',
      priority: 'medium',
      category: 'other',
      assignedTo: null,
      dueDate: ''
    },
    recurrence: {
      type: RECURRENCE_TYPES.DAILY,
      interval: 1,
      daysOfWeek: [],
      dayOfMonth: null,
      endDate: null,
      maxOccurrences: null
    }
  })
  const [errors, setErrors] = useState({})

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      api.recurring.getAll(boardId)
        .then(loadedTemplates => setTemplates(loadedTemplates))
        .catch(err => console.error('Failed to load recurring tasks:', err))
    }
  }, [isOpen, boardId])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const path = name.split('.')
    
    if (path.length === 1) {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    } else if (path.length === 2) {
      setFormData(prev => ({
        ...prev,
        [path[0]]: {
          ...prev[path[0]],
          [path[1]]: type === 'checkbox' ? checked : value
        }
      }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle recurrence type change
  const handleRecurrenceTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        type,
        daysOfWeek: type === RECURRENCE_TYPES.WEEKLY ? prev.recurrence.daysOfWeek : [],
        dayOfMonth: type === RECURRENCE_TYPES.MONTHLY ? prev.recurrence.dayOfMonth : null
      }
    }))
  }

  // Toggle day of week for weekly recurrence
  const handleToggleDayOfWeek = (day) => {
    setFormData(prev => {
      const days = prev.recurrence.daysOfWeek || []
      const newDays = days.includes(day)
        ? days.filter(d => d !== day)
        : [...days, day].sort()
      return {
        ...prev,
        recurrence: {
          ...prev.recurrence,
          daysOfWeek: newDays
        }
      }
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setErrors({ name: 'Template name is required' })
      return
    }

    if (!formData.taskTemplate.title.trim()) {
      setErrors({ 'taskTemplate.title': 'Task title is required' })
      return
    }

    const templateData = {
      ...formData,
      boardId: boardId || null
    }

    try {
      if (editingTemplate) {
        await api.recurring.update(editingTemplate.id, templateData)
      } else {
        await api.recurring.create(templateData)
      }
      // Reload templates
      const loadedTemplates = await api.recurring.getAll(boardId)
      setTemplates(loadedTemplates)
      handleReset()
    } catch (error) {
      setErrors({ form: error.message || 'Failed to save recurring task template' })
    }
  }

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      enabled: true,
      taskTemplate: {
        title: '',
        description: '',
        priority: 'medium',
        category: 'other',
        assignedTo: null,
        dueDate: ''
      },
      recurrence: {
        type: RECURRENCE_TYPES.DAILY,
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: null,
        endDate: null,
        maxOccurrences: null
      }
    })
    setEditingTemplate(null)
    setIsEditing(false)
    setErrors({})
  }

  // Edit a template
  const handleEdit = (template) => {
    setFormData({
      name: template.name,
      enabled: template.enabled,
      taskTemplate: template.taskTemplate,
      recurrence: template.recurrence
    })
    setEditingTemplate(template)
    setIsEditing(true)
  }

  // Delete a template
  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this recurring task template?')) {
      try {
        await api.recurring.delete(templateId)
        const loadedTemplates = await api.recurring.getAll(boardId)
        setTemplates(loadedTemplates)
      } catch (error) {
        alert('Failed to delete template: ' + error.message)
      }
    }
  }

  // Toggle template enabled state
  const handleToggleEnabled = async (templateId) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        await api.recurring.update(templateId, { enabled: !template.enabled })
        const loadedTemplates = await api.recurring.getAll(boardId)
        setTemplates(loadedTemplates)
      }
    } catch (error) {
      console.error('Failed to toggle template:', error)
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recurring-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Recurring Tasks</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="recurring-content">
          {/* Templates list */}
          <div className="recurring-templates-list">
            <h3>Recurring Templates</h3>
            {templates.length === 0 ? (
              <p className="no-templates">No recurring task templates defined.</p>
            ) : (
              <div className="templates-list">
                {templates.map(template => (
                  <div key={template.id} className="template-item">
                    <div className="template-header">
                      <div className="template-info">
                        <h4>{template.name}</h4>
                        <span className="template-task-title">{template.taskTemplate.title}</span>
                        <span className="template-recurrence">{formatRecurrence(template.recurrence)}</span>
                      </div>
                      <div className="template-actions">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={template.enabled}
                            onChange={() => handleToggleEnabled(template.id)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <button className="btn-edit-small" onClick={() => handleEdit(template)}>
                          Edit
                        </button>
                        <button className="btn-delete-small" onClick={() => handleDelete(template.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="template-details">
                      <div>Occurrences: {template.occurrenceCount || 0}</div>
                      {template.lastGenerated && (
                        <div>Last generated: {new Date(template.lastGenerated).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="recurring-form-section">
            <h3>{isEditing ? 'Edit Template' : 'Create New Template'}</h3>
            <form onSubmit={handleSubmit} className="recurring-form">
              {errors.name && <div className="error-message">{errors.name}</div>}
              {errors['taskTemplate.title'] && (
                <div className="error-message">{errors['taskTemplate.title']}</div>
              )}

              <div className="form-group">
                <label>Template Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Daily Standup"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleChange}
                  />
                  Enabled
                </label>
              </div>

              <h4>Task Template</h4>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  name="taskTemplate.title"
                  value={formData.taskTemplate.title}
                  onChange={handleChange}
                  required
                  placeholder="Task title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="taskTemplate.description"
                  value={formData.taskTemplate.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Task description"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  name="taskTemplate.priority"
                  value={formData.taskTemplate.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  name="taskTemplate.category"
                  value={formData.taskTemplate.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assign To</label>
                <select
                  name="taskTemplate.assignedTo"
                  value={formData.taskTemplate.assignedTo || ''}
                  onChange={handleChange}
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <h4>Recurrence Pattern</h4>
              <div className="form-group">
                <label>Recurrence Type</label>
                <select
                  value={formData.recurrence.type}
                  onChange={(e) => handleRecurrenceTypeChange(e.target.value)}
                >
                  <option value={RECURRENCE_TYPES.DAILY}>Daily</option>
                  <option value={RECURRENCE_TYPES.WEEKLY}>Weekly</option>
                  <option value={RECURRENCE_TYPES.MONTHLY}>Monthly</option>
                  <option value={RECURRENCE_TYPES.YEARLY}>Yearly</option>
                </select>
              </div>

              {formData.recurrence.type !== RECURRENCE_TYPES.DAILY && (
                <div className="form-group">
                  <label>Interval</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.recurrence.interval}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurrence: {
                        ...prev.recurrence,
                        interval: parseInt(e.target.value) || 1
                      }
                    }))}
                  />
                  <small>Every {formData.recurrence.interval} {formData.recurrence.type === RECURRENCE_TYPES.WEEKLY ? 'weeks' : formData.recurrence.type === RECURRENCE_TYPES.MONTHLY ? 'months' : 'years'}</small>
                </div>
              )}

              {formData.recurrence.type === RECURRENCE_TYPES.WEEKLY && (
                <div className="form-group">
                  <label>Days of Week</label>
                  <div className="days-of-week">
                    {dayNames.map((day, index) => (
                      <label key={index} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.recurrence.daysOfWeek.includes(index)}
                          onChange={() => handleToggleDayOfWeek(index)}
                        />
                        {day.substring(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.recurrence.type === RECURRENCE_TYPES.MONTHLY && (
                <div className="form-group">
                  <label>Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurrence.dayOfMonth || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurrence: {
                        ...prev.recurrence,
                        dayOfMonth: e.target.value ? parseInt(e.target.value) : null
                      }
                    }))}
                    placeholder="1-31"
                  />
                </div>
              )}

              <div className="form-group">
                <label>End Date (optional)</label>
                <input
                  type="date"
                  value={formData.recurrence.endDate ? formatDateForInput(formData.recurrence.endDate) : ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    recurrence: {
                      ...prev.recurrence,
                      endDate: e.target.value ? new Date(e.target.value).toISOString() : null
                    }
                  }))}
                />
              </div>

              <div className="form-group">
                <label>Max Occurrences (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrence.maxOccurrences || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    recurrence: {
                      ...prev.recurrence,
                      maxOccurrences: e.target.value ? parseInt(e.target.value) : null
                    }
                  }))}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="form-actions">
                {isEditing && (
                  <button type="button" className="btn-cancel" onClick={handleReset}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-submit">
                  {isEditing ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecurringTasks
