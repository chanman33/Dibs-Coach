import { z } from "zod"
// import { OrgIndustry } from "@prisma/client" // Removed incorrect import

// Enums for lead management
export const LEAD_STATUS = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUALIFIED: "QUALIFIED",
  PROPOSAL: "PROPOSAL",
  NEGOTIATION: "NEGOTIATION",
  WON: "WON",
  LOST: "LOST",
  ARCHIVED: "ARCHIVED"
} as const

export const LEAD_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
} as const

// Keeping the enum for future use, but not using it in the schema for now
export const LEAD_SOURCE = {
  CONTACT_FORM_AUTH: "CONTACT_FORM_AUTH",
  CONTACT_FORM_PUBLIC: "CONTACT_FORM_PUBLIC",
  REFERRAL: "REFERRAL",
  WEBSITE: "WEBSITE",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  EVENT: "EVENT",
  OTHER: "OTHER",
} as const

// Define ORG_INDUSTRY_VALUES based on the provided prisma/schema.prisma
export const ORG_INDUSTRY_VALUES = [
  "REAL_ESTATE_SALES",
  "MORTGAGE_LENDING",
  "PROPERTY_MANAGEMENT",
  "REAL_ESTATE_INVESTMENT",
  "TITLE_ESCROW",
  "INSURANCE",
  "COMMERCIAL",
  "PRIVATE_CREDIT",
  "OTHER"
] as const;

export type OrgIndustryType = typeof ORG_INDUSTRY_VALUES[number];

// Types derived from enums
export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS]
export type LeadPriority = typeof LEAD_PRIORITY[keyof typeof LEAD_PRIORITY]
export type LeadSource = typeof LEAD_SOURCE[keyof typeof LEAD_SOURCE]

// Note type for lead communication
export interface LeadNote {
  id: string
  content: string
  createdAt: string
  createdBy: string
  type: "NOTE" | "EMAIL" | "CALL" | "MEETING"
}

// Zod schema for lead validation
export const leadSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  website: z.string().optional(),
  industry: z.enum(ORG_INDUSTRY_VALUES), // This will now use the correct, synchronized list
  fullName: z.string().min(2, "Full name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  teamSize: z.enum(["5-20", "20-50", "50-100", "100+"]),
  multipleOffices: z.boolean().default(false),
  status: z.enum(Object.keys(LEAD_STATUS) as [string, ...string[]]).default("NEW"),
  priority: z.enum(Object.keys(LEAD_PRIORITY) as [string, ...string[]]).default("MEDIUM"),
  assignedToUlid: z.string().optional(),
  notes: z.array(z.object({
    id: z.string(),
    content: z.string(),
    createdAt: z.string(),
    createdBy: z.string(),
    type: z.enum(["NOTE", "EMAIL", "CALL", "MEETING"])
  })).optional(),
  lastContactedAt: z.string().datetime().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
})

export type Lead = z.infer<typeof leadSchema>

// Type for lead list view
export interface LeadListItem {
  ulid: string
  companyName: string
  fullName: string
  email: string
  status: keyof typeof LEAD_STATUS
  priority: keyof typeof LEAD_PRIORITY
  createdAt: string
  lastContactedAt?: string
  nextFollowUpDate?: string
  assignedTo?: {
    ulid: string
    fullName: string
    email: string
  }
}

// Type for lead details view
export interface LeadDetails extends Lead {
  ulid: string
  createdAt: string
  updatedAt: string
  assignedTo?: {
    ulid: string
    fullName: string
    email: string
  }
} 