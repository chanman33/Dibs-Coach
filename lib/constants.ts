export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  COACH: 'coach',
  BROKER: 'broker',
  REALTOR: 'realtor'
} as const

export type Role = typeof ROLES[keyof typeof ROLES] 