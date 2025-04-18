-- CreateEnum
CREATE TYPE "PortfolioItemType" AS ENUM ('PROPERTY_SALE', 'PROPERTY_PURCHASE', 'LOAN_ORIGINATION', 'PROPERTY_MANAGEMENT', 'INSURANCE_POLICY', 'COMMERCIAL_DEAL', 'PRIVATE_LENDING', 'TITLE_SERVICE', 'OTHER');

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "ulid" CHAR(26) NOT NULL,
    "userUlid" CHAR(26) NOT NULL,
    "type" "PortfolioItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrls" JSONB,
    "address" TEXT,
    "location" JSONB,
    "financialDetails" JSONB,
    "metrics" JSONB,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "tags" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("ulid")
);

-- CreateIndex
CREATE INDEX "PortfolioItem_userUlid_idx" ON "PortfolioItem"("userUlid");

-- CreateIndex
CREATE INDEX "PortfolioItem_type_idx" ON "PortfolioItem"("type");

-- CreateIndex
CREATE INDEX "PortfolioItem_featured_idx" ON "PortfolioItem"("featured");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_userUlid_fkey" FOREIGN KEY ("userUlid") REFERENCES "User"("ulid") ON DELETE CASCADE ON UPDATE CASCADE;
