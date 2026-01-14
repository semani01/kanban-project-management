import React, { useState, useEffect } from 'react'
import {
  loadSavedFilters,
  saveSavedFilters,
  createSavedFilter,
  applyFilter,
  validateSavedFilter
} from '../utils/advancedSearch'
import { CATEGORIES } from '../utils/categories'
import { formatDateForInput } from '../utils/dateUtils'

/**
 * AdvancedSearch Component
 * Advanced search with saved filters
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {Function} onApplyFilter - Callback when a filter is applied
 * @param {Array} tasks - Array of all tasks
 * @param {Array} users - Array of all users
 */
const AdvancedSearch = ({ isOpen, onClose, onApplyFilter, tasks = [], users = [] }) => {
  const [savedFilters, setSavedFilters] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingFilter, setEditingFilter] = useState(null)
  const [filterData, setFilterData] = useState({
    name: '',
    description: '',
    searchQuery: '',
    category: 'all',
    priority: 'all',
    status: 'all',
    assignedTo: 'all',
    dueDateRange: null,
    hasSubtasks: null,
    hasDependencies: null,
    timeTrackingStatus: 'all',
    sortBy: 'priority',
    sortOrder: 'desc'
  })
  const [errors, setErrors] = useState({})
  const [previewCount, setPreviewCount] = useState(0)

  // Load saved filters on mount
  useEffect(() => {
    if (isOpen) {
      setSavedFilters(loadSavedFilters())
    }
  }, [isOpen])

  // Update preview count when filter changes
  useEffect(() => {
    if (isOpen) {
      const filtered = applyFilter(tasks, filterData)
      setPreviewCount(filtered.length)
    }
  }, [filterData, tasks, isOpen])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilterData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? null : value)
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle date range changes
  const handleDateRangeChange = (field, value) => {
    setFilterData(prev => ({
      ...prev,
      dueDateRange: {
        ...prev.dueDateRange,
        [field]: value ? new Date(value).toISOString() : null
      }
    }))
  }

  // Handle save filter
  const handleSaveFilter = (e) => {
    e.preventDefault()

    const filter = editingFilter
      ? { ...editingFilter, ...filterData, updatedAt: new Date().toISOString() }
      : createSavedFilter(filterData)

    const validation = validateSavedFilter(filter)
    if (!validation.valid) {
      setErrors({ form: validation.errors.join(', ') })
      return
    }

    const allFilters = loadSavedFilters()
    const updatedFilters = editingFilter
      ? allFilters.map(f => f.id === editingFilter.id ? filter : f)
      : [...allFilters, filter]

    saveSavedFilters(updatedFilters)
    setSavedFilters(updatedFilters)
    handleReset()
  }

  // Apply a saved filter
  const handleApplyFilter = (filter) => {
    if (onApplyFilter) {
      const filtered = applyFilter(tasks, filter)
      onApplyFilter(filter, filtered)
    }
    onClose()
  }

  // Delete a saved filter
  const handleDeleteFilter = (filterId) => {
    if (window.confirm('Are you sure you want to delete this saved filter?')) {
      const allFilters = loadSavedFilters()
      const updatedFilters = allFilters.filter(f => f.id !== filterId)
      saveSavedFilters(updatedFilters)
      setSavedFilters(updatedFilters)
    }
  }

  // Load a filter for editing
  const handleEditFilter = (filter) => {
    setFilterData({
      name: filter.name,
      description: filter.description || '',
      searchQuery: filter.searchQuery || '',
      category: filter.category || 'all',
      priority: filter.priority || 'all',
      status: filter.status || 'all',
      assignedTo: filter.assignedTo || 'all',
      dueDateRange: filter.dueDateRange || null,
      hasSubtasks: filter.hasSubtasks ?? null,
      hasDependencies: filter.hasDependencies ?? null,
      timeTrackingStatus: filter.timeTrackingStatus || 'all',
      sortBy: filter.sortBy || 'priority',
      sortOrder: filter.sortOrder || 'desc'
    })
    setEditingFilter(filter)
    setIsEditing(true)
  }

  // Reset form
  const handleReset = () => {
    setFilterData({
      name: '',
      description: '',
      searchQuery: '',
      category: 'all',
      priority: 'all',
      status: 'all',
      assignedTo: 'all',
      dueDateRange: null,
      hasSubtasks: null,
      hasDependencies: null,
      timeTrackingStatus: 'all',
      sortBy: 'priority',
      sortOrder: 'desc'
    })
    setEditingFilter(null)
    setIsEditing(false)
    setErrors({})
  }

  // Apply current filter
  const handleApplyCurrentFilter = () => {
    handleApplyFilter(filterData)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content advanced-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Advanced Search</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="advanced-search-content">
          {/* Saved filters */}
          <div className="saved-filters-section">
            <h3>Saved Filters</h3>
            {savedFilters.length === 0 ? (
              <p className="no-filters">No saved filters.</p>
            ) : (
              <div className="filters-list">
                {savedFilters.map(filter => (
                  <div key={filter.id} className="filter-item">
                    <div className="filter-info">
                      <h4>{filter.name}</h4>
                      {filter.description && <p>{filter.description}</p>}
                    </div>
                    <div className="filter-actions">
                      <button
                        className="btn-apply"
                        onClick={() => handleApplyFilter(filter)}
                      >
                        Apply
                      </button>
                      <button
                        className="btn-edit-small"
                        onClick={() => handleEditFilter(filter)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete-small"
                        onClick={() => handleDeleteFilter(filter.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search form */}
          <div className="search-form-section">
            <h3>{isEditing ? 'Edit Filter' : 'Create New Filter'}</h3>
            <form onSubmit={handleSaveFilter} className="search-form">
              {errors.form && <div className="error-message">{errors.form}</div>}

              <div className="form-group">
                <label>Filter Name *</label>
                <input
                  type="text"
                  name="name"
                  value={filterData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., High Priority Overdue"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={filterData.description}
                  onChange={handleChange}
                  placeholder="Optional description"
                />
              </div>

              <div className="form-group">
                <label>Search Query</label>
                <input
                  type="text"
                  name="searchQuery"
                  value={filterData.searchQuery}
                  onChange={handleChange}
                  placeholder="Search in title, description, comments..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={filterData.category} onChange={handleChange}>
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={filterData.priority} onChange={handleChange}>
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={filterData.status} onChange={handleChange}>
                    <option value="all">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assigned To</label>
                  <select name="assignedTo" value={filterData.assignedTo} onChange={handleChange}>
                    <option value="all">All Users</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Due Date Range</label>
                <div className="date-range">
                  <input
                    type="date"
                    value={filterData.dueDateRange?.start ? formatDateForInput(filterData.dueDateRange.start) : ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    placeholder="Start date"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={filterData.dueDateRange?.end ? formatDateForInput(filterData.dueDateRange.end) : ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    placeholder="End date"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Has Subtasks</label>
                  <select
                    name="hasSubtasks"
                    value={filterData.hasSubtasks === null ? '' : filterData.hasSubtasks}
                    onChange={(e) => setFilterData(prev => ({
                      ...prev,
                      hasSubtasks: e.target.value === '' ? null : e.target.value === 'true'
                    }))}
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Time Tracking Status</label>
                  <select
                    name="timeTrackingStatus"
                    value={filterData.timeTrackingStatus}
                    onChange={handleChange}
                  >
                    <option value="all">All</option>
                    <option value="on-track">On Track</option>
                    <option value="at-risk">At Risk</option>
                    <option value="over-budget">Over Budget</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sort By</label>
                  <select name="sortBy" value={filterData.sortBy} onChange={handleChange}>
                    <option value="priority">Priority</option>
                    <option value="dueDate">Due Date</option>
                    <option value="title">Title</option>
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Sort Order</label>
                  <select name="sortOrder" value={filterData.sortOrder} onChange={handleChange}>
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>

              <div className="filter-preview">
                <strong>Preview: {previewCount} tasks match this filter</strong>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-apply" onClick={handleApplyCurrentFilter}>
                  Apply Filter
                </button>
                {isEditing && (
                  <button type="button" className="btn-cancel" onClick={handleReset}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-submit">
                  {isEditing ? 'Update Filter' : 'Save Filter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedSearch
