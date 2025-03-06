/*
  Warnings:

  - You are about to drop the column `source` on the `EnterpriseLeads` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `EnterpriseLeads` table. All the data in the column will be lost.
  - You are about to drop the column `userUlid` on the `EnterpriseLeads` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EnterpriseLeads" DROP CONSTRAINT "EnterpriseLeads_userUlid_fkey";

-- DropIndex
DROP INDEX "EnterpriseLeads_userUlid_idx";

-- AlterTable
ALTER TABLE "EnterpriseLeads" DROP COLUMN "source",
DROP COLUMN "userId",
DROP COLUMN "userUlid",
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;
