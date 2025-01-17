/*
  Warnings:

  - A unique constraint covering the columns `[calendlyEventId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL;

-- CreateTable
CREATE TABLE "CalendlyEvent" (
    "id" SERIAL NOT NULL,
    "eventUuid" TEXT NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "inviteeName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendlyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoomSession" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "joinUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoomSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyEvent_eventUuid_key" ON "CalendlyEvent"("eventUuid");

-- CreateIndex
CREATE INDEX "CalendlyEvent_userDbId_idx" ON "CalendlyEvent"("userDbId");

-- CreateIndex
CREATE INDEX "CalendlyEvent_eventUuid_idx" ON "CalendlyEvent"("eventUuid");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomSession_sessionId_key" ON "ZoomSession"("sessionId");

-- CreateIndex
CREATE INDEX "ZoomSession_sessionId_idx" ON "ZoomSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_calendlyEventId_key" ON "Session"("calendlyEventId");

-- CreateIndex
CREATE INDEX "Session_calendlyEventId_idx" ON "Session"("calendlyEventId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_calendlyEventId_fkey" FOREIGN KEY ("calendlyEventId") REFERENCES "CalendlyEvent"("eventUuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendlyEvent" ADD CONSTRAINT "CalendlyEvent_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomSession" ADD CONSTRAINT "ZoomSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
