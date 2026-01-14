import React from 'react'
import { DragDropContext } from 'react-beautiful-dnd'
import Column from './Column'

/**
 * KanbanBoard Component
 * Main container for the Kanban board with drag-and-drop functionality
 * Manages three columns: To Do, In Progress, and Done
 * 
 * @param {Array} tasks - Array of all tasks
 * @param {Function} onTaskMove - Callback function when a task is moved between columns
 * @param {Function} onEdit - Callback function to handle task editing
 * @param {Function} onDelete - Callback function to handle task deletion
 */
const KanbanBoard = ({ tasks, onTaskMove, onEdit, onDelete }) => {
  // Column configuration - defines the three columns of the Kanban board
  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
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

    // Map column IDs to status values
    const statusMap = {
      'todo': 'todo',
      'in-progress': 'in-progress',
      'done': 'done'
    }

    // Get the new status based on the destination column
    const newStatus = statusMap[destination.droppableId]

    // Call the parent's onTaskMove function to update the task
    onTaskMove(draggableId, newStatus)
  }

  return (
    <div className="kanban-board">
      {/* DragDropContext wraps the entire board and handles drag-and-drop logic */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="columns-container">
          {/* Render each column */}
          {columns.map(column => (
            <Column
              key={column.id}
              columnId={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default KanbanBoard
