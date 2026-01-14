import React from 'react'

/**
 * BulkActions Component
 * Toolbar for bulk operations on selected tasks
 * 
 * @param {Array} selectedTasks - Array of selected task IDs
 * @param {Function} onBulkDelete - Callback to delete selected tasks
 * @param {Function} onBulkMove - Callback to move selected tasks to a column
 * @param {Function} onBulkPriority - Callback to change priority of selected tasks
 * @param {Function} onBulkCategory - Callback to change category of selected tasks
 * @param {Array} columns - Array of column objects for move operation
 * @param {Function} onClearSelection - Callback to clear selection
 */
const BulkActions = ({
  selectedTasks,
  onBulkDelete,
  onBulkMove,
  onBulkPriority,
  onBulkCategory,
  columns,
  onClearSelection
}) => {
  if (selectedTasks.length === 0) return null

  const handleBulkMove = (columnId) => {
    onBulkMove(selectedTasks, columnId)
    onClearSelection()
  }

  const handleBulkPriority = (priority) => {
    onBulkPriority(selectedTasks, priority)
    onClearSelection()
  }

  const handleBulkCategory = (category) => {
    onBulkCategory(selectedTasks, category)
    onClearSelection()
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedTasks.length} task(s)?`)) {
      onBulkDelete(selectedTasks)
      onClearSelection()
    }
  }

  return (
    <div className="bulk-actions-bar">
      <div className="bulk-actions-info">
        <strong>{selectedTasks.length}</strong> task{selectedTasks.length !== 1 ? 's' : ''} selected
        <button
          className="btn-clear-selection"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          ×
        </button>
      </div>

      <div className="bulk-actions-buttons">
        {/* Move to column */}
        <div className="bulk-action-group">
          <label>Move to:</label>
          <select
            className="bulk-action-select"
            onChange={(e) => handleBulkMove(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Select column...</option>
            {columns.map(column => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
        </div>

        {/* Change priority */}
        <div className="bulk-action-group">
          <label>Priority:</label>
          <select
            className="bulk-action-select"
            onChange={(e) => handleBulkPriority(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Select priority...</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Change category */}
        <div className="bulk-action-group">
          <label>Category:</label>
          <select
            className="bulk-action-select"
            onChange={(e) => handleBulkCategory(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Select category...</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="shopping">Shopping</option>
            <option value="health">Health</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Delete */}
        <button
          className="btn-bulk-delete"
          onClick={handleBulkDelete}
          aria-label="Delete selected tasks"
        >
          🗑️ Delete Selected
        </button>
      </div>
    </div>
  )
}

export default BulkActions
