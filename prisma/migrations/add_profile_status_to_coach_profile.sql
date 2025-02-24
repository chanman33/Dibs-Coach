-- Add profileStatus column to CoachProfile table
ALTER TABLE "CoachProfile" ADD COLUMN "profileStatus" TEXT NOT NULL DEFAULT 'DRAFT';

-- Add enum type for profile status
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED');

-- Convert existing profiles to use the ENUM
ALTER TABLE "CoachProfile" ALTER COLUMN "profileStatus" TYPE "ProfileStatus" USING "profileStatus"::"ProfileStatus";

-- Create index for faster filtering by status
CREATE INDEX "CoachProfile_profileStatus_idx" ON "CoachProfile"("profileStatus");

-- Add completionPercentage column to track profile completeness
ALTER TABLE "CoachProfile" ADD COLUMN "completionPercentage" INTEGER NOT NULL DEFAULT 0; 