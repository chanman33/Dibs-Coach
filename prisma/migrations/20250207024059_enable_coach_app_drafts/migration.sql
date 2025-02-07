-- AlterTable
ALTER TABLE "CoachApplication" ADD COLUMN     "draftData" JSONB,
ADD COLUMN     "draftVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSavedAt" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "CoachApplication_isDraft_applicantDbId_idx" ON "CoachApplication"("isDraft", "applicantDbId");
