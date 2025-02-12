import { z } from "zod";

// ==========================================
// Core RESO Enums
// ==========================================
export const MLSSourceEnum = z.enum([
  // Major Regional MLS Systems
  "BRIGHT_MLS", // Bright MLS (Mid-Atlantic)
  "CRMLS", // California Regional MLS
  "STELLAR_MLS", // Florida
  "NWMLS", // Northwest MLS
  "GAMLS", // Georgia MLS
  "HAR", // Houston Association of REALTORS
  "MRED", // Midwest Real Estate Data
  "ARMLS", // Arizona Regional MLS
  "MRIS", // Metropolitan Regional Information Systems
  "REALTRACS", // RealTracs (Tennessee)
  "URE", // UtahRealEstate.com (Utah)
  "WFRMLS", // Wasatch Front Regional MLS (Utah)
  
  // Additional Major Systems
  "ACTRIS", // Austin/Central Texas
  "CLAW", // Combined LA/Westside
  "GLVAR", // Greater Las Vegas
  "MFRMLS", // My Florida Regional
  "MIBOR", // Metropolitan Indianapolis
  "MLSPIN", // MLS Property Information Network (New England)
  "RMLS", // Regional MLS (Portland)
  "SABOR", // San Antonio Board of REALTORS
  "TREND", // TREND MLS (Philadelphia)
  
  // Generic Options
  "OTHER_RESO", // Other RESO-certified MLS
  "OTHER" // Non-RESO MLS System
]);

export const PropertyTypeEnum = z.enum([
  "BusinessOpportunity",
  "CommercialLease",
  "CommercialSale",
  "Farm",
  "Land",
  "ManufacturedInPark",
  "Residential",
]);

export const PropertySubTypeEnum = z.enum([
  // Residential subtypes
  "Apartment",
  "Cabin",
  "Condominium",
  "Duplex",
  "ManufacturedHome",
  "SingleFamilyDetached",
  "SingleFamilyAttached",
  "Mobile",
  "Townhouse",
  "Triplex",
  "Quadruplex",
  
  // Commercial subtypes
  "Hotel",
  "CommercialIndustrial",
  "CommercialMixedUse",
  "MultiFamily",
  "Office",
  "Retail",
  "Restaurant",
  "Warehouse",
  
  // Land subtypes
  "AgriculturalLand",
  "CommercialLand",
  "IndustrialLand",
  "LandMixedUse",
  "ResidentialLand",
  
  // Farm subtypes
  "Equestrian",
  "Ranch",
  "TimberLand",
  "Vineyard",
  
  // Business Opportunity subtypes
  "BusinessOnly",
  "BusinessWithProperty",
  "BusinessWithRealEstate",
  
  // ManufacturedInPark subtypes
  "DoubleWide",
  "SingleWide",
  "TripleWide",
  
  // Other
  "Other"
]);

export const ListingStatusEnum = z.enum([
  "Active",
  "ActiveUnderContract",
  "Canceled",
  "Closed",
  "ComingSoon",
  "Delete",
  "Expired",
  "Hold",
  "Incomplete",
  "Pending",
  "Withdrawn",
]);

// ==========================================
// Property Feature Enums
// ==========================================
export const FurnishedStatusEnum = z.enum([
  "Furnished",
  "Negotiable",
  "Partially",
  "Unfurnished",
]);

export const AppliancesEnum = z.enum([
  "CentralVacuum",
  "Dishwasher",
  "Dryer",
  "GarbageDisposal",
  "Microwave",
  "Range",
  "Refrigerator",
  "Washer",
  "WaterHeater",
  "WaterSoftener",
]);

export const HeatingEnum = z.enum([
  "Baseboard",
  "ForcedAir",
  "GasHeating",
  "GeothermalHeat",
  "HeatPump",
  "Radiant",
  "Solar",
  "WoodStove",
]);

export const CoolingEnum = z.enum([
  "CentralAir",
  "Ductless",
  "Geothermal",
  "HeatPump",
  "Wall",
  "Window",
]);

// ==========================================
// Property Details Enums
// ==========================================
export const PropertyConditionEnum = z.enum([
  "Excellent",
  "Good",
  "Fair",
  "NeedsWork",
  "Renovated",
  "Updated",
]);

export const ListingTermsEnum = z.enum([
  "Cash",
  "Conventional",
  "FHA",
  "OwnerFinancing",
  "VA",
]);

