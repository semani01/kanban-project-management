import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { validateAutomationRule } from '../utils/automation'
import { CATEGORIES } from '../utils/categories'
import { generateId } from '../utils/storage'

/**
 * AutomationRules Component
 * Manages automation rules and workflows
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {string} boardId - Current board ID
 * @param {Array} users - Array of all users
 */
const AutomationRules = ({ isOpen, onClose, boardId, users = [] }) => {
  const [rules, setRules] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    enabled: true,
    trigger: 'task-created',
    conditions: [],
    actions: []
  })
  const [errors, setErrors] = useState({})

  // Load rules on mount and when board changes
  useEffect(() => {
    if (isOpen) {
      api.automations.getAll(boardId)
        .then(loadedRules => setRules(loadedRules))
        .catch(err => console.error('Failed to load automations:', err))
    }
  }, [isOpen, boardId])

  // Trigger options
  const triggers = [
    { value: 'task-created', label: 'Task Created' },
    { value: 'task-moved', label: 'Task Moved' },
    { value: 'task-completed', label: 'Task Completed' },
    { value: 'task-overdue', label: 'Task Overdue' },
    { value: 'task-assigned', label: 'Task Assigned' }
  ]

  // Condition field options
  const conditionFields = [
    { value: 'priority', label: 'Priority' },
    { value: 'category', label: 'Category' },
    { value: 'status', label: 'Status' },
    { value: 'assignedTo', label: 'Assigned To' },
    { value: 'dueDate', label: 'Due Date' }
  ]

  // Action type options
  const actionTypes = [
    { value: 'assign-user', label: 'Assign User' },
    { value: 'set-priority', label: 'Set Priority' },
    { value: 'set-category', label: 'Set Category' },
    { value: 'set-status', label: 'Set Status' },
    { value: 'create-notification', label: 'Create Notification' }
  ]

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Add a condition
  const handleAddCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        id: generateId(),
        field: 'priority',
        operator: 'equals',
        value: ''
      }]
    }))
  }

  // Update a condition
  const handleUpdateCondition = (conditionId, updates) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    }))
  }

  // Remove a condition
  const handleRemoveCondition = (conditionId) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== conditionId)
    }))
  }

  // Add an action
  const handleAddAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, {
        id: generateId(),
        type: 'assign-user',
        value: ''
      }]
    }))
  }

  // Update an action
  const handleUpdateAction = (actionId, updates) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map(a => 
        a.id === actionId ? { ...a, ...updates } : a
      )
    }))
  }

  // Remove an action
  const handleRemoveAction = (actionId) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== actionId)
    }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    const ruleData = {
      ...formData,
      boardId: boardId || null
    }

    const validation = validateAutomationRule(ruleData)
    if (!validation.valid) {
      setErrors({ form: validation.errors.join(', ') })
      return
    }

    try {
      if (editingRule) {
        await api.automations.update(editingRule.id, ruleData)
      } else {
        await api.automations.create(ruleData)
      }
      // Reload rules
      const loadedRules = await api.automations.getAll(boardId)
      setRules(loadedRules)
      handleReset()
    } catch (error) {
      setErrors({ form: error.message || 'Failed to save automation rule' })
    }
  }

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      enabled: true,
      trigger: 'task-created',
      conditions: [],
      actions: []
    })
    setEditingRule(null)
    setIsEditing(false)
    setErrors({})
  }

  // Edit a rule
  const handleEdit = (rule) => {
    setFormData({
      name: rule.name,
      enabled: rule.enabled,
      trigger: rule.trigger,
      conditions: rule.conditions || [],
      actions: rule.actions || []
    })
    setEditingRule(rule)
    setIsEditing(true)
  }

  // Delete a rule
  const handleDelete = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this automation rule?')) {
      try {
        await api.automations.delete(ruleId)
        const loadedRules = await api.automations.getAll(boardId)
        setRules(loadedRules)
      } catch (error) {
        alert('Failed to delete automation rule: ' + error.message)
      }
    }
  }

  // Toggle rule enabled state
  const handleToggleEnabled = async (ruleId) => {
    try {
      const rule = rules.find(r => r.id === ruleId)
      if (rule) {
        await api.automations.update(ruleId, { enabled: !rule.enabled })
        const loadedRules = await api.automations.getAll(boardId)
        setRules(loadedRules)
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content automation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Automation Rules</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="automation-content">
          {/* Rules list */}
          <div className="automation-rules-list">
            <h3>Active Rules</h3>
            {rules.length === 0 ? (
              <p className="no-rules">No automation rules defined.</p>
            ) : (
              <div className="rules-list">
                {rules.map(rule => (
                  <div key={rule.id} className="rule-item">
                    <div className="rule-header">
                      <div className="rule-info">
                        <h4>{rule.name}</h4>
                        <span className="rule-trigger">{triggers.find(t => t.value === rule.trigger)?.label}</span>
                      </div>
                      <div className="rule-actions">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => handleToggleEnabled(rule.id)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <button className="btn-edit-small" onClick={() => handleEdit(rule)}>
                          Edit
                        </button>
                        <button className="btn-delete-small" onClick={() => handleDelete(rule.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="rule-details">
                      {rule.conditions.length > 0 && (
                        <div className="rule-conditions">
                          <strong>Conditions:</strong> {rule.conditions.length}
                        </div>
                      )}
                      <div className="rule-actions-count">
                        <strong>Actions:</strong> {rule.actions.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="automation-form-section">
            <h3>{isEditing ? 'Edit Rule' : 'Create New Rule'}</h3>
            <form onSubmit={handleSubmit} className="automation-form">
              {errors.form && <div className="error-message">{errors.form}</div>}

              <div className="form-group">
                <label>Rule Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Auto-assign high priority tasks"
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

              <div className="form-group">
                <label>Trigger *</label>
                <select
                  name="trigger"
                  value={formData.trigger}
                  onChange={handleChange}
                  required
                >
                  {triggers.map(trigger => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditions */}
              <div className="form-group">
                <label>Conditions (optional)</label>
                {formData.conditions.map(condition => (
                  <div key={condition.id} className="condition-row">
                    <select
                      value={condition.field}
                      onChange={(e) => handleUpdateCondition(condition.id, { field: e.target.value })}
                    >
                      {conditionFields.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    {condition.field === 'dueDate' ? (
                      <select
                        value={condition.operator}
                        onChange={(e) => handleUpdateCondition(condition.id, { operator: e.target.value })}
                      >
                        <option value="overdue">Overdue</option>
                        <option value="due-soon">Due Soon</option>
                      </select>
                    ) : condition.field === 'status' ? (
                      <>
                        <select
                          value={condition.operator}
                          onChange={(e) => handleUpdateCondition(condition.id, { operator: e.target.value })}
                        >
                          <option value="equals">Equals</option>
                          <option value="not-equals">Not Equals</option>
                        </select>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
                          placeholder="Status value"
                        />
                      </>
                    ) : condition.field === 'assignedTo' ? (
                      <select
                        value={condition.value}
                        onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
                      >
                        <option value="">Select user</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    ) : condition.field === 'category' ? (
                      <select
                        value={condition.value}
                        onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={condition.value}
                        onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    )}
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveCondition(condition.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-add" onClick={handleAddCondition}>
                  + Add Condition
                </button>
              </div>

              {/* Actions */}
              <div className="form-group">
                <label>Actions *</label>
                {formData.actions.map(action => (
                  <div key={action.id} className="action-row">
                    <select
                      value={action.type}
                      onChange={(e) => handleUpdateAction(action.id, { type: e.target.value, value: '' })}
                    >
                      {actionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {action.type === 'assign-user' ? (
                      <select
                        value={action.value}
                        onChange={(e) => handleUpdateAction(action.id, { value: e.target.value })}
                      >
                        <option value="">Select user</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    ) : action.type === 'set-priority' ? (
                      <select
                        value={action.value}
                        onChange={(e) => handleUpdateAction(action.id, { value: e.target.value })}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    ) : action.type === 'set-category' ? (
                      <select
                        value={action.value}
                        onChange={(e) => handleUpdateAction(action.id, { value: e.target.value })}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : action.type === 'set-status' ? (
                      <input
                        type="text"
                        value={action.value}
                        onChange={(e) => handleUpdateAction(action.id, { value: e.target.value })}
                        placeholder="Status (e.g., in-progress)"
                      />
                    ) : action.type === 'create-notification' ? (
                      <>
                        <select
                          value={action.userId || ''}
                          onChange={(e) => handleUpdateAction(action.id, { userId: e.target.value })}
                        >
                          <option value="">Select user</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={action.message || ''}
                          onChange={(e) => handleUpdateAction(action.id, { message: e.target.value })}
                          placeholder="Notification message"
                        />
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveAction(action.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-add" onClick={handleAddAction}>
                  + Add Action
                </button>
              </div>

              <div className="form-actions">
                {isEditing && (
                  <button type="button" className="btn-cancel" onClick={handleReset}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-submit">
                  {isEditing ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutomationRules
