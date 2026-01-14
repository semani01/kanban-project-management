/**
 * Automation and Workflow Utility Functions
 * Handles automation rules and workflow triggers
 */

const AUTOMATION_STORAGE_KEY = 'kanban-automations'

/**
 * Loads automation rules from localStorage
 * @returns {Array} Array of automation rule objects
 */
export const loadAutomations = () => {
  try {
    const stored = localStorage.getItem(AUTOMATION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading automations:', error)
    return []
  }
}

/**
 * Saves automation rules to localStorage
 * @param {Array} automations - Array of automation rule objects
 */
export const saveAutomations = (automations) => {
  try {
    localStorage.setItem(AUTOMATION_STORAGE_KEY, JSON.stringify(automations))
  } catch (error) {
    console.error('Error saving automations:', error)
  }
}

/**
 * Creates a new automation rule
 * @param {Object} ruleData - Rule configuration
 * @returns {Object} Automation rule object
 */
export const createAutomationRule = (ruleData) => {
  return {
    id: `automation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: ruleData.name || 'Untitled Rule',
    enabled: ruleData.enabled !== false,
    boardId: ruleData.boardId || null, // null means applies to all boards
    trigger: ruleData.trigger || 'task-created', // task-created, task-moved, task-completed, etc.
    conditions: ruleData.conditions || [],
    actions: ruleData.actions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Checks if automation conditions are met
 * @param {Object} rule - Automation rule
 * @param {Object} context - Context object (task, oldStatus, newStatus, etc.)
 * @returns {boolean} True if conditions are met
 */
export const checkAutomationConditions = (rule, context) => {
  if (!rule.conditions || rule.conditions.length === 0) {
    return true // No conditions means always trigger
  }

  for (const condition of rule.conditions) {
    const task = context.task || {}
    
    switch (condition.field) {
      case 'priority':
        if (task.priority !== condition.value) return false
        break
      case 'category':
        if (task.category !== condition.value) return false
        break
      case 'status':
        if (condition.operator === 'equals') {
          if (context.newStatus !== condition.value) return false
        } else if (condition.operator === 'not-equals') {
          if (context.newStatus === condition.value) return false
        }
        break
      case 'assignedTo':
        if (task.assignedTo !== condition.value) return false
        break
      case 'dueDate':
        if (condition.operator === 'overdue') {
          if (!task.dueDate || new Date(task.dueDate) >= new Date()) return false
        } else if (condition.operator === 'due-soon') {
          if (!task.dueDate) return false
          const dueDate = new Date(task.dueDate)
          const threeDaysFromNow = new Date()
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
          if (dueDate > threeDaysFromNow || dueDate < new Date()) return false
        }
        break
      default:
        break
    }
  }

  return true
}

/**
 * Executes automation actions
 * @param {Object} rule - Automation rule
 * @param {Object} context - Context object
 * @returns {Object} Updated task or action result
 */
export const executeAutomationActions = (rule, context) => {
  const result = {
    task: { ...context.task },
    notifications: [],
    newTasks: []
  }

  for (const action of rule.actions) {
    switch (action.type) {
      case 'assign-user':
        result.task.assignedTo = action.value
        break
      case 'set-priority':
        result.task.priority = action.value
        break
      case 'set-category':
        result.task.category = action.value
        break
      case 'set-status':
        result.task.status = action.value
        break
      case 'add-label':
        if (!result.task.labels) result.task.labels = []
        if (!result.task.labels.includes(action.value)) {
          result.task.labels.push(action.value)
        }
        break
      case 'create-notification':
        result.notifications.push({
          userId: action.userId || context.task.assignedTo,
          message: action.message || `Automation: ${rule.name} triggered`,
          type: 'automation'
        })
        break
      case 'create-task':
        result.newTasks.push({
          title: action.title || 'Auto-created task',
          description: action.description || '',
          priority: action.priority || 'medium',
          status: action.status || 'todo',
          assignedTo: action.assignedTo || context.task.assignedTo
        })
        break
      default:
        break
    }
  }

  return result
}

/**
 * Processes automations for a given trigger
 * @param {string} trigger - Trigger type (task-created, task-moved, etc.)
 * @param {Object} context - Context object
 * @param {string} boardId - Current board ID
 * @returns {Object} Automation results
 */
export const processAutomations = (trigger, context, boardId) => {
  const automations = loadAutomations()
  const results = {
    updatedTask: context.task,
    notifications: [],
    newTasks: []
  }

  for (const rule of automations) {
    // Skip disabled rules
    if (!rule.enabled) continue

    // Check if rule applies to this board
    if (rule.boardId && rule.boardId !== boardId) continue

    // Check if trigger matches
    if (rule.trigger !== trigger) continue

    // Check conditions
    if (!checkAutomationConditions(rule, context)) continue

    // Execute actions
    const actionResult = executeAutomationActions(rule, {
      ...context,
      task: results.updatedTask
    })

    results.updatedTask = actionResult.task
    results.notifications.push(...actionResult.notifications)
    results.newTasks.push(...actionResult.newTasks)
  }

  return results
}

/**
 * Validates an automation rule
 * @param {Object} rule - Automation rule to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateAutomationRule = (rule) => {
  const errors = []

  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required')
  }

  if (!rule.trigger) {
    errors.push('Trigger is required')
  }

  if (!rule.actions || rule.actions.length === 0) {
    errors.push('At least one action is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
