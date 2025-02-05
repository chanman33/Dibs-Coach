-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'COACH', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('USER', 'COACH', 'SYSTEM', 'SECURITY');

-- CreateEnum
CREATE TYPE "ActivitySeverity" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "SystemHealth" (
    "id" BIGSERIAL NOT NULL,
    "status" INTEGER NOT NULL,
    "activeSessions" INTEGER NOT NULL,
    "pendingReviews" INTEGER NOT NULL,
    "securityAlerts" INTEGER NOT NULL,
    "uptime" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SystemHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminMetrics" (
    "id" SERIAL NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "totalCoaches" INTEGER NOT NULL,
    "activeCoaches" INTEGER NOT NULL,
    "pendingCoaches" INTEGER NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "completedSessions" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "monthlyRevenue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AdminMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemActivity" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SystemActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlerts" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SystemAlerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActivity" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userDbId" INTEGER,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AdminActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" SERIAL NOT NULL,
    "adminDbId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemHealth_createdAt_idx" ON "SystemHealth"("createdAt");

-- CreateIndex
CREATE INDEX "AdminMetrics_createdAt_idx" ON "AdminMetrics"("createdAt");

-- CreateIndex
CREATE INDEX "SystemActivity_type_createdAt_idx" ON "SystemActivity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SystemActivity_severity_createdAt_idx" ON "SystemActivity"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "SystemAlerts_type_createdAt_idx" ON "SystemAlerts"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SystemAlerts_severity_createdAt_idx" ON "SystemAlerts"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActivity_type_idx" ON "AdminActivity"("type");

-- CreateIndex
CREATE INDEX "AdminActivity_createdAt_idx" ON "AdminActivity"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminDbId_idx" ON "AdminAuditLog"("adminDbId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminDbId_fkey" FOREIGN KEY ("adminDbId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
