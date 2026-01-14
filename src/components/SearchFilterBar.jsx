import React from 'react'
import { CATEGORIES } from '../utils/categories'

/**
 * SearchFilterBar Component
 * Provides search, filter, and sort functionality for tasks
 * 
 * @param {string} searchQuery - Current search query
 * @param {Function} onSearchChange - Callback when search query changes
 * @param {string} selectedCategory - Currently selected category filter
 * @param {Function} onCategoryChange - Callback when category filter changes
 * @param {string} selectedPriority - Currently selected priority filter
 * @param {Function} onPriorityChange - Callback when priority filter changes
 * @param {string} sortBy - Current sort option
 * @param {Function} onSortChange - Callback when sort option changes
 * @param {Object} searchInputRef - Ref for search input (for keyboard shortcuts)
 */
const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedPriority,
  onPriorityChange,
  sortBy,
  onSortChange,
  searchInputRef
}) => {
  return (
    <div className="search-filter-bar">
      {/* Search input */}
      <div className="search-group">
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search tasks"
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Category filter */}
      <div className="filter-group">
        <label htmlFor="category-filter">Category:</label>
        <select
          id="category-filter"
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Priority filter */}
      <div className="filter-group">
        <label htmlFor="priority-filter">Priority:</label>
        <select
          id="priority-filter"
          className="filter-select"
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Sort options */}
      <div className="filter-group">
        <label htmlFor="sort-select">Sort by:</label>
        <select
          id="sort-select"
          className="filter-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="priority">Priority</option>
          <option value="dueDate">Due Date</option>
          <option value="title">Title</option>
          <option value="created">Created Date</option>
        </select>
      </div>

      {/* Clear filters button */}
      {(searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all') && (
        <button
          className="btn-clear-filters"
          onClick={() => {
            onSearchChange('')
            onCategoryChange('all')
            onPriorityChange('all')
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}

export default SearchFilterBar
