/*
  Warnings:

  - You are about to drop the column `coachingSpecialties` on the `CoachProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CoachProfile" DROP COLUMN "coachingSpecialties",
ADD COLUMN     "coachSkills" TEXT[] DEFAULT ARRAY[]::TEXT[];
