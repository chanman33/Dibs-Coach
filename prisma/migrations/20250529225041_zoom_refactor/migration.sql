/*
  Warnings:

  - You are about to alter the column `zoomMeetingId` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(26)`.
  - A unique constraint covering the columns `[staticZoomLink]` on the table `CoachZoomConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "RealEstateDomain" ADD VALUE 'PROPERTY_MANAGEMENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionStatus" ADD VALUE 'STARTED';
ALTER TYPE "SessionStatus" ADD VALUE 'COACH_ABSENT';

-- AlterTable
ALTER TABLE "CalEventType" ADD COLUMN     "zoomConfig" JSONB;

-- AlterTable
ALTER TABLE "CoachZoomConfig" ADD COLUMN     "staticZoomLink" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "zoomSessionName" TEXT,
ADD COLUMN     "zoomStatus" TEXT,
ALTER COLUMN "zoomMeetingId" SET DATA TYPE CHAR(26);

-- CreateIndex
CREATE UNIQUE INDEX "CoachZoomConfig_staticZoomLink_key" ON "CoachZoomConfig"("staticZoomLink");

-- CreateIndex
CREATE INDEX "CoachZoomConfig_staticZoomLink_idx" ON "CoachZoomConfig"("staticZoomLink");
