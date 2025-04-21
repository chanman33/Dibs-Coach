import { z } from "zod";
import { ProfileStatus } from "@/utils/types/coach";
import { COMMON_LANGUAGES } from "@/lib/constants";
import { Specialty } from "@/utils/types/coach";
import { ProfessionalRecognition } from "@/utils/types/recognition";

// Domain specialties for coaches
export const DOMAIN_SPECIALTIES = [
  { value: "REALTOR", label: "Real Estate Agent" },
  { value: "INVESTOR", label: "Real Estate Investor" },
  { value: "MORTGAGE", label: "Mortgage Professional" },
  { value: "PROPERTY_MANAGER", label: "Property Manager" },
  { value: "TITLE_ESCROW", label: "Title & Escrow" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "COMMERCIAL", label: "Commercial Real Estate" },
  { value: "PRIVATE_CREDIT", label: "Private Credit" }
];

// Form validation schema
export const coachProfileFormSchema = z.object({
  // Coach Profile Fields
  displayName: z.string().min(1, "Display name is required").optional(),
  slogan: z.string().optional(),
  profileSlug: z.string().nullable().optional(),
  specialties: z.array(z.string()).optional(),
  coachSkills: z.array(z.string()).default([]),
  yearsCoaching: z.number()
    .min(0, "Years must be 0 or greater")
    .int("Years must be a whole number")
    .nonnegative("Years cannot be negative"),
  hourlyRate: z.number()
    .min(100, "Minimum hourly rate is $100")
    .max(3000, "Maximum hourly rate is $3,000"),
  
  // Marketing URLs (added)
  websiteUrl: z.string().url("Invalid URL format").or(z.literal("")).nullable().optional(),
  facebookUrl: z.string().url("Invalid URL format").or(z.literal("")).nullable().optional(),
  instagramUrl: z.string().url("Invalid URL format").or(z.literal("")).nullable().optional(),
  linkedinUrl: z.string().url("Invalid URL format").or(z.literal("")).nullable().optional(),
  youtubeUrl: z.string().url("Invalid URL format").or(z.literal("")).nullable().optional(),
  tiktokUrl: z.string().url("Invalid URL format").or(z.literal("")).nullable().optional(),
  
  // Coach Domain Expertise
  coachRealEstateDomains: z.array(z.string()).optional(),
  coachPrimaryDomain: z.string().nullable().optional(),
  
  // Languages
  languages: z.array(z.string()).optional(),
  
  // Session Configuration
  defaultDuration: z.number().min(30).max(120).default(60),
  minimumDuration: z.number().min(30).max(60).default(30),
  maximumDuration: z.number().min(60).max(120).default(120),
  allowCustomDuration: z.boolean().default(false),
  
  // Professional Recognitions
  professionalRecognitions: z.array(z.object({
    ulid: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    type: z.enum(["AWARD", "ACHIEVEMENT"]),
    issuer: z.string().min(1, "Issuer is required"),
    issueDate: z.string().datetime(),
    expiryDate: z.string().datetime().nullable(),
    description: z.string().nullable(),
    verificationUrl: z.string().url().nullable(),
    certificateUrl: z.string().url().nullable(),
    status: z.enum(["ACTIVE", "EXPIRED", "REVOKED"]).default("ACTIVE"),
    industryType: z.string().nullable(),
    isVisible: z.boolean().default(true),
    coachProfileUlid: z.string().nullable(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  })).default([]),
});

// Type for form values
export type CoachProfileFormValues = z.infer<typeof coachProfileFormSchema>;

// Initial data structure
export interface CoachProfileInitialData {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  slogan?: string;
  profileSlug?: string | null;
  coachingSpecialties?: string[] | null;
  coachSkills?: string[] | null;
  hourlyRate?: number | undefined;
  yearsCoaching?: number | undefined;
  // Coach Domain Expertise
  coachRealEstateDomains?: string[] | null;
  coachPrimaryDomain?: string | null;
  // Add Marketing URLs (added)
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  // Add completion-related fields
  status?: ProfileStatus;
  completionPercentage?: number;
  missingFields?: string[];
  missingRequiredFields?: string[];
  optionalMissingFields?: string[];
  validationMessages?: Record<string, string>;
  canPublish?: boolean;
}

// User info structure
export interface UserInfo {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImageUrl?: string;
}

// Props for the main form component
export interface CoachProfileFormProps {
  initialData?: CoachProfileInitialData;
  onSubmit: (values: CoachProfileFormValues) => void;
  isSubmitting?: boolean;
  profileStatus?: ProfileStatus;
  completionPercentage?: number;
  missingFields?: string[];
  missingRequiredFields?: string[];
  optionalMissingFields?: string[];
  validationMessages?: Record<string, string>;
  canPublish?: boolean;
  userInfo?: UserInfo;
  onSkillsChange: (skills: string[]) => void;
  saveSkills: (skills: string[]) => Promise<boolean>;
  updateCompletionStatus: (data: any) => void;
}

export interface CoachProfileResponse {
  coachSkills: string[];
  professionalRecognitions: ProfessionalRecognition[];
  profileStatus: ProfileStatus;
  completionPercentage: number;
  missingFields: string[];
  missingRequiredFields: string[];
  optionalMissingFields: string[];
  validationMessages: Record<string, string>;
  canPublish: boolean;
  coachRealEstateDomains: string[];
  coachPrimaryDomain: string | null;
  slogan?: string;
  profileSlug?: string | null;
  // ... other existing fields ...
} 