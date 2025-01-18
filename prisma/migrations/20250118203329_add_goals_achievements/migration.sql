-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('in_progress', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('sales', 'listings', 'clients', 'custom');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('milestone', 'performance', 'learning');

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "type" "GoalType" NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "AchievementType" NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_userDbId_idx" ON "Goal"("userDbId");

-- CreateIndex
CREATE INDEX "Goal_type_idx" ON "Goal"("type");

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateIndex
CREATE INDEX "Achievement_userDbId_idx" ON "Achievement"("userDbId");

-- CreateIndex
CREATE INDEX "Achievement_type_idx" ON "Achievement"("type");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
