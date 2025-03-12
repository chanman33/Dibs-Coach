-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "coachPrimaryDomain" "RealEstateDomain",
ADD COLUMN     "coachRealEstateDomains" "RealEstateDomain"[] DEFAULT ARRAY[]::"RealEstateDomain"[];

-- CreateIndex
CREATE INDEX "CoachProfile_coachRealEstateDomains_idx" ON "CoachProfile"("coachRealEstateDomains");

-- CreateIndex
CREATE INDEX "CoachProfile_coachPrimaryDomain_idx" ON "CoachProfile"("coachPrimaryDomain");
