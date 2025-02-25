// Investment Strategy Types
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

// Property Types
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