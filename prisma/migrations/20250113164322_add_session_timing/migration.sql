/*
  Warnings:

  - Added the required column `endTime` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- First add the columns as nullable
ALTER TABLE "Session" ADD COLUMN "startTime" TIMESTAMP(3),
                      ADD COLUMN "endTime" TIMESTAMP(3);

-- Update existing rows with default values based on createdAt
UPDATE "Session"
SET "startTime" = "createdAt",
    "endTime" = "createdAt" + (INTERVAL '1 minute' * "durationMinutes");

-- Now make the columns required
ALTER TABLE "Session" 
  ALTER COLUMN "startTime" SET NOT NULL,
  ALTER COLUMN "endTime" SET NOT NULL;

-- Create indexes
CREATE INDEX "Session_startTime_idx" ON "Session"("startTime");
CREATE INDEX "Session_endTime_idx" ON "Session"("endTime");
