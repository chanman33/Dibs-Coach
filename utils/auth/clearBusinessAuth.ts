import { permissionService } from './permission-service';

/**
 * Utility function to clear the business portal authentication cache
 * This is useful when:
 * 1. User logs out
 * 2. User role changes
 * 3. Organization membership changes
 * 4. Permission errors need to be reset
 */
export const clearBusinessAuth = () => {
  if (typeof window !== 'undefined') {
    // Clear session storage cache
    sessionStorage.removeItem('business_portal_auth');
    
    // Clear permission cache
    permissionService.clearCache();
    
    console.log("[BUSINESS_AUTH] Cleared business portal auth cache");
  }
};

/**
 * Utility function to check if the user has cached business portal authorization
 * @returns boolean indicating if the user has cached business authorization
 */
export const hasBusinessAuth = (): boolean => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('business_portal_auth') === 'authorized';
  }
  return false;
};

/**
 * Utility function to set the business portal authorization cache
 */
export const setBusinessAuth = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('business_portal_auth', 'authorized');
    console.log("[BUSINESS_AUTH] Set business portal auth cache");
  }
}; 