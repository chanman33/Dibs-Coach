-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "sessionUlid" CHAR(26);

-- CreateIndex
CREATE INDEX "SupportTicket_sessionUlid_idx" ON "SupportTicket"("sessionUlid");

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_sessionUlid_fkey" FOREIGN KEY ("sessionUlid") REFERENCES "Session"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
