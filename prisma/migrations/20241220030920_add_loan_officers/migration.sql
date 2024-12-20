/*
  Warnings:

  - The values [coach,admin] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `Dispute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `amountPaid` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `amountDue` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The `currency` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The `currency` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `processingFee` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `platformFee` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The `currency` column on the `Payout` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Payout` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `bio` on the `RealtorProfile` table. All the data in the column will be lost.
  - The `status` column on the `Refund` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `realtorId` on the `Session` table. All the data in the column will be lost.
  - The `status` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `amount` on the `SubscriptionPlan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The `currency` column on the `SubscriptionPlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `CoachProfile` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `paymentMethod` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'debit_card', 'bank_transfer');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'resolved', 'rejected');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('realtor', 'loan_officer', 'realtor_coach', 'loan_officer_coach');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'realtor';
COMMIT;

-- DropForeignKey
ALTER TABLE "CoachProfile" DROP CONSTRAINT "CoachProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_coachId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_realtorId_fkey";

-- DropIndex
DROP INDEX "Session_realtorId_idx";

-- AlterTable
ALTER TABLE "Dispute" DROP COLUMN "status",
ADD COLUMN     "status" "DisputeStatus" NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "amountPaid" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "amountDue" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD',
ALTER COLUMN "processingFee" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "platformFee" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL;

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD',
DROP COLUMN "status",
ADD COLUMN     "status" "PayoutStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "RealtorProfile" DROP COLUMN "bio";

-- AlterTable
ALTER TABLE "Refund" DROP COLUMN "status",
ADD COLUMN     "status" "RefundStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "realtorId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "menteeId" INTEGER,
ALTER COLUMN "coachId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'scheduled';

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active';

-- DropTable
DROP TABLE "CoachProfile";

-- CreateTable
CREATE TABLE "BaseProfile" (
    "userId" INTEGER NOT NULL,
    "bio" TEXT,
    "careerStage" TEXT,
    "goals" TEXT,
    "availability" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaseProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LoanOfficerProfile" (
    "userId" INTEGER NOT NULL,
    "companyName" TEXT,
    "licenseNumber" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanOfficerProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RealtorCoachProfile" (
    "userId" INTEGER NOT NULL,
    "specialties" TEXT,
    "yearsOfExperience" INTEGER,
    "hourlyRate" DECIMAL(10,2),
    "bio" TEXT,
    "oneTimeCallPrice" DECIMAL(10,2),
    "bundlePrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealtorCoachProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LoanOfficerCoachProfile" (
    "userId" INTEGER NOT NULL,
    "specialties" TEXT,
    "yearsOfExperience" INTEGER,
    "hourlyRate" DECIMAL(10,2),
    "bio" TEXT,
    "oneTimeCallPrice" DECIMAL(10,2),
    "bundlePrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanOfficerCoachProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanOfficerProfile_licenseNumber_key" ON "LoanOfficerProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "Payment_payerId_status_idx" ON "Payment"("payerId", "status");

-- CreateIndex
CREATE INDEX "Payment_payeeId_status_idx" ON "Payment"("payeeId", "status");

-- CreateIndex
CREATE INDEX "Session_menteeId_idx" ON "Session"("menteeId");

-- CreateIndex
CREATE INDEX "Session_coachId_status_idx" ON "Session"("coachId", "status");

-- CreateIndex
CREATE INDEX "Session_menteeId_status_idx" ON "Session"("menteeId", "status");

-- AddForeignKey
ALTER TABLE "BaseProfile" ADD CONSTRAINT "BaseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanOfficerProfile" ADD CONSTRAINT "LoanOfficerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealtorCoachProfile" ADD CONSTRAINT "RealtorCoachProfile_realtorProfile_fkey" FOREIGN KEY ("userId") REFERENCES "RealtorProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealtorCoachProfile" ADD CONSTRAINT "RealtorCoachProfile_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanOfficerCoachProfile" ADD CONSTRAINT "LoanOfficerCoachProfile_loanOfficerProfile_fkey" FOREIGN KEY ("userId") REFERENCES "LoanOfficerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanOfficerCoachProfile" ADD CONSTRAINT "LoanOfficerCoachProfile_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
