/*
  Warnings:

  - You are about to drop the column `description` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Achievement` table. All the data in the column will be lost.
  - Added the required column `milestone` to the `Achievement` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Achievement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RecognitionType" AS ENUM ('AWARD', 'ACHIEVEMENT');

-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "description",
DROP COLUMN "icon",
DROP COLUMN "title",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "milestone" TEXT NOT NULL,
ALTER COLUMN "earnedAt" SET DATA TYPE TIMESTAMPTZ,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "ProfessionalRecognition" (
    "id" SERIAL NOT NULL,
    "realtorProfileId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "RecognitionType" NOT NULL,
    "year" INTEGER NOT NULL,
    "organization" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ProfessionalRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_realtorProfileId_idx" ON "ProfessionalRecognition"("realtorProfileId");

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_type_idx" ON "ProfessionalRecognition"("type");

-- CreateIndex
CREATE INDEX "Achievement_type_idx" ON "Achievement"("type");

-- AddForeignKey
ALTER TABLE "ProfessionalRecognition" ADD CONSTRAINT "ProfessionalRecognition_realtorProfileId_fkey" FOREIGN KEY ("realtorProfileId") REFERENCES "RealtorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
