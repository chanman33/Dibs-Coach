-- First, update null values to a default status
UPDATE "Session"
SET status = 'scheduled'
WHERE status IS NULL;

-- Create the SessionStatus enum type
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- Convert existing status values to match enum values
UPDATE "Session"
SET status = CASE 
    WHEN status = 'canceled' THEN 'cancelled'
    WHEN status NOT IN ('scheduled', 'completed', 'cancelled', 'no_show') THEN 'scheduled'
    ELSE status
END;

-- Alter the column type using USING clause for safe conversion
ALTER TABLE "Session" 
    ALTER COLUMN status TYPE "SessionStatus" 
    USING status::"SessionStatus"; 