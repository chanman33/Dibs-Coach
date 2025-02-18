// System-level roles (from Prisma schema)
export const SYSTEM_ROLES = {
  SYSTEM_OWNER: 'SYSTEM_OWNER',
  SYSTEM_MODERATOR: 'SYSTEM_MODERATOR',
  USER: 'USER',
} as const;

export type SystemRole = keyof typeof SYSTEM_ROLES;

// Organization-level roles (from Prisma schema)
export const ORG_ROLES = {
  // Global Level Roles
  GLOBAL_OWNER: 'GLOBAL_OWNER',
  GLOBAL_DIRECTOR: 'GLOBAL_DIRECTOR',
  GLOBAL_MANAGER: 'GLOBAL_MANAGER',
  
  // Regional Level Roles
  REGIONAL_OWNER: 'REGIONAL_OWNER',
  REGIONAL_DIRECTOR: 'REGIONAL_DIRECTOR',
  REGIONAL_MANAGER: 'REGIONAL_MANAGER',
  
  // Local Level Roles
  LOCAL_OWNER: 'LOCAL_OWNER',
  LOCAL_DIRECTOR: 'LOCAL_DIRECTOR',
  LOCAL_MANAGER: 'LOCAL_MANAGER',
  
  // Standard Roles
  OWNER: 'OWNER',
  DIRECTOR: 'DIRECTOR',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
} as const;

export type OrgRole = typeof ORG_ROLES[keyof typeof ORG_ROLES];

// User capabilities (from Prisma schema)
export const USER_CAPABILITIES = {
  COACH: 'COACH',
  MENTEE: 'MENTEE',
} as const;

export type UserCapability = typeof USER_CAPABILITIES[keyof typeof USER_CAPABILITIES];

// Organization levels (from Prisma schema)
export const ORG_LEVELS = {
  GLOBAL: 'GLOBAL',
  REGIONAL: 'REGIONAL',
  LOCAL: 'LOCAL',
  BRANCH: 'BRANCH',
} as const;

export type OrgLevel = typeof ORG_LEVELS[keyof typeof ORG_LEVELS];

// Permission definitions
export const PERMISSIONS = {
  // System Management
  MANAGE_SYSTEM: 'MANAGE_SYSTEM',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_COACHES: 'MANAGE_COACHES',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  VIEW_LOGS: 'VIEW_LOGS',
  
  // Coach Management
  MANAGE_SESSIONS: 'MANAGE_SESSIONS',
  VIEW_COACH_ANALYTICS: 'VIEW_COACH_ANALYTICS',
  MANAGE_AVAILABILITY: 'MANAGE_AVAILABILITY',
  
  // User Management
  BOOK_SESSIONS: 'BOOK_SESSIONS',
  VIEW_HISTORY: 'VIEW_HISTORY',
  MANAGE_PROFILE: 'MANAGE_PROFILE',
  
  // Organization Permissions
  MANAGE_ORGANIZATION: 'MANAGE_ORGANIZATION',
  MANAGE_MEMBERS: 'MANAGE_MEMBERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  VIEW_ORG_ANALYTICS: 'VIEW_ORG_ANALYTICS',
  
  // Feature Permissions
  ACCESS_DASHBOARD: 'ACCESS_DASHBOARD',
  ACCESS_AI_TOOLS: 'ACCESS_AI_TOOLS',
  ACCESS_CALCULATORS: 'ACCESS_CALCULATORS',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Base role permissions definitions
const BASE_ROLE_PERMISSIONS = {
  OWNER: [
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_ORG_ANALYTICS,
    PERMISSIONS.ACCESS_DASHBOARD,
  ],
  DIRECTOR: [
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_ORG_ANALYTICS,
    PERMISSIONS.ACCESS_DASHBOARD,
  ],
  MANAGER: [
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.VIEW_ORG_ANALYTICS,
    PERMISSIONS.ACCESS_DASHBOARD,
  ],
} as const;

// Role permission mappings
export const ROLE_PERMISSIONS: Record<SystemRole, readonly Permission[]> = {
  SYSTEM_OWNER: [
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_COACHES,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.MANAGE_SESSIONS,
    PERMISSIONS.VIEW_COACH_ANALYTICS,
    PERMISSIONS.MANAGE_AVAILABILITY,
    PERMISSIONS.BOOK_SESSIONS,
    PERMISSIONS.VIEW_HISTORY,
    PERMISSIONS.MANAGE_PROFILE,
  ],
  SYSTEM_MODERATOR: [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_COACHES,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.MANAGE_SESSIONS,
    PERMISSIONS.VIEW_COACH_ANALYTICS,
  ],
  USER: [
    PERMISSIONS.BOOK_SESSIONS,
    PERMISSIONS.VIEW_HISTORY,
    PERMISSIONS.MANAGE_PROFILE,
  ],
} as const;

// Organization role permission mappings
export const ORG_ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  // Global Level Roles
  GLOBAL_OWNER: [
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_ORG_ANALYTICS,
    PERMISSIONS.ACCESS_DASHBOARD,
  ],
  GLOBAL_DIRECTOR: [
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_ORG_ANALYTICS,
    PERMISSIONS.ACCESS_DASHBOARD,
  ],
  GLOBAL_MANAGER: [
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.VIEW_ORG_ANALYTICS,
    PERMISSIONS.ACCESS_DASHBOARD,
  ],
  
  // Regional Level Roles
  REGIONAL_OWNER: [...BASE_ROLE_PERMISSIONS.OWNER],
  REGIONAL_DIRECTOR: [...BASE_ROLE_PERMISSIONS.DIRECTOR],
  REGIONAL_MANAGER: [...BASE_ROLE_PERMISSIONS.MANAGER],
  
  // Local Level Roles
  LOCAL_OWNER: [...BASE_ROLE_PERMISSIONS.OWNER],
  LOCAL_DIRECTOR: [...BASE_ROLE_PERMISSIONS.DIRECTOR],
  LOCAL_MANAGER: [...BASE_ROLE_PERMISSIONS.MANAGER],
  
  // Standard Roles
  OWNER: [...BASE_ROLE_PERMISSIONS.OWNER],
  DIRECTOR: [...BASE_ROLE_PERMISSIONS.DIRECTOR],
  MANAGER: [...BASE_ROLE_PERMISSIONS.MANAGER],
  MEMBER: [
    PERMISSIONS.VIEW_ORG_ANALYTICS,
    PERMISSIONS.ACCESS_DASHBOARD,
  ],
  GUEST: [
    PERMISSIONS.ACCESS_DASHBOARD,
  ],
} as const;

