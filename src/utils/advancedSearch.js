/**
 * Advanced Search and Saved Filters Utility Functions
 * Handles advanced search queries and saved filter presets
 */

const SAVED_FILTERS_STORAGE_KEY = 'kanban-saved-filters'

/**
 * Loads saved filters from localStorage
 * @returns {Array} Array of saved filter objects
 */
export const loadSavedFilters = () => {
  try {
    const stored = localStorage.getItem(SAVED_FILTERS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading saved filters:', error)
    return []
  }
}

/**
 * Saves filters to localStorage
 * @param {Array} filters - Array of saved filter objects
 */
export const saveSavedFilters = (filters) => {
  try {
    localStorage.setItem(SAVED_FILTERS_STORAGE_KEY, JSON.stringify(filters))
  } catch (error) {
    console.error('Error saving filters:', error)
  }
}

/**
 * Creates a new saved filter
 * @param {Object} filterData - Filter configuration
 * @returns {Object} Saved filter object
 */
export const createSavedFilter = (filterData) => {
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: filterData.name || 'Untitled Filter',
    description: filterData.description || '',
    searchQuery: filterData.searchQuery || '',
    category: filterData.category || 'all',
    priority: filterData.priority || 'all',
    status: filterData.status || 'all',
    assignedTo: filterData.assignedTo || 'all',
    dueDateRange: filterData.dueDateRange || null, // { start: date, end: date }
    hasSubtasks: filterData.hasSubtasks || null, // true, false, or null
    hasDependencies: filterData.hasDependencies || null,
    timeTrackingStatus: filterData.timeTrackingStatus || 'all', // on-track, at-risk, over-budget, all
    customFields: filterData.customFields || {},
    sortBy: filterData.sortBy || 'priority',
    sortOrder: filterData.sortOrder || 'desc',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Applies a saved filter to tasks
 * @param {Array} tasks - Array of tasks to filter
 * @param {Object} filter - Filter object (saved filter or filter criteria)
 * @returns {Array} Filtered tasks
 */
export const applyFilter = (tasks, filter) => {
  let filtered = [...tasks]

  // Text search
  if (filter.searchQuery && filter.searchQuery.trim()) {
    const query = filter.searchQuery.toLowerCase().trim()
    filtered = filtered.filter(task => {
      const titleMatch = task.title?.toLowerCase().includes(query)
      const descMatch = task.description?.toLowerCase().includes(query)
      const commentMatch = task.comments?.some(c => 
        c.text?.toLowerCase().includes(query)
      )
      return titleMatch || descMatch || commentMatch
    })
  }

  // Category filter
  if (filter.category && filter.category !== 'all') {
    filtered = filtered.filter(task => task.category === filter.category)
  }

  // Priority filter
  if (filter.priority && filter.priority !== 'all') {
    filtered = filtered.filter(task => task.priority === filter.priority)
  }

  // Status filter
  if (filter.status && filter.status !== 'all') {
    filtered = filtered.filter(task => 
      (task.status || 'todo').toLowerCase() === filter.status.toLowerCase()
    )
  }

  // Assigned to filter
  if (filter.assignedTo && filter.assignedTo !== 'all') {
    filtered = filtered.filter(task => task.assignedTo === filter.assignedTo)
  }

  // Due date range filter
  if (filter.dueDateRange) {
    const { start, end } = filter.dueDateRange
    filtered = filtered.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      const startDate = start ? new Date(start) : null
      const endDate = end ? new Date(end) : null
      
      if (startDate && taskDate < startDate) return false
      if (endDate && taskDate > endDate) return false
      return true
    })
  }

  // Subtasks filter
  if (filter.hasSubtasks !== null && filter.hasSubtasks !== undefined) {
    filtered = filtered.filter(task => {
      const hasSubtasks = task.subtasks && task.subtasks.length > 0
      return filter.hasSubtasks ? hasSubtasks : !hasSubtasks
    })
  }

  // Dependencies filter
  if (filter.hasDependencies !== null && filter.hasDependencies !== undefined) {
    filtered = filtered.filter(task => {
      const hasDeps = task.dependencies && task.dependencies.length > 0
      return filter.hasDependencies ? hasDeps : !hasDeps
    })
  }

  // Time tracking status filter
  if (filter.timeTrackingStatus && filter.timeTrackingStatus !== 'all') {
    filtered = filtered.filter(task => {
      if (!task.timeEstimate) return false
      const timeSpent = task.timeSpent || 0
      const progress = (timeSpent / task.timeEstimate) * 100
      
      switch (filter.timeTrackingStatus) {
        case 'on-track':
          return progress < 80
        case 'at-risk':
          return progress >= 80 && progress < 100
        case 'over-budget':
          return progress >= 100
        default:
          return true
      }
    })
  }

  // Custom fields filter
  if (filter.customFields && Object.keys(filter.customFields).length > 0) {
    filtered = filtered.filter(task => {
      for (const [fieldId, value] of Object.entries(filter.customFields)) {
        const taskValue = task.customFields?.[fieldId]
        if (taskValue !== value) return false
      }
      return true
    })
  }

  // Sorting
  if (filter.sortBy) {
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (filter.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority] || 0
          bValue = priorityOrder[b.priority] || 0
          break
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0
          break
        case 'title':
          aValue = (a.title || '').toLowerCase()
          bValue = (b.title || '').toLowerCase()
          break
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0
          break
        case 'updatedAt':
          aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          break
        default:
          return 0
      }

      if (filter.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
  }

  return filtered
}

/**
 * Validates a saved filter
 * @param {Object} filter - Filter to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateSavedFilter = (filter) => {
  const errors = []

  if (!filter.name || filter.name.trim() === '') {
    errors.push('Filter name is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
