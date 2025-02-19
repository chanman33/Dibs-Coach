/*
  Warnings:

  - You are about to drop the column `designations` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `memberKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `memberStatus` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[memberKey]` on the table `RealtorProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_memberKey_key";

-- AlterTable
ALTER TABLE "RealtorProfile" ADD COLUMN     "designations" TEXT[],
ADD COLUMN     "memberKey" TEXT,
ADD COLUMN     "memberStatus" TEXT,
ALTER COLUMN "geographicFocus" DROP NOT NULL,
ALTER COLUMN "testimonials" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "designations",
DROP COLUMN "memberKey",
DROP COLUMN "memberStatus";

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_memberKey_key" ON "RealtorProfile"("memberKey");
