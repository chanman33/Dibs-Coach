-- CreateEnum
CREATE TYPE "CoachRequestStatus" AS ENUM ('PENDING', 'REVIEWED', 'MATCHED', 'CLOSED');

-- CreateTable
CREATE TABLE "CoachRequest" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "requestDetails" TEXT NOT NULL,
    "preferredDomain" "RealEstateDomain",
    "preferredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CoachRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByUlid" CHAR(26),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CoachRequest_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE INDEX "CoachRequest_userUlid_idx" ON "CoachRequest"("userUlid");

-- CreateIndex
CREATE INDEX "CoachRequest_status_idx" ON "CoachRequest"("status");

-- CreateIndex
CREATE INDEX "CoachRequest_reviewedByUlid_idx" ON "CoachRequest"("reviewedByUlid");

-- AddForeignKey
ALTER TABLE "CoachRequest" ADD CONSTRAINT "CoachRequest_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachRequest" ADD CONSTRAINT "CoachRequest_reviewedByUlid_fkey" FOREIGN KEY ("reviewedByUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
