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

// PropertyType Enum
export const PROPERTY_TYPE = {
  BUSINESS_OPPORTUNITY: "BusinessOpportunity",
  COMMERCIAL_LEASE: "CommercialLease",
  COMMERCIAL_SALE: "CommercialSale",
  FARM: "Farm",
  LAND: "Land",
  MANUFACTURED_IN_PARK: "ManufacturedInPark",
  RESIDENTIAL: "Residential",
} as const;
export type PropertyType = typeof PROPERTY_TYPE[keyof typeof PROPERTY_TYPE];
export const PropertyTypeEnum = z.enum(Object.values(PROPERTY_TYPE) as [string, ...string[]]);

// PropertySubType Enum
export const PROPERTY_SUB_TYPE = {
  APARTMENT: "Apartment",
  CABIN: "Cabin",
  CONDOMINIUM: "Condominium",
  DUPLEX: "Duplex",
  MANUFACTURED_HOME: "ManufacturedHome",
  SINGLE_FAMILY_DETACHED: "SingleFamilyDetached",
  SINGLE_FAMILY_ATTACHED: "SingleFamilyAttached",
  MOBILE: "Mobile",
  TOWNHOUSE: "Townhouse",
  TRIPLEX: "Triplex",
  QUADRUPLEX: "Quadruplex",
  HOTEL: "Hotel",
  COMMERCIAL_INDUSTRIAL: "CommercialIndustrial",
  COMMERCIAL_MIXED_USE: "CommercialMixedUse",
  MULTI_FAMILY: "MultiFamily",
  OFFICE: "Office",
  RETAIL: "Retail",
  RESTAURANT: "Restaurant",
  WAREHOUSE: "Warehouse",
  AGRICULTURAL_LAND: "AgriculturalLand",
  COMMERCIAL_LAND: "CommercialLand",
  INDUSTRIAL_LAND: "IndustrialLand",
  LAND_MIXED_USE: "LandMixedUse",
  RESIDENTIAL_LAND: "ResidentialLand",
  EQUESTRIAN: "Equestrian",
  RANCH: "Ranch",
  TIMBER_LAND: "TimberLand",
  VINEYARD: "Vineyard",
  BUSINESS_ONLY: "BusinessOnly",
  BUSINESS_WITH_PROPERTY: "BusinessWithProperty",
  BUSINESS_WITH_REAL_ESTATE: "BusinessWithRealEstate",
  DOUBLE_WIDE: "DoubleWide",
  SINGLE_WIDE: "SingleWide",
  TRIPLE_WIDE: "TripleWide",
  OTHER: "Other",
} as const;
export type PropertySubType = typeof PROPERTY_SUB_TYPE[keyof typeof PROPERTY_SUB_TYPE];
export const PropertySubTypeEnum = z.enum(Object.values(PROPERTY_SUB_TYPE) as [string, ...string[]]);

// CommercialPropertyType Enum
export const COMMERCIAL_PROPERTY_TYPE = {
  OFFICE: "OFFICE",
  RETAIL: "RETAIL",
  INDUSTRIAL: "INDUSTRIAL",
  MULTIFAMILY: "MULTIFAMILY",
  MIXED_USE: "MIXED_USE",
  LAND: "LAND",
  HOTEL: "HOTEL",
  MEDICAL: "MEDICAL",
  SELF_STORAGE: "SELF_STORAGE",
  OTHER: "OTHER",
} as const;
export type CommercialPropertyType = typeof COMMERCIAL_PROPERTY_TYPE[keyof typeof COMMERCIAL_PROPERTY_TYPE];
export const CommercialPropertyTypeEnum = z.enum(Object.values(COMMERCIAL_PROPERTY_TYPE) as [string, ...string[]]);

