/*
  Warnings:

  - The `primaryDomain` column on the `Organization` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `industrySpecialties` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RealEstateDomain" AS ENUM ('REALTOR', 'INVESTOR', 'MORTGAGE', 'PROPERTY_MANAGER', 'TITLE_ESCROW', 'INSURANCE', 'COMMERCIAL', 'PRIVATE_CREDIT');

-- DropIndex
DROP INDEX "User_industrySpecialties_idx";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "domains" "RealEstateDomain"[],
DROP COLUMN "primaryDomain",
ADD COLUMN     "primaryDomain" "RealEstateDomain";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "industrySpecialties",
ADD COLUMN     "primaryDomain" "RealEstateDomain",
ADD COLUMN     "realEstateDomains" "RealEstateDomain"[] DEFAULT ARRAY[]::"RealEstateDomain"[];

-- DropEnum
DROP TYPE "DomainType";

-- CreateIndex
CREATE INDEX "Organization_primaryDomain_idx" ON "Organization"("primaryDomain");

-- CreateIndex
CREATE INDEX "User_realEstateDomains_idx" ON "User"("realEstateDomains");

-- CreateIndex
CREATE INDEX "User_primaryDomain_idx" ON "User"("primaryDomain");
