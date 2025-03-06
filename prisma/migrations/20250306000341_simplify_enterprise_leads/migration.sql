/*
  Warnings:

  - You are about to drop the column `budget` on the `EnterpriseLeads` table. All the data in the column will be lost.
  - You are about to drop the column `currentCrm` on the `EnterpriseLeads` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyTransactions` on the `EnterpriseLeads` table. All the data in the column will be lost.
  - You are about to drop the column `primaryChallenges` on the `EnterpriseLeads` table. All the data in the column will be lost.
  - You are about to drop the column `timeframe` on the `EnterpriseLeads` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EnterpriseLeads_priority_idx";

-- DropIndex
DROP INDEX "EnterpriseLeads_status_idx";

-- AlterTable
ALTER TABLE "EnterpriseLeads" DROP COLUMN "budget",
DROP COLUMN "currentCrm",
DROP COLUMN "monthlyTransactions",
DROP COLUMN "primaryChallenges",
DROP COLUMN "timeframe",
ADD COLUMN     "multipleOffices" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "source" SET DEFAULT 'CONTACT_FORM_AUTH',
ALTER COLUMN "lastContactedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "nextFollowUpDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);
