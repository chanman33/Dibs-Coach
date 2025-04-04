-- AlterTable
ALTER TABLE "CalendarIntegration" ADD COLUMN     "googleCalendarConnected" BOOLEAN DEFAULT false,
ADD COLUMN     "office365CalendarConnected" BOOLEAN DEFAULT false;
