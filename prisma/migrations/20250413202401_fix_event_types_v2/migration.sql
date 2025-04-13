-- AlterTable
ALTER TABLE "CalEventType" ADD COLUMN     "color" JSONB,
ADD COLUMN     "customName" TEXT,
ADD COLUMN     "disableGuests" BOOLEAN,
ADD COLUMN     "hideCalendarEventDetails" BOOLEAN,
ADD COLUMN     "useDestinationCalendarEmail" BOOLEAN;
