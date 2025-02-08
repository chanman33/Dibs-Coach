/*
  Warnings:

  - You are about to drop the column `achievements` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `featuredListings` on the `RealtorProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mlsId]` on the table `RealtorProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'PENDING', 'SOLD', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('SINGLE_FAMILY', 'MULTI_FAMILY', 'CONDO', 'TOWNHOUSE', 'LAND', 'COMMERCIAL', 'OTHER');

-- AlterTable
ALTER TABLE "RealtorProfile" DROP COLUMN "achievements",
DROP COLUMN "featuredListings",
ADD COLUMN     "mlsId" TEXT,
ADD COLUMN     "mlsName" TEXT,
ADD COLUMN     "mlsStatus" TEXT;

-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "listingKey" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "propertySubType" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "listPrice" DECIMAL(10,2) NOT NULL,
    "originalListPrice" DECIMAL(10,2),
    "closePrice" DECIMAL(10,2),
    "listingContractDate" TIMESTAMPTZ,
    "closeDate" TIMESTAMPTZ,
    "city" TEXT NOT NULL,
    "stateOrProvince" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "streetName" TEXT NOT NULL,
    "streetNumber" TEXT NOT NULL,
    "unit" TEXT,
    "bedroomsTotal" INTEGER NOT NULL,
    "bathroomsTotal" DECIMAL(3,1) NOT NULL,
    "livingArea" DECIMAL(10,2),
    "lotSize" DECIMAL(10,2),
    "yearBuilt" INTEGER,
    "photos" JSONB,
    "virtualTours" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "mlsSource" TEXT,
    "mlsId" TEXT,
    "realtorProfileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_listingKey_key" ON "Listing"("listingKey");

-- CreateIndex
CREATE INDEX "Listing_realtorProfileId_idx" ON "Listing"("realtorProfileId");

-- CreateIndex
CREATE INDEX "Listing_listingKey_idx" ON "Listing"("listingKey");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_isFeatured_idx" ON "Listing"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_mlsId_key" ON "RealtorProfile"("mlsId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_realtorProfileId_fkey" FOREIGN KEY ("realtorProfileId") REFERENCES "RealtorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