// Combined permission check function
export function hasPermission(context: UserRoleContext, permission: Permission): boolean {
  const allPermissions = getAllPermissions(context);
  return allPermissions.includes(permission);
}

export function getAllPermissions(context: UserRoleContext): Permission[] {
  const permissions = new Set<Permission>();
  
  // Add system role permissions
  ROLE_PERMISSIONS[context.systemRole].forEach(p => permissions.add(p));
  
  // Add org role permissions if present
  if (context.orgRole) {
    ORG_ROLE_PERMISSIONS[context.orgRole].forEach(p => permissions.add(p));
  }
  
  // Add custom permissions
  context.customPermissions?.forEach(p => permissions.add(p));
  
  return Array.from(permissions);
}

// Helper function for getting role permissions (used internally)
function getRolePermissions(role: SystemRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

function getOrgRolePermissions(role: OrgRole): Permission[] {
  return [...(ORG_ROLE_PERMISSIONS[role] || [])];
}

// Helper Types
export interface UserRoleContext {
  systemRole: SystemRole;
  orgRole?: OrgRole;
  orgLevel?: OrgLevel;
  capabilities: UserCapability[];
  customPermissions?: Permission[];
}

// Helper Functions
export function hasSystemRole(userRole: SystemRole, requiredRole: SystemRole): boolean {
  const roleHierarchy = [
    SYSTEM_ROLES.SYSTEM_OWNER,
    SYSTEM_ROLES.SYSTEM_MODERATOR,
    SYSTEM_ROLES.USER
  ]
  const userRoleIndex = roleHierarchy.indexOf(SYSTEM_ROLES[userRole])
  const requiredRoleIndex = roleHierarchy.indexOf(SYSTEM_ROLES[requiredRole])
  return userRoleIndex !== -1 && requiredRoleIndex !== -1 && userRoleIndex <= requiredRoleIndex
}

export function hasOrgRole(userRole: OrgRole, requiredRole: OrgRole, userLevel: OrgLevel, requiredLevel: OrgLevel): boolean {
  // First check levels
  const levelHierarchy = [ORG_LEVELS.GLOBAL, ORG_LEVELS.REGIONAL, ORG_LEVELS.LOCAL, ORG_LEVELS.BRANCH];
  const userLevelIndex = levelHierarchy.indexOf(userLevel);
  const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);
  
  if (userLevelIndex > requiredLevelIndex) {
    return false;
  }
  
  // Then check roles within the same level category
  const getRoleCategory = (role: OrgRole): string => {
    if (role.startsWith('GLOBAL_')) return 'GLOBAL';
    if (role.startsWith('REGIONAL_')) return 'REGIONAL';
    if (role.startsWith('LOCAL_')) return 'LOCAL';
    return 'STANDARD';
  };
  
  const roleHierarchy = {
    GLOBAL: ['GLOBAL_OWNER', 'GLOBAL_DIRECTOR', 'GLOBAL_MANAGER'],
    REGIONAL: ['REGIONAL_OWNER', 'REGIONAL_DIRECTOR', 'REGIONAL_MANAGER'],
    LOCAL: ['LOCAL_OWNER', 'LOCAL_DIRECTOR', 'LOCAL_MANAGER'],
    STANDARD: ['OWNER', 'DIRECTOR', 'MANAGER', 'MEMBER', 'GUEST'],
  };
  
  const userCategory = getRoleCategory(userRole);
  const requiredCategory = getRoleCategory(requiredRole);
  
  if (userCategory !== requiredCategory) {
    return false;
  }
  
  const hierarchy = roleHierarchy[userCategory as keyof typeof roleHierarchy];
  const userRoleIndex = hierarchy.indexOf(userRole);
  const requiredRoleIndex = hierarchy.indexOf(requiredRole);
  
  return userRoleIndex <= requiredRoleIndex;
}

export function hasCapability(context: UserRoleContext, capability: UserCapability): boolean {
  return context.capabilities.includes(capability);
}

// Validation Functions
export function isValidSystemRole(role: string): role is SystemRole {
  return Object.values(SYSTEM_ROLES).includes(role as SystemRole);
}

export function isValidOrgRole(role: string): role is OrgRole {
  return Object.values(ORG_ROLES).includes(role as OrgRole);
}

export function isValidOrgLevel(level: string): level is OrgLevel {
  return Object.values(ORG_LEVELS).includes(level as OrgLevel);
}

export function isValidCapability(capability: string): capability is UserCapability {
  return Object.values(USER_CAPABILITIES).includes(capability as UserCapability);
}

export function isValidPermission(permission: string): permission is Permission {
  return Object.values(PERMISSIONS).includes(permission as Permission);
} 