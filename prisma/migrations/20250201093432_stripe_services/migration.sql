/*
  Warnings:

  - A unique constraint covering the columns `[stripeDisputeId]` on the table `Dispute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `Dispute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Dispute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evidence` to the `Dispute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evidenceDueBy` to the `Dispute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeDisputeId` to the `Dispute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripePaymentIntentId` to the `Dispute` table without a default value. This is not possible if the table is not empty.
  - Made the column `reason` on table `Dispute` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `Dispute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_payeeDbId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_payerDbId_fkey";

-- DropIndex
DROP INDEX "Dispute_paymentId_idx";

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "evidence" JSONB NOT NULL,
ADD COLUMN     "evidenceDueBy" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sessionId" INTEGER,
ADD COLUMN     "stripeDisputeId" TEXT NOT NULL,
ADD COLUMN     "stripePaymentIntentId" TEXT NOT NULL,
ALTER COLUMN "paymentId" DROP NOT NULL,
ALTER COLUMN "reason" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "currency" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_stripeDisputeId_key" ON "Dispute"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "Dispute_sessionId_idx" ON "Dispute"("sessionId");

-- CreateIndex
CREATE INDEX "Dispute_stripeDisputeId_idx" ON "Dispute"("stripeDisputeId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerDbId_fkey" FOREIGN KEY ("payerDbId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payeeDbId_fkey" FOREIGN KEY ("payeeDbId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
