-- CreateTable
CREATE TABLE "AIThread" (
    "id" SERIAL NOT NULL,
    "userDbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AIThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIThread_userDbId_idx" ON "AIThread"("userDbId");

-- CreateIndex
CREATE INDEX "AIMessage_threadId_idx" ON "AIMessage"("threadId");

-- AddForeignKey
ALTER TABLE "AIThread" ADD CONSTRAINT "AIThread_userDbId_fkey" FOREIGN KEY ("userDbId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "AIThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
