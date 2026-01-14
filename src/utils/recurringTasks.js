/**
 * Recurring Tasks Utility Functions
 * Handles recurring task patterns and generation
 */

const RECURRING_STORAGE_KEY = 'kanban-recurring-tasks'

/**
 * Recurrence pattern types
 */
export const RECURRENCE_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
}

/**
 * Loads recurring task templates from localStorage
 * @returns {Array} Array of recurring task template objects
 */
export const loadRecurringTasks = () => {
  try {
    const stored = localStorage.getItem(RECURRING_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading recurring tasks:', error)
    return []
  }
}

/**
 * Saves recurring task templates to localStorage
 * @param {Array} recurringTasks - Array of recurring task template objects
 */
export const saveRecurringTasks = (recurringTasks) => {
  try {
    localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(recurringTasks))
  } catch (error) {
    console.error('Error saving recurring tasks:', error)
  }
}

/**
 * Creates a new recurring task template
 * @param {Object} templateData - Template configuration
 * @returns {Object} Recurring task template object
 */
export const createRecurringTaskTemplate = (templateData) => {
  return {
    id: `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: templateData.name || 'Untitled Recurring Task',
    enabled: templateData.enabled !== false,
    boardId: templateData.boardId || null,
    taskTemplate: templateData.taskTemplate || {},
    recurrence: {
      type: templateData.recurrence?.type || RECURRENCE_TYPES.DAILY,
      interval: templateData.recurrence?.interval || 1, // Every X days/weeks/months
      daysOfWeek: templateData.recurrence?.daysOfWeek || [], // For weekly: [0,2,4] = Mon, Wed, Fri
      dayOfMonth: templateData.recurrence?.dayOfMonth || null, // For monthly: 1-31
      endDate: templateData.recurrence?.endDate || null, // When to stop recurring
      maxOccurrences: templateData.recurrence?.maxOccurrences || null // Max number of tasks to create
    },
    lastGenerated: null,
    occurrenceCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Calculates the next occurrence date based on recurrence pattern
 * @param {Object} recurrence - Recurrence configuration
 * @param {Date} lastDate - Last occurrence date (or start date)
 * @returns {Date|null} Next occurrence date, or null if pattern ended
 */
export const calculateNextOccurrence = (recurrence, lastDate = new Date()) => {
  const nextDate = new Date(lastDate)
  
  // Check if we've reached max occurrences
  if (recurrence.maxOccurrences && recurrence.occurrenceCount >= recurrence.maxOccurrences) {
    return null
  }
  
  // Check if we've passed the end date
  if (recurrence.endDate && new Date(recurrence.endDate) < nextDate) {
    return null
  }

  switch (recurrence.type) {
    case RECURRENCE_TYPES.DAILY:
      nextDate.setDate(nextDate.getDate() + recurrence.interval)
      break
    
    case RECURRENCE_TYPES.WEEKLY:
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        // Find next day of week
        let daysToAdd = 1
        let attempts = 0
        while (attempts < 14) { // Max 2 weeks
          const testDate = new Date(nextDate)
          testDate.setDate(testDate.getDate() + daysToAdd)
          const dayOfWeek = testDate.getDay()
          
          if (recurrence.daysOfWeek.includes(dayOfWeek)) {
            nextDate.setDate(nextDate.getDate() + daysToAdd)
            break
          }
          daysToAdd++
          attempts++
        }
        if (attempts >= 14) return null
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * recurrence.interval))
      }
      break
    
    case RECURRENCE_TYPES.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + recurrence.interval)
      if (recurrence.dayOfMonth) {
        // Set to specific day of month
        const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
        nextDate.setDate(Math.min(recurrence.dayOfMonth, daysInMonth))
      }
      break
    
    case RECURRENCE_TYPES.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval)
      break
    
    default:
      return null
  }

  // Check if next date is after end date
  if (recurrence.endDate && nextDate > new Date(recurrence.endDate)) {
    return null
  }

  return nextDate
}

/**
 * Generates tasks from recurring templates that are due
 * @param {string} boardId - Board ID to generate tasks for
 * @returns {Array} Array of generated task objects
 */
export const generateRecurringTasks = (boardId = null) => {
  const recurringTemplates = loadRecurringTasks()
  const generatedTasks = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (const template of recurringTemplates) {
    // Skip disabled templates
    if (!template.enabled) continue

    // Check if template applies to this board
    if (template.boardId && template.boardId !== boardId) continue

    // Determine start date (last generated or creation date)
    const startDate = template.lastGenerated 
      ? new Date(template.lastGenerated)
      : new Date(template.createdAt)
    startDate.setHours(0, 0, 0, 0)

    // Calculate next occurrence
    let nextDate = calculateNextOccurrence(template.recurrence, startDate)
    
    // Generate tasks until we catch up to today
    while (nextDate && nextDate <= now) {
      // Create task from template
      const task = {
        ...template.taskTemplate,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: template.taskTemplate.status || 'todo',
        createdAt: nextDate.toISOString(),
        isRecurring: true,
        recurringTemplateId: template.id
      }

      // Update due date if specified in template
      if (template.taskTemplate.dueDate) {
        const dueDate = new Date(template.taskTemplate.dueDate)
        // Adjust due date relative to task creation date
        const daysDiff = Math.floor((nextDate - startDate) / (1000 * 60 * 60 * 24))
        dueDate.setDate(dueDate.getDate() + daysDiff)
        task.dueDate = dueDate.toISOString()
      } else {
        task.dueDate = nextDate.toISOString()
      }

      generatedTasks.push(task)

      // Update template occurrence count
      template.occurrenceCount++
      template.lastGenerated = nextDate.toISOString()

      // Calculate next occurrence
      nextDate = calculateNextOccurrence(template.recurrence, nextDate)
    }

    // Save updated template
    if (generatedTasks.length > 0) {
      template.updatedAt = new Date().toISOString()
    }
  }

  // Save updated templates
  if (generatedTasks.length > 0) {
    const updatedTemplates = recurringTemplates.map(t => {
      const updated = recurringTemplates.find(rt => rt.id === t.id)
      return updated || t
    })
    saveRecurringTasks(updatedTemplates)
  }

  return generatedTasks
}

/**
 * Formats recurrence pattern for display
 * @param {Object} recurrence - Recurrence configuration
 * @returns {string} Human-readable recurrence description
 */
export const formatRecurrence = (recurrence) => {
  const { type, interval, daysOfWeek, dayOfMonth } = recurrence
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  switch (type) {
    case RECURRENCE_TYPES.DAILY:
      return interval === 1 ? 'Daily' : `Every ${interval} days`
    
    case RECURRENCE_TYPES.WEEKLY:
      if (daysOfWeek && daysOfWeek.length > 0) {
        const days = daysOfWeek.map(d => dayNames[d]).join(', ')
        return `Weekly on ${days}`
      }
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`
    
    case RECURRENCE_TYPES.MONTHLY:
      if (dayOfMonth) {
        return `Monthly on day ${dayOfMonth}`
      }
      return interval === 1 ? 'Monthly' : `Every ${interval} months`
    
    case RECURRENCE_TYPES.YEARLY:
      return interval === 1 ? 'Yearly' : `Every ${interval} years`
    
    default:
      return 'Custom'
  }
}
