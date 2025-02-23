// Environment variable validation
try {
  const missingVars = []
  if (!process.env.CALENDLY_CLIENT_ID) missingVars.push('CALENDLY_CLIENT_ID')
  if (!process.env.CALENDLY_CLIENT_SECRET) missingVars.push('CALENDLY_CLIENT_SECRET')
  if (!process.env.CALENDLY_WEBHOOK_SECRET) missingVars.push('CALENDLY_WEBHOOK_SECRET')
  if (!process.env.CALENDLY_REDIRECT_URI) missingVars.push('CALENDLY_REDIRECT_URI')
  
  if (missingVars.length > 0) {
    console.warn(`Missing Calendly environment variables: ${missingVars.join(', ')}. Calendly integration may not work properly.`)
  }
} catch (error) {
  console.warn('Failed to validate Calendly environment variables:', error)
}

// Core configuration
export const CALENDLY_CONFIG = {
  // API Configuration
  api: {
    baseUrl: 'https://api.calendly.com',
    version: 'v2'
  },

  // OAuth Configuration  
  oauth: {
    baseUrl: 'https://calendly.com',
    authorizePath: '/oauth/authorize',
    tokenPath: '/oauth/token',
    clientId: process.env.CALENDLY_CLIENT_ID || '',
    clientSecret: process.env.CALENDLY_CLIENT_SECRET || '',
    redirectUri: process.env.CALENDLY_REDIRECT_URI || ''
  },

  // Webhook Configuration
  webhook: {
    secret: process.env.CALENDLY_WEBHOOK_SECRET || '',
    signingKey: process.env.CALENDLY_WEBHOOK_SIGNING_KEY || ''
  },

  // Default Headers
  headers: {
    'Content-Type': 'application/json'
  }
}

// Helper to check if we should use real Calendly integration
export const useRealCalendly = () => {
  try {
    return process.env.USE_REAL_CALENDLY === 'true' && isCalendlyConfigured()
  } catch (error) {
    console.warn('Failed to check Calendly integration status:', error)
    return false
  }
}

// Helper to check if Calendly is properly configured
export const isCalendlyConfigured = () => {
  try {
    return !!(
      process.env.CALENDLY_CLIENT_ID && 
      process.env.CALENDLY_CLIENT_SECRET && 
      process.env.CALENDLY_WEBHOOK_SECRET &&
      process.env.CALENDLY_REDIRECT_URI
    )
  } catch (error) {
    console.warn('Failed to validate Calendly configuration:', error)
    return false
  }
} 