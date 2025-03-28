import { hasPermission, PERMISSIONS, ORG_ROLES, SystemRole, OrgRole, OrgLevel, Permission, UserCapability, SYSTEM_ROLES, USER_CAPABILITIES } from '@/utils/roles/roles';
import { AuthContext } from '@/utils/types/auth';
import {
  ForbiddenError,
  UnauthorizedError,
  type AuthOptions,
} from '../types/auth';
import { ORG_LEVELS } from '../roles/roles';

// Define the hierarchies for checking role access
export const systemRoleHierarchy: Record<string, number> = {
  SYSTEM_OWNER: 100,
  SYSTEM_MODERATOR: 50,
  USER: 1
};

export const orgLevelHierarchy: Record<string, number> = {
  GLOBAL: 100,
  REGIONAL: 75,
  LOCAL: 50,
  BRANCH: 25
};

// Business roles that have access to business dashboard
export const businessDashboardRoles = [
  ORG_ROLES.OWNER,
  ORG_ROLES.DIRECTOR,
  ORG_ROLES.MANAGER
] as const;

type PermissionPolicy = 'requireAll' | 'requireAny';

/**
 * Permission Service: Centralized authorization logic
 */
class PermissionService {
  private cache = new Map<string, boolean>();
  private user: AuthContext | null = null;
  private lastSetTimestamp: number = 0;

  /**
   * Set the current user context
   */
  setUser(user: AuthContext | null): void {
    const now = Date.now();
    
    if (this.user?.userId !== user?.userId) {
      this.cache.clear();
    }
    
    this.user = user;
    this.lastSetTimestamp = now;
  }

  /**
   * Get the current user context
   */
  getUser(): AuthContext | null {
    return this.user;
  }

  /**
   * Get the timestamp of when the user context was last set
   */
  getLastSetTimestamp(): number {
    return this.lastSetTimestamp;
  }

