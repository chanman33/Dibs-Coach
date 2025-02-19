/*
  Warnings:

  - You are about to drop the column `companyName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `licenseNumber` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_licenseNumber_key";

-- AlterTable
ALTER TABLE "RealtorProfile" ADD COLUMN     "companyName" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "companyName",
DROP COLUMN "licenseNumber";
