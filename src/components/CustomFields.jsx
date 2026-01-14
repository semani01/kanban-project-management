import React, { useState, useEffect } from 'react'
import {
  loadCustomFields,
  saveCustomFields,
  createCustomField,
  FIELD_TYPES
} from '../utils/customFields'

/**
 * CustomFields Component
 * Manages custom field definitions for tasks
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {string} boardId - Current board ID
 */
const CustomFields = ({ isOpen, onClose, boardId }) => {
  const [fields, setFields] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: FIELD_TYPES.TEXT,
    required: false,
    defaultValue: '',
    options: [],
    placeholder: '',
    description: '',
    order: 0
  })
  const [newOption, setNewOption] = useState('')
  const [errors, setErrors] = useState({})

  // Load fields on mount
  useEffect(() => {
    if (isOpen) {
      setFields(loadCustomFields(boardId))
    }
  }, [isOpen, boardId])

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

  // Handle adding option for SELECT type
  const handleAddOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }))
      setNewOption('')
    }
  }

  // Handle removing option
  const handleRemoveOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setErrors({ name: 'Field name is required' })
      return
    }

    const fieldData = {
      ...formData,
      boardId: boardId || null,
      defaultValue: formData.type === FIELD_TYPES.CHECKBOX 
        ? formData.defaultValue === 'true' 
        : formData.defaultValue || null
    }

    const field = editingField
      ? { ...editingField, ...fieldData, updatedAt: new Date().toISOString() }
      : createCustomField(fieldData)

    const allFields = loadCustomFields()
    const updatedFields = editingField
      ? allFields.map(f => f.id === editingField.id ? field : f)
      : [...allFields, field]

    saveCustomFields(updatedFields)
    setFields(updatedFields.filter(f => !boardId || !f.boardId || f.boardId === boardId))
    handleReset()
  }

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      type: FIELD_TYPES.TEXT,
      required: false,
      defaultValue: '',
      options: [],
      placeholder: '',
      description: '',
      order: 0
    })
    setEditingField(null)
    setIsEditing(false)
    setNewOption('')
    setErrors({})
  }

  // Edit a field
  const handleEdit = (field) => {
    setFormData({
      name: field.name,
      type: field.type,
      required: field.required || false,
      defaultValue: field.defaultValue !== null && field.defaultValue !== undefined 
        ? String(field.defaultValue) 
        : '',
      options: field.options || [],
      placeholder: field.placeholder || '',
      description: field.description || '',
      order: field.order || 0
    })
    setEditingField(field)
    setIsEditing(true)
  }

  // Delete a field
  const handleDelete = (fieldId) => {
    if (window.confirm('Are you sure you want to delete this custom field? This will remove it from all tasks.')) {
      const allFields = loadCustomFields()
      const updatedFields = allFields.filter(f => f.id !== fieldId)
      saveCustomFields(updatedFields)
      setFields(updatedFields.filter(f => !boardId || !f.boardId || f.boardId === boardId))
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content custom-fields-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Custom Fields</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="custom-fields-content">
          {/* Fields list */}
          <div className="custom-fields-list">
            <h3>Custom Fields</h3>
            {fields.length === 0 ? (
              <p className="no-fields">No custom fields defined.</p>
            ) : (
              <div className="fields-list">
                {fields
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map(field => (
                    <div key={field.id} className="field-item">
                      <div className="field-info">
                        <h4>{field.name}</h4>
                        <span className="field-type">{field.type}</span>
                        {field.required && <span className="field-required">Required</span>}
                        {field.description && <p>{field.description}</p>}
                      </div>
                      <div className="field-actions">
                        <button className="btn-edit-small" onClick={() => handleEdit(field)}>
                          Edit
                        </button>
                        <button className="btn-delete-small" onClick={() => handleDelete(field.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="custom-fields-form-section">
            <h3>{isEditing ? 'Edit Field' : 'Create New Field'}</h3>
            <form onSubmit={handleSubmit} className="custom-fields-form">
              {errors.name && <div className="error-message">{errors.name}</div>}

              <div className="form-group">
                <label>Field Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Client Name, Budget, etc."
                />
              </div>

              <div className="form-group">
                <label>Field Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} required>
                  <option value={FIELD_TYPES.TEXT}>Text</option>
                  <option value={FIELD_TYPES.NUMBER}>Number</option>
                  <option value={FIELD_TYPES.DATE}>Date</option>
                  <option value={FIELD_TYPES.SELECT}>Select (Dropdown)</option>
                  <option value={FIELD_TYPES.CHECKBOX}>Checkbox</option>
                  <option value={FIELD_TYPES.URL}>URL</option>
                  <option value={FIELD_TYPES.EMAIL}>Email</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="required"
                    checked={formData.required}
                    onChange={handleChange}
                  />
                  Required Field
                </label>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Optional description"
                />
              </div>

              <div className="form-group">
                <label>Placeholder</label>
                <input
                  type="text"
                  name="placeholder"
                  value={formData.placeholder}
                  onChange={handleChange}
                  placeholder="Placeholder text"
                />
              </div>

              {formData.type === FIELD_TYPES.SELECT && (
                <div className="form-group">
                  <label>Options</label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="option-row">
                      <span>{option}</span>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemoveOption(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <div className="add-option">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddOption()
                        }
                      }}
                      placeholder="Add option"
                    />
                    <button type="button" className="btn-add" onClick={handleAddOption}>
                      Add
                    </button>
                  </div>
                </div>
              )}

              {formData.type !== FIELD_TYPES.CHECKBOX && formData.type !== FIELD_TYPES.SELECT && (
                <div className="form-group">
                  <label>Default Value</label>
                  <input
                    type={formData.type === FIELD_TYPES.NUMBER ? 'number' : formData.type === FIELD_TYPES.DATE ? 'date' : 'text'}
                    name="defaultValue"
                    value={formData.defaultValue}
                    onChange={handleChange}
                    placeholder="Default value (optional)"
                  />
                </div>
              )}

              {formData.type === FIELD_TYPES.CHECKBOX && (
                <div className="form-group">
                  <label>Default Value</label>
                  <select
                    value={formData.defaultValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                  >
                    <option value="false">Unchecked</option>
                    <option value="true">Checked</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  min="0"
                />
                <small>Lower numbers appear first</small>
              </div>

              <div className="form-actions">
                {isEditing && (
                  <button type="button" className="btn-cancel" onClick={handleReset}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-submit">
                  {isEditing ? 'Update Field' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomFields
