-- CreateEnum
CREATE TYPE "CalSchedulingType" AS ENUM ('MANAGED', 'OFFICE_HOURS', 'GROUP_SESSION');

-- CreateTable
CREATE TABLE "CalEventType" (
    "ulid" CHAR(26) NOT NULL,
    "calendarIntegrationUlid" CHAR(26) NOT NULL,
    "calEventTypeId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "duration" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "scheduling" "CalSchedulingType" NOT NULL DEFAULT 'MANAGED',
    "bookingLimits" JSONB,
    "minimumBookingNotice" INTEGER,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxParticipants" INTEGER,
    "discountPercentage" INTEGER,
    "organizationUlid" CHAR(26),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalEventType_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE INDEX "CalEventType_calendarIntegrationUlid_idx" ON "CalEventType"("calendarIntegrationUlid");

-- CreateIndex
CREATE INDEX "CalEventType_isDefault_idx" ON "CalEventType"("isDefault");

-- CreateIndex
CREATE INDEX "CalEventType_isActive_idx" ON "CalEventType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CalEventType_calendarIntegrationUlid_calEventTypeId_key" ON "CalEventType"("calendarIntegrationUlid", "calEventTypeId");

-- AddForeignKey
ALTER TABLE "CalEventType" ADD CONSTRAINT "CalEventType_calendarIntegrationUlid_fkey" FOREIGN KEY ("calendarIntegrationUlid") REFERENCES "CalendarIntegration"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
