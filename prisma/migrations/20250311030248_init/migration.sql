-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SYSTEM_OWNER', 'SYSTEM_MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "UserCapability" AS ENUM ('COACH', 'MENTEE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('INDIVIDUAL', 'TEAM', 'BUSINESS', 'ENTERPRISE', 'FRANCHISE', 'NETWORK');

-- CreateEnum
CREATE TYPE "OrgIndustry" AS ENUM ('REAL_ESTATE_SALES', 'MORTGAGE_LENDING', 'PROPERTY_MANAGEMENT', 'REAL_ESTATE_INVESTMENT', 'TITLE_ESCROW', 'INSURANCE', 'COMMERCIAL', 'PRIVATE_CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrgTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'PARTNER');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('GLOBAL_OWNER', 'GLOBAL_DIRECTOR', 'GLOBAL_MANAGER', 'REGIONAL_OWNER', 'REGIONAL_DIRECTOR', 'REGIONAL_MANAGER', 'LOCAL_OWNER', 'LOCAL_DIRECTOR', 'LOCAL_MANAGER', 'OWNER', 'DIRECTOR', 'MANAGER', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "OrgLevel" AS ENUM ('GLOBAL', 'REGIONAL', 'LOCAL', 'BRANCH');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RealEstateDomain" AS ENUM ('REALTOR', 'INVESTOR', 'MORTGAGE', 'PROPERTY_MANAGER', 'TITLE_ESCROW', 'INSURANCE', 'COMMERCIAL', 'PRIVATE_CREDIT');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ExpertiseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('LICENSE', 'CERTIFICATION', 'EMPLOYMENT', 'REFERENCE', 'BACKGROUND_CHECK', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'PENDING');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('PEER_TO_PEER', 'MENTORSHIP', 'GROUP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'debit_card', 'bank_transfer');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('INDIVIDUAL', 'TEAM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CoachApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('sales_volume', 'commission_income', 'gci', 'avg_sale_price', 'listings', 'buyer_transactions', 'closed_deals', 'days_on_market', 'coaching_sessions', 'group_sessions', 'session_revenue', 'active_mentees', 'mentee_satisfaction', 'response_time', 'session_completion', 'mentee_milestones', 'new_clients', 'referrals', 'client_retention', 'reviews', 'market_share', 'territory_expansion', 'social_media', 'website_traffic', 'certifications', 'training_hours', 'networking_events', 'custom');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('MILESTONE', 'PERFORMANCE', 'LEARNING');

-- CreateEnum
CREATE TYPE "RecognitionType" AS ENUM ('AWARD', 'ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('USER', 'COACH', 'SYSTEM', 'SECURITY');

-- CreateEnum
CREATE TYPE "ActivitySeverity" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('Active', 'ActiveUnderContract', 'Canceled', 'Closed', 'ComingSoon', 'Delete', 'Expired', 'Hold', 'Incomplete', 'Pending', 'Withdrawn');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('BusinessOpportunity', 'CommercialLease', 'CommercialSale', 'Farm', 'Land', 'ManufacturedInPark', 'Residential');

-- CreateEnum
CREATE TYPE "PropertySubType" AS ENUM ('Apartment', 'Cabin', 'Condominium', 'Duplex', 'ManufacturedHome', 'SingleFamilyDetached', 'SingleFamilyAttached', 'Mobile', 'Townhouse', 'Triplex', 'Quadruplex', 'Hotel', 'CommercialIndustrial', 'CommercialMixedUse', 'MultiFamily', 'Office', 'Retail', 'Restaurant', 'Warehouse', 'AgriculturalLand', 'CommercialLand', 'IndustrialLand', 'LandMixedUse', 'ResidentialLand', 'Equestrian', 'Ranch', 'TimberLand', 'Vineyard', 'BusinessOnly', 'BusinessWithProperty', 'BusinessWithRealEstate', 'DoubleWide', 'SingleWide', 'TripleWide', 'Other');

-- CreateEnum
CREATE TYPE "FurnishedStatus" AS ENUM ('Furnished', 'Negotiable', 'Partially', 'Unfurnished');

-- CreateEnum
CREATE TYPE "PropertyCondition" AS ENUM ('Excellent', 'Good', 'Fair', 'NeedsWork', 'Renovated', 'Updated');

-- CreateEnum
CREATE TYPE "ListingTerms" AS ENUM ('Cash', 'Conventional', 'FHA', 'OwnerFinancing', 'VA');

-- CreateEnum
CREATE TYPE "ListingAgreement" AS ENUM ('Exclusive', 'OpenListing', 'PocketListing');

-- CreateEnum
CREATE TYPE "ArchitecturalStyle" AS ENUM ('Colonial', 'Contemporary', 'Craftsman', 'Mediterranean', 'Modern', 'Ranch', 'Traditional', 'Victorian');

-- CreateEnum
CREATE TYPE "BasementType" AS ENUM ('Finished', 'Partially', 'Unfinished', 'None');

-- CreateEnum
CREATE TYPE "RoofType" AS ENUM ('Asphalt', 'Metal', 'Slate', 'Tile', 'Wood');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('City', 'Golf', 'Lake', 'Mountain', 'Ocean', 'Park', 'River', 'Woods');

-- CreateEnum
CREATE TYPE "SocialMediaPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'YOUTUBE', 'TWITTER', 'TIKTOK', 'PINTEREST', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('CONVENTIONAL', 'FHA', 'VA', 'USDA', 'JUMBO', 'REVERSE', 'CONSTRUCTION', 'COMMERCIAL', 'HELOC', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentStrategy" AS ENUM ('FIX_AND_FLIP', 'BUY_AND_HOLD', 'WHOLESALE', 'COMMERCIAL', 'MULTIFAMILY', 'LAND_DEVELOPMENT', 'REIT', 'SYNDICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyManagerType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'VACATION_RENTAL', 'HOA', 'STUDENT_HOUSING', 'SENIOR_LIVING', 'OTHER');

-- CreateEnum
CREATE TYPE "TitleEscrowType" AS ENUM ('TITLE_AGENT', 'ESCROW_OFFICER', 'CLOSING_AGENT', 'TITLE_EXAMINER', 'UNDERWRITER', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('PROPERTY_CASUALTY', 'TITLE_INSURANCE', 'ERRORS_OMISSIONS', 'LIABILITY', 'HOMEOWNERS', 'FLOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'es', 'zh', 'tl', 'vi', 'ar', 'fr', 'ko', 'ru', 'de', 'hi', 'pt', 'it', 'ja');

-- CreateEnum
CREATE TYPE "CommercialPropertyType" AS ENUM ('OFFICE', 'RETAIL', 'INDUSTRIAL', 'MULTIFAMILY', 'MIXED_USE', 'LAND', 'HOTEL', 'MEDICAL', 'SELF_STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialDealType" AS ENUM ('SALES', 'LEASING', 'INVESTMENT', 'DEVELOPMENT', 'PROPERTY_MANAGEMENT', 'CONSULTING');

-- CreateEnum
CREATE TYPE "PrivateCreditLoanType" AS ENUM ('BRIDGE', 'CONSTRUCTION', 'VALUE_ADD', 'ACQUISITION', 'REFINANCE', 'MEZZANINE', 'PREFERRED_EQUITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "ulid" CHAR(26) NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "systemRole" "UserRole" NOT NULL DEFAULT 'USER',
    "capabilities" "UserCapability"[],
    "isCoach" BOOLEAN NOT NULL DEFAULT false,
    "isMentee" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeConnectAccountId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "profileImageUrl" TEXT,
    "realEstateDomains" "RealEstateDomain"[] DEFAULT ARRAY[]::"RealEstateDomain"[],
    "primaryDomain" "RealEstateDomain",
    "totalYearsRE" INTEGER NOT NULL DEFAULT 0,
    "languages" "Language"[] DEFAULT ARRAY['en']::"Language"[],
    "primaryMarket" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "MenteeProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "focusAreas" TEXT[],
    "experienceLevel" TEXT,
    "learningStyle" TEXT,
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSessionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MenteeProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsCoaching" INTEGER,
    "coachSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hourlyRate" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultDuration" INTEGER NOT NULL DEFAULT 60,
    "allowCustomDuration" BOOLEAN NOT NULL DEFAULT false,
    "minimumDuration" INTEGER NOT NULL DEFAULT 30,
    "maximumDuration" INTEGER NOT NULL DEFAULT 120,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Organization" (
    "ulid" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "type" "OrgType" NOT NULL DEFAULT 'INDIVIDUAL',
    "industry" "OrgIndustry",
    "level" "OrgLevel" NOT NULL DEFAULT 'LOCAL',
    "tier" "OrgTier" NOT NULL DEFAULT 'FREE',
    "parentUlid" CHAR(26),
    "metadata" JSONB,
    "primaryDomain" "RealEstateDomain",
    "domains" "RealEstateDomain"[],
    "licenseNumbers" JSONB,
    "serviceAreas" TEXT[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "totalTransactions" INTEGER,
    "transactionVolume" DECIMAL(12,2),
    "activeAgents" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Region" (
    "ulid" CHAR(26) NOT NULL,
    "organizationUlid" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentUlid" CHAR(26),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "ulid" CHAR(26) NOT NULL,
    "organizationUlid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "scope" TEXT DEFAULT 'LOCAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "customPermissions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "ulid" CHAR(26) NOT NULL,
    "organizationUlid" CHAR(26) NOT NULL,
    "role" "OrgRole" NOT NULL,
    "permissions" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "MarketingProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26),
    "organizationUlid" CHAR(26),
    "slogan" TEXT,
    "brandColors" JSONB,
    "logoUrl" TEXT,
    "brandGuidelines" JSONB,
    "websiteUrl" TEXT,
    "blogUrl" TEXT,
    "socialMediaLinks" JSONB NOT NULL,
    "marketingAreas" TEXT[],
    "targetAudience" TEXT[],
    "geographicFocus" JSONB,
    "testimonials" JSONB,
    "pressFeatures" JSONB,
    "marketingMaterials" JSONB,
    "brandAssets" JSONB,
    "marketingTeam" JSONB,
    "campaignHistory" JSONB,
    "googleAnalyticsId" TEXT,
    "facebookPixelId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MarketingProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "RealtorProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "propertyTypes" TEXT[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "companyName" TEXT,
    "geographicFocus" JSONB,
    "primaryMarket" TEXT,
    "mlsId" TEXT,
    "mlsName" TEXT,
    "mlsStatus" TEXT DEFAULT 'ACTIVE',
    "memberKey" TEXT,
    "memberStatus" TEXT,
    "designations" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "RealtorProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "LoanOfficerProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "nmls" TEXT,
    "lenderName" TEXT,
    "branchLocation" TEXT,
    "loanTypes" "LoanType"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "closedLoansCount" INTEGER,
    "totalLoanVolume" DECIMAL(12,2),
    "averageLoanSize" DECIMAL(12,2),
    "geographicFocus" JSONB,
    "primaryMarket" TEXT,
    "licensedStates" TEXT[],
    "minLoanAmount" DECIMAL(12,2),
    "maxLoanAmount" DECIMAL(12,2),
    "typicalTurnaroundDays" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LoanOfficerProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "InvestorProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "investmentStrategies" "InvestmentStrategy"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "minInvestmentAmount" DECIMAL(12,2),
    "maxInvestmentAmount" DECIMAL(12,2),
    "targetRoi" DECIMAL(5,2),
    "preferredPropertyTypes" TEXT[],
    "propertiesOwned" INTEGER,
    "totalPortfolioValue" DECIMAL(12,2),
    "completedDeals" INTEGER,
    "geographicFocus" JSONB,
    "primaryMarket" TEXT,
    "targetMarkets" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "PropertyManagerProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "managerTypes" "PropertyManagerType"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "propertiesManaged" INTEGER,
    "totalUnits" INTEGER,
    "squareFeetManaged" DECIMAL(12,2),
    "occupancyRate" DECIMAL(5,2),
    "geographicFocus" JSONB,
    "primaryMarket" TEXT,
    "serviceZips" TEXT[],
    "minimumUnits" INTEGER,
    "propertyTypes" TEXT[],
    "services" TEXT[],
    "managementSoftware" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PropertyManagerProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "TitleEscrowProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "titleEscrowTypes" "TitleEscrowType"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "closingsCompleted" INTEGER,
    "averageClosingTime" INTEGER,
    "totalTransactionVolume" DECIMAL(12,2),
    "geographicFocus" JSONB,
    "primaryMarket" TEXT,
    "licensedStates" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TitleEscrowProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "InsuranceProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "insuranceTypes" "InsuranceType"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "policiesIssued" INTEGER,
    "totalPremiumVolume" DECIMAL(12,2),
    "claimProcessingTime" INTEGER,
    "geographicFocus" JSONB,
    "primaryMarket" TEXT,
    "licensedStates" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "InsuranceProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CommercialProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "specializations" TEXT[],
    "certifications" TEXT[],
    "propertyTypes" "CommercialPropertyType"[],
    "dealTypes" "CommercialDealType"[],
    "typicalDealSize" DECIMAL(12,2),
    "totalTransactionVolume" DECIMAL(12,2),
    "completedDeals" INTEGER,
    "averageDealSize" DECIMAL(12,2),
    "geographicFocus" JSONB,
    "primaryMarket" TEXT,
    "serviceAreas" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CommercialProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "PrivateCreditProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "specializations" TEXT[],
    "certifications" TEXT[],
    "minLoanAmount" DECIMAL(12,2),
    "maxLoanAmount" DECIMAL(12,2),
    "typicalTermLength" INTEGER,
    "interestRateRange" JSONB,
    "loanTypes" "PrivateCreditLoanType"[],
    "totalLoanVolume" DECIMAL(12,2),
    "activeLoans" INTEGER,
    "averageLoanSize" DECIMAL(12,2),
    "geographicFocus" JSONB,
    "primaryMarket" TEXT,
    "licensedStates" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PrivateCreditProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Session" (
    "ulid" CHAR(26) NOT NULL,
    "menteeUlid" CHAR(26) NOT NULL,
    "coachUlid" CHAR(26) NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "sessionType" "SessionType",
    "sessionNotes" TEXT,
    "zoomMeetingId" TEXT,
    "zoomMeetingUrl" TEXT,
    "priceAmount" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'usd',
    "platformFeeAmount" DOUBLE PRECISION,
    "coachPayoutAmount" DOUBLE PRECISION,
    "stripePaymentIntentId" TEXT,
    "paymentStatus" TEXT DEFAULT 'pending',
    "payoutStatus" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Payment" (
    "ulid" CHAR(26) NOT NULL,
    "sessionUlid" CHAR(26),
    "payerUlid" CHAR(26) NOT NULL,
    "payeeUlid" CHAR(26) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Review" (
    "ulid" CHAR(26) NOT NULL,
    "reviewerUlid" CHAR(26) NOT NULL,
    "revieweeUlid" CHAR(26) NOT NULL,
    "sessionUlid" CHAR(26),
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CoachApplication" (
    "ulid" CHAR(26) NOT NULL,
    "applicantUlid" CHAR(26) NOT NULL,
    "status" "CoachApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "yearsOfExperience" INTEGER NOT NULL,
    "superPower" TEXT NOT NULL,
    "aboutYou" TEXT,
    "realEstateDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryDomain" TEXT,
    "resumeUrl" TEXT,
    "linkedIn" TEXT,
    "primarySocialMedia" TEXT,
    "reviewerUlid" CHAR(26),
    "reviewDate" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "lastSavedAt" TIMESTAMPTZ,
    "draftData" JSONB,
    "draftVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachApplication_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Note" (
    "ulid" CHAR(26) NOT NULL,
    "authorUlid" CHAR(26) NOT NULL,
    "relatedUserUlid" CHAR(26),
    "sessionUlid" CHAR(26),
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Payout" (
    "ulid" CHAR(26) NOT NULL,
    "payeeUlid" CHAR(26) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripeTransferId" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "ulid" CHAR(26) NOT NULL,
    "stripeDisputeId" TEXT NOT NULL,
    "sessionUlid" CHAR(26),
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceDueBy" TIMESTAMP(3) NOT NULL,
    "evidence" JSONB NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentUlid" CHAR(26),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Chargeback" (
    "ulid" CHAR(26) NOT NULL,
    "paymentUlid" CHAR(26) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chargeback_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Refund" (
    "ulid" CHAR(26) NOT NULL,
    "paymentUlid" CHAR(26) NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Message" (
    "ulid" CHAR(26) NOT NULL,
    "senderUlid" CHAR(26) NOT NULL,
    "recipientUlid" CHAR(26) NOT NULL,
    "content" TEXT NOT NULL,
    "readStatus" TEXT NOT NULL DEFAULT 'unread',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Referral" (
    "ulid" CHAR(26) NOT NULL,
    "referrerUlid" CHAR(26) NOT NULL,
    "refereeUlid" CHAR(26) NOT NULL,
    "referralCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "sessionUlid" CHAR(26),
    "message" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "StripePaymentMethod" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "StripePaymentMethod_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "SetupIntent" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "stripeSetupIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SetupIntent_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "StripeConnectedAccount" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'usd',
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "requiresOnboarding" BOOLEAN NOT NULL DEFAULT true,
    "deauthorizedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "StripeConnectedAccount_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "ulid" CHAR(26) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeTransferId" TEXT,
    "platformFee" DOUBLE PRECISION,
    "coachPayout" DOUBLE PRECISION,
    "sessionUlid" CHAR(26),
    "payerUlid" CHAR(26) NOT NULL,
    "coachUlid" CHAR(26) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "SystemHealth" (
    "ulid" CHAR(26) NOT NULL,
    "status" INTEGER NOT NULL,
    "activeSessions" INTEGER NOT NULL,
    "pendingReviews" INTEGER NOT NULL,
    "securityAlerts" INTEGER NOT NULL,
    "uptime" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SystemHealth_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "AdminMetrics" (
    "ulid" CHAR(26) NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "totalCoaches" INTEGER NOT NULL,
    "activeCoaches" INTEGER NOT NULL,
    "pendingCoaches" INTEGER NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "completedSessions" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "monthlyRevenue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AdminMetrics_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "SystemActivity" (
    "ulid" CHAR(26) NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SystemActivity_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "SystemAlerts" (
    "ulid" CHAR(26) NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SystemAlerts_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "AdminActivity" (
    "ulid" CHAR(26) NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userUlid" CHAR(26),
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AdminActivity_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "ulid" CHAR(26) NOT NULL,
    "adminUlid" CHAR(26) NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetUlid" CHAR(26) NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Listing" (
    "ulid" CHAR(26) NOT NULL,
    "listingKey" TEXT,
    "parcelNumber" VARCHAR(50),
    "taxLot" VARCHAR(50),
    "taxBlock" VARCHAR(50),
    "taxMapNumber" VARCHAR(50),
    "taxLegalDescription" VARCHAR(1000),
    "propertyType" "PropertyType" NOT NULL,
    "propertySubType" "PropertySubType",
    "status" "ListingStatus" NOT NULL DEFAULT 'Active',
    "streetNumber" VARCHAR(25) NOT NULL,
    "streetName" VARCHAR(50) NOT NULL,
    "unitNumber" VARCHAR(25),
    "city" VARCHAR(150) NOT NULL,
    "stateOrProvince" VARCHAR(50) NOT NULL,
    "postalCode" VARCHAR(10) NOT NULL,
    "listPrice" DECIMAL(12,2) NOT NULL,
    "originalListPrice" DECIMAL(12,2),
    "closePrice" DECIMAL(12,2),
    "listingContractDate" TIMESTAMPTZ,
    "closeDate" TIMESTAMPTZ,
    "statusChangeTimestamp" TIMESTAMPTZ,
    "priceChangeTimestamp" TIMESTAMPTZ,
    "modificationTimestamp" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "bedroomsTotal" INTEGER,
    "bathroomsTotal" DECIMAL(3,1),
    "livingArea" DECIMAL(12,2),
    "lotSize" DECIMAL(12,2),
    "lotSizeDimensions" VARCHAR(50),
    "lotDimensionsSource" VARCHAR(50),
    "yearBuilt" INTEGER,
    "stories" INTEGER,
    "architecturalStyle" "ArchitecturalStyle",
    "basement" "BasementType",
    "roofType" "RoofType",
    "view" "ViewType"[],
    "parkingTotal" DECIMAL(12,2),
    "garageSpaces" DECIMAL(12,2),
    "furnished" "FurnishedStatus",
    "appliances" TEXT[],
    "interiorFeatures" TEXT[],
    "exteriorFeatures" TEXT[],
    "heating" TEXT[],
    "cooling" TEXT[],
    "isWaterfront" BOOLEAN NOT NULL DEFAULT false,
    "hasFireplace" BOOLEAN NOT NULL DEFAULT false,
    "hasPatio" BOOLEAN NOT NULL DEFAULT false,
    "hasDeck" BOOLEAN NOT NULL DEFAULT false,
    "hasPorch" BOOLEAN NOT NULL DEFAULT false,
    "propertyCondition" "PropertyCondition"[],
    "listingTerms" "ListingTerms"[],
    "listingAgreement" "ListingAgreement",
    "schoolDistrict" VARCHAR(100),
    "elementarySchool" VARCHAR(100),
    "middleSchool" VARCHAR(100),
    "highSchool" VARCHAR(100),
    "taxYear" INTEGER,
    "taxAnnualAmount" DECIMAL(12,2),
    "hoaName" VARCHAR(100),
    "hoaFeeAmount" DECIMAL(12,2),
    "hoaFeeFrequency" VARCHAR(50),
    "electricityAvailable" BOOLEAN NOT NULL DEFAULT true,
    "gasAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sewerAvailable" BOOLEAN NOT NULL DEFAULT true,
    "waterAvailable" BOOLEAN NOT NULL DEFAULT true,
    "zoning" VARCHAR(25),
    "zoningDescription" VARCHAR(255),
    "publicRemarks" VARCHAR(4000),
    "privateRemarks" VARCHAR(4000),
    "photos" JSONB,
    "virtualTours" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER,
    "mlsLink" VARCHAR(1000),
    "publicListingUrl" VARCHAR(1000),
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "mlsSource" TEXT,
    "mlsId" TEXT,
    "realtorProfileUlid" CHAR(26) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "AIThread" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AIThread_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "ulid" CHAR(26) NOT NULL,
    "threadUlid" CHAR(26) NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "EnterpriseLeads" (
    "ulid" CHAR(26) NOT NULL,
    "assignedToUlid" CHAR(26),
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "industry" "OrgIndustry" NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "multipleOffices" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" JSONB,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EnterpriseLeads_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Settings" (
    "ulid" CHAR(26) NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Goal" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "type" "GoalType" NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target" JSONB,
    "progress" JSONB,
    "startDate" TIMESTAMPTZ NOT NULL,
    "dueDate" TIMESTAMPTZ NOT NULL,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "type" "AchievementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "awardedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "ProfessionalRecognition" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "coachUlid" CHAR(26),
    "type" "RecognitionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "issuer" TEXT,
    "issueDate" TIMESTAMPTZ NOT NULL,
    "expiryDate" TIMESTAMPTZ,
    "verificationUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ProfessionalRecognition_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26),
    "organizationUlid" CHAR(26),
    "stripeSubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    "currentPeriodStart" TIMESTAMPTZ NOT NULL,
    "currentPeriodEnd" TIMESTAMPTZ NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "ulid" CHAR(26) NOT NULL,
    "subscriptionUlid" CHAR(26) NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMPTZ NOT NULL,
    "paidAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "userUlid" CHAR(26),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "ZoomSession" (
    "ulid" CHAR(26) NOT NULL,
    "sessionUlid" CHAR(26) NOT NULL,
    "sessionName" TEXT NOT NULL,
    "hostUlid" CHAR(26) NOT NULL,
    "startUrl" TEXT,
    "joinUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ZoomSession_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");

-- CreateIndex
CREATE INDEX "User_userId_idx" ON "User"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_systemRole_idx" ON "User"("systemRole");

-- CreateIndex
CREATE INDEX "User_isCoach_idx" ON "User"("isCoach");

-- CreateIndex
CREATE INDEX "User_isMentee_idx" ON "User"("isMentee");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_realEstateDomains_idx" ON "User"("realEstateDomains");

-- CreateIndex
CREATE INDEX "User_primaryDomain_idx" ON "User"("primaryDomain");

-- CreateIndex
CREATE INDEX "User_primaryMarket_idx" ON "User"("primaryMarket");

-- CreateIndex
CREATE UNIQUE INDEX "MenteeProfile_userUlid_key" ON "MenteeProfile"("userUlid");

-- CreateIndex
CREATE INDEX "MenteeProfile_userUlid_idx" ON "MenteeProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userUlid_key" ON "CoachProfile"("userUlid");

-- CreateIndex
CREATE INDEX "CoachProfile_userUlid_idx" ON "CoachProfile"("userUlid");

-- CreateIndex
CREATE INDEX "CoachProfile_profileStatus_idx" ON "CoachProfile"("profileStatus");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_level_idx" ON "Organization"("level");

-- CreateIndex
CREATE INDEX "Organization_parentUlid_idx" ON "Organization"("parentUlid");

-- CreateIndex
CREATE INDEX "Organization_primaryDomain_idx" ON "Organization"("primaryDomain");

-- CreateIndex
CREATE INDEX "Region_organizationUlid_idx" ON "Region"("organizationUlid");

-- CreateIndex
CREATE INDEX "Region_parentUlid_idx" ON "Region"("parentUlid");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationUlid_idx" ON "OrganizationMember"("organizationUlid");

-- CreateIndex
CREATE INDEX "OrganizationMember_userUlid_idx" ON "OrganizationMember"("userUlid");

-- CreateIndex
CREATE INDEX "OrganizationMember_role_idx" ON "OrganizationMember"("role");

-- CreateIndex
CREATE INDEX "OrganizationMember_status_idx" ON "OrganizationMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationUlid_userUlid_key" ON "OrganizationMember"("organizationUlid", "userUlid");

-- CreateIndex
CREATE INDEX "RolePermission_organizationUlid_idx" ON "RolePermission"("organizationUlid");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_organizationUlid_role_key" ON "RolePermission"("organizationUlid", "role");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingProfile_userUlid_key" ON "MarketingProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingProfile_organizationUlid_key" ON "MarketingProfile"("organizationUlid");

-- CreateIndex
CREATE INDEX "MarketingProfile_userUlid_idx" ON "MarketingProfile"("userUlid");

-- CreateIndex
CREATE INDEX "MarketingProfile_organizationUlid_idx" ON "MarketingProfile"("organizationUlid");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_userUlid_key" ON "RealtorProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_mlsId_key" ON "RealtorProfile"("mlsId");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_memberKey_key" ON "RealtorProfile"("memberKey");

-- CreateIndex
CREATE INDEX "RealtorProfile_userUlid_idx" ON "RealtorProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "LoanOfficerProfile_userUlid_key" ON "LoanOfficerProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "LoanOfficerProfile_nmls_key" ON "LoanOfficerProfile"("nmls");

-- CreateIndex
CREATE INDEX "LoanOfficerProfile_userUlid_idx" ON "LoanOfficerProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProfile_userUlid_key" ON "InvestorProfile"("userUlid");

-- CreateIndex
CREATE INDEX "InvestorProfile_userUlid_idx" ON "InvestorProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyManagerProfile_userUlid_key" ON "PropertyManagerProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyManagerProfile_licenseNumber_key" ON "PropertyManagerProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "PropertyManagerProfile_userUlid_idx" ON "PropertyManagerProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "TitleEscrowProfile_userUlid_key" ON "TitleEscrowProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "TitleEscrowProfile_licenseNumber_key" ON "TitleEscrowProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "TitleEscrowProfile_userUlid_idx" ON "TitleEscrowProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProfile_userUlid_key" ON "InsuranceProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProfile_licenseNumber_key" ON "InsuranceProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "InsuranceProfile_userUlid_idx" ON "InsuranceProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialProfile_userUlid_key" ON "CommercialProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialProfile_licenseNumber_key" ON "CommercialProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "CommercialProfile_userUlid_idx" ON "CommercialProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateCreditProfile_userUlid_key" ON "PrivateCreditProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateCreditProfile_licenseNumber_key" ON "PrivateCreditProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "PrivateCreditProfile_userUlid_idx" ON "PrivateCreditProfile"("userUlid");

-- CreateIndex
CREATE INDEX "Session_menteeUlid_idx" ON "Session"("menteeUlid");

-- CreateIndex
CREATE INDEX "Session_coachUlid_idx" ON "Session"("coachUlid");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_sessionUlid_key" ON "Payment"("sessionUlid");

-- CreateIndex
CREATE INDEX "Payment_sessionUlid_idx" ON "Payment"("sessionUlid");

-- CreateIndex
CREATE INDEX "Payment_payerUlid_idx" ON "Payment"("payerUlid");

-- CreateIndex
CREATE INDEX "Payment_payeeUlid_idx" ON "Payment"("payeeUlid");

-- CreateIndex
CREATE INDEX "Review_reviewerUlid_idx" ON "Review"("reviewerUlid");

-- CreateIndex
CREATE INDEX "Review_revieweeUlid_idx" ON "Review"("revieweeUlid");

-- CreateIndex
CREATE INDEX "Review_sessionUlid_idx" ON "Review"("sessionUlid");

-- CreateIndex
CREATE INDEX "CoachApplication_applicantUlid_idx" ON "CoachApplication"("applicantUlid");

-- CreateIndex
CREATE INDEX "CoachApplication_reviewerUlid_idx" ON "CoachApplication"("reviewerUlid");

-- CreateIndex
CREATE INDEX "CoachApplication_isDraft_applicantUlid_idx" ON "CoachApplication"("isDraft", "applicantUlid");

-- CreateIndex
CREATE INDEX "Note_authorUlid_idx" ON "Note"("authorUlid");

-- CreateIndex
CREATE INDEX "Note_relatedUserUlid_idx" ON "Note"("relatedUserUlid");

-- CreateIndex
CREATE INDEX "Note_sessionUlid_idx" ON "Note"("sessionUlid");

-- CreateIndex
CREATE INDEX "SupportTicket_userUlid_idx" ON "SupportTicket"("userUlid");

-- CreateIndex
CREATE INDEX "Payout_payeeUlid_idx" ON "Payout"("payeeUlid");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_stripeDisputeId_key" ON "Dispute"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "Dispute_sessionUlid_idx" ON "Dispute"("sessionUlid");

-- CreateIndex
CREATE INDEX "Dispute_stripeDisputeId_idx" ON "Dispute"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "Chargeback_paymentUlid_idx" ON "Chargeback"("paymentUlid");

-- CreateIndex
CREATE INDEX "Refund_paymentUlid_idx" ON "Refund"("paymentUlid");

-- CreateIndex
CREATE INDEX "Message_senderUlid_idx" ON "Message"("senderUlid");

-- CreateIndex
CREATE INDEX "Message_recipientUlid_idx" ON "Message"("recipientUlid");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_referrerUlid_idx" ON "Referral"("referrerUlid");

-- CreateIndex
CREATE INDEX "Referral_refereeUlid_idx" ON "Referral"("refereeUlid");

-- CreateIndex
CREATE INDEX "Reminder_userUlid_idx" ON "Reminder"("userUlid");

-- CreateIndex
CREATE INDEX "Reminder_sessionUlid_idx" ON "Reminder"("sessionUlid");

-- CreateIndex
CREATE INDEX "StripePaymentMethod_userUlid_idx" ON "StripePaymentMethod"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "StripePaymentMethod_userUlid_stripePaymentMethodId_key" ON "StripePaymentMethod"("userUlid", "stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "SetupIntent_userUlid_idx" ON "SetupIntent"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectedAccount_userUlid_key" ON "StripeConnectedAccount"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectedAccount_stripeAccountId_key" ON "StripeConnectedAccount"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_sessionUlid_key" ON "Transaction"("sessionUlid");

-- CreateIndex
CREATE INDEX "Transaction_payerUlid_idx" ON "Transaction"("payerUlid");

-- CreateIndex
CREATE INDEX "Transaction_coachUlid_idx" ON "Transaction"("coachUlid");

-- CreateIndex
CREATE INDEX "Transaction_sessionUlid_idx" ON "Transaction"("sessionUlid");

-- CreateIndex
CREATE INDEX "SystemHealth_createdAt_idx" ON "SystemHealth"("createdAt");

-- CreateIndex
CREATE INDEX "AdminMetrics_createdAt_idx" ON "AdminMetrics"("createdAt");

-- CreateIndex
CREATE INDEX "SystemActivity_type_createdAt_idx" ON "SystemActivity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SystemActivity_severity_createdAt_idx" ON "SystemActivity"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "SystemAlerts_type_createdAt_idx" ON "SystemAlerts"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SystemAlerts_severity_createdAt_idx" ON "SystemAlerts"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActivity_type_idx" ON "AdminActivity"("type");

-- CreateIndex
CREATE INDEX "AdminActivity_createdAt_idx" ON "AdminActivity"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUlid_idx" ON "AdminAuditLog"("adminUlid");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_listingKey_key" ON "Listing"("listingKey");

-- CreateIndex
CREATE INDEX "Listing_realtorProfileUlid_idx" ON "Listing"("realtorProfileUlid");

-- CreateIndex
CREATE INDEX "Listing_listingKey_idx" ON "Listing"("listingKey");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_isFeatured_idx" ON "Listing"("isFeatured");

-- CreateIndex
CREATE INDEX "AIThread_userUlid_idx" ON "AIThread"("userUlid");

-- CreateIndex
CREATE INDEX "AIMessage_threadUlid_idx" ON "AIMessage"("threadUlid");

-- CreateIndex
CREATE INDEX "EnterpriseLeads_assignedToUlid_idx" ON "EnterpriseLeads"("assignedToUlid");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE INDEX "Goal_userUlid_idx" ON "Goal"("userUlid");

-- CreateIndex
CREATE INDEX "Achievement_userUlid_idx" ON "Achievement"("userUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_userUlid_idx" ON "ProfessionalRecognition"("userUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_coachUlid_idx" ON "ProfessionalRecognition"("coachUlid");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userUlid_idx" ON "Subscription"("userUlid");

-- CreateIndex
CREATE INDEX "Subscription_organizationUlid_idx" ON "Subscription"("organizationUlid");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionUlid_idx" ON "Invoice"("subscriptionUlid");

-- CreateIndex
CREATE INDEX "Invoice_userUlid_idx" ON "Invoice"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomSession_sessionUlid_key" ON "ZoomSession"("sessionUlid");

-- CreateIndex
CREATE INDEX "ZoomSession_sessionUlid_idx" ON "ZoomSession"("sessionUlid");

-- AddForeignKey
ALTER TABLE "MenteeProfile" ADD CONSTRAINT "MenteeProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentUlid_fkey" FOREIGN KEY ("parentUlid") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentUlid_fkey" FOREIGN KEY ("parentUlid") REFERENCES "Region"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingProfile" ADD CONSTRAINT "MarketingProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingProfile" ADD CONSTRAINT "MarketingProfile_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealtorProfile" ADD CONSTRAINT "RealtorProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanOfficerProfile" ADD CONSTRAINT "LoanOfficerProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyManagerProfile" ADD CONSTRAINT "PropertyManagerProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleEscrowProfile" ADD CONSTRAINT "TitleEscrowProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceProfile" ADD CONSTRAINT "InsuranceProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProfile" ADD CONSTRAINT "CommercialProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateCreditProfile" ADD CONSTRAINT "PrivateCreditProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_menteeUlid_fkey" FOREIGN KEY ("menteeUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coachUlid_fkey" FOREIGN KEY ("coachUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerUlid_fkey" FOREIGN KEY ("payerUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payeeUlid_fkey" FOREIGN KEY ("payeeUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerUlid_fkey" FOREIGN KEY ("reviewerUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeUlid_fkey" FOREIGN KEY ("revieweeUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_applicantUlid_fkey" FOREIGN KEY ("applicantUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_reviewerUlid_fkey" FOREIGN KEY ("reviewerUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorUlid_fkey" FOREIGN KEY ("authorUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_relatedUserUlid_fkey" FOREIGN KEY ("relatedUserUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_payeeUlid_fkey" FOREIGN KEY ("payeeUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_paymentUlid_fkey" FOREIGN KEY ("paymentUlid") REFERENCES "Payment"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chargeback" ADD CONSTRAINT "Chargeback_paymentUlid_fkey" FOREIGN KEY ("paymentUlid") REFERENCES "Payment"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentUlid_fkey" FOREIGN KEY ("paymentUlid") REFERENCES "Payment"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUlid_fkey" FOREIGN KEY ("senderUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientUlid_fkey" FOREIGN KEY ("recipientUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUlid_fkey" FOREIGN KEY ("referrerUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeUlid_fkey" FOREIGN KEY ("refereeUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripePaymentMethod" ADD CONSTRAINT "StripePaymentMethod_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupIntent" ADD CONSTRAINT "SetupIntent_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeConnectedAccount" ADD CONSTRAINT "StripeConnectedAccount_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payerUlid_fkey" FOREIGN KEY ("payerUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_coachUlid_fkey" FOREIGN KEY ("coachUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUlid_fkey" FOREIGN KEY ("adminUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_realtorProfileUlid_fkey" FOREIGN KEY ("realtorProfileUlid") REFERENCES "RealtorProfile"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIThread" ADD CONSTRAINT "AIThread_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_threadUlid_fkey" FOREIGN KEY ("threadUlid") REFERENCES "AIThread"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseLeads" ADD CONSTRAINT "EnterpriseLeads_assignedToUlid_fkey" FOREIGN KEY ("assignedToUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_coachUlid_fkey" FOREIGN KEY ("coachUlid") REFERENCES "CoachProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionUlid_fkey" FOREIGN KEY ("subscriptionUlid") REFERENCES "Subscription"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomSession" ADD CONSTRAINT "ZoomSession_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
