import React, { useState, useMemo } from 'react'
import { formatDate, isSameDay, getDaysInMonth, getFirstDayOfMonth, getStartOfWeek, getEndOfWeek } from '../utils/dateUtils'
import { getCategoryById } from '../utils/categories'

/**
 * CalendarView Component
 * Displays tasks in a calendar format with month view
 * Shows tasks by their due dates
 * 
 * @param {Array} tasks - Array of all tasks
 * @param {Function} onTaskClick - Callback when a task is clicked
 * @param {Date} currentDate - Current date to display (defaults to today)
 */
const CalendarView = ({ tasks = [], onTaskClick, currentDate = new Date() }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate))
  
  // Get month and year for display
  const month = viewDate.getMonth()
  const year = viewDate.getFullYear()
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  // Get all days in the month
  const daysInMonth = useMemo(() => getDaysInMonth(viewDate), [viewDate])
  
  // Get first day of month and its day of week (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = getFirstDayOfMonth(viewDate)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  
  // Create calendar grid (6 weeks x 7 days = 42 cells)
  const calendarDays = useMemo(() => {
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    daysInMonth.forEach(day => {
      days.push(day)
    })
    
    // Fill remaining cells to complete the grid (42 total)
    while (days.length < 42) {
      days.push(null)
    }
    
    return days
  }, [daysInMonth, firstDayOfWeek])
  
  // Group tasks by due date (using YYYY-MM-DD format for consistent key)
  const tasksByDate = useMemo(() => {
    const grouped = {}
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate)
        const dateKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(task)
      }
    })
    
    return grouped
  }, [tasks])
  
  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    if (!date) return []
    
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return tasksByDate[dateKey] || []
  }
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }
  
  // Navigate to next month
  const goToNextMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }
  
  // Navigate to today
  const goToToday = () => {
    setViewDate(new Date())
  }
  
  // Check if a date is today
  const isToday = (date) => {
    if (!date) return false
    return isSameDay(date, new Date())
  }
  
  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  return (
    <div className="calendar-view">
      {/* Calendar header with navigation */}
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
          ← Prev
        </button>
        <h2 className="calendar-month-title">{monthName}</h2>
        <button className="calendar-nav-btn" onClick={goToNextMonth}>
          Next →
        </button>
        <button className="calendar-today-btn" onClick={goToToday}>
          Today
        </button>
      </div>
      
      {/* Calendar grid */}
      <div className="calendar-grid">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday-header">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const dayTasks = getTasksForDate(date)
          const isCurrentDay = date && isToday(date)
          const isCurrentMonth = date && date.getMonth() === month
          
          return (
            <div
              key={index}
              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isCurrentDay ? 'today' : ''}`}
            >
              {date && (
                <>
                  {/* Day number */}
                  <div className="calendar-day-number">
                    {date.getDate()}
                  </div>
                  
                  {/* Tasks for this day */}
                  <div className="calendar-day-tasks">
                    {dayTasks.slice(0, 3).map(task => {
                      const category = task.category ? getCategoryById(task.category) : null
                      const priorityColors = {
                        high: '#ef4444',
                        medium: '#f59e0b',
                        low: '#10b981'
                      }
                      
                      return (
                        <div
                          key={task.id}
                          className="calendar-task-item"
                          style={{
                            borderLeftColor: priorityColors[task.priority] || priorityColors.medium
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onTaskClick) onTaskClick(task)
                          }}
                          title={task.title}
                        >
                          <span className="calendar-task-title">{task.title}</span>
                          {category && (
                            <span
                              className="calendar-task-category"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.name}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <div className="calendar-task-more">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarView
