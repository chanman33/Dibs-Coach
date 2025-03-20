/*
  Warnings:

  - You are about to drop the `course_sections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resource_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resource_domains` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `training_resources` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "course_sections" DROP CONSTRAINT "course_sections_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "resource_assignments" DROP CONSTRAINT "resource_assignments_assigned_by_id_fkey";

-- DropForeignKey
ALTER TABLE "resource_assignments" DROP CONSTRAINT "resource_assignments_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "resource_assignments" DROP CONSTRAINT "resource_assignments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "resource_domains" DROP CONSTRAINT "resource_domains_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "training_resources" DROP CONSTRAINT "training_resources_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "training_resources" DROP CONSTRAINT "training_resources_organization_id_fkey";

-- DropTable
DROP TABLE "course_sections";

-- DropTable
DROP TABLE "resource_assignments";

-- DropTable
DROP TABLE "resource_domains";

-- DropTable
DROP TABLE "training_resources";

-- CreateTable
CREATE TABLE "TrainingResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "url" TEXT,
    "thumbnail" TEXT,
    "partner" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "TrainingResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,

    CONSTRAINT "ResourceDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAssignment" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "completed_at" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ResourceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "resource_id" TEXT NOT NULL,
    "content" TEXT,
    "video_url" TEXT,
    "duration" INTEGER,

    CONSTRAINT "CourseSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceDomain_resource_id_domain_key" ON "ResourceDomain"("resource_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceAssignment_resource_id_user_id_key" ON "ResourceAssignment"("resource_id", "user_id");

-- AddForeignKey
ALTER TABLE "TrainingResource" ADD CONSTRAINT "TrainingResource_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingResource" ADD CONSTRAINT "TrainingResource_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceDomain" ADD CONSTRAINT "ResourceDomain_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "TrainingResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAssignment" ADD CONSTRAINT "ResourceAssignment_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "TrainingResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAssignment" ADD CONSTRAINT "ResourceAssignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAssignment" ADD CONSTRAINT "ResourceAssignment_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSection" ADD CONSTRAINT "CourseSection_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "TrainingResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
