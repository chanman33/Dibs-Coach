-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "organizationUlid" CHAR(26);

-- CreateIndex
CREATE INDEX "Goal_organizationUlid_idx" ON "Goal"("organizationUlid");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_organizationUlid_fkey" FOREIGN KEY ("organizationUlid") REFERENCES "Organization"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
