import { z } from "zod";

// Define Profile Status enum
export const PROFILE_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
} as const;

export type ProfileStatus = typeof PROFILE_STATUS[keyof typeof PROFILE_STATUS];

export const INDUSTRY_SPECIALTIES = {
  REALTOR: 'REALTOR',
  INVESTOR: 'INVESTOR',
  MORTGAGE: 'MORTGAGE',
  PROPERTY_MANAGER: 'PROPERTY_MANAGER',
  TITLE_ESCROW: 'TITLE_ESCROW',
  INSURANCE: 'INSURANCE',
  COMMERCIAL: 'COMMERCIAL',
  PRIVATE_CREDIT: 'PRIVATE_CREDIT'
} as const;

export type IndustrySpecialty = typeof INDUSTRY_SPECIALTIES[keyof typeof INDUSTRY_SPECIALTIES];

// Define approved specialties type
export interface ApprovedSpecialties {
  industrySpecialties: string[];
  approvedAt: string;
  approvedBy: string;
}

// Move these to the top, before CoachProfileSchema
export const COACH_SPECIALTIES = {
  BUSINESS_DEVELOPMENT: [
    "Lead Generation Strategy",
    "Sphere of Influence Building",
    "Digital Marketing Mastery",
    "Social Media Influence",
    "Content Strategy & Branding",
    "Referral Network Development",
    "Client Acquisition & Retention",
  ],

  BUSINESS_OPERATIONS: [
    "Team Leadership & Management",
    "Process Automation & Systems",
    "Performance Management",
    "Business Planning & Strategy",
    "Multiple Income Stream Development",
    "Market Expansion Strategy",
    "Risk Management & Compliance",
  ],

  CLIENT_RELATIONS: [
    "High-Net-Worth Client Services",
    "International Client Relations",
    "Client Communication Strategy",
    "Conflict Resolution",
    "Cross-Cultural Communication",
    "Multi-Generation Wealth Planning",
  ],

  PROFESSIONAL_DEVELOPMENT: [
    "Personal Brand Development",
    "Industry Certification Prep",
    "Professional Network Building",
    "Time Management & Productivity",
    "Video Marketing Mastery",
    "Digital Tools & Innovation",
  ],

  // Career-Specific Specialties
  REALTOR: [
    "Listing Presentation Mastery",
    "Luxury Market Strategy",
    "First-Time Buyer Guidance",
    "Virtual Showing Mastery",
    "Open House Optimization",
    "Expired Listing Revival",
    "Geographic Farm Development",
  ],

  MORTGAGE_OFFICER: [
    "Loan Structure Strategy",
    "Underwriting Navigation",
    "Credit Repair Guidance",
    "Alternative Lending Solutions",
    "FHA/VA Loan Specialization",
    "Construction Loan Mastery",
    "Portfolio Loan Development",
  ],

  COMMERCIAL_RE: [
    "Commercial Deal Structuring",
    "Investment Analysis",
    "Market Analysis & Forecasting",
    "Tenant Representation",
    "Property Valuation Strategy",
    "Development Project Management",
    "REO & Distressed Properties",
  ],

  PROPERTY_MANAGER: [
    "Property Management Systems",
    "Tenant Screening & Relations",
    "Maintenance Program Development",
    "Property Technology Integration",
    "Revenue Optimization",
    "Staff Management & Training",
    "Portfolio Scaling Strategy",
  ],

  INVESTOR: [
    "Investment Deal Analysis",
    "Portfolio Optimization",
    "Creative Financing Strategies",
    "1031 Exchange Mastery",
    "Syndication Formation",
    "Joint Venture Structuring",
    "Value-Add Strategy",
  ],

  PRIVATE_CREDIT: [
    "Private Lending Strategy",
    "Risk Assessment",
    "Deal Underwriting",
    "Capital Structure Planning",
    "Default Management",
    "Fund Structure & Management",
    "Investor Relations",
  ],

  TITLE_ESCROW: [
    "Transaction Management",
    "Due Diligence Process",
    "Title Search Optimization",
    "Closing Efficiency Systems",
    "Legal Compliance Strategy",
    "Client Education Programs",
    "Remote Closing Management",
  ],

  // Emerging Trends & Opportunities
  MARKET_INNOVATION: [
    "PropTech Integration",
    "ESG & Sustainable Real Estate",
    "Build-to-Rent Strategy",
    "Climate Risk Assessment",
    "Smart Home Technology",
    "Blockchain in Real Estate",
    "Virtual & Augmented Reality",
  ],

  ECONOMIC_MASTERY: [
    "Economic Cycle Navigation",
    "Market Data Analysis",
    "Investment Timing Strategy",
    "Distressed Market Opportunities",
    "Regional Market Analysis",
    "Economic Indicator Interpretation",
    "Risk Mitigation Planning",
  ],

  SOCIAL_MEDIA: [
    "Facebook Marketing & Ads",
    "Instagram Growth & Content",
    "TikTok Strategy & Trends",
    "LinkedIn Personal Branding",
    "X/Twitter Engagement",
    "Pinterest Marketing",
    "Social Media Content Planning",
    "Social Media Analytics",
    "Influencer Collaboration",
    "Social Media Advertising",
    "Community Management",
    "Social Media ROI Strategy",
  ],
} as const;

