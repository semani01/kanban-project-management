/**
 * API Service Layer
 * Centralized API client for all backend requests
 * Replaces localStorage calls with RESTful API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Get authentication token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('auth_token')
}

/**
 * Set authentication token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('current_user')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Set current user
 */
export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('current_user')
  }
}

/**
 * Make API request with authentication
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken()
  const url = `${API_BASE_URL}${endpoint}`

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  }

  try {
    console.log('API Request:', { method: config.method || 'GET', url, endpoint })
    const response = await fetch(url, config)
    console.log('API Response:', { status: response.status, statusText: response.statusText, ok: response.ok })

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      setAuthToken(null)
      setCurrentUser(null)
      // Redirect to login or trigger login modal
      window.dispatchEvent(new CustomEvent('auth:logout'))
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: response.statusText || 'Request failed' }
      }
      
      // Handle validation errors array
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const errorMsg = errorData.errors[0]?.msg || 'Validation error'
        const errorObj = new Error(errorMsg)
        errorObj.errors = errorData.errors
        errorObj.error = errorMsg
        throw errorObj
      }
      // Handle single error message
      const errorMsg = errorData.error || `HTTP error! status: ${response.status}`
      const errorObj = new Error(errorMsg)
      errorObj.error = errorMsg
      throw errorObj
    }

    const data = await response.json()
    console.log('API Response data:', data)
    return data
  } catch (error) {
    console.error('API request failed:', error)
    console.error('Error type:', typeof error)
    console.error('Error name:', error.name)
    
    // If it's a network error, provide a better message
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend is running.')
      networkError.error = networkError.message
      throw networkError
    }
    
    throw error
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
    if (response.token) {
      setAuthToken(response.token)
      setCurrentUser(response.user)
    }
    return response
  },

  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    if (response.token) {
      setAuthToken(response.token)
      setCurrentUser(response.user)
    }
    return response
  },

  logout: () => {
    setAuthToken(null)
    setCurrentUser(null)
  }
}

/**
 * Users API
 */
export const usersAPI = {
  getAll: () => apiRequest('/users'),

  getCurrent: () => apiRequest('/users/me'),

  update: (userData) => apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),

  changePassword: (currentPassword, newPassword) => apiRequest('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  })
}

/**
 * Boards API
 */
export const boardsAPI = {
  getAll: () => apiRequest('/boards'),

  getById: (id) => apiRequest(`/boards/${id}`),

  create: (boardData) => apiRequest('/boards', {
    method: 'POST',
    body: JSON.stringify(boardData)
  }),

  update: (id, boardData) => apiRequest(`/boards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(boardData)
  }),

  delete: (id) => apiRequest(`/boards/${id}`, {
    method: 'DELETE'
  }),

  share: (id, userId, permission) => apiRequest(`/boards/${id}/share`, {
    method: 'POST',
    body: JSON.stringify({ userId, permission })
  }),

  unshare: (id, userId) => apiRequest(`/boards/${id}/share/${userId}`, {
    method: 'DELETE'
  })
}

/**
 * Tasks API
 */
export const tasksAPI = {
  getByBoard: (boardId) => apiRequest(`/tasks?boardId=${boardId}`),

  getById: (id) => apiRequest(`/tasks/${id}`),

  create: (taskData) => apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  }),

  update: (id, taskData) => apiRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  }),

  delete: (id) => apiRequest(`/tasks/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Activities API
 */
export const activitiesAPI = {
  getByBoard: (boardId) => apiRequest(`/activities?boardId=${boardId}`)
}

/**
 * Notifications API
 */
export const notificationsAPI = {
  getAll: () => apiRequest('/notifications'),

  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, {
    method: 'PUT'
  }),

  markAllAsRead: () => apiRequest('/notifications/read-all', {
    method: 'PUT'
  }),

  getUnreadCount: () => apiRequest('/notifications/unread-count')
}

/**
 * Automations API
 */
export const automationsAPI = {
  getAll: (boardId) => {
    const query = boardId ? `?boardId=${boardId}` : ''
    return apiRequest(`/automations${query}`)
  },

  create: (ruleData) => apiRequest('/automations', {
    method: 'POST',
    body: JSON.stringify(ruleData)
  }),

  update: (id, ruleData) => apiRequest(`/automations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ruleData)
  }),

  delete: (id) => apiRequest(`/automations/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Recurring Tasks API
 */
export const recurringAPI = {
  getAll: (boardId) => {
    const query = boardId ? `?boardId=${boardId}` : ''
    return apiRequest(`/recurring${query}`)
  },

  create: (templateData) => apiRequest('/recurring', {
    method: 'POST',
    body: JSON.stringify(templateData)
  }),

  update: (id, templateData) => apiRequest(`/recurring/${id}`, {
    method: 'PUT',
    body: JSON.stringify(templateData)
  }),

  delete: (id) => apiRequest(`/recurring/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Saved Filters API
 */
export const filtersAPI = {
  getAll: () => apiRequest('/filters'),

  create: (filterData) => apiRequest('/filters', {
    method: 'POST',
    body: JSON.stringify(filterData)
  }),

  update: (id, filterData) => apiRequest(`/filters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(filterData)
  }),

  delete: (id) => apiRequest(`/filters/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Custom Fields API
 */
export const customFieldsAPI = {
  getAll: (boardId) => {
    const query = boardId ? `?boardId=${boardId}` : ''
    return apiRequest(`/custom-fields${query}`)
  },

  create: (fieldData) => apiRequest('/custom-fields', {
    method: 'POST',
    body: JSON.stringify(fieldData)
  }),

  update: (id, fieldData) => apiRequest(`/custom-fields/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fieldData)
  }),

  delete: (id) => apiRequest(`/custom-fields/${id}`, {
    method: 'DELETE'
  })
}

export default {
  auth: authAPI,
  users: usersAPI,
  boards: boardsAPI,
  tasks: tasksAPI,
  activities: activitiesAPI,
  notifications: notificationsAPI,
  automations: automationsAPI,
  recurring: recurringAPI,
  filters: filtersAPI,
  customFields: customFieldsAPI
}
