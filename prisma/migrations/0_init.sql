-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ULID generation function
CREATE OR REPLACE FUNCTION generate_ulid() 
RETURNS text 
LANGUAGE plpgsql 
AS $$
DECLARE
  -- Crockford's Base32
  encoding   BYTEA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  timestamp  BYTEA = E'\\000\\000\\000\\000\\000\\000';
  output     TEXT = '';
  unix_time  BIGINT;
  ulid       BYTEA;
BEGIN
  -- 6 timestamp bytes
  unix_time = (extract(epoch from clock_timestamp()) * 1000)::BIGINT;
  timestamp = SET_BYTE(timestamp, 0, (unix_time >> 40)::INTEGER);
  timestamp = SET_BYTE(timestamp, 1, ((unix_time >> 32) & 255)::INTEGER);
  timestamp = SET_BYTE(timestamp, 2, ((unix_time >> 24) & 255)::INTEGER);
  timestamp = SET_BYTE(timestamp, 3, ((unix_time >> 16) & 255)::INTEGER);
  timestamp = SET_BYTE(timestamp, 4, ((unix_time >> 8) & 255)::INTEGER);
  timestamp = SET_BYTE(timestamp, 5, (unix_time & 255)::INTEGER);
  
  -- 10 random bytes
  ulid = timestamp || gen_random_bytes(10);
  
  -- Encode as base32
  FOR i IN 0..25 LOOP
    output = output || CHR(GET_BYTE(encoding, (GET_BYTE(ulid, i/2) >> CASE WHEN i % 2 = 0 THEN 3 ELSE -2 END) & 31));
  END LOOP;
  
  RETURN output;
END;
$$;

-- Let Prisma create the rest of the schema 