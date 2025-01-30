/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `CalendlyIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `organizationUrl` on the `CalendlyIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `schedulingUrl` on the `CalendlyIntegration` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `eventTypeId` to the `CalendlyIntegration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `CalendlyIntegration` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "CalendlyIntegration" DROP CONSTRAINT "CalendlyIntegration_userDbId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_coachDbId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_menteeDbId_fkey";

-- DropIndex
DROP INDEX "Session_endTime_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "CalendlyIntegration" DROP COLUMN "expiresAt",
DROP COLUMN "organizationUrl",
DROP COLUMN "schedulingUrl",
ADD COLUMN     "eventTypeId" TEXT NOT NULL,
ADD COLUMN     "organization" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "calendlyEventUri" TEXT,
ADD COLUMN     "calendlyInviteeUri" TEXT,
ADD COLUMN     "calendlySchedulingUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "zoomJoinUrl" TEXT,
ADD COLUMN     "zoomMeetingId" TEXT,
ADD COLUMN     "zoomStartUrl" TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "startTime" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "endTime" SET DATA TYPE TIMESTAMPTZ,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" TEXT[],
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE INDEX "CoachSessionConfig_userDbId_idx" ON "CoachSessionConfig"("userDbId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coachDbId_fkey" FOREIGN KEY ("coachDbId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_menteeDbId_fkey" FOREIGN KEY ("menteeDbId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendlyIntegration" ADD CONSTRAINT "CalendlyIntegration_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
