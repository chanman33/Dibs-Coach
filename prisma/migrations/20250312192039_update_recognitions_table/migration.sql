-- DropIndex
DROP INDEX "ProfessionalRecognition_coachUlid_idx";

-- AlterTable
ALTER TABLE "ProfessionalRecognition" ADD COLUMN     "industryType" TEXT,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "ProfessionalRecognition_industryType_idx" ON "ProfessionalRecognition"("industryType");
