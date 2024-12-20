export const ROLES = {
  REALTOR: 'realtor',
  LOAN_OFFICER: 'loan_officer',
  REALTOR_COACH: 'realtor_coach',
  LOAN_OFFICER_COACH: 'loan_officer_coach',
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
  [ROLES.LOAN_OFFICER]: {
    canAccessDashboard: true,
    canAccessProjects: true,
    canAccessFinance: true,
    canAccessSettings: true,
  },
  [ROLES.REALTOR_COACH]: {
    canAccessDashboard: true,
    canAccessProjects: true,
    canAccessFinance: true,
    canAccessSettings: true,
    canManageRealtors: true,
  },
  [ROLES.LOAN_OFFICER_COACH]: {
    canAccessDashboard: true,
    canAccessProjects: true,
    canAccessFinance: true,
    canAccessSettings: true,
    canManageLoanOfficers: true,
  },
  [ROLES.ADMIN]: {
    canAccessDashboard: true,
    canAccessProjects: true,
    canAccessFinance: true,
    canAccessSettings: true,
    canManageRealtors: true,
    canManageLoanOfficers: true,
    canManageCoaches: true,
    canManageRoles: true,
  },
} as const;

export type Permission = keyof typeof rolePermissions[UserRole]; 