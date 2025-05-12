// Auth context exports
export { getAuthContext, getCurrentUserId, UnauthorizedError } from './auth-context'

// Auth client exports
export { createAuthClient } from './auth-client'
export { createServerAuthClient } from './server-client'

// Auth utilities exports
export {
  verifyAuth,
  isAuthorized,
  handleAuthError
} from './auth-utils'

// User management exports
export {
  createUserIfNotExists,
  getUserById,
  UserNotFoundError,
  type UserContext
} from './user-management'

// Re-export types
export type { AuthResult, AuthorizationResult } from './auth-utils'

// Auth Permission Service for centralized permission logic
export { 
  permissionService,
  systemRoleHierarchy,
  orgLevelHierarchy
} from './permission-service'

// Cal.com authentication helpers
export {
  getAuthenticatedUserUlid,
  getCalendarIntegration,
  getAuthenticatedCalUser
} from './cal-auth-helpers' 