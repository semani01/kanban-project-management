import React from 'react'
import { formatDate } from '../utils/dateUtils'
import { getCategoryById } from '../utils/categories'

/**
 * PrintView Component
 * Print-friendly view of the board
 * 
 * @param {Object} board - Board object to print
 * @param {boolean} isOpen - Whether print view is visible
 * @param {Function} onClose - Callback to close print view
 */
const PrintView = ({ board, isOpen, onClose }) => {
  if (!isOpen || !board) return null

  const tasks = board.tasks || []
  const columns = board.columns || []

  /**
   * Triggers browser print dialog
   */
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <div className="print-view-controls">
        <button className="btn-print" onClick={handlePrint}>
          🖨️ Print
        </button>
        <button className="btn-close-print" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="print-view-content">
        <div className="print-header">
          <h1>{board.name}</h1>
          <p className="print-date">Printed: {new Date().toLocaleString()}</p>
        </div>

        <div className="print-columns">
          {columns.map(column => {
            const columnTasks = tasks.filter(task => task.status === column.id)
            return (
              <div key={column.id} className="print-column">
                <h2 className="print-column-title">{column.title}</h2>
                {columnTasks.length === 0 ? (
                  <p className="print-empty">No tasks</p>
                ) : (
                  <div className="print-tasks">
                    {columnTasks.map(task => {
                      const category = task.category ? getCategoryById(task.category) : null
                      return (
                        <div key={task.id} className="print-task">
                          <div className="print-task-header">
                            <h3>{task.title}</h3>
                            <div className="print-task-badges">
                              <span className={`print-priority ${task.priority}`}>
                                {task.priority}
                              </span>
                              {category && (
                                <span className="print-category">
                                  {category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="print-task-description">{task.description}</p>
                          )}
                          {task.dueDate && (
                            <p className="print-task-due">
                              Due: {formatDate(task.dueDate)}
                            </p>
                          )}
                          {task.comments && task.comments.length > 0 && (
                            <div className="print-task-comments">
                              <strong>Comments ({task.comments.length}):</strong>
                              {task.comments.map(comment => (
                                <p key={comment.id} className="print-comment">
                                  {comment.text}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default PrintView
