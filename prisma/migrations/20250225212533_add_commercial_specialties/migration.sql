-- CreateEnum
CREATE TYPE "CommercialPropertyType" AS ENUM ('OFFICE', 'RETAIL', 'INDUSTRIAL', 'MULTIFAMILY', 'MIXED_USE', 'LAND', 'HOTEL', 'MEDICAL', 'SELF_STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommercialDealType" AS ENUM ('SALES', 'LEASING', 'INVESTMENT', 'DEVELOPMENT', 'PROPERTY_MANAGEMENT', 'CONSULTING');

-- CreateEnum
CREATE TYPE "PrivateCreditLoanType" AS ENUM ('BRIDGE', 'CONSTRUCTION', 'VALUE_ADD', 'ACQUISITION', 'REFINANCE', 'MEZZANINE', 'PREFERRED_EQUITY', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrgIndustry" ADD VALUE 'COMMERCIAL';
ALTER TYPE "OrgIndustry" ADD VALUE 'PRIVATE_CREDIT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserCapability" ADD VALUE 'COMMERCIAL';
ALTER TYPE "UserCapability" ADD VALUE 'PRIVATE_CREDIT';

-- DropIndex
DROP INDEX "User_confirmedSpecialties_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selectedSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "CommercialProfile" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "yearsExperience" INTEGER,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "specializations" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
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
    "languages" TEXT[],
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
CREATE INDEX "User_primaryMarket_idx" ON "User"("primaryMarket");

-- AddForeignKey
ALTER TABLE "CommercialProfile" ADD CONSTRAINT "CommercialProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateCreditProfile" ADD CONSTRAINT "PrivateCreditProfile_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
