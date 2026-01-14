import React, { useState, useEffect, useMemo } from 'react'
import KanbanBoard from './components/KanbanBoard'
import TaskForm from './components/TaskForm'
import SearchFilterBar from './components/SearchFilterBar'
import BoardSwitcher from './components/BoardSwitcher'
import BoardForm from './components/BoardForm'
import BoardStats from './components/BoardStats'
import { saveBoards, loadBoards, saveCurrentBoard, loadCurrentBoard, generateBoardId } from './utils/boardStorage'
import { generateId } from './utils/storage'
import { initialTasks } from './data/initialTasks'
import { defaultTemplate } from './utils/boardTemplates'
import { createBoardFromTemplate } from './utils/boardUtils'

/**
 * Main App Component
 * Manages multiple boards, tasks, and board operations
 * Handles data persistence with localStorage
 * Implements search, filter, and sort functionality
 */
function App() {
  // State for all boards
  const [boards, setBoards] = useState([])
  
  // State for current active board
  const [currentBoardId, setCurrentBoardId] = useState(null)
  
  // State for task form modal
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBoardFormOpen, setIsBoardFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  // Get current board object
  const currentBoard = useMemo(() => {
    return boards.find(board => board.id === currentBoardId) || null
  }, [boards, currentBoardId])

  // Get tasks from current board
  const tasks = useMemo(() => {
    return currentBoard ? (currentBoard.tasks || []) : []
  }, [currentBoard])

  /**
   * Migrates old task data to new board structure
   * This handles users upgrading from Phase 1/2 to Phase 3
   */
  const migrateOldData = () => {
    try {
      // Try to load old tasks
      const oldTasks = localStorage.getItem('kanban-tasks')
      if (oldTasks) {
        const parsedTasks = JSON.parse(oldTasks)
        if (parsedTasks.length > 0) {
          // Create a default board with old tasks
          const migratedBoard = createBoardFromTemplate('My Board', defaultTemplate)
          migratedBoard.tasks = parsedTasks
          migratedBoard.name = 'Migrated Board'
          
          // Save the migrated board
          const existingBoards = loadBoards()
          const updatedBoards = [...existingBoards, migratedBoard]
          saveBoards(updatedBoards)
          setBoards(updatedBoards)
          setCurrentBoardId(migratedBoard.id)
          saveCurrentBoard(migratedBoard.id)
          
          // Clear old storage
          localStorage.removeItem('kanban-tasks')
          return true
        }
      }
    } catch (error) {
      console.error('Error migrating old data:', error)
    }
    return false
  }

  /**
   * Initialize boards on component mount
   */
  useEffect(() => {
    const loadedBoards = loadBoards()
    const savedCurrentBoardId = loadCurrentBoard()

    if (loadedBoards.length === 0) {
      // No boards exist - check for old data or create default
      if (!migrateOldData()) {
        // Create default board with sample tasks
        const defaultBoard = createBoardFromTemplate('My First Board', defaultTemplate)
        defaultBoard.tasks = initialTasks
        const newBoards = [defaultBoard]
        saveBoards(newBoards)
        setBoards(newBoards)
        setCurrentBoardId(defaultBoard.id)
        saveCurrentBoard(defaultBoard.id)
      }
    } else {
      setBoards(loadedBoards)
      // Set current board to saved one, or first board
      const boardId = savedCurrentBoardId && loadedBoards.find(b => b.id === savedCurrentBoardId)
        ? savedCurrentBoardId
        : loadedBoards[0].id
      setCurrentBoardId(boardId)
      if (!savedCurrentBoardId) {
        saveCurrentBoard(boardId)
      }
    }
  }, [])

  /**
   * Save boards to localStorage whenever boards state changes
   */
  useEffect(() => {
    if (boards.length > 0) {
      saveBoards(boards)
    }
  }, [boards])

  /**
   * Update current board when switching
   */
  useEffect(() => {
    if (currentBoardId) {
      saveCurrentBoard(currentBoardId)
    }
  }, [currentBoardId])

  /**
   * Updates a specific board in the boards array
   * @param {string} boardId - ID of the board to update
   * @param {Function} updateFn - Function that receives board and returns updated board
   */
  const updateBoard = (boardId, updateFn) => {
    setBoards(prevBoards =>
      prevBoards.map(board =>
        board.id === boardId ? { ...updateFn(board), updatedAt: new Date().toISOString() } : board
      )
    )
  }

  /**
   * Opens the task form modal for creating a new task
   */
  const handleCreateTask = () => {
    if (!currentBoard) return
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
   * @param {Object} formData - Form data containing task information
   */
  const handleSubmitTask = (formData) => {
    if (!currentBoard) return

    updateBoard(currentBoardId, (board) => {
      const boardTasks = board.tasks || []
      
      if (editingTask) {
        // Update existing task
        return {
          ...board,
          tasks: boardTasks.map(task =>
            task.id === editingTask.id
              ? {
                  ...task,
                  ...formData,
                  updatedAt: new Date().toISOString()
                }
              : task
          )
        }
      } else {
        // Create new task - add to first column
        const firstColumn = board.columns[0]
        const newTask = {
          id: generateId(),
          ...formData,
          status: firstColumn ? firstColumn.id : 'todo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        return {
          ...board,
          tasks: [...boardTasks, newTask]
        }
      }
    })
    
    handleCloseForm()
  }

  /**
   * Deletes a task by ID
   * @param {string} taskId - ID of the task to delete
   */
  const handleDeleteTask = (taskId) => {
    if (!currentBoard) return
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      updateBoard(currentBoardId, (board) => ({
        ...board,
        tasks: (board.tasks || []).filter(task => task.id !== taskId)
      }))
    }
  }

  /**
   * Moves a task to a different column (changes status)
   * @param {string} taskId - ID of the task being moved
   * @param {string} newStatus - New status (column ID)
   */
  const handleTaskMove = (taskId, newStatus) => {
    if (!currentBoard) return

    updateBoard(currentBoardId, (board) => ({
      ...board,
      tasks: (board.tasks || []).map(task =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          : task
      )
    }))
  }

  /**
   * Handles board switching
   * @param {string} boardId - ID of the board to switch to
   */
  const handleBoardChange = (boardId) => {
    setCurrentBoardId(boardId)
    // Reset filters when switching boards
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedPriority('all')
  }

  /**
   * Handles board creation
   * @param {Object} newBoard - New board object
   */
  const handleCreateBoard = (newBoard) => {
    const boardWithId = {
      ...newBoard,
      id: generateBoardId()
    }
    setBoards(prevBoards => [...prevBoards, boardWithId])
    setCurrentBoardId(boardWithId.id)
    setIsBoardFormOpen(false)
  }

  /**
   * Handles board archiving/unarchiving
   * @param {string} boardId - ID of the board to archive/unarchive
   */
  const handleArchiveBoard = (boardId) => {
    updateBoard(boardId, (board) => ({
      ...board,
      isArchived: !board.isArchived
    }))
    
    // If archiving current board, switch to first active board
    if (boardId === currentBoardId) {
      const activeBoards = boards.filter(b => !b.isArchived && b.id !== boardId)
      if (activeBoards.length > 0) {
        setCurrentBoardId(activeBoards[0].id)
      }
    }
  }

  /**
   * Handles board deletion
   * @param {string} boardId - ID of the board to delete
   */
  const handleDeleteBoard = (boardId) => {
    setBoards(prevBoards => {
      const updated = prevBoards.filter(board => board.id !== boardId)
      
      // If deleting current board, switch to first available board
      if (boardId === currentBoardId) {
        if (updated.length > 0) {
          setCurrentBoardId(updated[0].id)
        } else {
          setCurrentBoardId(null)
        }
      }
      
      return updated
    })
  }

  /**
   * Filters and sorts tasks based on current search, filter, and sort settings
   */
  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return []
    
    let filtered = [...tasks]

    // Apply search filter
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
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate) - new Date(b.dueDate)
        
        case 'title':
          return a.title.localeCompare(b.title)
        
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt)
        
        default:
          return 0
      }
    })

    return filtered
  }, [tasks, searchQuery, selectedCategory, selectedPriority, sortBy])

  // Show message if no boards exist
  if (boards.length === 0) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Kanban Project Management</h1>
        </header>
        <main className="app-main">
          <div className="no-boards-message">
            <p>No boards available. Creating default board...</p>
          </div>
        </main>
      </div>
    )
  }

  // Show message if no current board
  if (!currentBoard) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Kanban Project Management</h1>
        </header>
        <main className="app-main">
          <div className="no-boards-message">
            <p>Please select a board to continue.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      {/* App header */}
      <header className="app-header">
        <div className="app-header-left">
          <h1>Kanban Project Management</h1>
          <BoardSwitcher
            boards={boards}
            currentBoardId={currentBoardId}
            onBoardChange={handleBoardChange}
            onCreateBoard={() => setIsBoardFormOpen(true)}
            onArchiveBoard={handleArchiveBoard}
            onDeleteBoard={handleDeleteBoard}
          />
        </div>
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

      {/* Main content area */}
      <main className="app-main">
        <div className="app-main-content">
          {/* Kanban board */}
          <div className="board-container">
            <KanbanBoard
              tasks={filteredAndSortedTasks}
              columns={currentBoard.columns}
              onTaskMove={handleTaskMove}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </div>

          {/* Board statistics sidebar */}
          <aside className="board-sidebar">
            <BoardStats board={currentBoard} />
          </aside>
        </div>
      </main>

      {/* Task form modal */}
      <TaskForm
        task={editingTask}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitTask}
      />

      {/* Board form modal */}
      <BoardForm
        isOpen={isBoardFormOpen}
        onClose={() => setIsBoardFormOpen(false)}
        onSubmit={handleCreateBoard}
      />
    </div>
  )
}

export default App
