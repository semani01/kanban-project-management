/**
 * Environment Variable Validation
 * Validates required environment variables and provides defaults
 */

/**
 * Validates environment variables for production
 * @returns {Object} Validation result with isValid flag and missing variables
 */
export const validateEnvironment = () => {
  const required = {
    // Frontend - API URL should be set in production
    VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  }

  const missing = []
  const warnings = []

  // Check if we're in production
  const isProduction = import.meta.env.PROD

  if (isProduction) {
    // In production, API URL should be explicitly set
    if (!import.meta.env.VITE_API_URL) {
      warnings.push('VITE_API_URL not set - using default localhost URL (not recommended for production)')
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    values: required
  }
}

/**
 * Gets API base URL with validation
 * @returns {string} API base URL
 */
export const getApiUrl = () => {
  const validation = validateEnvironment()
  return validation.values.VITE_API_URL
}

/**
 * Logs environment validation warnings in development
 */
export const logEnvironmentWarnings = () => {
  if (import.meta.env.DEV) {
    const validation = validateEnvironment()
    if (validation.warnings.length > 0) {
      console.warn('Environment Warnings:', validation.warnings)
    }
  }
}
