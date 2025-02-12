/*
  Warnings:

  - The values [ACTIVE,PENDING,SOLD,WITHDRAWN,EXPIRED] on the enum `ListingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SINGLE_FAMILY,MULTI_FAMILY,CONDO,TOWNHOUSE,LAND,COMMERCIAL,OTHER] on the enum `PropertyType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `unit` on the `Listing` table. All the data in the column will be lost.
  - You are about to alter the column `propertySubType` on the `Listing` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `city` on the `Listing` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - You are about to alter the column `stateOrProvince` on the `Listing` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `postalCode` on the `Listing` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - You are about to alter the column `streetName` on the `Listing` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `streetNumber` on the `Listing` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(25)`.

*/
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

-- AlterEnum
BEGIN;
CREATE TYPE "ListingStatus_new" AS ENUM ('Active', 'ActiveUnderContract', 'Canceled', 'Closed', 'ComingSoon', 'Delete', 'Expired', 'Hold', 'Incomplete', 'Pending', 'Withdrawn');
ALTER TABLE "Listing" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Listing" ALTER COLUMN "status" TYPE "ListingStatus_new" USING ("status"::text::"ListingStatus_new");
ALTER TYPE "ListingStatus" RENAME TO "ListingStatus_old";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
DROP TYPE "ListingStatus_old";
ALTER TABLE "Listing" ALTER COLUMN "status" SET DEFAULT 'Active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PropertyType_new" AS ENUM ('BusinessOpportunity', 'CommercialLease', 'CommercialSale', 'Farm', 'Land', 'ManufacturedInPark', 'Residential');
ALTER TABLE "Listing" ALTER COLUMN "propertyType" TYPE "PropertyType_new" USING ("propertyType"::text::"PropertyType_new");
ALTER TYPE "PropertyType" RENAME TO "PropertyType_old";
ALTER TYPE "PropertyType_new" RENAME TO "PropertyType";
DROP TYPE "PropertyType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "unit",
ADD COLUMN     "appliances" TEXT[],
ADD COLUMN     "architecturalStyle" "ArchitecturalStyle",
ADD COLUMN     "basement" "BasementType",
ADD COLUMN     "cooling" TEXT[],
ADD COLUMN     "electricityAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "elementarySchool" VARCHAR(100),
ADD COLUMN     "exteriorFeatures" TEXT[],
ADD COLUMN     "furnished" "FurnishedStatus",
ADD COLUMN     "garageSpaces" DECIMAL(12,2),
ADD COLUMN     "gasAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasDeck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasFireplace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPatio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPorch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "heating" TEXT[],
ADD COLUMN     "highSchool" VARCHAR(100),
ADD COLUMN     "hoaFeeAmount" DECIMAL(12,2),
ADD COLUMN     "hoaFeeFrequency" VARCHAR(50),
ADD COLUMN     "hoaName" VARCHAR(100),
ADD COLUMN     "interiorFeatures" TEXT[],
ADD COLUMN     "isWaterfront" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listingAgreement" "ListingAgreement",
ADD COLUMN     "listingTerms" "ListingTerms"[],
ADD COLUMN     "lotDimensionsSource" VARCHAR(50),
ADD COLUMN     "lotSizeDimensions" VARCHAR(50),
ADD COLUMN     "middleSchool" VARCHAR(100),
ADD COLUMN     "modificationTimestamp" TIMESTAMPTZ,
ADD COLUMN     "parcelNumber" VARCHAR(50),
ADD COLUMN     "parkingTotal" DECIMAL(12,2),
ADD COLUMN     "priceChangeTimestamp" TIMESTAMPTZ,
ADD COLUMN     "privateRemarks" VARCHAR(4000),
ADD COLUMN     "propertyCondition" "PropertyCondition"[],
ADD COLUMN     "publicRemarks" VARCHAR(4000),
ADD COLUMN     "roofType" "RoofType",
ADD COLUMN     "schoolDistrict" VARCHAR(100),
ADD COLUMN     "sewerAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "statusChangeTimestamp" TIMESTAMPTZ,
ADD COLUMN     "stories" INTEGER,
ADD COLUMN     "taxAnnualAmount" DECIMAL(12,2),
ADD COLUMN     "taxBlock" VARCHAR(50),
ADD COLUMN     "taxLegalDescription" VARCHAR(1000),
ADD COLUMN     "taxLot" VARCHAR(50),
ADD COLUMN     "taxMapNumber" VARCHAR(50),
ADD COLUMN     "taxYear" INTEGER,
ADD COLUMN     "unitNumber" VARCHAR(25),
ADD COLUMN     "view" "ViewType"[],
ADD COLUMN     "waterAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "zoning" VARCHAR(25),
ADD COLUMN     "zoningDescription" VARCHAR(255),
ALTER COLUMN "propertySubType" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "status" SET DEFAULT 'Active',
ALTER COLUMN "listPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "originalListPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "closePrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "stateOrProvince" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "postalCode" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "streetName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "streetNumber" SET DATA TYPE VARCHAR(25),
ALTER COLUMN "bedroomsTotal" DROP NOT NULL,
ALTER COLUMN "bathroomsTotal" DROP NOT NULL,
ALTER COLUMN "livingArea" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "lotSize" SET DATA TYPE DECIMAL(12,2);
