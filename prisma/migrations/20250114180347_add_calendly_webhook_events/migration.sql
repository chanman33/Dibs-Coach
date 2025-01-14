-- CreateTable
CREATE TABLE "CalendlyWebhookEvent" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendlyWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendlyWebhookEvent_eventType_idx" ON "CalendlyWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "CalendlyWebhookEvent_processed_idx" ON "CalendlyWebhookEvent"("processed");
