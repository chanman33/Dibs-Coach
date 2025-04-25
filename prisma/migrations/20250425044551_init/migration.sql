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
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED', 'ABSENT');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('MANAGED', 'GROUP_SESSION', 'OFFICE_HOURS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('credit_card', 'debit_card', 'bank_transfer');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'CAD');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'es', 'zh', 'tl', 'vi', 'ar', 'fr', 'ko', 'ru', 'de', 'hi', 'pt', 'it', 'ja');

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
CREATE TYPE "RecognitionType" AS ENUM ('AWARD', 'ACHIEVEMENT', 'CERTIFICATION', 'DESIGNATION', 'LICENSE', 'EDUCATION', 'MEMBERSHIP');

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
CREATE TYPE "CommercialPropertyType" AS ENUM ('OFFICE', 'RETAIL', 'INDUSTRIAL', 'MULTIFAMILY', 'MIXED_USE', 'LAND', 'HOTEL', 'MEDICAL', 'SELF_STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialDealType" AS ENUM ('SALES', 'LEASING', 'INVESTMENT', 'DEVELOPMENT', 'PROPERTY_MANAGEMENT', 'CONSULTING');

-- CreateEnum
CREATE TYPE "PrivateCreditLoanType" AS ENUM ('BRIDGE', 'CONSTRUCTION', 'VALUE_ADD', 'ACQUISITION', 'REFINANCE', 'MEZZANINE', 'PREFERRED_EQUITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PortfolioItemType" AS ENUM ('PROPERTY_SALE', 'PROPERTY_PURCHASE', 'LOAN_ORIGINATION', 'PROPERTY_MANAGEMENT', 'INSURANCE_POLICY', 'COMMERCIAL_DEAL', 'PRIVATE_LENDING', 'TITLE_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "CalSchedulingType" AS ENUM ('MANAGED', 'OFFICE_HOURS', 'GROUP_SESSION');

-- CreateEnum
CREATE TYPE "CalBookingStatus" AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED', 'REJECTED', 'ABSENT');

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
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
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
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MenteeProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsCoaching" INTEGER,
    "coachSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hourlyRate" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultDuration" INTEGER NOT NULL DEFAULT 60,
    "allowCustomDuration" BOOLEAN NOT NULL DEFAULT false,
    "minimumDuration" INTEGER NOT NULL DEFAULT 30,
    "maximumDuration" INTEGER NOT NULL DEFAULT 120,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "coachPrimaryDomain" "RealEstateDomain",
    "coachRealEstateDomains" "RealEstateDomain"[] DEFAULT ARRAY[]::"RealEstateDomain"[],
    "eventTypeUrl" TEXT,
    "slogan" TEXT,
    "lastSlugUpdateAt" TIMESTAMPTZ(6),
    "profileSlug" TEXT,
    "websiteUrl" VARCHAR(2048),
    "facebookUrl" VARCHAR(2048),
    "instagramUrl" VARCHAR(2048),
    "linkedinUrl" VARCHAR(2048),
    "youtubeUrl" VARCHAR(2048),
    "tiktokUrl" VARCHAR(2048),

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
    "licenseNumbers" JSONB,
    "specializations" TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

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
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

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
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "ulid" CHAR(26) NOT NULL,
    "organizationUlid" CHAR(26) NOT NULL,
    "role" "OrgRole" NOT NULL,
    "permissions" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

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
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MarketingProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Session" (
    "ulid" CHAR(26) NOT NULL,
    "menteeUlid" CHAR(26) NOT NULL,
    "coachUlid" CHAR(26) NOT NULL,
    "startTime" TIMESTAMPTZ(6) NOT NULL,
    "endTime" TIMESTAMPTZ(6) NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "sessionNotes" TEXT,
    "originalSessionUlid" CHAR(26),
    "rescheduledFromUlid" CHAR(26),
    "rescheduledToUlid" CHAR(26),
    "reschedulingHistory" JSONB DEFAULT '[]',
    "reschedulingReason" TEXT,
    "rescheduledBy" TEXT,
    "cancelledAt" TIMESTAMPTZ(6),
    "cancelledBy" TEXT,
    "cancelledByUlid" CHAR(26),
    "cancellationReason" TEXT,
    "cancellationPolicy" TEXT,
    "cancellationFee" DECIMAL(10,2),
    "cancellationHistory" JSONB DEFAULT '[]',
    "isRefundable" BOOLEAN NOT NULL DEFAULT true,
    "absentCoach" BOOLEAN DEFAULT false,
    "absentCoachMarkedAt" TIMESTAMPTZ(6),
    "absentCoachMarkedBy" TEXT,
    "absentMentee" BOOLEAN DEFAULT false,
    "absentMenteeMarkedAt" TIMESTAMPTZ(6),
    "absentMenteeMarkedBy" TEXT,
    "absenceHistory" JSONB DEFAULT '[]',
    "zoomMeetingId" TEXT,
    "zoomStartUrl" TEXT,
    "zoomJoinUrl" TEXT,
    "zoomMeetingPassword" TEXT,
    "zoomMeetingSettings" JSONB,
    "zoomMetadata" JSONB,
    "calBookingUlid" CHAR(26),
    "calEventTypeUlid" CHAR(26),
    "price" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "paymentStatus" TEXT DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentIntentId" TEXT,
    "refundStatus" TEXT,
    "refundAmount" DECIMAL(10,2),
    "refundReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

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
    "lastSavedAt" TIMESTAMPTZ(6),
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
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "StripePaymentMethod_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "SetupIntent" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "stripeSetupIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

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
    "deauthorizedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

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
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

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
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EnterpriseLeads_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Settings" (
    "ulid" CHAR(26) NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Goal" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "organizationUlid" CHAR(26),
    "type" "GoalType" NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target" JSONB,
    "progress" JSONB,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "dueDate" TIMESTAMPTZ(6) NOT NULL,
    "completedAt" TIMESTAMPTZ(6),
    "milestones" JSONB,
    "growthPlan" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("ulid")
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
    "issueDate" TIMESTAMPTZ(6) NOT NULL,
    "expiryDate" TIMESTAMPTZ(6),
    "verificationUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "industryType" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

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
    "currentPeriodStart" TIMESTAMPTZ(6) NOT NULL,
    "currentPeriodEnd" TIMESTAMPTZ(6) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "totalSeats" INTEGER NOT NULL DEFAULT 1,
    "usedSeats" INTEGER NOT NULL DEFAULT 0,
    "seatPrice" DECIMAL(10,2),
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "billingDay" INTEGER,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "SeatLicense" (
    "ulid" CHAR(26) NOT NULL,
    "subscriptionUlid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assignedByUserUlid" CHAR(26),
    "departmentName" TEXT,
    "teamName" TEXT,
    "metadata" JSONB,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SeatLicense_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "ulid" CHAR(26) NOT NULL,
    "subscriptionUlid" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUlid" CHAR(26),
    "amount" DECIMAL(10,2) NOT NULL,
    "spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26),
    "organizationUlid" CHAR(26),
    "stripePaymentId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "last4" TEXT NOT NULL,
    "brand" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "country" TEXT,
    "billingAddress" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "ulid" CHAR(26) NOT NULL,
    "subscriptionUlid" CHAR(26),
    "paymentMethodUlid" CHAR(26),
    "organizationUlid" CHAR(26),
    "userUlid" CHAR(26),
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "ulid" CHAR(26) NOT NULL,
    "subscriptionUlid" CHAR(26) NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMPTZ(6) NOT NULL,
    "paidAt" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "userUlid" CHAR(26),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CoachingAvailabilitySchedule" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "calScheduleId" INTEGER,
    "availability" JSONB NOT NULL,
    "overrides" JSONB,
    "syncSource" TEXT NOT NULL DEFAULT 'LOCAL',
    "lastSyncedAt" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "allowCustomDuration" BOOLEAN NOT NULL DEFAULT true,
    "defaultDuration" INTEGER NOT NULL DEFAULT 60,
    "maximumDuration" INTEGER NOT NULL DEFAULT 120,
    "minimumDuration" INTEGER NOT NULL DEFAULT 30,
    "bufferAfter" INTEGER NOT NULL DEFAULT 0,
    "bufferBefore" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "zoomEnabled" BOOLEAN NOT NULL DEFAULT false,
    "calendlyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CoachingAvailabilitySchedule_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "type" "PortfolioItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrls" JSONB,
    "address" TEXT,
    "location" JSONB,
    "financialDetails" JSONB,
    "propertyType" "PropertyType",
    "propertySubType" "PropertySubType",
    "commercialPropertyType" "CommercialPropertyType",
    "investmentStrategy" "InvestmentStrategy",
    "loanType" "LoanType",
    "propertyManagerType" "PropertyManagerType",
    "insuranceType" "InsuranceType",
    "titleEscrowType" "TitleEscrowType",
    "commercialDealType" "CommercialDealType",
    "privateCreditLoanType" "PrivateCreditLoanType",
    "metrics" JSONB,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "tags" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CalendarIntegration" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CAL',
    "calManagedUserId" INTEGER NOT NULL,
    "calUsername" TEXT NOT NULL,
    "calAccessToken" TEXT NOT NULL,
    "calRefreshToken" TEXT NOT NULL,
    "calAccessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "defaultScheduleId" INTEGER,
    "timeZone" TEXT,
    "weekStart" TEXT,
    "timeFormat" INTEGER,
    "locale" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "googleCalendarConnected" BOOLEAN DEFAULT false,
    "office365CalendarConnected" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalendarIntegration_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CalEventType" (
    "ulid" CHAR(26) NOT NULL,
    "calendarIntegrationUlid" CHAR(26) NOT NULL,
    "calEventTypeId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "lengthInMinutes" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "scheduling" "CalSchedulingType" NOT NULL DEFAULT 'MANAGED',
    "bookingLimits" JSONB,
    "minimumBookingNotice" INTEGER,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxParticipants" INTEGER,
    "discountPercentage" INTEGER,
    "organizationUlid" CHAR(26),
    "locations" JSONB,
    "bookerLayouts" JSONB,
    "beforeEventBuffer" INTEGER,
    "afterEventBuffer" INTEGER,
    "slotInterval" INTEGER,
    "successRedirectUrl" TEXT,
    "disableGuests" BOOLEAN,
    "customName" TEXT,
    "useDestinationCalendarEmail" BOOLEAN,
    "hideCalendarEventDetails" BOOLEAN,
    "color" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalEventType_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CalBooking" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "calBookingUid" TEXT NOT NULL,
    "calBookingId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMPTZ(6) NOT NULL,
    "endTime" TIMESTAMPTZ(6) NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "attendeeName" TEXT,
    "allAttendees" TEXT,
    "status" "CalBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "duration" INTEGER,
    "eventTypeId" INTEGER,
    "eventTypeSlug" TEXT,
    "meetingUrl" TEXT,
    "location" TEXT,
    "icsUid" TEXT,
    "rating" INTEGER,
    "attendeeTimeZone" TEXT,
    "attendeePhoneNumber" TEXT,
    "attendeeLanguage" TEXT,
    "calHostId" INTEGER,
    "hostName" TEXT,
    "hostEmail" TEXT,
    "hostUsername" TEXT,
    "hostTimeZone" TEXT,
    "guests" JSONB DEFAULT '[]',
    "bookingFieldsResponses" JSONB DEFAULT '{}',
    "hosts" JSONB DEFAULT '[]',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalBooking_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CoachZoomConfig" (
    "ulid" CHAR(26) NOT NULL,
    "coachUlid" CHAR(26) NOT NULL,
    "zoomApiKey" TEXT NOT NULL,
    "zoomApiSecret" TEXT NOT NULL,
    "zoomAccountId" TEXT,
    "zoomAccountEmail" TEXT,
    "defaultSettings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CoachZoomConfig_pkey" PRIMARY KEY ("ulid")
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
CREATE UNIQUE INDEX "CoachProfile_profileSlug_key" ON "CoachProfile"("profileSlug");

-- CreateIndex
CREATE INDEX "CoachProfile_userUlid_idx" ON "CoachProfile"("userUlid");

-- CreateIndex
CREATE INDEX "CoachProfile_profileStatus_idx" ON "CoachProfile"("profileStatus");

-- CreateIndex
CREATE INDEX "CoachProfile_coachRealEstateDomains_idx" ON "CoachProfile"("coachRealEstateDomains");

-- CreateIndex
CREATE INDEX "CoachProfile_coachPrimaryDomain_idx" ON "CoachProfile"("coachPrimaryDomain");

-- CreateIndex
CREATE INDEX "CoachProfile_profileSlug_idx" ON "CoachProfile"("profileSlug");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_level_idx" ON "Organization"("level");

-- CreateIndex
CREATE INDEX "Organization_parentUlid_idx" ON "Organization"("parentUlid");

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
CREATE UNIQUE INDEX "Session_calBookingUlid_key" ON "Session"("calBookingUlid");

-- CreateIndex
CREATE INDEX "Session_menteeUlid_idx" ON "Session"("menteeUlid");

-- CreateIndex
CREATE INDEX "Session_coachUlid_idx" ON "Session"("coachUlid");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Session_startTime_idx" ON "Session"("startTime");

-- CreateIndex
CREATE INDEX "Session_calBookingUlid_idx" ON "Session"("calBookingUlid");

-- CreateIndex
CREATE INDEX "Session_calEventTypeUlid_idx" ON "Session"("calEventTypeUlid");

-- CreateIndex
CREATE INDEX "Session_zoomMeetingId_idx" ON "Session"("zoomMeetingId");

-- CreateIndex
CREATE INDEX "Session_originalSessionUlid_idx" ON "Session"("originalSessionUlid");

-- CreateIndex
CREATE INDEX "Session_rescheduledFromUlid_idx" ON "Session"("rescheduledFromUlid");

-- CreateIndex
CREATE INDEX "Session_rescheduledToUlid_idx" ON "Session"("rescheduledToUlid");

-- CreateIndex
CREATE INDEX "Session_cancelledByUlid_idx" ON "Session"("cancelledByUlid");

-- CreateIndex
CREATE INDEX "Session_sessionType_idx" ON "Session"("sessionType");

-- CreateIndex
CREATE INDEX "Session_paymentStatus_idx" ON "Session"("paymentStatus");

-- CreateIndex
CREATE INDEX "Session_paymentIntentId_idx" ON "Session"("paymentIntentId");

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
CREATE INDEX "EnterpriseLeads_assignedToUlid_idx" ON "EnterpriseLeads"("assignedToUlid");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE INDEX "Goal_userUlid_idx" ON "Goal"("userUlid");

-- CreateIndex
CREATE INDEX "Goal_organizationUlid_idx" ON "Goal"("organizationUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_userUlid_idx" ON "ProfessionalRecognition"("userUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_industryType_idx" ON "ProfessionalRecognition"("industryType");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userUlid_idx" ON "Subscription"("userUlid");

-- CreateIndex
CREATE INDEX "Subscription_organizationUlid_idx" ON "Subscription"("organizationUlid");

-- CreateIndex
CREATE INDEX "SeatLicense_subscriptionUlid_idx" ON "SeatLicense"("subscriptionUlid");

-- CreateIndex
CREATE INDEX "SeatLicense_userUlid_idx" ON "SeatLicense"("userUlid");

-- CreateIndex
CREATE INDEX "SeatLicense_assignedByUserUlid_idx" ON "SeatLicense"("assignedByUserUlid");

-- CreateIndex
CREATE INDEX "SeatLicense_status_idx" ON "SeatLicense"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SeatLicense_subscriptionUlid_userUlid_key" ON "SeatLicense"("subscriptionUlid", "userUlid");

-- CreateIndex
CREATE INDEX "BudgetAllocation_subscriptionUlid_idx" ON "BudgetAllocation"("subscriptionUlid");

-- CreateIndex
CREATE INDEX "BudgetAllocation_targetUlid_idx" ON "BudgetAllocation"("targetUlid");

-- CreateIndex
CREATE INDEX "BudgetAllocation_type_idx" ON "BudgetAllocation"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_stripePaymentId_key" ON "PaymentMethod"("stripePaymentId");

-- CreateIndex
CREATE INDEX "PaymentMethod_userUlid_idx" ON "PaymentMethod"("userUlid");

-- CreateIndex
CREATE INDEX "PaymentMethod_organizationUlid_idx" ON "PaymentMethod"("organizationUlid");

-- CreateIndex
CREATE INDEX "PaymentMethod_isDefault_idx" ON "PaymentMethod"("isDefault");

-- CreateIndex
CREATE INDEX "BillingEvent_subscriptionUlid_idx" ON "BillingEvent"("subscriptionUlid");

-- CreateIndex
CREATE INDEX "BillingEvent_paymentMethodUlid_idx" ON "BillingEvent"("paymentMethodUlid");

-- CreateIndex
CREATE INDEX "BillingEvent_organizationUlid_idx" ON "BillingEvent"("organizationUlid");

-- CreateIndex
CREATE INDEX "BillingEvent_userUlid_idx" ON "BillingEvent"("userUlid");

-- CreateIndex
CREATE INDEX "BillingEvent_type_idx" ON "BillingEvent"("type");

-- CreateIndex
CREATE INDEX "BillingEvent_createdAt_idx" ON "BillingEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionUlid_idx" ON "Invoice"("subscriptionUlid");

-- CreateIndex
CREATE INDEX "Invoice_userUlid_idx" ON "Invoice"("userUlid");

-- CreateIndex
CREATE INDEX "CoachingAvailabilitySchedule_userUlid_idx" ON "CoachingAvailabilitySchedule"("userUlid");

-- CreateIndex
CREATE INDEX "CoachingAvailabilitySchedule_calScheduleId_idx" ON "CoachingAvailabilitySchedule"("calScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingAvailabilitySchedule_userUlid_calScheduleId_key" ON "CoachingAvailabilitySchedule"("userUlid", "calScheduleId");

-- CreateIndex
CREATE INDEX "PortfolioItem_userUlid_idx" ON "PortfolioItem"("userUlid");

-- CreateIndex
CREATE INDEX "PortfolioItem_type_idx" ON "PortfolioItem"("type");

-- CreateIndex
CREATE INDEX "PortfolioItem_featured_idx" ON "PortfolioItem"("featured");

-- CreateIndex
CREATE INDEX "PortfolioItem_propertyType_idx" ON "PortfolioItem"("propertyType");

-- CreateIndex
CREATE INDEX "PortfolioItem_propertySubType_idx" ON "PortfolioItem"("propertySubType");

-- CreateIndex
CREATE INDEX "PortfolioItem_commercialPropertyType_idx" ON "PortfolioItem"("commercialPropertyType");

-- CreateIndex
CREATE INDEX "PortfolioItem_investmentStrategy_idx" ON "PortfolioItem"("investmentStrategy");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarIntegration_userUlid_key" ON "CalendarIntegration"("userUlid");

-- CreateIndex
CREATE INDEX "CalendarIntegration_userUlid_idx" ON "CalendarIntegration"("userUlid");

-- CreateIndex
CREATE INDEX "CalendarIntegration_provider_idx" ON "CalendarIntegration"("provider");

-- CreateIndex
CREATE INDEX "CalEventType_calendarIntegrationUlid_idx" ON "CalEventType"("calendarIntegrationUlid");

-- CreateIndex
CREATE INDEX "CalEventType_isDefault_idx" ON "CalEventType"("isDefault");

-- CreateIndex
CREATE INDEX "CalEventType_isActive_idx" ON "CalEventType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CalEventType_calendarIntegrationUlid_calEventTypeId_key" ON "CalEventType"("calendarIntegrationUlid", "calEventTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CalBooking_calBookingUid_key" ON "CalBooking"("calBookingUid");

-- CreateIndex
CREATE INDEX "CalBooking_userUlid_idx" ON "CalBooking"("userUlid");

-- CreateIndex
CREATE INDEX "CalBooking_status_idx" ON "CalBooking"("status");

-- CreateIndex
CREATE INDEX "CalBooking_startTime_idx" ON "CalBooking"("startTime");

-- CreateIndex
CREATE INDEX "CalBooking_calBookingId_idx" ON "CalBooking"("calBookingId");

-- CreateIndex
CREATE INDEX "CalBooking_eventTypeId_idx" ON "CalBooking"("eventTypeId");

-- CreateIndex
CREATE INDEX "CalBooking_calBookingUid_idx" ON "CalBooking"("calBookingUid");

-- CreateIndex
CREATE INDEX "CalBooking_calHostId_idx" ON "CalBooking"("calHostId");

-- CreateIndex
CREATE INDEX "CalBooking_attendeeEmail_idx" ON "CalBooking"("attendeeEmail");

-- CreateIndex
CREATE INDEX "CalBooking_eventTypeSlug_idx" ON "CalBooking"("eventTypeSlug");

-- CreateIndex
CREATE UNIQUE INDEX "CoachZoomConfig_coachUlid_key" ON "CoachZoomConfig"("coachUlid");

-- CreateIndex
CREATE INDEX "CoachZoomConfig_coachUlid_idx" ON "CoachZoomConfig"("coachUlid");

-- CreateIndex
CREATE INDEX "CoachZoomConfig_zoomAccountId_idx" ON "CoachZoomConfig"("zoomAccountId");

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
ALTER TABLE "MarketingProfile" ADD CONSTRAINT "MarketingProfile_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingProfile" ADD CONSTRAINT "MarketingProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_menteeUlid_fkey" FOREIGN KEY ("menteeUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coachUlid_fkey" FOREIGN KEY ("coachUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_calBookingUlid_fkey" FOREIGN KEY ("calBookingUlid") REFERENCES "CalBooking"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_calEventTypeUlid_fkey" FOREIGN KEY ("calEventTypeUlid") REFERENCES "CalEventType"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_originalSessionUlid_fkey" FOREIGN KEY ("originalSessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_rescheduledFromUlid_fkey" FOREIGN KEY ("rescheduledFromUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_rescheduledToUlid_fkey" FOREIGN KEY ("rescheduledToUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payeeUlid_fkey" FOREIGN KEY ("payeeUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerUlid_fkey" FOREIGN KEY ("payerUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeUlid_fkey" FOREIGN KEY ("revieweeUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerUlid_fkey" FOREIGN KEY ("reviewerUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_paymentUlid_fkey" FOREIGN KEY ("paymentUlid") REFERENCES "Payment"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chargeback" ADD CONSTRAINT "Chargeback_paymentUlid_fkey" FOREIGN KEY ("paymentUlid") REFERENCES "Payment"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentUlid_fkey" FOREIGN KEY ("paymentUlid") REFERENCES "Payment"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientUlid_fkey" FOREIGN KEY ("recipientUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUlid_fkey" FOREIGN KEY ("senderUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeUlid_fkey" FOREIGN KEY ("refereeUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUlid_fkey" FOREIGN KEY ("referrerUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripePaymentMethod" ADD CONSTRAINT "StripePaymentMethod_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupIntent" ADD CONSTRAINT "SetupIntent_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeConnectedAccount" ADD CONSTRAINT "StripeConnectedAccount_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_coachUlid_fkey" FOREIGN KEY ("coachUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payerUlid_fkey" FOREIGN KEY ("payerUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUlid_fkey" FOREIGN KEY ("adminUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseLeads" ADD CONSTRAINT "EnterpriseLeads_assignedToUlid_fkey" FOREIGN KEY ("assignedToUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_coachUlid_fkey" FOREIGN KEY ("coachUlid") REFERENCES "CoachProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatLicense" ADD CONSTRAINT "SeatLicense_subscriptionUlid_fkey" FOREIGN KEY ("subscriptionUlid") REFERENCES "Subscription"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatLicense" ADD CONSTRAINT "SeatLicense_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatLicense" ADD CONSTRAINT "SeatLicense_assignedByUserUlid_fkey" FOREIGN KEY ("assignedByUserUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_subscriptionUlid_fkey" FOREIGN KEY ("subscriptionUlid") REFERENCES "Subscription"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_targetUlid_fkey" FOREIGN KEY ("targetUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_subscriptionUlid_fkey" FOREIGN KEY ("subscriptionUlid") REFERENCES "Subscription"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_paymentMethodUlid_fkey" FOREIGN KEY ("paymentMethodUlid") REFERENCES "PaymentMethod"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionUlid_fkey" FOREIGN KEY ("subscriptionUlid") REFERENCES "Subscription"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingAvailabilitySchedule" ADD CONSTRAINT "CoachingAvailabilitySchedule_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarIntegration" ADD CONSTRAINT "CalendarIntegration_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalEventType" ADD CONSTRAINT "CalEventType_calendarIntegrationUlid_fkey" FOREIGN KEY ("calendarIntegrationUlid") REFERENCES "CalendarIntegration"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalBooking" ADD CONSTRAINT "CalBooking_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachZoomConfig" ADD CONSTRAINT "CoachZoomConfig_coachUlid_fkey" FOREIGN KEY ("coachUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
