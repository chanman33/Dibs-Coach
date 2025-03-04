/*
  Warnings:

  - The values [COMMERCIAL,PRIVATE_CREDIT] on the enum `UserCapability` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `additionalInfo` on the `CoachApplication` table. All the data in the column will be lost.
  - You are about to drop the column `applicationDate` on the `CoachApplication` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `CoachApplication` table. All the data in the column will be lost.
  - You are about to drop the column `industrySpecialties` on the `CoachApplication` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `CoachApplication` table. All the data in the column will be lost.
  - You are about to drop the column `specialties` on the `CoachApplication` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserCapability_new" AS ENUM ('COACH', 'MENTEE');
ALTER TABLE "User" ALTER COLUMN "capabilities" TYPE "UserCapability_new"[] USING ("capabilities"::text::"UserCapability_new"[]);
ALTER TYPE "UserCapability" RENAME TO "UserCapability_old";
ALTER TYPE "UserCapability_new" RENAME TO "UserCapability";
DROP TYPE "UserCapability_old";
COMMIT;

-- AlterTable
ALTER TABLE "CoachApplication" DROP COLUMN "additionalInfo",
DROP COLUMN "applicationDate",
DROP COLUMN "experience",
DROP COLUMN "industrySpecialties",
DROP COLUMN "notes",
DROP COLUMN "specialties",
ADD COLUMN     "aboutYou" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "primaryDomain" TEXT,
ADD COLUMN     "realEstateDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "superPower" TEXT,
ADD COLUMN     "yearsOfExperience" INTEGER;
