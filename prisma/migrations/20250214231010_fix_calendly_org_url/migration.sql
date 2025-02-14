/*
  Warnings:

  - Made the column `schedulingUrl` on table `CalendlyIntegration` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CalendlyIntegration" ADD COLUMN     "organizationUrl" TEXT,
ALTER COLUMN "eventTypeId" DROP NOT NULL,
ALTER COLUMN "schedulingUrl" SET NOT NULL;
