import { z } from "zod";

export const realtorProfileSchema = z.object({
  userDbId: z.number(),
  companyName: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type exports
export type RealtorProfile = z.infer<typeof realtorProfileSchema>; 