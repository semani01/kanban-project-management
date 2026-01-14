import React, { useState, useEffect } from 'react'
import KanbanBoard from './components/KanbanBoard'
import TaskForm from './components/TaskForm'
import { saveTasks, loadTasks, generateId } from './utils/storage'
import { initialTasks } from './data/initialTasks'

/**
 * Main App Component
 * Manages global application state and task CRUD operations
 * Handles data persistence with localStorage
 */
function App() {
  // State for all tasks
  const [tasks, setTasks] = useState([])
  
  // State for task form modal
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  /**
   * Load tasks from localStorage on component mount
   * If no tasks exist, initialize with sample tasks
   */
  useEffect(() => {
    const loadedTasks = loadTasks()
    
    // If localStorage is empty, use initial sample tasks
    if (loadedTasks.length === 0) {
      setTasks(initialTasks)
      saveTasks(initialTasks)
    } else {
      setTasks(loadedTasks)
    }
  }, [])

  /**
   * Save tasks to localStorage whenever tasks state changes
   */
  useEffect(() => {
    if (tasks.length > 0 || loadTasks().length > 0) {
      saveTasks(tasks)
    }
  }, [tasks])

  /**
   * Opens the task form modal for creating a new task
   */
  const handleCreateTask = () => {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  /**
   * Opens the task form modal for editing an existing task
   * @param {Object} task - Task object to edit
   */
  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  /**
   * Closes the task form modal
   */
  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingTask(null)
  }

  /**
   * Handles form submission for both creating and updating tasks
   * @param {Object} formData - Form data containing title, description, and priority
   */
  const handleSubmitTask = (formData) => {
    if (editingTask) {
      // Update existing task
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingTask.id
            ? {
                ...task,
                ...formData,
                updatedAt: new Date().toISOString()
              }
            : task
        )
      )
    } else {
      // Create new task
      const newTask = {
        id: generateId(),
        ...formData,
        status: 'todo', // New tasks always start in "To Do" column
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setTasks(prevTasks => [...prevTasks, newTask])
    }
    
    // Close the form after submission
    handleCloseForm()
  }

  /**
   * Deletes a task by ID
   * @param {string} taskId - ID of the task to delete
   */
  const handleDeleteTask = (taskId) => {
    // Confirm deletion with user
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    }
  }

  /**
   * Moves a task to a different column (changes status)
   * Called when a task is dragged and dropped to a new column
   * @param {string} taskId - ID of the task being moved
   * @param {string} newStatus - New status (todo, in-progress, or done)
   */
  const handleTaskMove = (taskId, newStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          : task
      )
    )
  }

  return (
    <div className="app">
      {/* App header */}
      <header className="app-header">
        <h1>Kanban Project Management</h1>
        <button className="btn-create" onClick={handleCreateTask}>
          + Create Task
        </button>
      </header>

      {/* Main Kanban board */}
      <main className="app-main">
        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      </main>

      {/* Task form modal */}
      <TaskForm
        task={editingTask}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitTask}
      />
    </div>
  )
}

export default App
