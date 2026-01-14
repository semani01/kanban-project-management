/**
 * Custom Fields Utility Functions
 * Handles custom field definitions and management
 */

const CUSTOM_FIELDS_STORAGE_KEY = 'kanban-custom-fields'

/**
 * Field types
 */
export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  URL: 'url',
  EMAIL: 'email'
}

/**
 * Loads custom field definitions from localStorage
 * @param {string} boardId - Board ID (optional, for board-specific fields)
 * @returns {Array} Array of custom field definition objects
 */
export const loadCustomFields = (boardId = null) => {
  try {
    const stored = localStorage.getItem(CUSTOM_FIELDS_STORAGE_KEY)
    const allFields = stored ? JSON.parse(stored) : []
    
    if (boardId) {
      return allFields.filter(field => 
        !field.boardId || field.boardId === boardId
      )
    }
    
    return allFields
  } catch (error) {
    console.error('Error loading custom fields:', error)
    return []
  }
}

/**
 * Saves custom field definitions to localStorage
 * @param {Array} fields - Array of custom field definition objects
 */
export const saveCustomFields = (fields) => {
  try {
    localStorage.setItem(CUSTOM_FIELDS_STORAGE_KEY, JSON.stringify(fields))
  } catch (error) {
    console.error('Error saving custom fields:', error)
  }
}

/**
 * Creates a new custom field definition
 * @param {Object} fieldData - Field configuration
 * @returns {Object} Custom field definition object
 */
export const createCustomField = (fieldData) => {
  return {
    id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: fieldData.name || 'Untitled Field',
    type: fieldData.type || FIELD_TYPES.TEXT,
    boardId: fieldData.boardId || null, // null means applies to all boards
    required: fieldData.required || false,
    defaultValue: fieldData.defaultValue || null,
    options: fieldData.options || [], // For SELECT type
    placeholder: fieldData.placeholder || '',
    description: fieldData.description || '',
    order: fieldData.order || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Validates a custom field value
 * @param {Object} field - Field definition
 * @param {*} value - Value to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateCustomFieldValue = (field, value) => {
  // Check required
  if (field.required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: `${field.name} is required` }
  }

  // Type-specific validation
  switch (field.type) {
    case FIELD_TYPES.NUMBER:
      if (value !== null && value !== undefined && value !== '') {
        if (isNaN(Number(value))) {
          return { valid: false, error: `${field.name} must be a number` }
        }
      }
      break
    
    case FIELD_TYPES.DATE:
      if (value !== null && value !== undefined && value !== '') {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return { valid: false, error: `${field.name} must be a valid date` }
        }
      }
      break
    
    case FIELD_TYPES.EMAIL:
      if (value !== null && value !== undefined && value !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return { valid: false, error: `${field.name} must be a valid email` }
        }
      }
      break
    
    case FIELD_TYPES.URL:
      if (value !== null && value !== undefined && value !== '') {
        try {
          new URL(value)
        } catch {
          return { valid: false, error: `${field.name} must be a valid URL` }
        }
      }
      break
    
    case FIELD_TYPES.SELECT:
      if (value !== null && value !== undefined && value !== '') {
        if (!field.options.includes(value)) {
          return { valid: false, error: `${field.name} must be one of the allowed values` }
        }
      }
      break
    
    default:
      break
  }

  return { valid: true, error: null }
}

/**
 * Gets the default value for a custom field
 * @param {Object} field - Field definition
 * @returns {*} Default value
 */
export const getCustomFieldDefaultValue = (field) => {
  if (field.defaultValue !== null && field.defaultValue !== undefined) {
    return field.defaultValue
  }

  switch (field.type) {
    case FIELD_TYPES.CHECKBOX:
      return false
    case FIELD_TYPES.NUMBER:
      return 0
    case FIELD_TYPES.SELECT:
      return field.options.length > 0 ? field.options[0] : ''
    default:
      return ''
  }
}

/**
 * Formats a custom field value for display
 * @param {Object} field - Field definition
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
export const formatCustomFieldValue = (field, value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  switch (field.type) {
    case FIELD_TYPES.DATE:
      return new Date(value).toLocaleDateString()
    case FIELD_TYPES.CHECKBOX:
      return value ? 'Yes' : 'No'
    case FIELD_TYPES.URL:
      return value // Could be formatted as a link in the UI
    default:
      return String(value)
  }
}
