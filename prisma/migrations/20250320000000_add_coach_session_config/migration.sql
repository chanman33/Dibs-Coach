-- Create Currency enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "CoachSessionConfig" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "durations" JSONB NOT NULL,
    "rates" JSONB NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CoachSessionConfig_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "RealtorCoachProfile" 
ADD COLUMN "defaultDuration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN "allowCustomDuration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "minimumDuration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "maximumDuration" INTEGER NOT NULL DEFAULT 120;

-- AlterTable
ALTER TABLE "Session" 
ADD COLUMN "rateAtBooking" DECIMAL(10,2),
ADD COLUMN "currencyCode" "Currency" NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE UNIQUE INDEX "CoachSessionConfig_userDbId_key" ON "CoachSessionConfig"("userDbId");

-- AddForeignKey
ALTER TABLE "CoachSessionConfig" ADD CONSTRAINT "CoachSessionConfig_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 