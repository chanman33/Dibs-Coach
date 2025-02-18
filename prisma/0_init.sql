-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop the ULID function if it exists
DROP FUNCTION IF EXISTS generate_ulid();

-- No need to create the function since we're using client-side generation

-- Create function to extract timestamp from ULID
CREATE OR REPLACE FUNCTION ulid_to_timestamp(ulid text)
RETURNS timestamp with time zone
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  -- Crockford's Base32 decoding table
  decoding   INTEGER[] = ARRAY[
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    0,   1,   2,   3,   4,   5,   6,   7,   8,   9,   255, 255, 255, 255, 255, 255,
    255, 10,  11,  12,  13,  14,  15,  16,  17,  255, 18,  19,  255, 20,  21,  255,
    22,  23,  24,  25,  26,  255, 27,  28,  29,  30,  31,  255, 255, 255, 255, 255,
    255, 10,  11,  12,  13,  14,  15,  16,  17,  255, 18,  19,  255, 20,  21,  255,
    22,  23,  24,  25,  26,  255, 27,  28,  29,  30,  31
  ];
  timestamp   BIGINT = 0;
BEGIN
  -- Extract timestamp from first 10 characters
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 1, 1))] << 45);
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 2, 1))] << 40);
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 3, 1))] << 35);
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 4, 1))] << 30);
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 5, 1))] << 25);
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 6, 1))] << 20);
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 7, 1))] << 15);
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 8, 1))] << 10);
  timestamp = timestamp | (decoding[ASCII(SUBSTRING(ulid, 9, 1))] << 5);
  timestamp = timestamp | decoding[ASCII(SUBSTRING(ulid, 10, 1))];
  
  RETURN to_timestamp(timestamp::double precision / 1000);
END;
$$;

-- Create function to compare ULIDs
CREATE OR REPLACE FUNCTION compare_ulids(ulid1 text, ulid2 text)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF ulid1 < ulid2 THEN
    RETURN -1;
  ELSIF ulid1 > ulid2 THEN
    RETURN 1;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to handle JSON array updates
CREATE OR REPLACE FUNCTION jsonb_array_append(jsonb, jsonb)
RETURNS jsonb AS $$
BEGIN
    RETURN CASE
        WHEN $1 IS NULL THEN jsonb_build_array($2)
        WHEN jsonb_typeof($1) = 'array' THEN $1 || $2
        ELSE jsonb_build_array($1, $2)
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to handle array distinct values
CREATE OR REPLACE FUNCTION array_distinct(anyarray)
RETURNS anyarray AS $$
  SELECT array_agg(DISTINCT x) FROM unnest($1) t(x);
$$ LANGUAGE SQL IMMUTABLE;

-- Create text search configuration
DO $$ 
BEGIN
    -- Check if configuration already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'english_unaccent'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION english_unaccent ( COPY = english );
        ALTER TEXT SEARCH CONFIGURATION english_unaccent
            ALTER MAPPING FOR hword, hword_part, word WITH english_stem;
    END IF;
END $$;

-- Create index creation helper function
CREATE OR REPLACE FUNCTION create_tsvector_index(table_name text, column_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING gin(to_tsvector(''english_unaccent'', %I))',
        'idx_' || table_name || '_' || column_name || '_fts',
        table_name,
        column_name
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for ULID fields
CREATE OR REPLACE FUNCTION create_ulid_indexes() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    table_name text;
    column_name text;
BEGIN
    FOR table_name, column_name IN
        SELECT t.table_name, c.column_name
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public'
        AND c.data_type = 'character'
        AND c.character_maximum_length = 26
        AND c.column_name LIKE '%ulid%'
    LOOP
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_%I ON %I USING btree (%I)',
            table_name, column_name, table_name, column_name);
    END LOOP;
END;
$$;

-- Execute the index creation
SELECT create_ulid_indexes();

-- Let Prisma handle the schema creation 