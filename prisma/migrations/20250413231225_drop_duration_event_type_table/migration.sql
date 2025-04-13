/*
  Warnings:

  - You are about to drop the column `duration` on the `CalEventType` table. All the data in the column will be lost.
  - Added the required column `lengthInMinutes` to the `CalEventType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CalEventType" DROP COLUMN "duration",
ADD COLUMN     "lengthInMinutes" INTEGER NOT NULL;
