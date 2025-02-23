import { env } from '@/lib/env'

// Environment variable validation
try {
  const missingVars = []
  if (!env.CALENDLY_CLIENT_ID) missingVars.push('CALENDLY_CLIENT_ID')
  if (!env.CALENDLY_CLIENT_SECRET) missingVars.push('CALENDLY_CLIENT_SECRET')
  if (!env.CALENDLY_WEBHOOK_SECRET) missingVars.push('CALENDLY_WEBHOOK_SECRET')
  if (!env.CALENDLY_REDIRECT_URI) missingVars.push('CALENDLY_REDIRECT_URI')
  
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
    clientId: env.CALENDLY_CLIENT_ID,
    clientSecret: env.CALENDLY_CLIENT_SECRET,
    redirectUri: env.CALENDLY_REDIRECT_URI
  },

  // Webhook Configuration
  webhook: {
    secret: env.CALENDLY_WEBHOOK_SECRET,
    signingKey: env.CALENDLY_WEBHOOK_SIGNING_KEY || ''
  },

  // Default Headers
  headers: {
    'Content-Type': 'application/json'
  }
}

// Helper to check if we should use real Calendly integration
export const useRealCalendly = () => {
  return env.USE_REAL_CALENDLY && isCalendlyConfigured()
}

// Helper to check if Calendly is properly configured
export const isCalendlyConfigured = () => {
  return !!(
    env.CALENDLY_CLIENT_ID && 
    env.CALENDLY_CLIENT_SECRET && 
    env.CALENDLY_WEBHOOK_SECRET &&
    env.CALENDLY_REDIRECT_URI
  )
} 