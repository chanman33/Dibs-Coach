import { z } from "zod";

export const PROPERTY_TYPES = [
  "Office",
  "Retail",
  "Industrial",
  "Multifamily",
  "Mixed-Use",
  "Land",
  "Hotel",
  "Medical",
  "Self-Storage",
  "Other"
] as const;

export const DEAL_TYPES = [
  "Sales",
  "Leasing",
  "Investment",
  "Development",
  "Property Management",
  "Consulting"
] as const;

export const commercialFormSchema = z.object({
  companyName: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  specializations: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)),
  dealTypes: z.array(z.enum(DEAL_TYPES)),
  typicalDealSize: z.number().optional(),
  totalTransactionVolume: z.number().optional(),
  completedDeals: z.number().min(0).optional(),
  primaryMarket: z.string().optional(),
  serviceAreas: z.array(z.string()),
});

export type CommercialFormValues = z.infer<typeof commercialFormSchema>;

export interface CommercialProfile extends CommercialFormValues {
  ulid: string;
  userUlid: string;
  createdAt: Date;
  updatedAt: Date;
} 