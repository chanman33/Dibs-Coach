import { z } from "zod";

export const reviewSchema = z.object({
  id: z.number().describe("Internal database ID"),
  reviewerDbId: z.number(),
  revieweeDbId: z.number(),
  sessionId: z.number().nullable(),
  rating: z.number().min(1).max(5),
  comment: z.string().nullable(),
  status: z.enum(["PENDING", "PUBLISHED", "HIDDEN"]).default("PENDING"),
  isVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const reviewCreateSchema = z.object({
  reviewerDbId: z.number(),
  revieweeDbId: z.number(),
  sessionId: z.number().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  status: z.enum(["PENDING", "PUBLISHED", "HIDDEN"]).optional(),
  isVerified: z.boolean().optional(),
});

// Type exports
export type Review = z.infer<typeof reviewSchema>;
export type ReviewCreate = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdate = z.infer<typeof reviewUpdateSchema>; 