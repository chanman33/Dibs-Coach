/*
  Warnings:

  - You are about to drop the column `bio` on the `InsuranceProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `InvestorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `LoanOfficerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `PropertyManagerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `TitleEscrowProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InsuranceProfile" DROP COLUMN "bio";

-- AlterTable
ALTER TABLE "InvestorProfile" DROP COLUMN "bio";

-- AlterTable
ALTER TABLE "LoanOfficerProfile" DROP COLUMN "bio";

-- AlterTable
ALTER TABLE "PropertyManagerProfile" DROP COLUMN "bio";

-- AlterTable
ALTER TABLE "RealtorProfile" DROP COLUMN "bio";

-- AlterTable
ALTER TABLE "TitleEscrowProfile" DROP COLUMN "bio";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT;
