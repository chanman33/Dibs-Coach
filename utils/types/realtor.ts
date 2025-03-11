import { z } from "zod";

// Common schemas
const testimonialSchema = z.object({
  author: z.string(),
  content: z.string(),
});

const listingSchema = z.object({
  address: z.string(),
  price: z.string(),
  status: z.string(),
});

const geographicFocusSchema = z.object({
  cities: z.array(z.string()),
  neighborhoods: z.array(z.string()),
  counties: z.array(z.string()),
});

// Professional Recognition Schema
export const ProfessionalRecognitionSchema = z.object({
  ulid: z.string().length(26).optional(),
  title: z.string(),
  type: z.enum(["AWARD", "ACHIEVEMENT"]),
  year: z.number(),
  organization: z.string().nullable(),
  description: z.string().nullable(),
  realtorProfileUlid: z.string().length(26).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional()
});

// Form data schema for new/editing recognition
export const RecognitionFormSchema = z.object({
  title: z.string(),
  type: z.enum(["AWARD", "ACHIEVEMENT"]),
  year: z.number(),
  organization: z.string(),
  description: z.string()
});

export type ProfessionalRecognition = z.infer<typeof ProfessionalRecognitionSchema>;

// Base realtor profile schema (common to both coaches and mentees)
export const realtorProfileSchema = z.object({
  ulid: z.string().length(26).optional(),
  userUlid: z.string().length(26),
  bio: z.string().nullable(),
  yearsExperience: z.number().nullable(),
  
  // Professional Information
  propertyTypes: z.array(z.string()),
  specializations: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  
  // Geographic Focus
  geographicFocus: geographicFocusSchema,
  primaryMarket: z.string().nullable(),

  // Marketing Information
  slogan: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  facebookUrl: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  youtubeUrl: z.string().nullable(),
  marketingAreas: z.array(z.string()),
  testimonials: z.array(testimonialSchema),

  // Listings and Professional Recognitions
  featuredListings: z.array(listingSchema),
  professionalRecognitions: z.array(ProfessionalRecognitionSchema),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Coach-specific profile schema
export const coachProfileSchema = z.object({
  ulid: z.string().length(26).optional(),
  userUlid: z.string().length(26),
  coachingSpecialties: z.array(z.string()),
  yearsCoaching: z.number().nullable(),
  hourlyRate: z.number().nullable(),
  
  // Session Configuration
  isActive: z.boolean(),
  defaultDuration: z.number(),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Mentee-specific profile schema
export const menteeProfileSchema = z.object({
  ulid: z.string().length(26).optional(),
  userUlid: z.string().length(26),
  focusAreas: z.array(z.string()),
  experienceLevel: z.string().nullable(),
  learningStyle: z.string().nullable(),
  goals: z.record(z.any()).nullable(),
  sessionsCompleted: z.number(),
  isActive: z.boolean(),
  lastSessionDate: z.string().datetime().nullable(),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Combined profile types for coaches and mentees
export const coachFullProfileSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    role: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
  realtorProfile: realtorProfileSchema,
  coachProfile: coachProfileSchema,
});

export const menteeFullProfileSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    role: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
  realtorProfile: realtorProfileSchema,
  menteeProfile: menteeProfileSchema,
});

// Type exports
export type RealtorProfile = z.infer<typeof realtorProfileSchema>;
export type CoachProfile = z.infer<typeof coachProfileSchema>;
export type MenteeProfile = z.infer<typeof menteeProfileSchema>;
export type CoachFullProfile = z.infer<typeof coachFullProfileSchema>;
export type MenteeFullProfile = z.infer<typeof menteeFullProfileSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type Listing = z.infer<typeof listingSchema>;
export type GeographicFocus = z.infer<typeof geographicFocusSchema>; 