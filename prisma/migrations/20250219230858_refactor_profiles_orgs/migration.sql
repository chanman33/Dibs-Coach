/*
  Warnings:

  - You are about to drop the column `archivedAt` on the `ProfessionalRecognition` table. All the data in the column will be lost.
  - You are about to drop the column `organization` on the `ProfessionalRecognition` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `ProfessionalRecognition` table. All the data in the column will be lost.
  - You are about to drop the column `facebookUrl` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `instagramUrl` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `linkedinUrl` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `marketingAreas` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `slogan` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `testimonials` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `websiteUrl` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `youtubeUrl` on the `RealtorProfile` table. All the data in the column will be lost.
  - Added the required column `issueDate` to the `ProfessionalRecognition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuer` to the `ProfessionalRecognition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userUlid` to the `ProfessionalRecognition` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrgIndustry" AS ENUM ('REAL_ESTATE_SALES', 'MORTGAGE_LENDING', 'PROPERTY_MANAGEMENT', 'REAL_ESTATE_INVESTMENT', 'TITLE_ESCROW', 'INSURANCE', 'OTHER');

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

-- AlterEnum
ALTER TYPE "OrgType" ADD VALUE 'TEAM';

-- DropForeignKey
ALTER TABLE "ProfessionalRecognition" DROP CONSTRAINT "ProfessionalRecognition_realtorProfileUlid_fkey";

-- DropIndex
DROP INDEX "ProfessionalRecognition_type_idx";

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "activeDomains" TEXT[];

-- AlterTable
ALTER TABLE "DomainExpertise" ADD COLUMN     "coachProfileUlid" CHAR(26),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "menteeProfileUlid" CHAR(26);

-- AlterTable
ALTER TABLE "MenteeProfile" ADD COLUMN     "activeDomains" TEXT[];

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "activeAgents" INTEGER,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "industry" "OrgIndustry",
ADD COLUMN     "licenseNumbers" JSONB,
ADD COLUMN     "primaryDomain" "DomainType",
ADD COLUMN     "serviceAreas" TEXT[],
ADD COLUMN     "specializations" TEXT[],
ADD COLUMN     "totalTransactions" INTEGER,
ADD COLUMN     "transactionVolume" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "ProfessionalRecognition" DROP COLUMN "archivedAt",
DROP COLUMN "organization",
DROP COLUMN "year",
ADD COLUMN     "certificateUrl" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMPTZ,
ADD COLUMN     "insuranceProfileUlid" CHAR(26),
ADD COLUMN     "investorProfileUlid" CHAR(26),
ADD COLUMN     "issueDate" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "issuer" TEXT NOT NULL,
ADD COLUMN     "loanOfficerProfileUlid" CHAR(26),
ADD COLUMN     "propertyManagerProfileUlid" CHAR(26),
ADD COLUMN     "status" "CertificationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "titleEscrowProfileUlid" CHAR(26),
ADD COLUMN     "userUlid" CHAR(26) NOT NULL,
ADD COLUMN     "verificationUrl" TEXT,
ALTER COLUMN "realtorProfileUlid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RealtorProfile" DROP COLUMN "facebookUrl",
DROP COLUMN "instagramUrl",
DROP COLUMN "linkedinUrl",
DROP COLUMN "marketingAreas",
DROP COLUMN "slogan",
DROP COLUMN "testimonials",
DROP COLUMN "websiteUrl",
DROP COLUMN "youtubeUrl";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "currency" DROP DEFAULT;

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
CREATE TABLE "LoanOfficerProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "nmls" TEXT,
    "lenderName" TEXT,
    "branchLocation" TEXT,
    "loanTypes" "LoanType"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
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
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "investmentStrategies" "InvestmentStrategy"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
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
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "managerTypes" "PropertyManagerType"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
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
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "titleEscrowTypes" "TitleEscrowType"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
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
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "insuranceTypes" "InsuranceType"[],
    "specializations" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
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

-- CreateIndex
CREATE UNIQUE INDEX "MarketingProfile_userUlid_key" ON "MarketingProfile"("userUlid");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingProfile_organizationUlid_key" ON "MarketingProfile"("organizationUlid");

-- CreateIndex
CREATE INDEX "MarketingProfile_userUlid_idx" ON "MarketingProfile"("userUlid");

-- CreateIndex
CREATE INDEX "MarketingProfile_organizationUlid_idx" ON "MarketingProfile"("organizationUlid");

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
CREATE INDEX "DomainExpertise_coachProfileUlid_idx" ON "DomainExpertise"("coachProfileUlid");

-- CreateIndex
CREATE INDEX "DomainExpertise_menteeProfileUlid_idx" ON "DomainExpertise"("menteeProfileUlid");

-- CreateIndex
CREATE INDEX "Organization_primaryDomain_idx" ON "Organization"("primaryDomain");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_userUlid_idx" ON "ProfessionalRecognition"("userUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_loanOfficerProfileUlid_idx" ON "ProfessionalRecognition"("loanOfficerProfileUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_investorProfileUlid_idx" ON "ProfessionalRecognition"("investorProfileUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_propertyManagerProfileUlid_idx" ON "ProfessionalRecognition"("propertyManagerProfileUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_titleEscrowProfileUlid_idx" ON "ProfessionalRecognition"("titleEscrowProfileUlid");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_insuranceProfileUlid_idx" ON "ProfessionalRecognition"("insuranceProfileUlid");

-- AddForeignKey
ALTER TABLE "MarketingProfile" ADD CONSTRAINT "MarketingProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingProfile" ADD CONSTRAINT "MarketingProfile_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainExpertise" ADD CONSTRAINT "DomainExpertise_coachProfileUlid_fkey" FOREIGN KEY ("coachProfileUlid") REFERENCES "CoachProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainExpertise" ADD CONSTRAINT "DomainExpertise_menteeProfileUlid_fkey" FOREIGN KEY ("menteeProfileUlid") REFERENCES "MenteeProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_realtorProfileUlid_fkey" FOREIGN KEY ("realtorProfileUlid") REFERENCES "RealtorProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_loanOfficerProfileUlid_fkey" FOREIGN KEY ("loanOfficerProfileUlid") REFERENCES "LoanOfficerProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_investorProfileUlid_fkey" FOREIGN KEY ("investorProfileUlid") REFERENCES "InvestorProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_propertyManagerProfileUlid_fkey" FOREIGN KEY ("propertyManagerProfileUlid") REFERENCES "PropertyManagerProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_titleEscrowProfileUlid_fkey" FOREIGN KEY ("titleEscrowProfileUlid") REFERENCES "TitleEscrowProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_insuranceProfileUlid_fkey" FOREIGN KEY ("insuranceProfileUlid") REFERENCES "InsuranceProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
