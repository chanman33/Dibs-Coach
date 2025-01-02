-- CreateTable
CREATE TABLE "CoachApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "experience" TEXT NOT NULL,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" INTEGER,
    "reviewDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachApplication_userId_idx" ON "CoachApplication"("userId");

-- CreateIndex
CREATE INDEX "CoachApplication_reviewedBy_idx" ON "CoachApplication"("reviewedBy");

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