export const ListingAgreementEnum = z.enum([
  "Exclusive",
  "OpenListing",
  "PocketListing",
]);

export const ArchitecturalStyleEnum = z.enum([
  "Colonial",
  "Contemporary",
  "Craftsman",
  "Mediterranean",
  "Modern",
  "Ranch",
  "Traditional",
  "Victorian",
]);

export const BasementTypeEnum = z.enum([
  "Finished",
  "Partially",
  "Unfinished",
  "None",
]);

export const RoofTypeEnum = z.enum([
  "Asphalt",
  "Metal",
  "Slate",
  "Tile",
  "Wood",
]);

export const ViewTypeEnum = z.enum([
  "City",
  "Golf",
  "Lake",
  "Mountain",
  "Ocean",
  "Park",
  "River",
  "Woods",
]);

// ==========================================
// RESO Validation Rules
// ==========================================
const resoPrice = z.preprocess(
  // First preprocess to handle string inputs and convert to number
  (val) => {
    if (typeof val === 'string') {
      return val === '' ? null : parseFloat(val);
    }
    return val;
  },
  // Then validate the number
  z.number()
    .multipleOf(0.01)
    .min(-999999999999.99)
    .max(999999999999.99)
    .nullable()
);

const resoString = (maxLength: number) => z.string().max(maxLength).nullable();

// ==========================================
// Base Listing Schema
// ==========================================
export const listingBaseSchema = z.object({
  // Core Identification
  listingKey: z.string().min(1, "Listing Key is required"),
  mlsSource: MLSSourceEnum.nullable(),
  mlsId: z.string().nullable(),
  parcelNumber: z.string().max(50).optional(),
  taxLot: z.string().max(50).optional(),
  taxBlock: z.string().max(50).optional(),
  taxMapNumber: z.string().max(50).optional(),
  taxLegalDescription: z.string().max(1000).optional(),

  // Property Classification
  propertyType: PropertyTypeEnum,
  propertySubType: PropertySubTypeEnum.nullable(),
  status: ListingStatusEnum.optional(),

  // Location Information (Required by database)
  streetNumber: z.string().max(25),
  streetName: z.string().max(50),
  unitNumber: z.string().max(25).nullable(),
  city: z.string().max(150),
  stateOrProvince: z.string().max(50),
  postalCode: z.string().max(10),

  // Price Information (listPrice required by database)
  listPrice: z.number().positive("List price must be greater than 0"),
  originalListPrice: z.number().positive().nullable(),
  closePrice: z.number().positive().nullable(),

  // Dates
  listingContractDate: z.union([z.string(), z.date()]).nullable(),
  closeDate: z.union([z.string(), z.date()]).nullable(),
  statusChangeTimestamp: z.union([z.string(), z.date()]).nullable().optional(),
  priceChangeTimestamp: z.union([z.string(), z.date()]).nullable().optional(),
  modificationTimestamp: z.union([z.string(), z.date()]).nullable().optional(),

  // Physical Characteristics
  bedroomsTotal: z.number().int().min(0).nullable(),
  bathroomsTotal: z.number().multipleOf(0.5).min(0).nullable(),
  livingArea: z.number().positive().nullable(),
  lotSize: z.number().multipleOf(0.01).positive().nullable().optional(),
  lotSizeDimensions: z.string().max(50).nullable().optional(),
  lotDimensionsSource: z.string().max(50).nullable().optional(),
  yearBuilt: z.number().int().positive().nullable(),
  stories: z.number().int().positive().nullable().optional(),

  // Structural Details
  architecturalStyle: ArchitecturalStyleEnum.nullable().optional(),
  basement: BasementTypeEnum.nullable().optional(),
  roofType: RoofTypeEnum.nullable().optional(),
  view: z.array(ViewTypeEnum).optional(),

  // Parking Information
  parkingTotal: z.number().multipleOf(0.01).positive().nullable().optional(),
  garageSpaces: z.number().multipleOf(0.01).positive().nullable().optional(),

  // Property Features
  furnished: FurnishedStatusEnum.nullable().optional(),
  appliances: z.array(AppliancesEnum).optional(),
  interiorFeatures: z.array(z.string()).optional(),
  exteriorFeatures: z.array(z.string()).optional(),
  heating: z.array(HeatingEnum).optional(),
  cooling: z.array(CoolingEnum).optional(),

  // Property Amenities
  isWaterfront: z.boolean().default(false),
  hasFireplace: z.boolean().default(false),
  hasPatio: z.boolean().default(false),
  hasDeck: z.boolean().default(false),
  hasPorch: z.boolean().default(false),

  // Property Condition and Terms
  propertyCondition: z.array(PropertyConditionEnum).optional(),
  listingTerms: z.array(ListingTermsEnum).optional(),
  listingAgreement: ListingAgreementEnum.nullable().optional(),

  // Community Information
  schoolDistrict: z.string().max(100).nullable().optional(),
  elementarySchool: z.string().max(100).nullable().optional(),
  middleSchool: z.string().max(100).nullable().optional(),
  highSchool: z.string().max(100).nullable().optional(),

  // Financial Information
  taxYear: z.number().int().positive().nullable().optional(),
  taxAnnualAmount: z.number().positive().nullable().optional(),
  hoaName: z.string().max(100).nullable().optional(),
  hoaFeeAmount: z.number().positive().nullable().optional(),
  hoaFeeFrequency: z.enum(["monthly", "quarterly", "annual"]).nullable().optional(),

  // Utilities
  electricityAvailable: z.boolean().default(true),
  gasAvailable: z.boolean().default(true),
  sewerAvailable: z.boolean().default(true),
  waterAvailable: z.boolean().default(true),

  // Zoning Information
  zoning: z.string().max(25).nullable().optional(),
  zoningDescription: z.string().max(255).nullable().optional(),

  // Marketing Information
  publicRemarks: z.string().max(4000).optional(),
  privateRemarks: z.string().max(4000).nullable().optional(),
  photos: z.array(z.string().url()).optional(),
  virtualTours: z.array(z.string().url()).optional(),
  isFeatured: z.boolean().default(false),
  featuredOrder: z.number().int().nullable().optional(),

  // Source Information
  source: z.literal("MANUAL"),
});

