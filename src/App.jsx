import React, { useState, useEffect, useMemo, useRef } from 'react'
import KanbanBoard from './components/KanbanBoard'
import TaskForm from './components/TaskForm'
import SearchFilterBar from './components/SearchFilterBar'
import BoardSwitcher from './components/BoardSwitcher'
import BoardForm from './components/BoardForm'
import BoardStats from './components/BoardStats'
import ThemeToggle from './components/ThemeToggle'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import BulkActions from './components/BulkActions'
import ExportImport from './components/ExportImport'
import PrintView from './components/PrintView'
import LoginForm from './components/LoginForm'
import UserProfile from './components/UserProfile'
import ActivityLog from './components/ActivityLog'
import NotificationsPanel from './components/NotificationsPanel'
import NotificationButton from './components/NotificationButton'
import BoardSharing from './components/BoardSharing'
import CalendarView from './components/CalendarView'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import { saveBoards, loadBoards, saveCurrentBoard, loadCurrentBoard, generateBoardId } from './utils/boardStorage'
import { generateId } from './utils/storage'
import { initialTasks } from './data/initialTasks'
import { defaultTemplate } from './utils/boardTemplates'
import { createBoardFromTemplate } from './utils/boardUtils'
import { getTheme, applyTheme } from './utils/theme'
import { createHistoryManager } from './utils/undoRedo'
import { loadCurrentUser, loadUsers } from './utils/userStorage'
import { createActivityEntry } from './utils/activityLog'
import { createNotification, saveNotifications, loadNotifications, getUnreadCount } from './utils/notifications'
import { getUserBoardPermission, PERMISSIONS } from './utils/boardPermissions'

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

  // Phase 4: State for new features
  const [selectedTasks, setSelectedTasks] = useState([])
  const [isExportImportOpen, setIsExportImportOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const searchInputRef = useRef(null)

  // Phase 5: State for collaboration features
  const [currentUser, setCurrentUser] = useState(null)
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isBoardSharingOpen, setIsBoardSharingOpen] = useState(false)
  const [boardActivities, setBoardActivities] = useState([])
  
  // Phase 6: State for view switching
  const [currentView, setCurrentView] = useState('kanban') // 'kanban', 'calendar', 'analytics'

  // Undo/Redo history manager
  const historyManager = useRef(createHistoryManager(50))

  // Get all users
  const allUsers = useMemo(() => loadUsers(), [])

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
   * Initialize theme on component mount
   */
  useEffect(() => {
    const theme = getTheme()
    applyTheme(theme)
  }, [])

  /**
   * Initialize user authentication on component mount
   */
  useEffect(() => {
    const savedUser = loadCurrentUser()
    if (savedUser) {
      setCurrentUser(savedUser)
    }
  }, [])

  /**
   * Initialize boards on component mount
   */
  useEffect(() => {
    // Only load boards if user is logged in
    if (!currentUser) return

    const loadedBoards = loadBoards()
    const savedCurrentBoardId = loadCurrentBoard()

    // Filter boards based on user permissions
    const accessibleBoards = loadedBoards.filter(board => {
      // User owns the board
      if (board.ownerId === currentUser.id) return true
      // Board is shared with user
      if (board.sharedUsers && board.sharedUsers.some(su => su.userId === currentUser.id)) return true
      // Legacy boards without owner (assign to current user)
      if (!board.ownerId) {
        board.ownerId = currentUser.id
        return true
      }
      return false
    })

    // Initialize history with loaded boards
    if (accessibleBoards.length > 0) {
      historyManager.current.push(accessibleBoards)
    }

    if (accessibleBoards.length === 0) {
      // No boards exist - check for old data or create default
      if (!migrateOldData()) {
        // Create default board with sample tasks
        const defaultBoard = createBoardFromTemplate('My First Board', defaultTemplate)
        defaultBoard.tasks = initialTasks
        defaultBoard.ownerId = currentUser.id
        defaultBoard.activities = []
        const newBoards = [defaultBoard]
        saveBoards(newBoards)
        setBoards(newBoards)
        setCurrentBoardId(defaultBoard.id)
        saveCurrentBoard(defaultBoard.id)
      }
    } else {
      setBoards(accessibleBoards)
      // Set current board to saved one, or first board
      const boardId = savedCurrentBoardId && accessibleBoards.find(b => b.id === savedCurrentBoardId)
        ? savedCurrentBoardId
        : accessibleBoards[0].id
      setCurrentBoardId(boardId)
      if (!savedCurrentBoardId) {
        saveCurrentBoard(boardId)
      }
    }
  }, [currentUser])

  /**
   * Save boards to localStorage whenever boards state changes
   * Also update history for undo/redo
   */
  useEffect(() => {
    if (boards.length > 0) {
      saveBoards(boards)
      // Don't push to history on initial load
      if (historyManager.current.getCurrent() !== null) {
        historyManager.current.push(boards)
      }
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
    setBoards(prevBoards => {
      const updated = prevBoards.map(board =>
        board.id === boardId ? { ...updateFn(board), updatedAt: new Date().toISOString() } : board
      )
      // Update history after state update
      setTimeout(() => {
        historyManager.current.push(updated)
      }, 0)
      return updated
    })
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
    if (!currentBoard || !currentUser) return

    updateBoard(currentBoardId, (board) => {
      const boardTasks = board.tasks || []
      const activities = board.activities || []
      
      if (editingTask) {
        // Update existing task
        const oldTask = boardTasks.find(t => t.id === editingTask.id)
        const updatedTask = {
          ...editingTask,
          ...formData,
          updatedAt: new Date().toISOString()
        }
        
        // Log activity
        const activity = createActivityEntry(
          currentUser.id,
          currentUser.name,
          'updated',
          'task',
          updatedTask.id,
          updatedTask.title
        )
        
        // Check if assignment changed
        if (formData.assignedTo !== oldTask.assignedTo) {
          if (formData.assignedTo) {
            const assignedUser = allUsers.find(u => u.id === formData.assignedTo)
            // Create notification for assigned user
            if (assignedUser) {
              const notification = createNotification(
                formData.assignedTo,
                'task_assigned',
                'Task Assigned',
                `${currentUser.name} assigned you to task "${updatedTask.title}"`,
                updatedTask.id
              )
              const userNotifications = loadNotifications(formData.assignedTo)
              saveNotifications(formData.assignedTo, [...userNotifications, notification])
            }
          }
        }
        
        return {
          ...board,
          tasks: boardTasks.map(task =>
            task.id === editingTask.id ? updatedTask : task
          ),
          activities: [...activities, activity]
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
        
        // Log activity
        const activity = createActivityEntry(
          currentUser.id,
          currentUser.name,
          'created',
          'task',
          newTask.id,
          newTask.title
        )
        
        // Create notification if task is assigned
        if (formData.assignedTo) {
          const assignedUser = allUsers.find(u => u.id === formData.assignedTo)
          if (assignedUser) {
            const notification = createNotification(
              formData.assignedTo,
              'task_assigned',
              'Task Assigned',
              `${currentUser.name} assigned you to task "${newTask.title}"`,
              newTask.id
            )
            const userNotifications = loadNotifications(formData.assignedTo)
            saveNotifications(formData.assignedTo, [...userNotifications, notification])
          }
        }
        
        return {
          ...board,
          tasks: [...boardTasks, newTask],
          activities: [...activities, activity]
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
    if (!currentBoard || !currentUser) return
    
    const task = currentBoard.tasks?.find(t => t.id === taskId)
    if (!task) return
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      updateBoard(currentBoardId, (board) => {
        const activities = board.activities || []
        const activity = createActivityEntry(
          currentUser.id,
          currentUser.name,
          'deleted',
          'task',
          taskId,
          task.title
        )
        
        return {
          ...board,
          tasks: (board.tasks || []).filter(task => task.id !== taskId),
          activities: [...activities, activity]
        }
      })
    }
  }

  /**
   * Moves a task to a different column (changes status)
   * @param {string} taskId - ID of the task being moved
   * @param {string} newStatus - New status (column ID)
   */
  const handleTaskMove = (taskId, newStatus) => {
    if (!currentBoard || !currentUser) return

    const task = currentBoard.tasks?.find(t => t.id === taskId)
    if (!task) return

    const oldColumn = currentBoard.columns.find(col => col.id === task.status)
    const newColumn = currentBoard.columns.find(col => col.id === newStatus)

    updateBoard(currentBoardId, (board) => {
      const activities = board.activities || []
      const activity = createActivityEntry(
        currentUser.id,
        currentUser.name,
        'moved',
        'task',
        taskId,
        task.title,
        {
          from: oldColumn?.title || task.status,
          to: newColumn?.title || newStatus
        }
      )
      
      return {
        ...board,
        tasks: (board.tasks || []).map(t =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                updatedAt: new Date().toISOString()
              }
            : t
        ),
        activities: [...activities, activity]
      }
    })
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
      id: generateBoardId(),
      ownerId: currentUser?.id || null,
      activities: [],
      sharedUsers: []
    }
    
    // Add activity log entry
    if (currentUser) {
      const activity = createActivityEntry(
        currentUser.id,
        currentUser.name,
        'created',
        'board',
        boardWithId.id,
        boardWithId.name
      )
      boardWithId.activities = [activity]
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
      
      // Update history
      setTimeout(() => {
        historyManager.current.push(updated)
      }, 0)
      
      return updated
    })
  }

  /**
   * Phase 4: Undo last action
   */
  const handleUndo = () => {
    const previousState = historyManager.current.undo()
    if (previousState) {
      setBoards(previousState)
    }
  }

  /**
   * Phase 4: Redo last undone action
   */
  const handleRedo = () => {
    const nextState = historyManager.current.redo()
    if (nextState) {
      setBoards(nextState)
    }
  }

  /**
   * Phase 4: Toggle task selection for bulk operations
   */
  const handleToggleTaskSelect = (taskId) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  /**
   * Phase 4: Clear task selection
   */
  const handleClearSelection = () => {
    setSelectedTasks([])
  }

  /**
   * Phase 4: Bulk delete tasks
   */
  const handleBulkDelete = (taskIds) => {
    if (!currentBoard) return
    updateBoard(currentBoardId, (board) => ({
      ...board,
      tasks: (board.tasks || []).filter(task => !taskIds.includes(task.id))
    }))
  }

  /**
   * Phase 4: Bulk move tasks to column
   */
  const handleBulkMove = (taskIds, columnId) => {
    if (!currentBoard) return
    updateBoard(currentBoardId, (board) => ({
      ...board,
      tasks: (board.tasks || []).map(task =>
        taskIds.includes(task.id)
          ? { ...task, status: columnId, updatedAt: new Date().toISOString() }
          : task
      )
    }))
  }

  /**
   * Phase 4: Bulk change priority
   */
  const handleBulkPriority = (taskIds, priority) => {
    if (!currentBoard) return
    updateBoard(currentBoardId, (board) => ({
      ...board,
      tasks: (board.tasks || []).map(task =>
        taskIds.includes(task.id)
          ? { ...task, priority, updatedAt: new Date().toISOString() }
          : task
      )
    }))
  }

  /**
   * Phase 4: Bulk change category
   */
  const handleBulkCategory = (taskIds, category) => {
    if (!currentBoard) return
    updateBoard(currentBoardId, (board) => ({
      ...board,
      tasks: (board.tasks || []).map(task =>
        taskIds.includes(task.id)
          ? { ...task, category, updatedAt: new Date().toISOString() }
          : task
      )
    }))
  }

  /**
   * Phase 4: Handle import boards
   */
  const handleImportBoards = (importedBoards) => {
    setBoards(prevBoards => [...prevBoards, ...importedBoards])
  }

  /**
   * Phase 4: Focus search input
   */
  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  /**
   * Phase 5: Handles user login
   */
  const handleLogin = (user) => {
    setCurrentUser(user)
    // Reload boards after login
    const loadedBoards = loadBoards()
    const accessibleBoards = loadedBoards.filter(board => {
      if (board.ownerId === user.id) return true
      if (board.sharedUsers && board.sharedUsers.some(su => su.userId === user.id)) return true
      if (!board.ownerId) {
        board.ownerId = user.id
        return true
      }
      return false
    })
    setBoards(accessibleBoards)
    if (accessibleBoards.length > 0) {
      setCurrentBoardId(accessibleBoards[0].id)
      saveCurrentBoard(accessibleBoards[0].id)
    }
  }

  /**
   * Phase 5: Handles user logout
   */
  const handleLogout = () => {
    setCurrentUser(null)
    setBoards([])
    setCurrentBoardId(null)
  }

  /**
   * Phase 5: Handles user profile update
   */
  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser)
  }

  /**
   * Phase 5: Handles board sharing
   */
  const handleBoardShare = (updatedBoard) => {
    updateBoard(currentBoardId, () => updatedBoard)
    
    // Create notifications for newly shared users
    if (currentUser && updatedBoard.sharedUsers) {
      updatedBoard.sharedUsers.forEach(sharedUser => {
        const notification = createNotification(
          sharedUser.userId,
          'board_shared',
          'Board Shared',
          `${currentUser.name} shared board "${updatedBoard.name}" with you`,
          updatedBoard.id,
          { permission: sharedUser.permission }
        )
        const userNotifications = loadNotifications(sharedUser.userId)
        saveNotifications(sharedUser.userId, [...userNotifications, notification])
      })
    }
  }

  /**
   * Phase 5: Update board activities when board changes
   */
  useEffect(() => {
    if (currentBoard) {
      setBoardActivities(currentBoard.activities || [])
    }
  }, [currentBoard])

  /**
   * Phase 5: Get user's permission for current board
   */
  const userBoardPermission = useMemo(() => {
    if (!currentBoard || !currentUser) return null
    return getUserBoardPermission(currentBoard, currentUser.id)
  }, [currentBoard, currentUser])

  /**
   * Phase 5: Check if user can edit
   */
  const canEdit = useMemo(() => {
    if (!userBoardPermission) return false
    return userBoardPermission === PERMISSIONS.OWNER || userBoardPermission === PERMISSIONS.EDITOR
  }, [userBoardPermission])

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

  // Phase 5: Show login form if user is not logged in
  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Show message if no boards exist
  if (boards.length === 0 && currentUser) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="app-header-left">
            <h1>Kanban Project Management</h1>
          </div>
          <div className="app-header-right">
            <UserProfile
              currentUser={currentUser}
              onLogout={handleLogout}
              onUpdate={handleUserUpdate}
            />
          </div>
        </header>
        <main className="app-main">
          <div className="no-boards-message">
            <p>No boards available. Create your first board!</p>
            <button className="btn-create" onClick={() => setIsBoardFormOpen(true)}>
              + Create Board
            </button>
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
          <div className="app-header-left">
            <h1>Kanban Project Management</h1>
          </div>
          <div className="app-header-right">
            <UserProfile
              currentUser={currentUser}
              onLogout={handleLogout}
              onUpdate={handleUserUpdate}
            />
          </div>
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
        <div className="app-header-right">
          <ThemeToggle />
          {/* Phase 5: Activity log button */}
          <button
            className="btn-icon"
            onClick={() => setIsActivityLogOpen(true)}
            title="Activity log"
            aria-label="Activity log"
          >
            📋
          </button>
          {/* Phase 5: Notifications button */}
          <NotificationButton
            userId={currentUser?.id}
            onClick={() => setIsNotificationsOpen(true)}
          />
          {/* Phase 5: Board sharing button (only for owners/editors) */}
          {canEdit && (
            <button
              className="btn-icon"
              onClick={() => setIsBoardSharingOpen(true)}
              title="Share board"
              aria-label="Share board"
            >
              👥
            </button>
          )}
          <button
            className="btn-icon"
            onClick={() => setIsPrintViewOpen(true)}
            title="Print view"
            aria-label="Print view"
          >
            🖨️
          </button>
          <button
            className="btn-icon"
            onClick={() => setIsExportImportOpen(true)}
            title="Export/Import"
            aria-label="Export/Import"
          >
            📥
          </button>
          {canEdit && (
            <button className="btn-create" onClick={handleCreateTask}>
              + Create Task
            </button>
          )}
          {/* Phase 5: User profile */}
          <UserProfile
            currentUser={currentUser}
            onLogout={handleLogout}
            onUpdate={handleUserUpdate}
          />
        </div>
      </header>

      {/* View switcher */}
      <div className="view-switcher">
        <button
          className={`view-btn ${currentView === 'kanban' ? 'active' : ''}`}
          onClick={() => setCurrentView('kanban')}
        >
          📋 Kanban
        </button>
        <button
          className={`view-btn ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => setCurrentView('calendar')}
        >
          📅 Calendar
        </button>
        <button
          className={`view-btn ${currentView === 'analytics' ? 'active' : ''}`}
          onClick={() => setCurrentView('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {/* Search and filter bar (only show for kanban view) */}
      {currentView === 'kanban' && (
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
            searchInputRef={searchInputRef}
          />
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedTasks.length > 0 && (
        <BulkActions
          selectedTasks={selectedTasks}
          onBulkDelete={handleBulkDelete}
          onBulkMove={handleBulkMove}
          onBulkPriority={handleBulkPriority}
          onBulkCategory={handleBulkCategory}
          columns={currentBoard?.columns || []}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Main content area */}
      <main className="app-main">
        {currentView === 'kanban' && (
          <div className="app-main-content">
            {/* Kanban board */}
            <div className="board-container">
              <KanbanBoard
                tasks={filteredAndSortedTasks}
                columns={currentBoard.columns}
                onTaskMove={handleTaskMove}
                onEdit={canEdit ? handleEditTask : null}
                onDelete={canEdit ? handleDeleteTask : null}
                selectedTasks={selectedTasks}
                onToggleTaskSelect={canEdit ? handleToggleTaskSelect : null}
                users={allUsers}
                currentUser={currentUser}
                canEdit={canEdit}
              />
            </div>

            {/* Board statistics sidebar */}
            <aside className="board-sidebar">
              <BoardStats board={currentBoard} />
            </aside>
          </div>
        )}
        
        {currentView === 'calendar' && (
          <div className="calendar-container">
            <CalendarView
              tasks={tasks}
              onTaskClick={canEdit ? handleEditTask : null}
            />
          </div>
        )}
        
        {currentView === 'analytics' && (
          <div className="analytics-container">
            <AnalyticsDashboard
              tasks={tasks}
              boards={boards}
            />
          </div>
        )}
      </main>

      {/* Task form modal */}
      <TaskForm
        task={editingTask}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitTask}
        users={allUsers}
        currentUser={currentUser}
        allTasks={tasks}
      />

      {/* Board form modal */}
      <BoardForm
        isOpen={isBoardFormOpen}
        onClose={() => setIsBoardFormOpen(false)}
        onSubmit={handleCreateBoard}
      />

      {/* Export/Import modal */}
      <ExportImport
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        boards={boards}
        onImport={handleImportBoards}
      />

      {/* Print view */}
      <PrintView
        board={currentBoard}
        isOpen={isPrintViewOpen}
        onClose={() => setIsPrintViewOpen(false)}
      />

      {/* Phase 5: Activity log modal */}
      <ActivityLog
        activities={boardActivities}
        users={allUsers}
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
      />

      {/* Phase 5: Notifications panel */}
      <NotificationsPanel
        userId={currentUser?.id}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNotificationClick={(notification) => {
          // Handle notification click (e.g., navigate to task/board)
          setIsNotificationsOpen(false)
        }}
      />

      {/* Phase 5: Board sharing modal */}
      <BoardSharing
        isOpen={isBoardSharingOpen}
        onClose={() => setIsBoardSharingOpen(false)}
        board={currentBoard}
        currentUser={currentUser}
        onShare={handleBoardShare}
      />

      {/* Keyboard shortcuts handler */}
      <KeyboardShortcuts
        shortcuts={{
          onCreateTask: canEdit ? handleCreateTask : null,
          onSearch: handleFocusSearch,
          onUndo: handleUndo,
          onRedo: handleRedo,
          onCloseModal: () => {
            if (isFormOpen) handleCloseForm()
            if (isBoardFormOpen) setIsBoardFormOpen(false)
            if (isExportImportOpen) setIsExportImportOpen(false)
            if (isPrintViewOpen) setIsPrintViewOpen(false)
            if (isActivityLogOpen) setIsActivityLogOpen(false)
            if (isNotificationsOpen) setIsNotificationsOpen(false)
            if (isBoardSharingOpen) setIsBoardSharingOpen(false)
          }
        }}
      />
    </div>
  )
}

export default App
