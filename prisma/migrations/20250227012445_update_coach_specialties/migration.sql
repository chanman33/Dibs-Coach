/*
  Warnings:

  - You are about to drop the column `selectedSpecialties` on the `CoachProfile` table. All the data in the column will be lost.
  - The `coachingSpecialties` column on the `CoachProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "CoachProfile" DROP COLUMN "selectedSpecialties",
DROP COLUMN "coachingSpecialties",
ADD COLUMN     "coachingSpecialties" JSONB NOT NULL DEFAULT '[]';
