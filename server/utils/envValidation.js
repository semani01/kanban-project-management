/**
 * Environment Variable Validation for Server
 * Validates required environment variables on server startup
 */

/**
 * Validates server environment variables
 * @returns {Object} Validation result with isValid flag and missing variables
 */
export const validateServerEnvironment = () => {
  const required = {
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT || '3001',
    DB_PATH: process.env.DB_PATH,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }

  const missing = []
  const warnings = []

  // JWT_SECRET is critical for production
  if (!required.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      missing.push('JWT_SECRET')
    } else {
      warnings.push('JWT_SECRET not set - using default (not secure for production)')
      // Set a default for development only
      process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    }
  }

  // DB_PATH is optional (has default)
  if (!required.DB_PATH) {
    warnings.push('DB_PATH not set - using default location')
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    values: required
  }
}

/**
 * Logs environment validation warnings
 */
export const logServerEnvironmentWarnings = () => {
  const validation = validateServerEnvironment()
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Environment Warnings:')
    validation.warnings.forEach(warning => {
      console.warn(`   - ${warning}`)
    })
  }

  if (validation.missing.length > 0) {
    console.error('❌ Missing Required Environment Variables:')
    validation.missing.forEach(variable => {
      console.error(`   - ${variable}`)
    })
    console.error('Please set these variables before starting the server in production.')
  }

  return validation
}
