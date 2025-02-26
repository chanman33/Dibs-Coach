/*
  Warnings:

  - You are about to drop the column `selectedSpecialties` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "selectedSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "selectedSpecialties";
