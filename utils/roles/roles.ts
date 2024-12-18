export const ROLES = {
  REALTOR: 'realtor',
  COACH: 'coach',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const rolePermissions = {
  [ROLES.REALTOR]: {
    canAccessDashboard: true,
    canAccessProjects: true,
    canAccessFinance: true,
    canAccessSettings: true,
  },
  [ROLES.COACH]: {
    canAccessDashboard: true,
    canAccessProjects: true,
    canAccessFinance: true,
    canAccessSettings: true,
    canManageRealtors: true,
  },
  [ROLES.ADMIN]: {
    canAccessDashboard: true,
    canAccessProjects: true,
    canAccessFinance: true,
    canAccessSettings: true,
    canManageRealtors: true,
    canManageCoaches: true,
    canManageRoles: true,
  },
} as const;

export type Permission = keyof typeof rolePermissions[UserRole]; 