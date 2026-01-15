/**
 * Error Handling Middleware
 */

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Database constraint violation',
      message: err.message
    })
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    })
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
}
