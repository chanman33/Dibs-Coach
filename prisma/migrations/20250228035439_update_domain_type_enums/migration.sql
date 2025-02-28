/*
  Warnings:

  - The values [LOAN_OFFICER,TITLE_OFFICER] on the enum `DomainType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DomainType_new" AS ENUM ('REALTOR', 'INVESTOR', 'MORTGAGE', 'PROPERTY_MANAGER', 'TITLE_ESCROW', 'COMMERCIAL', 'PRIVATE_CREDIT');
ALTER TABLE "Organization" ALTER COLUMN "primaryDomain" TYPE "DomainType_new" USING ("primaryDomain"::text::"DomainType_new");
ALTER TYPE "DomainType" RENAME TO "DomainType_old";
ALTER TYPE "DomainType_new" RENAME TO "DomainType";
DROP TYPE "DomainType_old";
COMMIT;
