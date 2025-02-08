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

const achievementSchema = z.object({
  year: z.string(),
  description: z.string(),
});

const geographicFocusSchema = z.object({
  cities: z.array(z.string()),
  neighborhoods: z.array(z.string()),
  counties: z.array(z.string()),
});

// Base realtor profile schema (common to both coaches and mentees)
export const realtorProfileSchema = z.object({
  id: z.number().optional(),
  userDbId: z.number(),
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

  // Listings and Achievements
  featuredListings: z.array(listingSchema),
  professionalRecognitions: z.array(z.object({
    id: z.number().optional(),
    realtorProfileId: z.number(),
    title: z.string().min(1, "Title is required"),
    type: z.enum(["AWARD", "ACHIEVEMENT"]),
    year: z.number().min(1900).max(new Date().getFullYear()),
    organization: z.string().optional(),
    description: z.string().optional(),
  })),

  createdAt: z.date(),
  updatedAt: z.date(),
});

// Coach-specific profile schema
export const coachProfileSchema = z.object({
  id: z.number().optional(),
  userDbId: z.number(),
  coachingSpecialties: z.array(z.string()),
  yearsCoaching: z.number().nullable(),
  hourlyRate: z.number().nullable(),
  
  // Calendly Integration
  calendlyUrl: z.string().nullable(),
  eventTypeUrl: z.string().nullable(),
  
  // Session Configuration
  isActive: z.boolean(),
  defaultDuration: z.number(),
  allowCustomDuration: z.boolean(),
  minimumDuration: z.number(),
  maximumDuration: z.number(),
  totalSessions: z.number(),
  averageRating: z.number().nullable(),
  
  // Replace achievements and awards with professionalRecognitions
  professionalRecognitions: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      type: z.enum(["AWARD", "ACHIEVEMENT"]),
      year: z.number().min(1900).max(new Date().getFullYear()),
      organization: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Mentee-specific profile schema
export const menteeProfileSchema = z.object({
  id: z.number().optional(),
  userDbId: z.number(),
  focusAreas: z.array(z.string()),
  experienceLevel: z.string().nullable(),
  learningStyle: z.string().nullable(),
  goals: z.record(z.any()).nullable(),
  sessionsCompleted: z.number(),
  isActive: z.boolean(),
  lastSessionDate: z.date().nullable(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
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
export type Achievement = z.infer<typeof achievementSchema>;
export type GeographicFocus = z.infer<typeof geographicFocusSchema>;
export type ProfessionalRecognition = z.infer<typeof professionalRecognitionSchema>;

// Update the coach profile form schema
export const coachProfileFormSchema = z.object({
  // ... other fields ...
  
  // Replace achievements and awards with professionalRecognitions
  professionalRecognitions: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      type: z.enum(["AWARD", "ACHIEVEMENT"]),
      year: z.number().min(1900).max(new Date().getFullYear()),
      organization: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  
  // ... other fields ...
}); 