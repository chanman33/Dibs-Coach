-- CreateTable
CREATE TABLE "EnterpriseLeads" (
    "ulid" CHAR(26) NOT NULL,
    "userId" TEXT,
    "userUlid" CHAR(26),
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "industry" "OrgIndustry" NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "monthlyTransactions" TEXT NOT NULL,
    "currentCrm" TEXT,
    "primaryChallenges" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL DEFAULT 'CONTACT_FORM',
    "assignedToUlid" CHAR(26),
    "notes" JSONB,
    "lastContactedAt" TIMESTAMPTZ,
    "nextFollowUpDate" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EnterpriseLeads_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE INDEX "EnterpriseLeads_status_idx" ON "EnterpriseLeads"("status");

-- CreateIndex
CREATE INDEX "EnterpriseLeads_priority_idx" ON "EnterpriseLeads"("priority");

-- CreateIndex
CREATE INDEX "EnterpriseLeads_userUlid_idx" ON "EnterpriseLeads"("userUlid");

-- CreateIndex
CREATE INDEX "EnterpriseLeads_assignedToUlid_idx" ON "EnterpriseLeads"("assignedToUlid");

-- AddForeignKey
ALTER TABLE "EnterpriseLeads" ADD CONSTRAINT "EnterpriseLeads_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseLeads" ADD CONSTRAINT "EnterpriseLeads_assignedToUlid_fkey" FOREIGN KEY ("assignedToUlid") REFERENCES "User"("ulid") ON DELETE SET NULL ON UPDATE CASCADE;
