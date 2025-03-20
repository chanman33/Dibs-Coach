/*
  Warnings:

  - You are about to alter the column `user_id` on the `FeatureWaitlist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(26)`.
  - You are about to alter the column `organization_id` on the `FeatureWaitlist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(26)`.

*/
-- AlterTable
ALTER TABLE "FeatureWaitlist" ALTER COLUMN "user_id" SET DATA TYPE CHAR(26),
ALTER COLUMN "organization_id" SET DATA TYPE CHAR(26);

-- CreateIndex
CREATE INDEX "FeatureWaitlist_user_id_idx" ON "FeatureWaitlist"("user_id");

-- AddForeignKey
ALTER TABLE "FeatureWaitlist" ADD CONSTRAINT "FeatureWaitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureWaitlist" ADD CONSTRAINT "FeatureWaitlist_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
