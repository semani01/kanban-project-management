/**
 * Task templates - Pre-configured task setups
 * Provides ready-to-use task configurations for quick creation
 */

/**
 * Default task templates
 */
export const taskTemplates = [
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Template for reporting bugs',
    template: {
      title: 'Bug: ',
      description: '**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n\n**Environment:**\n- Browser: \n- OS: ',
      priority: 'high',
      category: 'work'
    }
  },
  {
    id: 'feature-request',
    name: 'Feature Request',
    description: 'Template for feature requests',
    template: {
      title: 'Feature: ',
      description: '**Description:**\n\n**Use Case:**\n\n**Proposed Solution:**\n\n**Benefits:**',
      priority: 'medium',
      category: 'work'
    }
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Template for meeting notes',
    template: {
      title: 'Meeting: ',
      description: '**Date:** \n**Attendees:**\n\n**Agenda:**\n1. \n2. \n3. \n\n**Action Items:**\n- [ ] \n- [ ] \n\n**Notes:**',
      priority: 'medium',
      category: 'work'
    }
  },
  {
    id: 'todo-item',
    name: 'Simple To-Do',
    description: 'Basic to-do item',
    template: {
      title: '',
      description: '',
      priority: 'medium',
      category: 'personal'
    }
  },
  {
    id: 'shopping-item',
    name: 'Shopping Item',
    description: 'Template for shopping list items',
    template: {
      title: '',
      description: '**Store:** \n**Quantity:** \n**Notes:**',
      priority: 'low',
      category: 'shopping'
    }
  }
]

/**
 * Gets all task templates
 * @returns {Array} Array of template objects
 */
export const getTaskTemplates = () => {
  return taskTemplates
}

/**
 * Gets a task template by ID
 * @param {string} templateId - Template identifier
 * @returns {Object|null} Template object or null if not found
 */
export const getTaskTemplateById = (templateId) => {
  return taskTemplates.find(template => template.id === templateId) || null
}

/**
 * Creates a task from a template
 * @param {string} templateId - Template identifier
 * @returns {Object} Task object with template data
 */
export const createTaskFromTemplate = (templateId) => {
  const template = getTaskTemplateById(templateId)
  if (!template) {
    return null
  }

  return {
    ...template.template,
    // User can fill in the title and other fields
  }
}
