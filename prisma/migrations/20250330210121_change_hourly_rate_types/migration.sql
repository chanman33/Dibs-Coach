/*
  Warnings:

  - You are about to alter the column `hourlyRate` on the `CoachProfile` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "CoachProfile" ALTER COLUMN "hourlyRate" SET DATA TYPE INTEGER;
