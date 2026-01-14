import React, { useState, useEffect } from 'react'
import { getTemplates } from '../utils/boardTemplates'
import { createBoardFromTemplate, createCustomBoard } from '../utils/boardUtils'

/**
 * BoardForm Component
 * Modal form for creating new boards from templates or custom configuration
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {Function} onSubmit - Callback to handle board creation
 */
const BoardForm = ({ isOpen, onClose, onSubmit }) => {
  const [boardName, setBoardName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('default')
  const [customColumns, setCustomColumns] = useState([
    { id: 'todo', title: 'To Do', wipLimit: null },
    { id: 'in-progress', title: 'In Progress', wipLimit: null },
    { id: 'done', title: 'Done', wipLimit: null }
  ])
  const [isCustom, setIsCustom] = useState(false)
  const [errors, setErrors] = useState({})

  const templates = getTemplates()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setBoardName('')
      setSelectedTemplate('default')
      setIsCustom(false)
      setCustomColumns([
        { id: 'todo', title: 'To Do', wipLimit: null },
        { id: 'in-progress', title: 'In Progress', wipLimit: null },
        { id: 'done', title: 'Done', wipLimit: null }
      ])
      setErrors({})
    }
  }, [isOpen])

  /**
   * Validates the form
   */
  const validate = () => {
    const newErrors = {}

    if (!boardName.trim()) {
      newErrors.name = 'Board name is required'
    }

    if (isCustom) {
      if (customColumns.length < 2) {
        newErrors.columns = 'At least 2 columns are required'
      }
      customColumns.forEach((col, index) => {
        if (!col.title.trim()) {
          newErrors[`column-${index}`] = 'Column title is required'
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handles form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    let newBoard
    if (isCustom) {
      newBoard = createCustomBoard(boardName, customColumns)
    } else {
      const template = templates.find(t => t.id === selectedTemplate)
      newBoard = createBoardFromTemplate(boardName, template)
    }

    onSubmit(newBoard)
    onClose()
  }

  /**
   * Adds a new custom column
   */
  const handleAddColumn = () => {
    setCustomColumns([
      ...customColumns,
      { id: `col-${Date.now()}`, title: '', wipLimit: null }
    ])
  }

  /**
   * Removes a custom column
   */
  const handleRemoveColumn = (index) => {
    if (customColumns.length > 2) {
      setCustomColumns(customColumns.filter((_, i) => i !== index))
    }
  }

  /**
   * Updates a custom column
   */
  const handleUpdateColumn = (index, field, value) => {
    const updated = [...customColumns]
    updated[index] = { ...updated[index], [field]: value }
    setCustomColumns(updated)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Board</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="board-form">
          {/* Board name */}
          <div className="form-group">
            <label htmlFor="board-name">
              Board Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="board-name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              className={errors.name ? 'input-error' : ''}
              placeholder="Enter board name"
              maxLength={50}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Template selection */}
          <div className="form-group">
            <label>
              <input
                type="radio"
                checked={!isCustom}
                onChange={() => setIsCustom(false)}
              />
              Use Template
            </label>
            <label>
              <input
                type="radio"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
              />
              Custom Columns
            </label>
          </div>

          {!isCustom ? (
            /* Template selection */
            <div className="form-group">
              <label htmlFor="template-select">Template</label>
              <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="template-preview">
                  <strong>Columns:</strong>
                  <div className="template-columns">
                    {templates.find(t => t.id === selectedTemplate)?.columns.map(col => (
                      <span key={col.id} className="template-column-badge">
                        {col.title} {col.wipLimit && `(WIP: ${col.wipLimit})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Custom columns */
            <div className="form-group">
              <label>Custom Columns</label>
              {errors.columns && <span className="error-message">{errors.columns}</span>}
              {customColumns.map((column, index) => (
                <div key={index} className="custom-column-row">
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) => handleUpdateColumn(index, 'title', e.target.value)}
                    placeholder="Column name"
                    className={errors[`column-${index}`] ? 'input-error' : ''}
                  />
                  <input
                    type="number"
                    value={column.wipLimit || ''}
                    onChange={(e) => handleUpdateColumn(index, 'wipLimit', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="WIP Limit (optional)"
                    min="1"
                    className="wip-limit-input"
                  />
                  {customColumns.length > 2 && (
                    <button
                      type="button"
                      className="btn-remove-column"
                      onClick={() => handleRemoveColumn(index)}
                      aria-label="Remove column"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-add-column"
                onClick={handleAddColumn}
              >
                + Add Column
              </button>
            </div>
          )}

          {/* Form actions */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BoardForm
