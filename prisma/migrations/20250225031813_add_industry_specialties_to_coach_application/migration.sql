/*
  Warnings:

  - You are about to drop the column `activeDomains` on the `CoachProfile` table. All the data in the column will be lost.
  - You are about to drop the column `activeDomains` on the `MenteeProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CoachApplication" ADD COLUMN     "industrySpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "CoachProfile" DROP COLUMN "activeDomains";

-- AlterTable
ALTER TABLE "MenteeProfile" DROP COLUMN "activeDomains";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "confirmedSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "industrySpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "primaryMarket" TEXT;

-- CreateIndex
CREATE INDEX "User_industrySpecialties_idx" ON "User"("industrySpecialties");

-- CreateIndex
CREATE INDEX "User_confirmedSpecialties_idx" ON "User"("confirmedSpecialties");
