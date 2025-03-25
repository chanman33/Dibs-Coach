/*
  Warnings:

  - You are about to drop the column `progress` on the `ResourceAssignment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('credit_card', 'debit_card', 'bank_transfer');

-- AlterTable
ALTER TABLE "ResourceAssignment" DROP COLUMN "progress";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "billingDay" INTEGER,
ADD COLUMN     "seatPrice" DECIMAL(10,2),
ADD COLUMN     "totalSeats" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "usedSeats" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "PaymentMethod";

-- CreateTable
CREATE TABLE "SeatLicense" (
    "ulid" CHAR(26) NOT NULL,
    "subscriptionUlid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assignedByUserUlid" CHAR(26),
    "departmentName" TEXT,
    "teamName" TEXT,
    "metadata" JSONB,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SeatLicense_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "ulid" CHAR(26) NOT NULL,
    "subscriptionUlid" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUlid" CHAR(26),
    "amount" DECIMAL(10,2) NOT NULL,
    "spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26),
    "organizationUlid" CHAR(26),
    "stripePaymentId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "last4" TEXT NOT NULL,
    "brand" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "country" TEXT,
    "billingAddress" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("ulid")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "ulid" CHAR(26) NOT NULL,
    "subscriptionUlid" CHAR(26),
    "paymentMethodUlid" CHAR(26),
    "organizationUlid" CHAR(26),
    "userUlid" CHAR(26),
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE INDEX "SeatLicense_subscriptionUlid_idx" ON "SeatLicense"("subscriptionUlid");

-- CreateIndex
CREATE INDEX "SeatLicense_userUlid_idx" ON "SeatLicense"("userUlid");

-- CreateIndex
CREATE INDEX "SeatLicense_assignedByUserUlid_idx" ON "SeatLicense"("assignedByUserUlid");

-- CreateIndex
CREATE INDEX "SeatLicense_status_idx" ON "SeatLicense"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SeatLicense_subscriptionUlid_userUlid_key" ON "SeatLicense"("subscriptionUlid", "userUlid");

-- CreateIndex
CREATE INDEX "BudgetAllocation_subscriptionUlid_idx" ON "BudgetAllocation"("subscriptionUlid");

-- CreateIndex
CREATE INDEX "BudgetAllocation_targetUlid_idx" ON "BudgetAllocation"("targetUlid");

-- CreateIndex
CREATE INDEX "BudgetAllocation_type_idx" ON "BudgetAllocation"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_stripePaymentId_key" ON "PaymentMethod"("stripePaymentId");

-- CreateIndex
CREATE INDEX "PaymentMethod_userUlid_idx" ON "PaymentMethod"("userUlid");

-- CreateIndex
CREATE INDEX "PaymentMethod_organizationUlid_idx" ON "PaymentMethod"("organizationUlid");

-- CreateIndex
CREATE INDEX "PaymentMethod_isDefault_idx" ON "PaymentMethod"("isDefault");

-- CreateIndex
CREATE INDEX "BillingEvent_subscriptionUlid_idx" ON "BillingEvent"("subscriptionUlid");

-- CreateIndex
CREATE INDEX "BillingEvent_paymentMethodUlid_idx" ON "BillingEvent"("paymentMethodUlid");

-- CreateIndex
CREATE INDEX "BillingEvent_organizationUlid_idx" ON "BillingEvent"("organizationUlid");

-- CreateIndex
CREATE INDEX "BillingEvent_userUlid_idx" ON "BillingEvent"("userUlid");

-- CreateIndex
CREATE INDEX "BillingEvent_type_idx" ON "BillingEvent"("type");

-- CreateIndex
CREATE INDEX "BillingEvent_createdAt_idx" ON "BillingEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "SeatLicense" ADD CONSTRAINT "SeatLicense_subscriptionUlid_fkey" FOREIGN KEY ("subscriptionUlid") REFERENCES "Subscription"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatLicense" ADD CONSTRAINT "SeatLicense_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatLicense" ADD CONSTRAINT "SeatLicense_assignedByUserUlid_fkey" FOREIGN KEY ("assignedByUserUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_subscriptionUlid_fkey" FOREIGN KEY ("subscriptionUlid") REFERENCES "Subscription"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_targetUlid_fkey" FOREIGN KEY ("targetUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_subscriptionUlid_fkey" FOREIGN KEY ("subscriptionUlid") REFERENCES "Subscription"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_paymentMethodUlid_fkey" FOREIGN KEY ("paymentMethodUlid") REFERENCES "PaymentMethod"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
