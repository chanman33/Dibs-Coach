import { z } from 'zod'

export const contactSalesSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  website: z.string()
    .transform((val) => val.trim())
    .refine((val) => /^[a-zA-Z0-9][\w-]*(\.[a-zA-Z0-9][\w-]*)+$/.test(val) || /^https?:\/\//.test(val), {
      message: "Please enter a valid website"
    }),
  fullName: z.string().min(2, "Full name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  teamSize: z.enum(["5-20", "20-50", "50-100", "100+"]),
  multipleOffices: z.enum(["yes", "no"]).transform(val => val === "yes"),
})

export type ContactSalesFormData = z.infer<typeof contactSalesSchema> 