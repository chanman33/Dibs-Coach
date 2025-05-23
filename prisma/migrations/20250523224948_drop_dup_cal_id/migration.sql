/*
  Warnings:

  - You are about to drop the column `calBookingId` on the `CalBooking` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CalBooking_calBookingId_idx";

-- AlterTable
ALTER TABLE "CalBooking" DROP COLUMN "calBookingId";
