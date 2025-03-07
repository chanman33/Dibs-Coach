/*
  Warnings:

  - You are about to drop the column `firstName` on the `CoachApplication` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `CoachApplication` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `CoachApplication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CoachApplication" DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "phoneNumber";
