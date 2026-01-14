import React from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import Task from './Task'
import { checkWipLimit } from '../utils/boardUtils'

/**
 * Column Component
 * Represents a single column in the Kanban board
 * Handles the droppable area for drag-and-drop functionality
 * Supports WIP (Work In Progress) limits
 * 
 * @param {string} columnId - Unique identifier for the column
 * @param {string} title - Display title of the column
 * @param {number|null} wipLimit - Optional WIP limit for the column
 * @param {Array} tasks - Array of tasks belonging to this column
 * @param {Function} onEdit - Callback function to handle task editing
 * @param {Function} onDelete - Callback function to handle task deletion
 * @param {Array} selectedTasks - Array of selected task IDs for bulk operations
 * @param {Function} onToggleTaskSelect - Callback to toggle task selection
 * @param {Array} users - Array of all users (for displaying assigned users)
 */
const Column = ({ columnId, title, wipLimit, tasks, onEdit, onDelete, selectedTasks = [], onToggleTaskSelect, users = [] }) => {
  // Check WIP limit status
  const columnObj = { wipLimit }
  const wipStatus = checkWipLimit(columnObj, tasks)
  const isWipLimited = wipLimit !== null && wipLimit !== undefined

  return (
    <div className={`column ${wipStatus.isAtLimit ? 'wip-limit-reached' : ''}`}>
      {/* Column header with title, task count, and WIP limit */}
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
        <div className="column-count-container">
          {isWipLimited ? (
            <span className={`column-count ${wipStatus.isAtLimit ? 'wip-limit-exceeded' : ''}`}>
              {tasks.length}/{wipLimit}
            </span>
          ) : (
            <span className="column-count">{tasks.length}</span>
          )}
        </div>
      </div>
      
      {/* WIP limit warning */}
      {wipStatus.isAtLimit && (
        <div className="wip-limit-warning">
          ⚠️ {wipStatus.message}
        </div>
      )}
      
      {/* Droppable area for drag-and-drop */}
      {/* Droppable is a component from react-beautiful-dnd that creates a drop zone */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            // ref is required by react-beautiful-dnd to identify the droppable element
            ref={provided.innerRef}
            // provided.droppableProps contains necessary props for the droppable
            {...provided.droppableProps}
            // Add visual feedback when dragging over this column
            className={`column-tasks ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          >
            {/* Render each task in the column */}
            {/* Each task must be wrapped in a Draggable component for drag-and-drop */}
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.8 : 1
                    }}
                  >
                    <Task
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isSelected={selectedTasks.includes(task.id)}
                      onToggleSelect={onToggleTaskSelect}
                      users={users}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            
            {/* Placeholder that appears when dragging over empty column */}
            {provided.placeholder}
            
            {/* Empty state message when column has no tasks */}
            {tasks.length === 0 && (
              <div className="empty-column">
                <p>No tasks in this column</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}

export default Column