  /**
   * Main permission check method
   * This is used by the withServerAction wrapper
   */
  check(options: AuthOptions): boolean {
    if (!this.user) {
      return false;
    }
    
    const hasOrganization = !!this.user.organizationUlid && !!this.user.orgRole;
    
    if (this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER || hasOrganization) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user can access business dashboard
   */
  canAccessBusinessDashboard(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'business_dashboard_access';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const hasValidOrg = !!this.user.organizationUlid && !!this.user.orgRole;
    const hasValidOrgRole = !!this.user.orgRole && 
      (businessDashboardRoles as readonly string[]).includes(this.user.orgRole);
    const isSystemOwner = this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER;
    const result = isSystemOwner || (hasValidOrg && hasValidOrgRole);
    
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Check if user can access coach dashboard
   */
  canAccessCoachDashboard(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'coach_dashboard_access';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // User must have COACH capability or be a system owner
    const result = this.user.capabilities.includes(USER_CAPABILITIES.COACH) || 
                  this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER;
    
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Check if user can access mentee dashboard
   */
  canAccessMenteeDashboard(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'mentee_dashboard_access';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // User must have MENTEE capability or be a system owner
    const result = this.user.capabilities.includes(USER_CAPABILITIES.MENTEE) || 
                  this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER;
    
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Check if user can access system dashboard
   */
  canAccessSystemDashboard(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'system_dashboard_access';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Only system owners can access the system dashboard
    const result = this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER;
    
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Check if user can manage coach profile
   */
  canManageCoachProfile(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'manage_coach_profile';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // User must have COACH capability or be a system owner
    const result = this.user.capabilities.includes(USER_CAPABILITIES.COACH) || 
                  this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER;
    
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Check if user can view analytics for the organization
   */
  canViewOrgAnalytics(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'org_analytics_access';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    if (this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER) {
      this.cache.set(cacheKey, true);
      return true;
    }
    
    const hasRequiredRole = this.user.orgRole === ORG_ROLES.OWNER || 
                           this.user.orgRole === ORG_ROLES.DIRECTOR;
    
    this.cache.set(cacheKey, hasRequiredRole);
    return hasRequiredRole;
  }

  /**
   * Check if user can manage organization members
   */
  canManageOrgMembers(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'manage_org_members';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    if (this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER) {
      this.cache.set(cacheKey, true);
      return true;
    }
    
    const hasRequiredRole = this.user.orgRole === ORG_ROLES.OWNER || 
                           this.user.orgRole === ORG_ROLES.DIRECTOR;
    
    this.cache.set(cacheKey, hasRequiredRole);
    return hasRequiredRole;
  }

  /**
   * Check if user can access business billing
   */
  canAccessBusinessBilling(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'business_billing_access';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    if (this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER) {
      this.cache.set(cacheKey, true);
      return true;
    }
    
    const hasRequiredRole = this.user.orgRole === ORG_ROLES.OWNER || 
                           this.user.orgRole === ORG_ROLES.DIRECTOR;
    
    this.cache.set(cacheKey, hasRequiredRole);
    return hasRequiredRole;
  }

  /**
   * Check if user can access business permissions
   */
  canAccessBusinessPermissions(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'business_permissions_access';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    if (this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER) {
      this.cache.set(cacheKey, true);
      return true;
    }
    
    const hasRequiredRole = this.user.orgRole === ORG_ROLES.OWNER || 
                           this.user.orgRole === ORG_ROLES.DIRECTOR;
    
    this.cache.set(cacheKey, hasRequiredRole);
    return hasRequiredRole;
  }

  /**
   * Check if user is an organization owner
   */
  isOrganizationOwner(): boolean {
    if (!this.user) return false;
    
    const cacheKey = 'is_org_owner';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    if (this.user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER) {
      this.cache.set(cacheKey, true);
      return true;
    }
    
    const hasOrgUlid = !!this.user.organizationUlid;
    const isOwner = hasOrgUlid && this.user.orgRole === ORG_ROLES.OWNER;
    
    this.cache.set(cacheKey, isOwner);
    return isOwner;
  }

  /**
   * Clear the entire permission cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate a unique cache key for permission options
   */
  private generateCacheKey(options: AuthOptions): string {
    const {
      requiredSystemRole,
      requiredOrgRole,
      requiredOrgLevel,
      requiredPermissions,
      requiredCapabilities,
      requireAll,
      requireOrganization
    } = options;
    
    const key = [
      requiredSystemRole || '',
      requiredOrgRole || '',
      requiredOrgLevel || '',
      requiredPermissions?.join(',') || '',
      requiredCapabilities?.join(',') || '',
      requireAll ? 'all' : 'any',
      requireOrganization ? 'org' : ''
    ].join('|');
    
    return key;
  }

  /**
   * Perform actual permission checks
   */
  private checkPermissions(
    user: AuthContext,
    options: AuthOptions,
    policy: PermissionPolicy
  ): boolean {
    const {
      requiredSystemRole,
      requiredOrgRole,
      requiredOrgLevel,
      requiredPermissions,
      requiredCapabilities,
      requireOrganization
    } = options;

    if (user.systemRole === SYSTEM_ROLES.SYSTEM_OWNER) {
      return true;
    }

    if (requireOrganization && !user.orgRole) {
      return false;
    }

    const checks: boolean[] = [];

    if (requiredSystemRole) {
      const hasSystemRole = systemRoleHierarchy[user.systemRole] >= systemRoleHierarchy[requiredSystemRole];
      checks.push(hasSystemRole);
    }

    if (requiredOrgRole && user.orgRole) {
      const orgRoleValue = ORG_ROLES[user.orgRole] || 0;
      const requiredValue = ORG_ROLES[requiredOrgRole] || 0;
      const hasOrgRole = orgRoleValue >= requiredValue;
      checks.push(hasOrgRole);
    } else if (requiredOrgRole) {
      checks.push(false);
    }

    if (requiredOrgLevel && user.orgLevel) {
      const levelValue = orgLevelHierarchy[user.orgLevel] || 0;
      const requiredValue = orgLevelHierarchy[requiredOrgLevel] || 0;
      const hasOrgLevel = levelValue >= requiredValue;
      checks.push(hasOrgLevel);
    } else if (requiredOrgLevel) {
      checks.push(false);
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      for (const permission of requiredPermissions) {
        const hasRequiredPermission = hasPermission(user, permission as Permission);
        checks.push(hasRequiredPermission);
        
        if (policy === 'requireAny' && hasRequiredPermission) {
          return true;
        }
      }
    }

    if (requiredCapabilities && requiredCapabilities.length > 0) {
      for (const capability of requiredCapabilities) {
        const hasCapability = user.capabilities.includes(capability);
        checks.push(hasCapability);
        
        if (policy === 'requireAny' && hasCapability) {
          return true;
        }
      }
    }

    if (checks.length === 0) {
      return false;
    }

    return policy === 'requireAll' ? checks.every(result => result) : checks.some(result => result);
  }

  /**
   * Enforce permissions or throw error
   */
  enforce(options: AuthOptions): void {
    if (!this.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!this.check(options)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  }
}

// Export as a singleton
export const permissionService = new PermissionService(); 