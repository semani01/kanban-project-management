import React from 'react'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import Task from './Task'

/**
 * Column Component
 * Represents a single column in the Kanban board (To Do, In Progress, or Done)
 * Handles the droppable area for drag-and-drop functionality
 * 
 * @param {string} columnId - Unique identifier for the column (todo, in-progress, done)
 * @param {string} title - Display title of the column
 * @param {Array} tasks - Array of tasks belonging to this column
 * @param {Function} onEdit - Callback function to handle task editing
 * @param {Function} onDelete - Callback function to handle task deletion
 */
const Column = ({ columnId, title, tasks, onEdit, onDelete }) => {
  return (
    <div className="column">
      {/* Column header with title and task count */}
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
        <span className="column-count">{tasks.length}</span>
      </div>
      
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
