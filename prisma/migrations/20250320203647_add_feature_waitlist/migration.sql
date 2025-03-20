-- CreateTable
CREATE TABLE "FeatureWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "user_id" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureWaitlist_organization_id_idx" ON "FeatureWaitlist"("organization_id");

-- CreateIndex
CREATE INDEX "FeatureWaitlist_feature_id_idx" ON "FeatureWaitlist"("feature_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureWaitlist_email_feature_id_key" ON "FeatureWaitlist"("email", "feature_id");
