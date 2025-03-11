-- CreateTable
CREATE TABLE "CoachingAvailabilitySchedule" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "allowCustomDuration" BOOLEAN NOT NULL DEFAULT true,
    "averageRating" DECIMAL(3,2),
    "bufferAfter" INTEGER NOT NULL DEFAULT 0,
    "bufferBefore" INTEGER NOT NULL DEFAULT 0,
    "calendlyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultDuration" INTEGER NOT NULL DEFAULT 60,
    "maximumDuration" INTEGER NOT NULL DEFAULT 120,
    "minimumDuration" INTEGER NOT NULL DEFAULT 30,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "zoomEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CoachingAvailabilitySchedule_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE INDEX "CoachingAvailabilitySchedule_userUlid_idx" ON "CoachingAvailabilitySchedule"("userUlid");

-- AddForeignKey
ALTER TABLE "CoachingAvailabilitySchedule" ADD CONSTRAINT "CoachingAvailabilitySchedule_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
