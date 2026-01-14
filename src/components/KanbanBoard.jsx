import React from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import Column from './Column'

/**
 * KanbanBoard Component
 * Main container for the Kanban board with drag-and-drop functionality
 * Supports custom columns with WIP limits
 * 
 * @param {Array} tasks - Array of all tasks
 * @param {Array} columns - Array of column objects with id, title, and optional wipLimit
 * @param {Function} onTaskMove - Callback function when a task is moved between columns
 * @param {Function} onEdit - Callback function to handle task editing
 * @param {Function} onDelete - Callback function to handle task deletion
 * @param {Array} selectedTasks - Array of selected task IDs for bulk operations
 * @param {Function} onToggleTaskSelect - Callback to toggle task selection
 */
const KanbanBoard = ({ tasks, columns, onTaskMove, onEdit, onDelete, selectedTasks = [], onToggleTaskSelect }) => {
  // Default columns if none provided (backward compatibility)
  const boardColumns = columns || [
    { id: 'todo', title: 'To Do', wipLimit: null },
    { id: 'in-progress', title: 'In Progress', wipLimit: null },
    { id: 'done', title: 'Done', wipLimit: null }
  ]

  // Filter tasks by status for each column
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status)
  }

  /**
   * Handles the end of a drag operation
   * Updates the task status when moved between columns
   * 
   * @param {Object} result - Result object from react-beautiful-dnd containing drag information
   */
  const handleDragEnd = (result) => {
    // result.destination is null if dropped outside a valid drop zone
    if (!result.destination) {
      return
    }

    // result.source contains information about where the drag started
    // result.destination contains information about where it was dropped
    const { source, destination, draggableId } = result

    // If dropped in the same position, no update needed
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    // Get the new status based on the destination column ID
    // Column ID becomes the task status
    const newStatus = destination.droppableId

    // Call the parent's onTaskMove function to update the task
    onTaskMove(draggableId, newStatus)
  }

  return (
    <div className="kanban-board">
      {/* DragDropContext wraps the entire board and handles drag-and-drop logic */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="columns-container">
          {/* Render each column */}
          {boardColumns.map(column => (
            <Column
              key={column.id}
              columnId={column.id}
              title={column.title}
              wipLimit={column.wipLimit}
              tasks={getTasksByStatus(column.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              selectedTasks={selectedTasks}
              onToggleTaskSelect={onToggleTaskSelect}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default KanbanBoard
