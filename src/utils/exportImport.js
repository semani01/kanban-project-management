/**
 * Export/Import utility functions
 * Handles exporting and importing boards/tasks in various formats
 */

/**
 * Exports boards to JSON format
 * @param {Array} boards - Array of board objects
 * @returns {string} JSON string
 */
export const exportToJSON = (boards) => {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    boards: boards
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * Imports boards from JSON format
 * @param {string} jsonString - JSON string to import
 * @returns {Array} Array of board objects
 */
export const importFromJSON = (jsonString) => {
  try {
    const data = JSON.parse(jsonString)
    
    // Validate structure
    if (!data.boards || !Array.isArray(data.boards)) {
      throw new Error('Invalid JSON format: missing boards array')
    }
    
    return data.boards
  } catch (error) {
    throw new Error(`Failed to import JSON: ${error.message}`)
  }
}

/**
 * Exports tasks to CSV format
 * @param {Array} tasks - Array of task objects
 * @returns {string} CSV string
 */
export const exportTasksToCSV = (tasks) => {
  if (tasks.length === 0) {
    return 'No tasks to export'
  }

  // CSV headers
  const headers = [
    'Title',
    'Description',
    'Priority',
    'Status',
    'Category',
    'Due Date',
    'Created At',
    'Updated At',
    'Comments Count'
  ]

  // Convert tasks to CSV rows
  const rows = tasks.map(task => {
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString()
    }

    return [
      `"${(task.title || '').replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.priority || '',
      task.status || '',
      task.category || '',
      formatDate(task.dueDate),
      formatDate(task.createdAt),
      formatDate(task.updatedAt),
      (task.comments && task.comments.length) || 0
    ].join(',')
  })

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Downloads data as a file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type (e.g., 'application/json', 'text/csv')
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Reads a file and returns its content as text
 * @param {File} file - File object
 * @returns {Promise<string>} File content as text
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
