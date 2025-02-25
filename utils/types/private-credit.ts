import { z } from "zod";

export const LOAN_TYPES = [
  "Bridge",
  "Construction",
  "Value-Add",
  "Acquisition",
  "Refinance",
  "Mezzanine",
  "Preferred Equity",
  "Other"
] as const;

export const privateCreditFormSchema = z.object({
  companyName: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  specializations: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  minLoanAmount: z.number().optional(),
  maxLoanAmount: z.number().optional(),
  typicalTermLength: z.number().optional(),
  interestRateRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  loanTypes: z.array(z.enum(LOAN_TYPES)),
  totalLoanVolume: z.number().optional(),
  activeLoans: z.number().min(0).optional(),
  primaryMarket: z.string().optional(),
  licensedStates: z.array(z.string()),
});

export type PrivateCreditFormValues = z.infer<typeof privateCreditFormSchema>;

export interface PrivateCreditProfile extends PrivateCreditFormValues {
  ulid: string;
  userUlid: string;
  createdAt: Date;
  updatedAt: Date;
} 