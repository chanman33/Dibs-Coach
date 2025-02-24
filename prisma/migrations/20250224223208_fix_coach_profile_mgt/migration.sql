-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED');

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "completionPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "CoachProfile_profileStatus_idx" ON "CoachProfile"("profileStatus");
