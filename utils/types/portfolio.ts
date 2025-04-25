import { z } from "zod";
import { ulidSchema } from './auth';

// Portfolio Item Types
export const PortfolioItemTypeEnum = z.enum([
  "PROPERTY_SALE",
  "PROPERTY_PURCHASE",
  "LOAN_ORIGINATION",
  "PROPERTY_MANAGEMENT",
  "INSURANCE_POLICY",
  "COMMERCIAL_DEAL",
  "PRIVATE_LENDING",
  "TITLE_SERVICE",
  "OTHER"
]);

export type PortfolioItemType = z.infer<typeof PortfolioItemTypeEnum>;

// Financial details schema
export const financialDetailsSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  currency: z.string().default("USD"),
  percentAboveAsk: z.number().optional(),
  interestRate: z.number().optional(),
  term: z.number().optional(),
  otherDetails: z.record(z.string(), z.any()).optional()
}).nullable().optional();

// Location schema
export const locationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default("USA")
}).nullable().optional();

// Base portfolio item schema
export const portfolioItemSchema = z.object({
  type: PortfolioItemTypeEnum,
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrls: z.array(z.string().url("Must be a valid URL")).optional(),
  address: z.string().optional(),
  location: locationSchema,
  financialDetails: financialDetailsSchema,
  metrics: z.record(z.string(), z.any()).optional(),
  date: z.union([
    z.string().datetime(), // Full ISO datetime string
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"), // YYYY-MM-DD format
    z.date() // Date object
  ]),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  // Add property-specific fields
  propertyType: z.string().optional(),
  propertySubType: z.string().optional(),
  commercialPropertyType: z.string().optional(),
  investmentStrategy: z.string().optional(),
  loanType: z.string().optional(),
  propertyManagerType: z.string().optional(),
  insuranceType: z.string().optional(),
  titleEscrowType: z.string().optional(),
  commercialDealType: z.string().optional(),
  privateCreditLoanType: z.string().optional()
});

// Create portfolio item schema
export const createPortfolioItemSchema = portfolioItemSchema;

// Update portfolio item schema
export const updatePortfolioItemSchema = portfolioItemSchema.partial();

// Portfolio item with database fields
export const PortfolioItemSchema = portfolioItemSchema.extend({
  ulid: ulidSchema,
  userUlid: ulidSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Types
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type CreatePortfolioItem = z.infer<typeof createPortfolioItemSchema>;
export type UpdatePortfolioItem = z.infer<typeof updatePortfolioItemSchema>;

// Type labels for display
export const PORTFOLIO_ITEM_TYPE_LABELS: Record<PortfolioItemType, string> = {
  "PROPERTY_SALE": "Property Sale",
  "PROPERTY_PURCHASE": "Property Purchase",
  "LOAN_ORIGINATION": "Loan Origination",
  "PROPERTY_MANAGEMENT": "Property Management",
  "INSURANCE_POLICY": "Insurance Policy",
  "COMMERCIAL_DEAL": "Commercial Deal",
  "PRIVATE_LENDING": "Private Lending",
  "TITLE_SERVICE": "Title Service",
  "OTHER": "Other Achievement"
};

// Type icons/colors for display
export const PORTFOLIO_ITEM_TYPE_COLORS: Record<PortfolioItemType, string> = {
  "PROPERTY_SALE": "blue",
  "PROPERTY_PURCHASE": "green",
  "LOAN_ORIGINATION": "amber",
  "PROPERTY_MANAGEMENT": "violet",
  "INSURANCE_POLICY": "cyan",
  "COMMERCIAL_DEAL": "indigo",
  "PRIVATE_LENDING": "orange",
  "TITLE_SERVICE": "red",
  "OTHER": "gray"
}; 