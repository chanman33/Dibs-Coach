/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `ProfessionalRecognition` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProfessionalRecognition" DROP COLUMN "deletedAt",
ADD COLUMN     "archivedAt" TIMESTAMPTZ;
