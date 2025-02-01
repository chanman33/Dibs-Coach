export const ROLES = {
  MENTEE: 'MENTEE',
  COACH: 'COACH',
  ADMIN: 'ADMIN'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
export type UserRoles = UserRole[];

export const rolePermissions = {
  [ROLES.MENTEE]: {
    canAccessDashboard: true,
    canAccessSessions: true,
    canBookSessions: true,
    canAccessProfile: true,
    canAccessSettings: true,
  },
  [ROLES.COACH]: {
    canAccessDashboard: true,
    canAccessSessions: true,
    canManageSessions: true,
    canAccessProfile: true,
    canAccessSettings: true,
    canSetAvailability: true,
    canViewAnalytics: true,
  },
  [ROLES.ADMIN]: {
    canAccessDashboard: true,
    canAccessSessions: true,
    canManageSessions: true,
    canAccessProfile: true,
    canAccessSettings: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewAnalytics: true,
    canManageSystem: true,
  },
} as const;

export type Permission = keyof typeof rolePermissions[UserRole];

// Helper functions for role management
export function hasAnyRole(userRoles: UserRoles, requiredRoles: UserRole[]): boolean {
  return userRoles.some(role => requiredRoles.includes(role));
}

export function hasAllRoles(userRoles: UserRoles, requiredRoles: UserRole[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role));
}

export function hasPermissions(userRoles: UserRoles, requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => 
    userRoles.some(role => rolePermissions[role]?.[permission])
  );
}

export function getRolePermissions(userRoles: UserRoles): Set<Permission> {
  return new Set(
    userRoles.flatMap(role => 
      Object.entries(rolePermissions[role])
        .filter(([_, hasPermission]) => hasPermission)
        .map(([permission]) => permission as Permission)
    )
  );
}

// Validation
export function isValidRole(role: string): role is UserRole {
  return Object.values(ROLES).includes(role as UserRole);
}

export function validateRoles(roles: string[]): UserRole[] {
  const validRoles = roles.filter(isValidRole);
  if (validRoles.length === 0) {
    throw new Error('At least one valid role must be provided');
  }
  return validRoles;
} 