// ==========================================
// Derived Schemas
// ==========================================
export const createListingSchema = listingBaseSchema;
export const updateListingSchema = listingBaseSchema.partial();

// ==========================================
// Type Exports
// ==========================================
export type PropertyType = z.infer<typeof PropertyTypeEnum>;
export type ListingStatus = z.infer<typeof ListingStatusEnum>;
export type FurnishedStatus = z.infer<typeof FurnishedStatusEnum>;
export type ListingBase = z.infer<typeof listingBaseSchema>;
export type CreateListing = z.infer<typeof createListingSchema>;
export type UpdateListing = z.infer<typeof updateListingSchema>;

// ==========================================
// Form Field Configuration
// ==========================================
export interface ListingFormField {
  name: keyof CreateListing;
  label: string;
  type: "text" | "number" | "select" | "date" | "textarea" | "checkbox";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  maxLength?: number;
}

// Form fields configuration organized by sections
export const listingFormFields: ListingFormField[] = [
  // Core Identification Fields
  {
    name: "listingKey",
    label: "Listing Key",
    type: "text",
    placeholder: "Enter MLS listing key",
    maxLength: 50,
  },
  {
    name: "parcelNumber",
    label: "Parcel Number",
    type: "text",
    placeholder: "Enter parcel number",
    maxLength: 50,
  },

  // Property Classification Fields
  {
    name: "propertyType",
    label: "Property Type",
    type: "select",
    required: true,
    options: [
      { value: "BusinessOpportunity", label: "Business Opportunity" },
      { value: "CommercialLease", label: "Commercial Lease" },
      { value: "CommercialSale", label: "Commercial Sale" },
      { value: "Farm", label: "Farm" },
      { value: "Land", label: "Land" },
      { value: "ManufacturedInPark", label: "Manufactured In Park" },
      { value: "Residential", label: "Residential" },
    ],
  },
  {
    name: "status",
    label: "Listing Status",
    type: "select",
    required: true,
    options: [
      { value: "Active", label: "Active" },
      { value: "ActiveUnderContract", label: "Active Under Contract" },
      { value: "Canceled", label: "Canceled" },
      { value: "Closed", label: "Closed" },
      { value: "ComingSoon", label: "Coming Soon" },
      { value: "Expired", label: "Expired" },
      { value: "Hold", label: "Hold" },
      { value: "Pending", label: "Pending" },
      { value: "Withdrawn", label: "Withdrawn" },
    ],
  },

  // Location Fields
  {
    name: "streetNumber",
    label: "Street Number",
    type: "text",
    required: true,
    placeholder: "Enter street number",
    maxLength: 25,
  },
  {
    name: "streetName",
    label: "Street Name",
    type: "text",
    required: true,
    placeholder: "Enter street name",
    maxLength: 50,
  },
  {
    name: "unitNumber",
    label: "Unit Number",
    type: "text",
    placeholder: "Enter unit number",
    maxLength: 25,
  },
  {
    name: "city",
    label: "City",
    type: "text",
    required: true,
    placeholder: "Enter city",
    maxLength: 150,
  },
  {
    name: "stateOrProvince",
    label: "State/Province",
    type: "text",
    required: true,
    placeholder: "Enter state or province",
    maxLength: 50,
  },
  {
    name: "postalCode",
    label: "Postal Code",
    type: "text",
    required: true,
    placeholder: "Enter postal code",
    maxLength: 10,
  },

  // Price Fields
  {
    name: "listPrice",
    label: "List Price",
    type: "number",
    required: true,
    placeholder: "Enter listing price",
  },
  {
    name: "closePrice",
    label: "Close Price",
    type: "number",
    placeholder: "Enter closing price (if sold)",
  },

  // Date Fields
  {
    name: "listingContractDate",
    label: "Listing Date",
    type: "date",
    required: true,
  },
  {
    name: "closeDate",
    label: "Close Date",
    type: "date",
  },

  // Physical Characteristics Fields
  {
    name: "bedroomsTotal",
    label: "Bedrooms",
    type: "number",
    required: true,
    placeholder: "Enter number of bedrooms",
  },
  {
    name: "bathroomsTotal",
    label: "Bathrooms",
    type: "number",
    required: true,
    placeholder: "Enter number of bathrooms",
  },
  {
    name: "livingArea",
    label: "Living Area (sq ft)",
    type: "number",
    placeholder: "Enter living area",
  },
  {
    name: "lotSize",
    label: "Lot Size (sq ft)",
    type: "number",
    placeholder: "Enter lot size",
  },
  {
    name: "yearBuilt",
    label: "Year Built",
    type: "number",
    placeholder: "Enter year built",
  },

  // Property Features Fields
  {
    name: "furnished",
    label: "Furnished Status",
    type: "select",
    options: [
      { value: "Furnished", label: "Furnished" },
      { value: "Negotiable", label: "Negotiable" },
      { value: "Partially", label: "Partially Furnished" },
      { value: "Unfurnished", label: "Unfurnished" },
    ],
  },

  // Description Fields
  {
    name: "publicRemarks",
    label: "Public Description",
    type: "textarea",
    placeholder: "Enter public listing description",
    maxLength: 4000,
  },
  {
    name: "privateRemarks",
    label: "Private Remarks",
    type: "textarea",
    placeholder: "Enter private agent remarks",
    maxLength: 4000,
  },

  // Featured Status
  {
    name: "isFeatured",
    label: "Feature this Listing",
    type: "checkbox",
  },
];

