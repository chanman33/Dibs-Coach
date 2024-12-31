/*
  Warnings:

  - You are about to drop the column `bundlePrice` on the `RealtorCoachProfile` table. All the data in the column will be lost.
  - You are about to drop the column `oneTimeCallPrice` on the `RealtorCoachProfile` table. All the data in the column will be lost.
  - You are about to drop the column `yearsOfExperience` on the `RealtorCoachProfile` table. All the data in the column will be lost.
  - Made the column `specialties` on table `RealtorCoachProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hourlyRate` on table `RealtorCoachProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RealtorCoachProfile" DROP COLUMN "bundlePrice",
DROP COLUMN "oneTimeCallPrice",
DROP COLUMN "yearsOfExperience",
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "calendlyUrl" TEXT,
ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "eventTypeUrl" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "rating" DECIMAL(2,1) NOT NULL DEFAULT 0.0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sessionLength" TEXT,
ADD COLUMN     "specialty" TEXT,
ALTER COLUMN "specialties" SET NOT NULL,
ALTER COLUMN "specialties" SET DEFAULT '[]',
ALTER COLUMN "hourlyRate" SET NOT NULL;

-- CreateTable
CREATE TABLE "CalendlyIntegration" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "organizationUrl" TEXT NOT NULL,
    "schedulingUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendlyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyIntegration_userId_key" ON "CalendlyIntegration"("userId");

-- CreateIndex
CREATE INDEX "CalendlyIntegration_userId_idx" ON "CalendlyIntegration"("userId");

-- AddForeignKey
ALTER TABLE "CalendlyIntegration" ADD CONSTRAINT "CalendlyIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
