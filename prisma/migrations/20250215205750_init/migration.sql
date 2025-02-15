-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'closed');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'debit_card', 'bank_transfer');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'resolved', 'rejected');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('in_progress', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('sales_volume', 'commission_income', 'gci', 'avg_sale_price', 'listings', 'buyer_transactions', 'closed_deals', 'days_on_market', 'coaching_sessions', 'group_sessions', 'session_revenue', 'active_mentees', 'mentee_satisfaction', 'response_time', 'session_completion', 'mentee_milestones', 'new_clients', 'referrals', 'client_retention', 'reviews', 'market_share', 'territory_expansion', 'social_media', 'website_traffic', 'certifications', 'training_hours', 'networking_events', 'custom');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('milestone', 'performance', 'learning');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MENTEE', 'COACH', 'ADMIN');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('PEER_TO_PEER', 'MENTORSHIP', 'GROUP');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "CoachApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'COACH', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('USER', 'COACH', 'SYSTEM', 'SECURITY');

-- CreateEnum
CREATE TYPE "ActivitySeverity" AS ENUM ('INFO', 'WARNING', 'ERROR');

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
CREATE TYPE "RecognitionType" AS ENUM ('AWARD', 'ACHIEVEMENT');

-- CreateTable
CREATE TABLE "User" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MENTEE',
    "stripeCustomerId" TEXT,
    "stripeConnectAccountId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "memberKey" TEXT,
    "memberStatus" TEXT NOT NULL,
    "designations" TEXT[],
    "licenseNumber" TEXT,
    "companyName" TEXT,
    "phoneNumber" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "profileImageUrl" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "RealtorProfile" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "propertyTypes" TEXT[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
    "geographicFocus" JSONB NOT NULL,
    "primaryMarket" TEXT,
    "slogan" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "marketingAreas" TEXT[],
    "testimonials" JSONB NOT NULL,
    "mlsId" TEXT,
    "mlsName" TEXT,
    "mlsStatus" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "RealtorProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "MenteeProfile" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "focusAreas" TEXT[],
    "experienceLevel" TEXT,
    "learningStyle" TEXT,
    "goals" JSONB,
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSessionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MenteeProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "coachingSpecialties" TEXT[],
    "yearsCoaching" INTEGER,
    "hourlyRate" DECIMAL(10,2),
    "calendlyUrl" TEXT,
    "eventTypeUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultDuration" INTEGER NOT NULL DEFAULT 60,
    "allowCustomDuration" BOOLEAN NOT NULL DEFAULT false,
    "minimumDuration" INTEGER NOT NULL DEFAULT 30,
    "maximumDuration" INTEGER NOT NULL DEFAULT 120,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Session" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "menteeUlid" CHAR(26) NOT NULL,
    "coachUlid" CHAR(26) NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'scheduled',
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "sessionUlid" CHAR(26),
    "payerUlid" CHAR(26) NOT NULL,
    "payeeUlid" CHAR(26) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Review" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "applicantUlid" CHAR(26) NOT NULL,
    "status" "CoachApplicationStatus" NOT NULL DEFAULT 'pending',
    "experience" TEXT NOT NULL,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewerUlid" CHAR(26),
    "reviewDate" TIMESTAMP(3),
    "notes" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "lastSavedAt" TIMESTAMPTZ,
    "draftData" JSONB,
    "draftVersion" INTEGER NOT NULL DEFAULT 1,
    "resumeUrl" TEXT,
    "linkedIn" TEXT,
    "primarySocialMedia" TEXT,
    "additionalInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachApplication_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Note" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Payout" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "payeeUlid" CHAR(26) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripeTransferId" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "paymentUlid" CHAR(26) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chargeback_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Refund" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "paymentUlid" CHAR(26) NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Message" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
CREATE TABLE "CalendlyIntegration" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "userId" TEXT NOT NULL,
    "eventTypeId" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "organization" TEXT,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "lastSyncAt" TIMESTAMPTZ,
    "failedRefreshCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "schedulingUrl" TEXT NOT NULL,
    "organizationUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CalendlyIntegration_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "subscriptionId" TEXT NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "planUlid" CHAR(26) NOT NULL,
    "defaultPaymentMethodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "invoiceId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userUlid" CHAR(26),
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "amountDue" DECIMAL(10,2),
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CalendlyWebhookEvent" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendlyWebhookEvent_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CalendlyEvent" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "eventUuid" TEXT NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "status" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "inviteeName" TEXT NOT NULL,
    "sessionUlid" CHAR(26),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendlyEvent_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "ZoomSession" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "sessionUlid" CHAR(26) NOT NULL,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "joinUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoomSession_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Goal" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "type" "GoalType" NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "type" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "ProfessionalRecognition" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "realtorProfileUlid" CHAR(26) NOT NULL,
    "title" TEXT NOT NULL,
    "type" "RecognitionType" NOT NULL,
    "year" INTEGER NOT NULL,
    "organization" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "archivedAt" TIMESTAMPTZ,

    CONSTRAINT "ProfessionalRecognition_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "CoachingAvailabilitySchedule" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultDuration" INTEGER NOT NULL DEFAULT 60,
    "minimumDuration" INTEGER NOT NULL DEFAULT 30,
    "maximumDuration" INTEGER NOT NULL DEFAULT 120,
    "allowCustomDuration" BOOLEAN NOT NULL DEFAULT false,
    "bufferBefore" INTEGER NOT NULL DEFAULT 15,
    "bufferAfter" INTEGER NOT NULL DEFAULT 15,
    "rules" JSONB NOT NULL,
    "calendlyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "zoomEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingAvailabilitySchedule_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "StripePaymentMethod" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "userUlid" CHAR(26) NOT NULL,
    "stripeSetupIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SetupIntent_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "StripeConnectedAccount" (
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
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
    "ulid" CHAR(26) NOT NULL DEFAULT generate_ulid(),
    "threadUlid" CHAR(26) NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("ulid")
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
CREATE UNIQUE INDEX "User_memberKey_key" ON "User"("memberKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_licenseNumber_key" ON "User"("licenseNumber");

-- CreateIndex
CREATE INDEX "User_userId_idx" ON "User"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_userUlid_key" ON "RealtorProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_mlsId_key" ON "RealtorProfile"("mlsId");

-- CreateIndex
CREATE INDEX "RealtorProfile_userUlid_idx" ON "RealtorProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "MenteeProfile_userUlid_key" ON "MenteeProfile"("userUlid");

-- CreateIndex
CREATE INDEX "MenteeProfile_userUlid_idx" ON "MenteeProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userUlid_key" ON "CoachProfile"("userUlid");

-- CreateIndex
CREATE INDEX "CoachProfile_userUlid_idx" ON "CoachProfile"("userUlid");

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
CREATE UNIQUE INDEX "CalendlyIntegration_userUlid_key" ON "CalendlyIntegration"("userUlid");

-- CreateIndex
CREATE INDEX "CalendlyIntegration_userUlid_idx" ON "CalendlyIntegration"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriptionId_key" ON "Subscription"("subscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userUlid_idx" ON "Subscription"("userUlid");

-- CreateIndex
CREATE INDEX "Subscription_planUlid_idx" ON "Subscription"("planUlid");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_planId_key" ON "SubscriptionPlan"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceId_key" ON "Invoice"("invoiceId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_userUlid_idx" ON "Invoice"("userUlid");

-- CreateIndex
CREATE INDEX "CalendlyWebhookEvent_eventType_idx" ON "CalendlyWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "CalendlyWebhookEvent_processed_idx" ON "CalendlyWebhookEvent"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyEvent_eventUuid_key" ON "CalendlyEvent"("eventUuid");

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyEvent_sessionUlid_key" ON "CalendlyEvent"("sessionUlid");

-- CreateIndex
CREATE INDEX "CalendlyEvent_userUlid_idx" ON "CalendlyEvent"("userUlid");

-- CreateIndex
CREATE INDEX "CalendlyEvent_eventUuid_idx" ON "CalendlyEvent"("eventUuid");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomSession_sessionUlid_key" ON "ZoomSession"("sessionUlid");

-- CreateIndex
CREATE INDEX "ZoomSession_sessionUlid_idx" ON "ZoomSession"("sessionUlid");

-- CreateIndex
CREATE INDEX "Goal_userUlid_idx" ON "Goal"("userUlid");

-- CreateIndex
CREATE INDEX "Goal_type_idx" ON "Goal"("type");

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateIndex
CREATE INDEX "Achievement_userUlid_idx" ON "Achievement"("userUlid");

-- CreateIndex
CREATE INDEX "Achievement_type_idx" ON "Achievement"("type");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_realtorProfileUlid_idx" ON "ProfessionalRecognition"("realtorProfileUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_type_idx" ON "ProfessionalRecognition"("type");

-- CreateIndex
CREATE INDEX "CoachingAvailabilitySchedule_userUlid_idx" ON "CoachingAvailabilitySchedule"("userUlid");

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

-- AddForeignKey
ALTER TABLE "RealtorProfile" ADD CONSTRAINT "RealtorProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenteeProfile" ADD CONSTRAINT "MenteeProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "CalendlyIntegration" ADD CONSTRAINT "CalendlyIntegration_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planUlid_fkey" FOREIGN KEY ("planUlid") REFERENCES "SubscriptionPlan"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("subscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendlyEvent" ADD CONSTRAINT "CalendlyEvent_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendlyEvent" ADD CONSTRAINT "CalendlyEvent_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomSession" ADD CONSTRAINT "ZoomSession_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_realtorProfileUlid_fkey" FOREIGN KEY ("realtorProfileUlid") REFERENCES "RealtorProfile"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingAvailabilitySchedule" ADD CONSTRAINT "CoachingAvailabilitySchedule_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

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
