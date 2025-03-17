/*
  Warnings:

  - You are about to drop the column `activeAgents` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `certifications` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `serviceAreas` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `totalTransactions` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `transactionVolume` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "activeAgents",
DROP COLUMN "certifications",
DROP COLUMN "serviceAreas",
DROP COLUMN "totalTransactions",
DROP COLUMN "transactionVolume";
