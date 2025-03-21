-- CreateTable
CREATE TABLE "CalendarIntegration" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CAL',
    "calManagedUserId" INTEGER NOT NULL,
    "calUsername" TEXT NOT NULL,
    "calAccessToken" TEXT NOT NULL,
    "calRefreshToken" TEXT NOT NULL,
    "calAccessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "defaultScheduleId" INTEGER,
    "timeZone" TEXT,
    "weekStart" TEXT,
    "timeFormat" INTEGER,
    "locale" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalendarIntegration_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarIntegration_userUlid_key" ON "CalendarIntegration"("userUlid");

-- CreateIndex
CREATE INDEX "CalendarIntegration_userUlid_idx" ON "CalendarIntegration"("userUlid");

-- CreateIndex
CREATE INDEX "CalendarIntegration_provider_idx" ON "CalendarIntegration"("provider");

-- AddForeignKey
ALTER TABLE "CalendarIntegration" ADD CONSTRAINT "CalendarIntegration_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
