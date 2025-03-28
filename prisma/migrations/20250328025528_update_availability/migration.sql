/*
  Warnings:

  - You are about to drop the column `rules` on the `CoachingAvailabilitySchedule` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `CoachingAvailabilitySchedule` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userUlid,calScheduleId]` on the table `CoachingAvailabilitySchedule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `availability` to the `CoachingAvailabilitySchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeZone` to the `CoachingAvailabilitySchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CoachingAvailabilitySchedule" DROP COLUMN "rules",
DROP COLUMN "timezone",
ADD COLUMN     "availability" JSONB NOT NULL,
ADD COLUMN     "calScheduleId" INTEGER,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "overrides" JSONB,
ADD COLUMN     "syncSource" TEXT NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "timeZone" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CoachingAvailabilitySchedule_calScheduleId_idx" ON "CoachingAvailabilitySchedule"("calScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingAvailabilitySchedule_userUlid_calScheduleId_key" ON "CoachingAvailabilitySchedule"("userUlid", "calScheduleId");
