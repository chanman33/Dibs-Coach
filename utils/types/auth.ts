import { z } from 'zod'
import {
  ORG_LEVELS,
  ORG_ROLES,
  OrgLevel,
  OrgRole,
  Permission,
  SYSTEM_ROLES,
  USER_CAPABILITIES,
  type SystemRole,
  type UserCapability
} from "../roles/roles";

// ID Types
export const clerkUserIdSchema = z.string()
  .regex(/^user_[a-zA-Z0-9]+$/, 'Invalid Clerk user ID format')

export const ulidSchema = z.string()
  .length(26, 'ULID must be exactly 26 characters')
  .regex(/^[0-9A-Z]+$/, 'Invalid ULID format')

// User Types
export const userIdSchema = z.object({
  userId: clerkUserIdSchema,
  ulid: ulidSchema
})

export type ClerkUserId = z.infer<typeof clerkUserIdSchema>
export type Ulid = z.infer<typeof ulidSchema>
export type UserIds = z.infer<typeof userIdSchema>

// Validation Functions
export function validateClerkUserId(id: string): boolean {
  return clerkUserIdSchema.safeParse(id).success
}

export function validateUlid(id: string): boolean {
  return ulidSchema.safeParse(id).success
}

export function validateUserIds(ids: { userId?: string, ulid?: string }): boolean {
  if (ids.userId && !validateClerkUserId(ids.userId)) return false
  if (ids.ulid && !validateUlid(ids.ulid)) return false
  return true
}

// Type Guards
export function isClerkUserId(id: string): id is ClerkUserId {
  return validateClerkUserId(id)
}

export function isUlid(id: string): id is Ulid {
  return validateUlid(id)
}

// Error Types
export class InvalidClerkUserIdError extends Error {
  constructor(id: string) {
    super(`Invalid Clerk user ID: ${id}`)
    this.name = 'InvalidClerkUserIdError'
  }
}

export class InvalidUlidError extends Error {
  constructor(id: string) {
    super(`Invalid ULID: ${id}`)
    this.name = 'InvalidUlidError'
  }
}

export class UserNotFoundError extends Error {
  constructor(params: { clerkUserId?: string, ulid?: string }) {
    super(`User not found: ${JSON.stringify(params)}`)
    this.name = 'UserNotFoundError'
  }
}

export interface AuthContext {
  userId: string;          // Clerk ID
  userUlid: string;       // Database ID
  systemRole: SystemRole;
  capabilities: UserCapability[];
  orgRole?: OrgRole;
  orgLevel?: OrgLevel;
  subscription?: {
    status: string;
    planId: string;
  };
}

export interface AuthOptions {
  requiredSystemRole?: SystemRole;
  requiredOrgRole?: OrgRole;
  requiredOrgLevel?: OrgLevel;
  requiredPermissions?: Permission[];
  requiredCapabilities?: UserCapability[];
  requireAll?: boolean;
  requireOrganization?: boolean;
}

export const authContextSchema = z.object({
  userId: z.string(),
  userUlid: z.string(),
  systemRole: z.string(), // Will be validated against SystemRole
  capabilities: z.array(z.string()), // Will be validated against UserCapability
  orgRole: z.string().optional(), // Will be validated against OrgRole
  orgLevel: z.string().optional(), // Will be validated against OrgLevel
  subscription: z.object({
    status: z.string(),
    planId: z.string()
  }).optional()
});

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
} 