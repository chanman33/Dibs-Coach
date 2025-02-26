/*
  Warnings:

  - You are about to drop the column `languages` on the `CommercialProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `InsuranceProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `InvestorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `LoanOfficerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `PrivateCreditProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `PropertyManagerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `RealtorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `TitleEscrowProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CommercialProfile" DROP COLUMN "languages";

-- AlterTable
ALTER TABLE "InsuranceProfile" DROP COLUMN "languages";

-- AlterTable
ALTER TABLE "InvestorProfile" DROP COLUMN "languages";

-- AlterTable
ALTER TABLE "LoanOfficerProfile" DROP COLUMN "languages";

-- AlterTable
ALTER TABLE "PrivateCreditProfile" DROP COLUMN "languages";

-- AlterTable
ALTER TABLE "PropertyManagerProfile" DROP COLUMN "languages";

-- AlterTable
ALTER TABLE "RealtorProfile" DROP COLUMN "languages";

-- AlterTable
ALTER TABLE "TitleEscrowProfile" DROP COLUMN "languages";
