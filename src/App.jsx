import React, { useState, useEffect, useMemo } from 'react'
import KanbanBoard from './components/KanbanBoard'
import TaskForm from './components/TaskForm'
import SearchFilterBar from './components/SearchFilterBar'
import { saveTasks, loadTasks, generateId } from './utils/storage'
import { initialTasks } from './data/initialTasks'

/**
 * Main App Component
 * Manages global application state and task CRUD operations
 * Handles data persistence with localStorage
 * Implements search, filter, and sort functionality
 */
function App() {
  // State for all tasks
  const [tasks, setTasks] = useState([])
  
  // State for task form modal
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

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

  /**
   * Filters and sorts tasks based on current search, filter, and sort settings
   * Uses useMemo to optimize performance and only recalculate when dependencies change
   */
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]

    // Apply search filter (searches in title and description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory)
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === selectedPriority)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          // Sort by priority: high > medium > low
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        
        case 'dueDate':
          // Sort by due date (earliest first, nulls last)
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate) - new Date(b.dueDate)
        
        case 'title':
          // Sort alphabetically by title
          return a.title.localeCompare(b.title)
        
        case 'created':
          // Sort by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt)
        
        default:
          return 0
      }
    })

    return filtered
  }, [tasks, searchQuery, selectedCategory, selectedPriority, sortBy])

  return (
    <div className="app">
      {/* App header */}
      <header className="app-header">
        <h1>Kanban Project Management</h1>
        <button className="btn-create" onClick={handleCreateTask}>
          + Create Task
        </button>
      </header>

      {/* Search and filter bar */}
      <div className="app-filters">
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Main Kanban board */}
      <main className="app-main">
        <KanbanBoard
          tasks={filteredAndSortedTasks}
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
