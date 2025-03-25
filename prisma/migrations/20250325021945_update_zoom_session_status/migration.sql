-- CreateEnum
CREATE TYPE "ZoomSessionStatus" AS ENUM ('SCHEDULED', 'STARTED', 'ENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ZoomSession" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
