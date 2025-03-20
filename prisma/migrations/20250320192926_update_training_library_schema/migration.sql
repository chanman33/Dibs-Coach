-- CreateTable
CREATE TABLE "training_resources" (
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

    CONSTRAINT "training_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_domains" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,

    CONSTRAINT "resource_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_assignments" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "completed_at" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resource_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "resource_id" TEXT NOT NULL,
    "content" TEXT,
    "video_url" TEXT,
    "duration" INTEGER,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_domains_resource_id_domain_key" ON "resource_domains"("resource_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "resource_assignments_resource_id_user_id_key" ON "resource_assignments"("resource_id", "user_id");

-- AddForeignKey
ALTER TABLE "training_resources" ADD CONSTRAINT "training_resources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_resources" ADD CONSTRAINT "training_resources_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_domains" ADD CONSTRAINT "resource_domains_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "training_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_assignments" ADD CONSTRAINT "resource_assignments_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "training_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_assignments" ADD CONSTRAINT "resource_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_assignments" ADD CONSTRAINT "resource_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "User"("ulid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "training_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
