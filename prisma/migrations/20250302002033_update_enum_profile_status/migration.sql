/*
  Warnings:

  - The values [REVIEW] on the enum `ProfileStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProfileStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
ALTER TABLE "CoachProfile" ALTER COLUMN "profileStatus" DROP DEFAULT;
ALTER TABLE "CoachProfile" ALTER COLUMN "profileStatus" TYPE "ProfileStatus_new" USING ("profileStatus"::text::"ProfileStatus_new");
ALTER TYPE "ProfileStatus" RENAME TO "ProfileStatus_old";
ALTER TYPE "ProfileStatus_new" RENAME TO "ProfileStatus";
DROP TYPE "ProfileStatus_old";
ALTER TABLE "CoachProfile" ALTER COLUMN "profileStatus" SET DEFAULT 'DRAFT';
COMMIT;
