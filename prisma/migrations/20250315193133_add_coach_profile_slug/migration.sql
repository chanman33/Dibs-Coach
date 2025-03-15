/*
  Warnings:

  - A unique constraint covering the columns `[profileSlug]` on the table `CoachProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "lastSlugUpdateAt" TIMESTAMPTZ,
ADD COLUMN     "profileSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_profileSlug_key" ON "CoachProfile"("profileSlug");

-- CreateIndex
CREATE INDEX "CoachProfile_profileSlug_idx" ON "CoachProfile"("profileSlug");
