/*
  Warnings:

  - You are about to drop the `DomainExpertise` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DomainVerification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DomainExpertise" DROP CONSTRAINT "DomainExpertise_coachProfileUlid_fkey";

-- DropForeignKey
ALTER TABLE "DomainExpertise" DROP CONSTRAINT "DomainExpertise_menteeProfileUlid_fkey";

-- DropForeignKey
ALTER TABLE "DomainExpertise" DROP CONSTRAINT "DomainExpertise_userUlid_fkey";

-- DropForeignKey
ALTER TABLE "DomainVerification" DROP CONSTRAINT "DomainVerification_domainExpertiseUlid_fkey";

-- DropForeignKey
ALTER TABLE "DomainVerification" DROP CONSTRAINT "DomainVerification_userUlid_fkey";

-- DropTable
DROP TABLE "DomainExpertise";

-- DropTable
DROP TABLE "DomainVerification";
