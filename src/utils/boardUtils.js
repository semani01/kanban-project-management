/**
 * Board utility functions
 * Helper functions for board operations and calculations
 */

/**
 * Creates a new board from a template
 * @param {string} name - Board name
 * @param {Object} template - Template object
 * @returns {Object} New board object
 */
export const createBoardFromTemplate = (name, template) => {
  return {
    id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name || template.name,
    description: template.description || '',
    columns: template.columns.map(col => ({ ...col })),
    tasks: [],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Creates a new board with custom columns
 * @param {string} name - Board name
 * @param {Array} columns - Array of column objects
 * @returns {Object} New board object
 */
export const createCustomBoard = (name, columns) => {
  return {
    id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name || 'New Board',
    description: '',
    columns: columns || [],
    tasks: [],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Calculates board statistics
 * @param {Object} board - Board object
 * @returns {Object} Statistics object
 */
export const calculateBoardStats = (board) => {
  const tasks = board.tasks || []
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.status === 'done' || board.columns.some(col => col.id === 'done' && task.status === col.id)).length
  const inProgressTasks = tasks.filter(task => {
    const column = board.columns.find(col => col.id === task.status)
    return column && column.id !== 'done' && column.id !== 'todo'
  }).length
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  // Tasks by priority
  const tasksByPriority = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length
  }
  
  // Tasks by category
  const tasksByCategory = {}
  tasks.forEach(task => {
    if (task.category) {
      tasksByCategory[task.category] = (tasksByCategory[task.category] || 0) + 1
    }
  })
  
  // Overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false
    const dueDate = new Date(task.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today && task.status !== 'done'
  }).length
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    completionRate,
    tasksByPriority,
    tasksByCategory,
    overdueTasks
  }
}

/**
 * Checks if a column has reached its WIP limit
 * @param {Object} column - Column object
 * @param {Array} tasks - Array of tasks in that column
 * @returns {Object} Object with isAtLimit boolean and message
 */
export const checkWipLimit = (column, tasks) => {
  if (!column.wipLimit) {
    return { isAtLimit: false, message: null }
  }
  
  const taskCount = tasks.length
  const isAtLimit = taskCount >= column.wipLimit
  const message = isAtLimit 
    ? `WIP Limit Reached (${taskCount}/${column.wipLimit})`
    : `${taskCount}/${column.wipLimit} tasks`
  
  return { isAtLimit, message }
}
