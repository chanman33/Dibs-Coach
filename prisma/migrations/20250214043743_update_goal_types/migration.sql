/*
  Warnings:

  - The values [sales,clients] on the enum `GoalType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GoalType_new" AS ENUM ('sales_volume', 'commission_income', 'gci', 'avg_sale_price', 'listings', 'buyer_transactions', 'closed_deals', 'days_on_market', 'coaching_sessions', 'group_sessions', 'session_revenue', 'active_mentees', 'mentee_satisfaction', 'response_time', 'session_completion', 'mentee_milestones', 'new_clients', 'referrals', 'client_retention', 'reviews', 'market_share', 'territory_expansion', 'social_media', 'website_traffic', 'certifications', 'training_hours', 'networking_events', 'custom');
ALTER TABLE "Goal" ALTER COLUMN "type" TYPE "GoalType_new" USING ("type"::text::"GoalType_new");
ALTER TYPE "GoalType" RENAME TO "GoalType_old";
ALTER TYPE "GoalType_new" RENAME TO "GoalType";
DROP TYPE "GoalType_old";
COMMIT;
