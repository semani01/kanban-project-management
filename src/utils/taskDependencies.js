/**
 * Task Dependencies Utility Functions
 * Handles task dependency relationships and validation
 */

/**
 * Validates if a dependency can be added (prevents circular dependencies)
 * @param {string} taskId - ID of the task to add dependency to
 * @param {string} dependsOnId - ID of the task this task depends on
 * @param {Array} allTasks - Array of all tasks
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateDependency = (taskId, dependsOnId, allTasks) => {
  // Can't depend on itself
  if (taskId === dependsOnId) {
    return { valid: false, error: 'A task cannot depend on itself' }
  }
  
  // Check if dependency task exists
  const dependsOnTask = allTasks.find(t => t.id === dependsOnId)
  if (!dependsOnTask) {
    return { valid: false, error: 'Dependency task not found' }
  }
  
  // Check for circular dependencies
  const hasCircularDependency = checkCircularDependency(
    dependsOnId,
    taskId,
    allTasks,
    new Set()
  )
  
  if (hasCircularDependency) {
    return { valid: false, error: 'This would create a circular dependency' }
  }
  
  return { valid: true, error: null }
}

/**
 * Recursively checks for circular dependencies
 * @param {string} currentTaskId - Current task being checked
 * @param {string} targetTaskId - Task we're trying to avoid circular dependency with
 * @param {Array} allTasks - Array of all tasks
 * @param {Set} visited - Set of visited task IDs to prevent infinite loops
 * @returns {boolean} True if circular dependency exists
 */
const checkCircularDependency = (currentTaskId, targetTaskId, allTasks, visited) => {
  // If we've already visited this task, we're in a loop
  if (visited.has(currentTaskId)) {
    return false // Not the circular dependency we're looking for
  }
  
  // If current task is the target, we have a circular dependency
  if (currentTaskId === targetTaskId) {
    return true
  }
  
  // Mark as visited
  visited.add(currentTaskId)
  
  // Get current task
  const currentTask = allTasks.find(t => t.id === currentTaskId)
  if (!currentTask || !currentTask.dependencies || currentTask.dependencies.length === 0) {
    return false
  }
  
  // Check all dependencies of current task
  for (const depId of currentTask.dependencies) {
    if (checkCircularDependency(depId, targetTaskId, allTasks, new Set(visited))) {
      return true
    }
  }
  
  return false
}

/**
 * Gets all tasks that depend on a given task
 * @param {string} taskId - ID of the task
 * @param {Array} allTasks - Array of all tasks
 * @returns {Array} Array of task IDs that depend on this task
 */
export const getDependentTasks = (taskId, allTasks) => {
  return allTasks
    .filter(task => task.dependencies && task.dependencies.includes(taskId))
    .map(task => task.id)
}

/**
 * Checks if a task can be moved to a new status (all dependencies must be completed)
 * @param {Object} task - Task object
 * @param {string} newStatus - New status to move to
 * @param {Array} allTasks - Array of all tasks
 * @returns {Object} { canMove: boolean, blockingTasks: Array }
 */
export const canMoveTask = (task, newStatus, allTasks) => {
  // If moving to "Done" or similar completed status, check dependencies
  const completedStatuses = ['done', 'completed', 'closed']
  if (!completedStatuses.includes(newStatus.toLowerCase())) {
    return { canMove: true, blockingTasks: [] }
  }
  
  if (!task.dependencies || task.dependencies.length === 0) {
    return { canMove: true, blockingTasks: [] }
  }
  
  // Check if all dependencies are completed
  const blockingTasks = []
  for (const depId of task.dependencies) {
    const depTask = allTasks.find(t => t.id === depId)
    if (depTask) {
      const depStatus = depTask.status?.toLowerCase() || ''
      if (!completedStatuses.includes(depStatus)) {
        blockingTasks.push(depTask)
      }
    }
  }
  
  return {
    canMove: blockingTasks.length === 0,
    blockingTasks
  }
}

/**
 * Gets dependency chain depth (how many levels deep)
 * @param {string} taskId - ID of the task
 * @param {Array} allTasks - Array of all tasks
 * @param {number} depth - Current depth (internal use)
 * @returns {number} Maximum depth of dependency chain
 */
export const getDependencyDepth = (taskId, allTasks, depth = 0) => {
  const task = allTasks.find(t => t.id === taskId)
  if (!task || !task.dependencies || task.dependencies.length === 0) {
    return depth
  }
  
  let maxDepth = depth
  for (const depId of task.dependencies) {
    const depDepth = getDependencyDepth(depId, allTasks, depth + 1)
    maxDepth = Math.max(maxDepth, depDepth)
  }
  
  return maxDepth
}
