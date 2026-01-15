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
import AutomationRules from './components/AutomationRules'
import RecurringTasks from './components/RecurringTasks'
import AdvancedSearch from './components/AdvancedSearch'
import CustomFields from './components/CustomFields'
import LoadingSpinner from './components/LoadingSpinner'
import LoadingSkeleton from './components/LoadingSkeleton'
import { generateId } from './utils/storage'
import { initialTasks } from './data/initialTasks'
import { defaultTemplate } from './utils/boardTemplates'
import { createBoardFromTemplate } from './utils/boardUtils'
import { getTheme, applyTheme } from './utils/theme'
import { createHistoryManager } from './utils/undoRedo'
import { getCurrentUser, setCurrentUser, authAPI } from './services/api'
import api from './services/api'
import { getUserBoardPermission, PERMISSIONS } from './utils/boardPermissions'
import { processAutomations } from './utils/automation'
// Phase 8: Recurring tasks generation handled by backend
import { applyFilter } from './utils/advancedSearch'
import { logEnvironmentWarnings } from './utils/envValidation'

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
  
  // Phase 7: State for automation and advanced features
  const [isAutomationOpen, setIsAutomationOpen] = useState(false)
  const [isRecurringTasksOpen, setIsRecurringTasksOpen] = useState(false)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState(null)

  // Phase 8: Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [allUsers, setAllUsers] = useState([])

  // Undo/Redo history manager
  const historyManager = useRef(createHistoryManager(50))

  // Get current board object
  const currentBoard = useMemo(() => {
    return boards.find(board => board.id === currentBoardId) || null
  }, [boards, currentBoardId])

  // Get tasks from current board
  const tasks = useMemo(() => {
    return currentBoard ? (currentBoard.tasks || []) : []
  }, [currentBoard])

  // Phase 8: Migration removed - all data now stored in backend database

  /**
   * Initialize theme on component mount
   */
  useEffect(() => {
    const theme = getTheme()
    applyTheme(theme)
    // Log environment warnings in development
    logEnvironmentWarnings()
  }, [])

  /**
   * Initialize user authentication on component mount
   * Phase 8: Check for saved user from API token
   */
  useEffect(() => {
    const savedUser = getCurrentUser()
    if (savedUser) {
      setCurrentUser(savedUser)
      // Verify token is still valid by fetching current user
      api.users.getCurrent()
        .then(user => {
          setCurrentUser(user)
          setCurrentUser(user) // Update stored user
        })
        .catch(() => {
          // Token invalid, clear user
          authAPI.logout()
          setCurrentUser(null)
        })
    }
  }, [])

  /**
   * Load all users when current user changes
   */
  useEffect(() => {
    if (currentUser) {
      api.users.getAll()
        .then(users => setAllUsers(users))
        .catch(err => console.error('Failed to load users:', err))
    }
  }, [currentUser])

  /**
   * Initialize boards on component mount
   * Phase 8: Load boards from API
   */
  useEffect(() => {
    // Only load boards if user is logged in
    if (!currentUser) return

    setLoading(true)
    setError(null)

    api.boards.getAll()
      .then(response => {
        // Combine owned and shared boards
        const allBoards = [
          ...(response.owned || []).map(b => ({ ...b, ownerId: b.owner_id })),
          ...(response.shared || []).map(b => ({ ...b, ownerId: b.owner_id }))
        ]

        if (allBoards.length === 0) {
          // Create default board
          const defaultBoard = createBoardFromTemplate('My First Board', defaultTemplate)
          defaultBoard.ownerId = currentUser.id
          defaultBoard.activities = []
          
          api.boards.create({
            name: defaultBoard.name,
            description: defaultBoard.description,
            columns: defaultBoard.columns
          })
            .then(newBoard => {
              // Add initial tasks
              const taskPromises = initialTasks.map(task =>
                api.tasks.create({
                  boardId: newBoard.id,
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  priority: task.priority,
                  category: task.category,
                  dueDate: task.dueDate
                })
              )
              
              return Promise.all(taskPromises)
                .then(() => {
                  // Reload board with tasks
                  return api.boards.getById(newBoard.id)
                })
            })
            .then(fullBoard => {
              // Transform snake_case to camelCase for frontend compatibility
              const transformedBoard = {
                ...fullBoard,
                ownerId: fullBoard.owner_id || fullBoard.ownerId,
                sharedUsers: fullBoard.shared_users || fullBoard.sharedUsers || []
              }
              setBoards([transformedBoard])
              setCurrentBoardId(transformedBoard.id)
              localStorage.setItem('current_board_id', transformedBoard.id)
            })
            .catch(err => {
              console.error('Failed to create default board:', err)
              setError('Failed to create default board')
            })
            .finally(() => setLoading(false))
        } else {
          setBoards(allBoards)
          // Set current board to first board or saved one
          const savedBoardId = localStorage.getItem('current_board_id')
          const boardId = savedBoardId && allBoards.find(b => b.id === savedBoardId)
            ? savedBoardId
            : allBoards[0].id
          setCurrentBoardId(boardId)
          localStorage.setItem('current_board_id', boardId)
          
          // Load full board data with tasks
          loadBoardData(boardId)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('Failed to load boards:', err)
        setError('Failed to load boards')
        setLoading(false)
      })
  }, [currentUser])

  /**
   * Load full board data including tasks
   */
  const loadBoardData = async (boardId) => {
    if (!boardId) return

    try {
      const board = await api.boards.getById(boardId)
      // Transform snake_case to camelCase for frontend compatibility
      const transformedBoard = {
        ...board,
        ownerId: board.owner_id || board.ownerId,
        sharedUsers: board.shared_users || board.sharedUsers || []
      }
      setBoards(prev => prev.map(b => b.id === boardId ? transformedBoard : b))
      setBoardActivities(board.activities || [])
    } catch (err) {
      console.error('Failed to load board data:', err)
    }
  }

  /**
   * Update current board when switching
   * Phase 8: Load board data when switching
   */
  useEffect(() => {
    if (currentBoardId) {
      localStorage.setItem('current_board_id', currentBoardId)
      loadBoardData(currentBoardId)
    }
  }, [currentBoardId])

  /**
   * Updates a specific board in the boards array
   * Phase 8: Update via API
   * @param {string} boardId - ID of the board to update
   * @param {Function} updateFn - Function that receives board and returns updated board
   */
  const updateBoard = async (boardId, updateFn) => {
    const board = boards.find(b => b.id === boardId)
    if (!board) return

    const updatedBoard = updateFn(board)
    
    try {
      // Update via API
      const apiData = {
        name: updatedBoard.name,
        description: updatedBoard.description,
        columns: updatedBoard.columns,
        archived: updatedBoard.archived || false
      }
      
      const savedBoard = await api.boards.update(boardId, apiData)
      
      // Transform snake_case to camelCase for frontend compatibility
      const transformedBoard = {
        ...savedBoard,
        ownerId: savedBoard.owner_id || savedBoard.ownerId,
        sharedUsers: savedBoard.shared_users || savedBoard.sharedUsers || []
      }
      
      // Update local state
      setBoards(prevBoards => prevBoards.map(b => 
        b.id === boardId ? transformedBoard : b
      ))
    } catch (error) {
      console.error('Failed to update board:', error)
      setError('Failed to update board')
      // Revert local state on error
      setBoards(prevBoards => prevBoards.map(b => 
        b.id === boardId ? board : b
      ))
    }
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
   * Phase 8: Use API for task operations
   * @param {Object} formData - Form data containing task information
   */
  const handleSubmitTask = async (formData) => {
    if (!currentBoard || !currentUser) return

    setLoading(true)
    setError(null)

    try {
      const firstColumn = currentBoard.columns[0]
      const taskData = {
        ...formData,
        status: formData.status || (firstColumn ? firstColumn.id : 'todo')
      }

      if (editingTask) {
        // Update existing task via API
        const updatedTask = await api.tasks.update(editingTask.id, taskData)
        
        // Update local board state
        setBoards(prevBoards => prevBoards.map(board => {
          if (board.id === currentBoardId) {
            return {
              ...board,
              tasks: (board.tasks || []).map(t => t.id === editingTask.id ? updatedTask : t)
            }
          }
          return board
        }))

        // Check if assignment changed and create notification
        if (formData.assignedTo && formData.assignedTo !== editingTask.assignedTo) {
          // Notification is created by backend
        }
      } else {
        // Create new task via API
        const newTask = await api.tasks.create({
          boardId: currentBoardId,
          ...taskData
        })

        // Update local board state
        setBoards(prevBoards => prevBoards.map(board => {
          if (board.id === currentBoardId) {
            return {
              ...board,
              tasks: [...(board.tasks || []), newTask]
            }
          }
          return board
        }))

        // Phase 7: Process automations (client-side for now)
        // Note: In production, automations should run on backend
        const automationResult = processAutomations('task-created', { task: newTask }, currentBoardId)
        if (automationResult.updatedTask && automationResult.updatedTask.id !== newTask.id) {
          // Update task if automation changed it
          await api.tasks.update(newTask.id, automationResult.updatedTask)
        }
      }

      // Reload board data to get latest activities
      await loadBoardData(currentBoardId)
      handleCloseForm()
    } catch (error) {
      console.error('Failed to save task:', error)
      setError('Failed to save task: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Deletes a task by ID
   * Phase 8: Use API for deletion
   * @param {string} taskId - ID of the task to delete
   */
  const handleDeleteTask = async (taskId) => {
    if (!currentBoard || !currentUser) return
    
    const task = currentBoard.tasks?.find(t => t.id === taskId)
    if (!task) return
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true)
      try {
        await api.tasks.delete(taskId)
        
        // Update local state
        setBoards(prevBoards => prevBoards.map(board => {
          if (board.id === currentBoardId) {
            return {
              ...board,
              tasks: (board.tasks || []).filter(t => t.id !== taskId)
            }
          }
          return board
        }))

        // Reload board data to get latest activities
        await loadBoardData(currentBoardId)
      } catch (error) {
        console.error('Failed to delete task:', error)
        setError('Failed to delete task: ' + error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  /**
   * Moves a task to a different column (changes status)
   * @param {string} taskId - ID of the task being moved
   * @param {string} newStatus - New status (column ID)
   */
  /**
   * Handles task movement between columns
   * Phase 8: Use API for task updates
   */
  const handleTaskMove = async (taskId, newStatus) => {
    if (!currentBoard || !currentUser) return

    const task = currentBoard.tasks?.find(t => t.id === taskId)
    if (!task) return

    try {
      // Update task status via API
      const updatedTask = await api.tasks.update(taskId, { status: newStatus })

      // Phase 7: Process automations (client-side for now)
      const automationResult = processAutomations('task-moved', {
        task: updatedTask,
        oldStatus: task.status,
        newStatus
      }, currentBoardId)

      // If automation changed the task, update again
      if (automationResult.updatedTask && automationResult.updatedTask.id === taskId) {
        await api.tasks.update(taskId, automationResult.updatedTask)
      }

      // Update local state
      setBoards(prevBoards => prevBoards.map(board => {
        if (board.id === currentBoardId) {
          return {
            ...board,
            tasks: (board.tasks || []).map(t => t.id === taskId ? updatedTask : t)
          }
        }
        return board
      }))

      // Reload board data to get latest activities
      await loadBoardData(currentBoardId)
    } catch (error) {
      console.error('Failed to move task:', error)
      setError('Failed to move task: ' + error.message)
    }
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
  /**
   * Handles board creation
   * Phase 8: Use API for board creation
   */
  const handleCreateBoard = async (newBoard) => {
    if (!currentUser) return

    setLoading(true)
    try {
      const createdBoard = await api.boards.create({
        name: newBoard.name,
        description: newBoard.description,
        columns: newBoard.columns
      })

      // Update local state
      const boardWithOwner = { ...createdBoard, ownerId: createdBoard.owner_id, activities: [], sharedUsers: [] }
      setBoards(prevBoards => [...prevBoards, boardWithOwner])
      setCurrentBoardId(createdBoard.id)
      localStorage.setItem('current_board_id', createdBoard.id)
      setIsBoardFormOpen(false)
    } catch (error) {
      console.error('Failed to create board:', error)
      setError('Failed to create board: ' + error.message)
    } finally {
      setLoading(false)
    }
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
   * Phase 8: User is already set by LoginForm via API
   */
  const handleLogin = (user) => {
    setCurrentUser(user)
    setCurrentUser(user) // Also update stored user
    // Boards will be loaded by useEffect when currentUser changes
  }

  /**
   * Phase 5: Handles user logout
   * Phase 8: Clear API token
   */
  const handleLogout = () => {
    authAPI.logout()
    setCurrentUser(null)
    setBoards([])
    setCurrentBoardId(null)
    localStorage.removeItem('current_board_id')
  }

  /**
   * Phase 5: Handles user profile update
   * Phase 8: Use API for user updates
   */
  const handleUserUpdate = async (updatedUser) => {
    try {
      const user = await api.users.update(updatedUser)
      setCurrentUser(user)
      setCurrentUser(user) // Update stored user
    } catch (error) {
      console.error('Failed to update user:', error)
      setError('Failed to update user profile')
    }
  }

  /**
   * Phase 5: Handles board sharing
   * Phase 8: Use API for board sharing
   */
  const handleBoardShare = async (updatedBoard) => {
    try {
      // Share/unshare operations are handled by BoardSharing component via API
      // Just reload board data
      await loadBoardData(currentBoardId)
    } catch (error) {
      console.error('Failed to update board sharing:', error)
      setError('Failed to update board sharing')
    }
  }

  /**
   * Phase 5: Update board activities when board changes
   * Phase 8: Load activities from API
   */
  useEffect(() => {
    if (currentBoardId && currentUser) {
      api.activities.getByBoard(currentBoardId)
        .then(activities => setBoardActivities(activities))
        .catch(err => console.error('Failed to load activities:', err))
    }
  }, [currentBoardId, currentUser])

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
    
    // Phase 7: If active filter is set, use advanced search filter
    if (activeFilter) {
      return applyFilter(tasks, activeFilter)
    }
    
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

  // Show loading state
  if (loading && boards.length === 0) {
    return (
      <div className="app">
        <div className="app-content">
          <LoadingSpinner message="Loading your boards..." size="large" />
        </div>
      </div>
    )
  }

  // Show message if no boards exist
  if (boards.length === 0 && currentUser && !loading) {
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
      {/* Error banner */}
      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button 
            className="error-dismiss" 
            onClick={(e) => {
              e.stopPropagation()
              setError(null)
            }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <LoadingSpinner message="Processing..." size="medium" />
        </div>
      )}

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
          {/* Phase 7: Advanced features buttons */}
          {canEdit && (
            <>
              <button
                className="btn-icon"
                onClick={() => setIsAutomationOpen(true)}
                title="Automation Rules"
                aria-label="Automation Rules"
              >
                ⚙️
              </button>
              <button
                className="btn-icon"
                onClick={() => setIsRecurringTasksOpen(true)}
                title="Recurring Tasks"
                aria-label="Recurring Tasks"
              >
                🔄
              </button>
              <button
                className="btn-icon"
                onClick={() => setIsCustomFieldsOpen(true)}
                title="Custom Fields"
                aria-label="Custom Fields"
              >
                📝
              </button>
            </>
          )}
          <button
            className="btn-icon"
            onClick={() => setIsAdvancedSearchOpen(true)}
            title="Advanced Search"
            aria-label="Advanced Search"
          >
            🔍
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
        boardId={currentBoardId}
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
        users={allUsers}
        onShare={handleBoardShare}
      />

      {/* Phase 7: Automation Rules modal */}
      <AutomationRules
        isOpen={isAutomationOpen}
        onClose={() => setIsAutomationOpen(false)}
        boardId={currentBoardId}
        users={allUsers}
      />

      {/* Phase 7: Recurring Tasks modal */}
      <RecurringTasks
        isOpen={isRecurringTasksOpen}
        onClose={() => setIsRecurringTasksOpen(false)}
        boardId={currentBoardId}
        users={allUsers}
      />

      {/* Phase 7: Advanced Search modal */}
      <AdvancedSearch
        isOpen={isAdvancedSearchOpen}
        onClose={() => {
          setIsAdvancedSearchOpen(false)
          setActiveFilter(null) // Clear filter when closing
        }}
        onApplyFilter={(filter, filteredTasks) => {
          setActiveFilter(filter)
          // Update search/filter state to match applied filter
          if (filter.searchQuery) setSearchQuery(filter.searchQuery)
          if (filter.category !== 'all') setSelectedCategory(filter.category)
          if (filter.priority !== 'all') setSelectedPriority(filter.priority)
          if (filter.sortBy) setSortBy(filter.sortBy)
        }}
        tasks={tasks}
        users={allUsers}
      />

      {/* Phase 7: Custom Fields modal */}
      <CustomFields
        isOpen={isCustomFieldsOpen}
        onClose={() => setIsCustomFieldsOpen(false)}
        boardId={currentBoardId}
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
            if (isAutomationOpen) setIsAutomationOpen(false)
            if (isRecurringTasksOpen) setIsRecurringTasksOpen(false)
            if (isAdvancedSearchOpen) setIsAdvancedSearchOpen(false)
            if (isCustomFieldsOpen) setIsCustomFieldsOpen(false)
          }
        }}
      />
    </div>
  )
}

export default App
