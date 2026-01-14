/**
 * Board templates - Pre-configured board setups
 * Provides ready-to-use board configurations for different use cases
 */

/**
 * Default Kanban template (To Do, In Progress, Done)
 */
export const defaultTemplate = {
  id: 'default',
  name: 'Default Kanban',
  description: 'Standard three-column Kanban board',
  columns: [
    { id: 'todo', title: 'To Do', wipLimit: null },
    { id: 'in-progress', title: 'In Progress', wipLimit: null },
    { id: 'done', title: 'Done', wipLimit: null }
  ]
}

/**
 * Software Development template
 */
export const softwareDevTemplate = {
  id: 'software-dev',
  name: 'Software Development',
  description: 'Board for software development workflow',
  columns: [
    { id: 'backlog', title: 'Backlog', wipLimit: null },
    { id: 'todo', title: 'To Do', wipLimit: null },
    { id: 'in-progress', title: 'In Progress', wipLimit: 3 },
    { id: 'review', title: 'Code Review', wipLimit: 2 },
    { id: 'testing', title: 'Testing', wipLimit: 2 },
    { id: 'done', title: 'Done', wipLimit: null }
  ]
}

/**
 * Project Management template
 */
export const projectMgmtTemplate = {
  id: 'project-mgmt',
  name: 'Project Management',
  description: 'Board for project management workflow',
  columns: [
    { id: 'ideas', title: 'Ideas', wipLimit: null },
    { id: 'planning', title: 'Planning', wipLimit: null },
    { id: 'in-progress', title: 'In Progress', wipLimit: 5 },
    { id: 'review', title: 'Review', wipLimit: 3 },
    { id: 'done', title: 'Completed', wipLimit: null }
  ]
}

/**
 * Simple To-Do template
 */
export const simpleTodoTemplate = {
  id: 'simple-todo',
  name: 'Simple To-Do',
  description: 'Simple two-column board',
  columns: [
    { id: 'todo', title: 'To Do', wipLimit: null },
    { id: 'done', title: 'Done', wipLimit: null }
  ]
}

/**
 * Bug Tracking template
 */
export const bugTrackingTemplate = {
  id: 'bug-tracking',
  name: 'Bug Tracking',
  description: 'Board for tracking bugs and issues',
  columns: [
    { id: 'reported', title: 'Reported', wipLimit: null },
    { id: 'investigating', title: 'Investigating', wipLimit: 3 },
    { id: 'fixing', title: 'Fixing', wipLimit: 4 },
    { id: 'testing', title: 'Testing Fix', wipLimit: 2 },
    { id: 'resolved', title: 'Resolved', wipLimit: null }
  ]
}

/**
 * Get all available templates
 * @returns {Array} Array of template objects
 */
export const getTemplates = () => {
  return [
    defaultTemplate,
    softwareDevTemplate,
    projectMgmtTemplate,
    simpleTodoTemplate,
    bugTrackingTemplate
  ]
}

/**
 * Get a template by ID
 * @param {string} templateId - Template identifier
 * @returns {Object|null} Template object or null if not found
 */
export const getTemplateById = (templateId) => {
  const templates = getTemplates()
  return templates.find(template => template.id === templateId) || null
}
