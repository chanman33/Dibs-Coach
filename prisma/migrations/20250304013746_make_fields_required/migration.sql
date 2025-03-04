/*
  Warnings:

  - Made the column `superPower` on table `CoachApplication` required. This step will fail if there are existing NULL values in that column.
  - Made the column `yearsOfExperience` on table `CoachApplication` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CoachApplication" ALTER COLUMN "superPower" SET NOT NULL,
ALTER COLUMN "yearsOfExperience" SET NOT NULL;
