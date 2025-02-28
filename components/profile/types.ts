import { z } from "zod";
import { ProfileStatus } from "@/utils/types/coach";
import { COMMON_LANGUAGES } from "@/lib/constants";
import { Specialty } from "@/utils/types/coach";

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
  specialties: z.array(z.string()).optional(),
  coachSkills: z.array(z.string()).default([]),
  yearsCoaching: z.number()
    .min(0, "Years must be 0 or greater")
    .int("Years must be a whole number")
    .nonnegative("Years cannot be negative"),
  hourlyRate: z.number()
    .min(100, "Minimum hourly rate is $100")
    .max(3000, "Maximum hourly rate is $3,000"),
  
  // Languages
  languages: z.array(z.string()).optional(),
  
  // Calendly Integration
  calendlyUrl: z.string().url("Invalid Calendly URL").optional(),
  eventTypeUrl: z.string().url("Invalid event type URL").optional(),
  
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
    organization: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    year: z.number().min(1900, "Year must be valid").max(new Date().getFullYear(), "Year cannot be in the future"),
    isVisible: z.boolean().default(true),
    industryType: z.string().nullable().optional(),
  })).default([]),
});

// Type for form values
export type CoachProfileFormValues = z.infer<typeof coachProfileFormSchema>;

// Professional Recognition type
export interface ProfessionalRecognition {
  ulid?: string;
  title: string;
  type: "AWARD" | "ACHIEVEMENT";
  year: number;
  organization: string | null;
  description: string | null;
  isVisible: boolean;
  industryType: string | null;
}

// Initial data structure
export interface CoachProfileInitialData {
  specialties?: string[];
  yearsCoaching?: number;
  hourlyRate?: number;
  domainSpecialties?: string[]; // Keep this for display purposes only
  calendlyUrl?: string;
  eventTypeUrl?: string;
  defaultDuration?: number;
  minimumDuration?: number;
  maximumDuration?: number;
  allowCustomDuration?: boolean;
  certifications?: string[];
  languages?: string[]; // Keep this for LanguagesSection initialization
  professionalRecognitions?: ProfessionalRecognition[];
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
  canPublish?: boolean;
  userInfo?: UserInfo;
  onSpecialtiesChange: (specialties: Specialty[]) => void;
  saveSpecialties: (selectedSpecialties: Specialty[]) => Promise<boolean>;
} 