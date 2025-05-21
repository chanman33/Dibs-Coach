-- AlterTable
ALTER TABLE "CalBooking" ADD COLUMN     "coachUserUlid" CHAR(26);

-- CreateIndex
CREATE INDEX "CalBooking_coachUserUlid_idx" ON "CalBooking"("coachUserUlid");

-- AddForeignKey
ALTER TABLE "CalBooking" ADD CONSTRAINT "CalBooking_coachUserUlid_fkey" FOREIGN KEY ("coachUserUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
