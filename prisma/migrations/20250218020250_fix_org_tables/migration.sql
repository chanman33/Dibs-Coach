/*
  Warnings:

  - The values [GLOBAL_ADMIN,LOCAL_ADMIN] on the enum `OrgRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [SYSTEM_ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "OrgLevel" ADD VALUE 'BRANCH';

-- AlterEnum
BEGIN;
CREATE TYPE "OrgRole_new" AS ENUM ('GLOBAL_OWNER', 'GLOBAL_DIRECTOR', 'GLOBAL_MANAGER', 'REGIONAL_OWNER', 'REGIONAL_DIRECTOR', 'REGIONAL_MANAGER', 'LOCAL_OWNER', 'LOCAL_DIRECTOR', 'LOCAL_MANAGER', 'OWNER', 'DIRECTOR', 'MANAGER', 'MEMBER', 'GUEST');
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" TYPE "OrgRole_new" USING ("role"::text::"OrgRole_new");
ALTER TABLE "RolePermission" ALTER COLUMN "role" TYPE "OrgRole_new" USING ("role"::text::"OrgRole_new");
ALTER TYPE "OrgRole" RENAME TO "OrgRole_old";
ALTER TYPE "OrgRole_new" RENAME TO "OrgRole";
DROP TYPE "OrgRole_old";
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrgStatus" ADD VALUE 'PENDING';
ALTER TYPE "OrgStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
ALTER TYPE "OrgTier" ADD VALUE 'PARTNER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrgType" ADD VALUE 'FRANCHISE';
ALTER TYPE "OrgType" ADD VALUE 'NETWORK';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SYSTEM_OWNER', 'SYSTEM_MODERATOR', 'USER');
ALTER TABLE "User" ALTER COLUMN "systemRole" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "systemRole" TYPE "UserRole_new" USING ("systemRole"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "systemRole" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "level" "OrgLevel" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "parentUlid" CHAR(26),
ADD COLUMN     "tier" "OrgTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "type" "OrgType" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "Region" (
    "ulid" CHAR(26) NOT NULL,
    "organizationUlid" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentUlid" CHAR(26),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE INDEX "Region_organizationUlid_idx" ON "Region"("organizationUlid");

-- CreateIndex
CREATE INDEX "Region_parentUlid_idx" ON "Region"("parentUlid");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_level_idx" ON "Organization"("level");

-- CreateIndex
CREATE INDEX "Organization_parentUlid_idx" ON "Organization"("parentUlid");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentUlid_fkey" FOREIGN KEY ("parentUlid") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentUlid_fkey" FOREIGN KEY ("parentUlid") REFERENCES "Region"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
