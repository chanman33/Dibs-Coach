import { z } from "zod";

// Investment Strategy enum
export const InvestmentStrategy = {
  FIX_AND_FLIP: "FIX_AND_FLIP",
  BUY_AND_HOLD: "BUY_AND_HOLD",
  WHOLESALE: "WHOLESALE",
  COMMERCIAL: "COMMERCIAL",
  MULTIFAMILY: "MULTIFAMILY",
  LAND_DEVELOPMENT: "LAND_DEVELOPMENT",
  REIT: "REIT",
  SYNDICATION: "SYNDICATION",
  OTHER: "OTHER",
} as const;

export type InvestmentStrategyType = typeof InvestmentStrategy[keyof typeof InvestmentStrategy];

// Property Type enum
export const PropertyType = {
  BusinessOpportunity: "BusinessOpportunity",
  CommercialLease: "CommercialLease",
  CommercialSale: "CommercialSale",
  Farm: "Farm",
  Land: "Land",
  ManufacturedInPark: "ManufacturedInPark",
  Residential: "Residential",
} as const;

export type PropertyTypeValue = typeof PropertyType[keyof typeof PropertyType];

// Schema for the Investor profile form
export const investorProfileSchema = z.object({
  yearsExperience: z.number().min(0, "Years must be 0 or greater"),
  companyName: z.string().optional(),
  investmentStrategies: z.array(z.nativeEnum(InvestmentStrategy)).min(1, "At least one investment strategy is required"),
  minInvestmentAmount: z.number().min(0, "Amount must be 0 or greater").optional(),
  maxInvestmentAmount: z.number().min(0, "Amount must be 0 or greater").optional(),
  targetRoi: z.number().min(0, "ROI must be 0 or greater").optional(),
  preferredPropertyTypes: z.array(z.nativeEnum(PropertyType)).min(1, "At least one property type is required"),
  propertiesOwned: z.number().min(0, "Must be 0 or greater").optional(),
  totalPortfolioValue: z.number().min(0, "Must be 0 or greater").optional(),
  completedDeals: z.number().min(0, "Must be 0 or greater").optional(),
  primaryMarket: z.string().optional(),
  targetMarkets: z.array(z.string()).min(1, "At least one target market is required"),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional(),
});

// Type for the form values
export type InvestorProfileFormValues = z.infer<typeof investorProfileSchema>;

// Type for the initial data
export interface InvestorProfileInitialData {
  yearsExperience?: number;
  companyName?: string;
  investmentStrategies?: InvestmentStrategyType[];
  minInvestmentAmount?: number;
  maxInvestmentAmount?: number;
  targetRoi?: number;
  preferredPropertyTypes?: PropertyTypeValue[];
  propertiesOwned?: number;
  totalPortfolioValue?: number;
  completedDeals?: number;
  primaryMarket?: string;
  targetMarkets?: string[];
  certifications?: string[];
  languages?: string[];
  bio?: string;
} 