export type SpecialtyCategory = keyof typeof COACH_SPECIALTIES;
export type Specialty = typeof COACH_SPECIALTIES[SpecialtyCategory][number];

// Add new type for stored specialty
export interface CoachSpecialtyEntry {
  category: SpecialtyCategory;
  specialty: Specialty;
}

// Now the schema can use these types
export const CoachProfileSchema = z.object({
  id: z.number().optional(),
  bio: z.string().min(1, "Bio is required").max(1000, "Bio must be less than 1000 characters"),
  coachSkills: z.array(z.string()).optional().default([]),
  yearsCoaching: z.number().min(0, "Years of coaching must be 0 or greater").optional(),
  certifications: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or greater"),
  calendlyUrl: z.string().url("Invalid Calendly URL").optional().nullable(),
  eventTypeUrl: z.string().url("Invalid event type URL").optional().nullable(),
  isActive: z.boolean().default(true),
  defaultDuration: z.number().min(15).max(240).default(60),
  allowCustomDuration: z.boolean().default(false),
  minimumDuration: z.number().min(15).max(240).default(30),
  maximumDuration: z.number().min(15).max(240).default(120),
  yearsExperience: z.number().min(0),
  specializations: z.array(z.string()),
  languages: z.array(z.string()),
  geographicFocus: z.record(z.string(), z.any()),
  marketingAreas: z.array(z.string()),
  testimonials: z.record(z.string(), z.any()),
  calendlyLink: z.string().url().optional(),
  zoomLink: z.string().url().optional(),
  profileStatus: z.enum(Object.values(PROFILE_STATUS) as [string, ...string[]]).default(PROFILE_STATUS.DRAFT),
  completionPercentage: z.number().min(0).max(100).default(0),
});

export interface CoachProfileData {
  userUlid: string
  firstName: string | null
  lastName: string | null
  profileStatus: ProfileStatus
  industrySpecialties: string[]
  completionPercentage: number
  hourlyRate: number | null
  updatedAt: string
}

export interface CoachProfile {
  userUlid: string
  firstName: string
  lastName: string
  profileStatus: ProfileStatus
  industrySpecialties: string[]
  completionPercentage: number
  hourlyRate: number
  updatedAt: string
}

export const UpdateCoachProfileSchema = CoachProfileSchema.partial().extend({
  id: z.number(),
});

export type UpdateCoachProfile = z.infer<typeof UpdateCoachProfileSchema>;

export const COACH_CERTIFICATIONS = [
  "Licensed Real Estate Broker",
  "Certified Residential Specialist (CRS)",
  "Graduate, REALTOR® Institute (GRI)",
  "Accredited Buyer's Representative (ABR)",
  "Seller Representative Specialist (SRS)",
  "Certified International Property Specialist (CIPS)",
  "Certified Property Manager (CPM)",
  "Certified Commercial Investment Member (CCIM)",
  "Short Sales and Foreclosure Resource (SFR)",
  "NAR's Green Designation",
] as const;

export const CoachMetricsSchema = z.object({
  totalSessions: z.number(),
  completedSessions: z.number(),
  averageRating: z.number().nullable(),
  completionRate: z.number(),
  ratings: z.number(),
  upcomingSessions: z.number(),
  totalEarnings: z.number(),
  canceledSessions: z.number(),
  noShowSessions: z.number()
});

export enum CoachApplicationStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export const COACH_APPLICATION_STATUS = {
  DRAFT: CoachApplicationStatus.DRAFT,
  PENDING: CoachApplicationStatus.PENDING,
  APPROVED: CoachApplicationStatus.APPROVED,
  REJECTED: CoachApplicationStatus.REJECTED,
} as const;

export type CoachApplicationStatusType = typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS];

export type CoachMetrics = z.infer<typeof CoachMetricsSchema>;

// Coach Config Types
export const CoachConfigSchema = z.object({
  durations: z.array(z.number().min(15).max(240)),  // durations in minutes
  rates: z.record(z.string(), z.number().min(0)),   // mapping of duration to rate
  currency: z.enum(['USD', 'EUR', 'GBP']),
  isActive: z.boolean().optional().default(true),
  defaultDuration: z.number().min(15).max(240),
  allowCustomDuration: z.boolean(),
  minimumDuration: z.number().min(15),
  maximumDuration: z.number().max(240)
});

export type CoachConfig = z.infer<typeof CoachConfigSchema>;

// Coach Session Types
export type WeekDay = typeof DAYS_OF_WEEK[number];

export const TimeSlotSchema = z.object({
  from: z.string(),
  to: z.string()
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export interface PublicCoach {
  ulid: string
  userUlid: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  bio: string | null
  profileImageUrl: string | null
  coachingSpecialties: CoachSpecialtyEntry[]
  hourlyRate: number | null
  averageRating: number | null
  totalSessions: number
} 