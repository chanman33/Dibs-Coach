/*
  Warnings:

  - You are about to drop the column `domains` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `primaryDomain` on the `Organization` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Organization_primaryDomain_idx";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "domains",
DROP COLUMN "primaryDomain";
