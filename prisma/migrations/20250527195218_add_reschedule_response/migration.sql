-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'COACH_PROPOSED_RESCHEDULE';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "proposedEndTime" TIMESTAMPTZ(6),
ADD COLUMN     "proposedStartTime" TIMESTAMPTZ(6),
ADD COLUMN     "rescheduleProposalReason" TEXT,
ADD COLUMN     "rescheduleProposedByUlid" CHAR(26);

-- CreateIndex
CREATE INDEX "Session_rescheduleProposedByUlid_idx" ON "Session"("rescheduleProposedByUlid");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_rescheduleProposedByUlid_fkey" FOREIGN KEY ("rescheduleProposedByUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
