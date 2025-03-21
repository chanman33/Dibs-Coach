-- CreateTable
CREATE TABLE "CalBooking" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "calBookingUid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMPTZ(6) NOT NULL,
    "endTime" TIMESTAMPTZ(6) NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "attendeeName" TEXT,
    "allAttendees" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "cancellationReason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CalBooking_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalBooking_calBookingUid_key" ON "CalBooking"("calBookingUid");

-- CreateIndex
CREATE INDEX "CalBooking_userUlid_idx" ON "CalBooking"("userUlid");

-- CreateIndex
CREATE INDEX "CalBooking_status_idx" ON "CalBooking"("status");

-- CreateIndex
CREATE INDEX "CalBooking_startTime_idx" ON "CalBooking"("startTime");

-- AddForeignKey
ALTER TABLE "CalBooking" ADD CONSTRAINT "CalBooking_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
