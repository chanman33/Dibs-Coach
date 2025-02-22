import { z } from "zod"

// Schema for testimonials
const testimonialSchema = z.object({
  author: z.string(),
  content: z.string(),
})

// Helper for optional URL fields
const optionalUrlSchema = z.union([
  z.literal(""),
  z.string().url("Please enter a valid URL"),
  z.null()
])
.optional()
.catch("")  // Convert invalid URLs to empty string

// Schema for marketing information
export const marketingInfoSchema = z.object({
  slogan: z.string().optional(),
  websiteUrl: optionalUrlSchema,
  facebookUrl: optionalUrlSchema.refine(
    (val) => !val || val === "" || val.includes("facebook.com"),
    "Please enter a valid Facebook URL"
  ),
  instagramUrl: optionalUrlSchema.refine(
    (val) => !val || val === "" || val.includes("instagram.com"),
    "Please enter a valid Instagram URL"
  ),
  linkedinUrl: optionalUrlSchema.refine(
    (val) => !val || val === "" || val.includes("linkedin.com"),
    "Please enter a valid LinkedIn URL"
  ),
  youtubeUrl: optionalUrlSchema.refine(
    (val) => !val || val === "" || val.includes("youtube.com") || val.includes("youtu.be"),
    "Please enter a valid YouTube URL"
  ),
  marketingAreas: z.array(z.string()).default([]),
  testimonials: z.array(testimonialSchema)
    .transform(testimonials => 
      testimonials.filter(t => t.author.trim() !== "" || t.content.trim() !== "")
    )
    .default([])
})

// Schema for updating marketing information
export const updateMarketingInfoSchema = marketingInfoSchema

// Inferred types
export type MarketingInfo = z.infer<typeof marketingInfoSchema>
export type UpdateMarketingInfo = z.infer<typeof updateMarketingInfoSchema>
export type Testimonial = z.infer<typeof testimonialSchema> 