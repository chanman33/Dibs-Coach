-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'es', 'zh', 'tl', 'vi', 'ar', 'fr', 'ko', 'ru', 'de', 'hi', 'pt', 'it', 'ja');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "languages" "Language"[] DEFAULT ARRAY['en']::"Language"[];