// InvestmentStrategy Enum
export const INVESTMENT_STRATEGY = {
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
export type InvestmentStrategy = typeof INVESTMENT_STRATEGY[keyof typeof INVESTMENT_STRATEGY];
export const InvestmentStrategyEnum = z.enum(Object.values(INVESTMENT_STRATEGY) as [string, ...string[]]);

// LoanType Enum
export const LOAN_TYPE = {
  CONVENTIONAL: "CONVENTIONAL",
  FHA: "FHA",
  VA: "VA",
  USDA: "USDA",
  JUMBO: "JUMBO",
  REVERSE: "REVERSE",
  CONSTRUCTION: "CONSTRUCTION",
  COMMERCIAL: "COMMERCIAL",
  HELOC: "HELOC",
  OTHER: "OTHER",
} as const;
export type LoanType = typeof LOAN_TYPE[keyof typeof LOAN_TYPE];
export const LoanTypeEnum = z.enum(Object.values(LOAN_TYPE) as [string, ...string[]]);

// PropertyManagerType Enum
export const PROPERTY_MANAGER_TYPE = {
  RESIDENTIAL: "RESIDENTIAL",
  COMMERCIAL: "COMMERCIAL",
  MIXED_USE: "MIXED_USE",
  VACATION_RENTAL: "VACATION_RENTAL",
  HOA: "HOA",
  STUDENT_HOUSING: "STUDENT_HOUSING",
  SENIOR_LIVING: "SENIOR_LIVING",
  OTHER: "OTHER",
} as const;
export type PropertyManagerType = typeof PROPERTY_MANAGER_TYPE[keyof typeof PROPERTY_MANAGER_TYPE];
export const PropertyManagerTypeEnum = z.enum(Object.values(PROPERTY_MANAGER_TYPE) as [string, ...string[]]);

// TitleEscrowType Enum
export const TITLE_ESCROW_TYPE = {
  TITLE_AGENT: "TITLE_AGENT",
  ESCROW_OFFICER: "ESCROW_OFFICER",
  CLOSING_AGENT: "CLOSING_AGENT",
  TITLE_EXAMINER: "TITLE_EXAMINER",
  UNDERWRITER: "UNDERWRITER",
  OTHER: "OTHER",
} as const;
export type TitleEscrowType = typeof TITLE_ESCROW_TYPE[keyof typeof TITLE_ESCROW_TYPE];
export const TitleEscrowTypeEnum = z.enum(Object.values(TITLE_ESCROW_TYPE) as [string, ...string[]]);

// InsuranceType Enum
export const INSURANCE_TYPE = {
  PROPERTY_CASUALTY: "PROPERTY_CASUALTY",
  TITLE_INSURANCE: "TITLE_INSURANCE",
  ERRORS_OMISSIONS: "ERRORS_OMISSIONS",
  LIABILITY: "LIABILITY",
  HOMEOWNERS: "HOMEOWNERS",
  FLOOD: "FLOOD",
  OTHER: "OTHER",
} as const;
export type InsuranceType = typeof INSURANCE_TYPE[keyof typeof INSURANCE_TYPE];
export const InsuranceTypeEnum = z.enum(Object.values(INSURANCE_TYPE) as [string, ...string[]]);

// CommercialDealType Enum
export const COMMERCIAL_DEAL_TYPE = {
  SALES: "SALES",
  LEASING: "LEASING",
  INVESTMENT: "INVESTMENT",
  DEVELOPMENT: "DEVELOPMENT",
  PROPERTY_MANAGEMENT: "PROPERTY_MANAGEMENT",
  CONSULTING: "CONSULTING",
} as const;
export type CommercialDealType = typeof COMMERCIAL_DEAL_TYPE[keyof typeof COMMERCIAL_DEAL_TYPE];
export const CommercialDealTypeEnum = z.enum(Object.values(COMMERCIAL_DEAL_TYPE) as [string, ...string[]]);

// PrivateCreditLoanType Enum
export const PRIVATE_CREDIT_LOAN_TYPE = {
  BRIDGE: "BRIDGE",
  CONSTRUCTION: "CONSTRUCTION",
  VALUE_ADD: "VALUE_ADD",
  ACQUISITION: "ACQUISITION",
  REFINANCE: "REFINANCE",
  MEZZANINE: "MEZZANINE",
  PREFERRED_EQUITY: "PREFERRED_EQUITY",
  OTHER: "OTHER",
} as const;
export type PrivateCreditLoanType = typeof PRIVATE_CREDIT_LOAN_TYPE[keyof typeof PRIVATE_CREDIT_LOAN_TYPE];
export const PrivateCreditLoanTypeEnum = z.enum(Object.values(PRIVATE_CREDIT_LOAN_TYPE) as [string, ...string[]]);

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
  propertyType: PropertyTypeEnum.optional(),
  propertySubType: PropertySubTypeEnum.optional(),
  commercialPropertyType: CommercialPropertyTypeEnum.optional(),
  investmentStrategy: InvestmentStrategyEnum.optional(),
  loanType: LoanTypeEnum.optional(),
  propertyManagerType: PropertyManagerTypeEnum.optional(),
  insuranceType: InsuranceTypeEnum.optional(),
  titleEscrowType: TitleEscrowTypeEnum.optional(),
  commercialDealType: CommercialDealTypeEnum.optional(),
  privateCreditLoanType: PrivateCreditLoanTypeEnum.optional()
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