// Add helper function to get valid subtypes
export const getValidSubTypes = (propertyType: PropertyType | undefined): string[] => {
  switch (propertyType) {
    case "Residential":
      return [
        "Apartment",
        "Cabin",
        "Condominium",
        "Duplex",
        "ManufacturedHome",
        "SingleFamilyDetached",
        "SingleFamilyAttached",
        "Mobile",
        "Townhouse",
        "Triplex",
        "Quadruplex",
      ];
    case "CommercialLease":
    case "CommercialSale":
      return [
        "Hotel",
        "CommercialIndustrial",
        "CommercialMixedUse",
        "MultiFamily",
        "Office",
        "Retail",
        "Restaurant",
        "Warehouse",
      ];
    case "Land":
      return [
        "AgriculturalLand",
        "CommercialLand",
        "IndustrialLand",
        "LandMixedUse",
        "ResidentialLand",
      ];
    case "Farm":
      return [
        "Equestrian",
        "Ranch",
        "TimberLand",
        "Vineyard",
      ];
    case "BusinessOpportunity":
      return [
        "BusinessOnly",
        "BusinessWithProperty",
        "BusinessWithRealEstate",
      ];
    case "ManufacturedInPark":
      return [
        "DoubleWide",
        "SingleWide",
        "TripleWide",
      ];
    default:
      return [];
  }
}; 