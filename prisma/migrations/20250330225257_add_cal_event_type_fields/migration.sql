-- AlterTable
ALTER TABLE "CalEventType" ADD COLUMN     "afterEventBuffer" INTEGER,
ADD COLUMN     "beforeEventBuffer" INTEGER,
ADD COLUMN     "bookerLayouts" JSONB,
ADD COLUMN     "locations" JSONB,
ADD COLUMN     "slotInterval" INTEGER,
ADD COLUMN     "successRedirectUrl" TEXT;
