-- First, copy data to new fields
UPDATE "CoachApplication"
SET 
  "yearsOfExperience" = CASE 
    WHEN "experience" ~ '^[0-9]+$' THEN CAST("experience" AS INTEGER)
    ELSE 0
  END,
  "superPower" = "specialties",
  "aboutYou" = "notes",
  "realEstateDomains" = "industrySpecialties";

-- Verify data was copied
SELECT 
  "ulid",
  "experience",
  "yearsOfExperience",
  "specialties",
  "superPower",
  "notes",
  "aboutYou",
  "industrySpecialties",
  "realEstateDomains"
FROM "CoachApplication"; 