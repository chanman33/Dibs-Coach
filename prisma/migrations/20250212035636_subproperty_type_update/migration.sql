/*
  Warnings:

  - The `propertySubType` column on the `Listing` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PropertySubType" AS ENUM ('Apartment', 'Cabin', 'Condominium', 'Duplex', 'ManufacturedHome', 'SingleFamilyDetached', 'SingleFamilyAttached', 'Mobile', 'Townhouse', 'Triplex', 'Quadruplex', 'Hotel', 'CommercialIndustrial', 'CommercialMixedUse', 'MultiFamily', 'Office', 'Retail', 'Restaurant', 'Warehouse', 'AgriculturalLand', 'CommercialLand', 'IndustrialLand', 'LandMixedUse', 'ResidentialLand', 'Equestrian', 'Ranch', 'TimberLand', 'Vineyard', 'BusinessOnly', 'BusinessWithProperty', 'BusinessWithRealEstate', 'DoubleWide', 'SingleWide', 'TripleWide', 'Other');

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "propertySubType",
ADD COLUMN     "propertySubType" "PropertySubType";
