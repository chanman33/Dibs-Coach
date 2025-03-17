import { z } from 'zod'

// Organization Type Enum
export const OrgType = {
  INDIVIDUAL: 'INDIVIDUAL',
  TEAM: 'TEAM',
  BUSINESS: 'BUSINESS',
  ENTERPRISE: 'ENTERPRISE',
  FRANCHISE: 'FRANCHISE',
  NETWORK: 'NETWORK'
} as const

export type OrgType = typeof OrgType[keyof typeof OrgType]

// Organization Industry Enum
export const OrgIndustry = {
  REAL_ESTATE_SALES: 'REAL_ESTATE_SALES',
  MORTGAGE_LENDING: 'MORTGAGE_LENDING',
  PROPERTY_MANAGEMENT: 'PROPERTY_MANAGEMENT',
  REAL_ESTATE_INVESTMENT: 'REAL_ESTATE_INVESTMENT',
  TITLE_ESCROW: 'TITLE_ESCROW',
  INSURANCE: 'INSURANCE',
  COMMERCIAL: 'COMMERCIAL',
  PRIVATE_CREDIT: 'PRIVATE_CREDIT',
  OTHER: 'OTHER'
} as const

export type OrgIndustry = typeof OrgIndustry[keyof typeof OrgIndustry]

// Organization Tier Enum
export const OrgTier = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
  PARTNER: 'PARTNER'
} as const

export type OrgTier = typeof OrgTier[keyof typeof OrgTier]

// Organization Status Enum
export const OrgStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
  ARCHIVED: 'ARCHIVED'
} as const

export type OrgStatus = typeof OrgStatus[keyof typeof OrgStatus]

// Organization Level Enum
export const OrgLevel = {
  GLOBAL: 'GLOBAL',
  REGIONAL: 'REGIONAL',
  LOCAL: 'LOCAL',
  BRANCH: 'BRANCH'
} as const

export type OrgLevel = typeof OrgLevel[keyof typeof OrgLevel]

// Organization Schema
export const organizationSchema = z.object({
  ulid: z.string().length(26),
  name: z.string().min(3).max(100),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(Object.values(OrgStatus) as [string, ...string[]]),
  type: z.enum(Object.values(OrgType) as [string, ...string[]]),
  industry: z.enum(Object.values(OrgIndustry) as [string, ...string[]]).nullable().optional(),
  level: z.enum(Object.values(OrgLevel) as [string, ...string[]]),
  tier: z.enum(Object.values(OrgTier) as [string, ...string[]]),
  parentUlid: z.string().length(26).nullable().optional(),
  primaryDomain: z.string().nullable().optional(),
  domains: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  metadata: z.record(z.any()).nullable().optional()
})

export type Organization = z.infer<typeof organizationSchema>

// Organization creation schema
export const createOrganizationSchema = z.object({
  ulid: z.string().length(26),
  name: z.string().min(3).max(100),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(Object.values(OrgStatus) as [string, ...string[]]).default('ACTIVE'),
  type: z.enum(Object.values(OrgType) as [string, ...string[]]).default('BUSINESS'),
  industry: z.enum(Object.values(OrgIndustry) as [string, ...string[]]).nullable().optional(),
  level: z.enum(Object.values(OrgLevel) as [string, ...string[]]).default('LOCAL'),
  tier: z.enum(Object.values(OrgTier) as [string, ...string[]]).default('PROFESSIONAL'),
  parentUlid: z.string().length(26).nullable().optional(),
  primaryDomain: z.string().nullable().optional(),
  domains: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  metadata: z.record(z.any()).nullable().optional()
})

export type CreateOrganization = z.infer<typeof createOrganizationSchema>

// Organization update schema
export const updateOrganizationSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(Object.values(OrgStatus) as [string, ...string[]]).optional(),
  type: z.enum(Object.values(OrgType) as [string, ...string[]]).optional(),
  industry: z.enum(Object.values(OrgIndustry) as [string, ...string[]]).nullable().optional(),
  level: z.enum(Object.values(OrgLevel) as [string, ...string[]]).optional(),
  tier: z.enum(Object.values(OrgTier) as [string, ...string[]]).optional(),
  parentUlid: z.string().length(26).nullable().optional(),
  primaryDomain: z.string().nullable().optional(),
  domains: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  metadata: z.record(z.any()).nullable().optional()
})

export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>

// Organization Member Schema
export const organizationMemberSchema = z.object({
  ulid: z.string().length(26),
  organizationUlid: z.string().length(26),
  userUlid: z.string().length(26),
  role: z.string(),
  scope: z.string().nullable().optional(),
  status: z.string(),
  customPermissions: z.record(z.any()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  metadata: z.record(z.any()).nullable().optional(),
  user: z.object({
    ulid: z.string().length(26),
    name: z.string(),
    email: z.string().email(),
    imageUrl: z.string().nullable().optional()
  }).optional()
})

export type OrganizationMember = z.infer<typeof organizationMemberSchema>

// Add Member Schema
export const addOrganizationMemberSchema = z.object({
  ulid: z.string().length(26),
  organizationUlid: z.string().length(26),
  email: z.string().email(),
  role: z.string(),
  scope: z.string().optional(),
  customPermissions: z.record(z.any()).nullable().optional(),
})

export type AddOrganizationMember = z.infer<typeof addOrganizationMemberSchema>

// Update Member Schema
export const updateOrganizationMemberSchema = z.object({
  memberUlid: z.string().length(26),
  role: z.string().optional(),
  status: z.string().optional(),
  scope: z.string().optional(),
  customPermissions: z.record(z.any()).nullable().optional(),
})

export type UpdateOrganizationMember = z.infer<typeof updateOrganizationMemberSchema>

// Remove Member Schema
export const removeOrganizationMemberSchema = z.object({
  memberUlid: z.string().length(26)
})

export type RemoveOrganizationMember = z.infer<typeof removeOrganizationMemberSchema> 