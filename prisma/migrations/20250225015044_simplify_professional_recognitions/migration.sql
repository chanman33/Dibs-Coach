/*
  Warnings:

  - You are about to drop the column `insuranceProfileUlid` on the `ProfessionalRecognition` table. All the data in the column will be lost.
  - You are about to drop the column `investorProfileUlid` on the `ProfessionalRecognition` table. All the data in the column will be lost.
  - You are about to drop the column `loanOfficerProfileUlid` on the `ProfessionalRecognition` table. All the data in the column will be lost.
  - You are about to drop the column `propertyManagerProfileUlid` on the `ProfessionalRecognition` table. All the data in the column will be lost.
  - You are about to drop the column `realtorProfileUlid` on the `ProfessionalRecognition` table. All the data in the column will be lost.
  - You are about to drop the column `titleEscrowProfileUlid` on the `ProfessionalRecognition` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProfessionalRecognition" DROP CONSTRAINT "ProfessionalRecognition_insuranceProfileUlid_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalRecognition" DROP CONSTRAINT "ProfessionalRecognition_investorProfileUlid_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalRecognition" DROP CONSTRAINT "ProfessionalRecognition_loanOfficerProfileUlid_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalRecognition" DROP CONSTRAINT "ProfessionalRecognition_propertyManagerProfileUlid_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalRecognition" DROP CONSTRAINT "ProfessionalRecognition_realtorProfileUlid_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalRecognition" DROP CONSTRAINT "ProfessionalRecognition_titleEscrowProfileUlid_fkey";

-- DropIndex
DROP INDEX "ProfessionalRecognition_insuranceProfileUlid_idx";

-- DropIndex
DROP INDEX "ProfessionalRecognition_investorProfileUlid_idx";

-- DropIndex
DROP INDEX "ProfessionalRecognition_loanOfficerProfileUlid_idx";

-- DropIndex
DROP INDEX "ProfessionalRecognition_propertyManagerProfileUlid_idx";

-- DropIndex
DROP INDEX "ProfessionalRecognition_realtorProfileUlid_idx";

-- DropIndex
DROP INDEX "ProfessionalRecognition_titleEscrowProfileUlid_idx";

-- AlterTable
ALTER TABLE "ProfessionalRecognition" DROP COLUMN "insuranceProfileUlid",
DROP COLUMN "investorProfileUlid",
DROP COLUMN "loanOfficerProfileUlid",
DROP COLUMN "propertyManagerProfileUlid",
DROP COLUMN "realtorProfileUlid",
DROP COLUMN "titleEscrowProfileUlid",
ADD COLUMN     "coachProfileUlid" CHAR(26),
ADD COLUMN     "industryType" TEXT,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_coachProfileUlid_idx" ON "ProfessionalRecognition"("coachProfileUlid");

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_coachProfileUlid_fkey" FOREIGN KEY ("coachProfileUlid") REFERENCES "CoachProfile"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
