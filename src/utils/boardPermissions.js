/**
 * Board permissions utility functions
 * Manages board sharing and user permissions
 */

/**
 * Permission levels
 */
export const PERMISSIONS = {
  OWNER: 'owner',      // Full control
  EDITOR: 'editor',    // Can edit tasks and board
  VIEWER: 'viewer'     // Read-only access
}

/**
 * Checks if user has permission to perform action
 * @param {string} userPermission - User's permission level
 * @param {string} requiredPermission - Required permission level
 * @returns {boolean} True if user has required permission
 */
export const hasPermission = (userPermission, requiredPermission) => {
  const permissionLevels = {
    [PERMISSIONS.OWNER]: 3,
    [PERMISSIONS.EDITOR]: 2,
    [PERMISSIONS.VIEWER]: 1
  }
  
  return (permissionLevels[userPermission] || 0) >= (permissionLevels[requiredPermission] || 0)
}

/**
 * Checks if user can edit board
 * @param {string} userPermission - User's permission level
 * @returns {boolean} True if user can edit
 */
export const canEditBoard = (userPermission) => {
  return hasPermission(userPermission, PERMISSIONS.EDITOR)
}

/**
 * Checks if user can edit tasks
 * @param {string} userPermission - User's permission level
 * @returns {boolean} True if user can edit tasks
 */
export const canEditTasks = (userPermission) => {
  return hasPermission(userPermission, PERMISSIONS.EDITOR)
}

/**
 * Checks if user can delete board
 * @param {string} userPermission - User's permission level
 * @returns {boolean} True if user can delete
 */
export const canDeleteBoard = (userPermission) => {
  return hasPermission(userPermission, PERMISSIONS.OWNER)
}

/**
 * Gets user's permission for a board
 * @param {Object} board - Board object
 * @param {string} userId - User ID
 * @returns {string|null} Permission level or null
 */
export const getUserBoardPermission = (board, userId) => {
  // Owner has full access
  if (board.ownerId === userId) {
    return PERMISSIONS.OWNER
  }
  
  // Check shared users
  if (board.sharedUsers && board.sharedUsers.length > 0) {
    const sharedUser = board.sharedUsers.find(su => su.userId === userId)
    return sharedUser ? sharedUser.permission : null
  }
  
  return null
}

/**
 * Shares board with a user
 * @param {Object} board - Board object
 * @param {string} userId - User ID to share with
 * @param {string} permission - Permission level (editor or viewer)
 * @returns {Object} Updated board
 */
export const shareBoardWithUser = (board, userId, permission = PERMISSIONS.EDITOR) => {
  const sharedUsers = board.sharedUsers || []
  
  // Check if already shared
  const existingIndex = sharedUsers.findIndex(su => su.userId === userId)
  
  if (existingIndex >= 0) {
    // Update existing permission
    sharedUsers[existingIndex].permission = permission
  } else {
    // Add new shared user
    sharedUsers.push({
      userId,
      permission,
      sharedAt: new Date().toISOString()
    })
  }
  
  return {
    ...board,
    sharedUsers
  }
}

/**
 * Removes user from shared board
 * @param {Object} board - Board object
 * @param {string} userId - User ID to remove
 * @returns {Object} Updated board
 */
export const unshareBoardWithUser = (board, userId) => {
  const sharedUsers = (board.sharedUsers || []).filter(su => su.userId !== userId)
  
  return {
    ...board,
    sharedUsers
  }
}
