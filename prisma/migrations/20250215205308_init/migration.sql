-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ULID generation function
CREATE OR REPLACE FUNCTION generate_ulid() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Crockford's Base32 for encoding
    encoding   CHAR(32) := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    timestamp  BIGINT;
    output     TEXT := '';
    ulid       BYTEA;
    byte       INTEGER;
    value      INTEGER;
BEGIN
    -- Get current timestamp in milliseconds
    timestamp := (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT;
    
    -- Convert timestamp to Base32 (10 chars)
    FOR i IN REVERSE 9..0 LOOP
        output := output || substr(encoding, 1 + (timestamp >> (i * 5) & 31)::integer, 1);
    END LOOP;
    
    -- Generate 16 random bytes using pgcrypto
    ulid := gen_random_bytes(10);
    
    -- Convert random bytes to Base32 (16 chars)
    FOR i IN 0..9 LOOP
        byte := get_byte(ulid, i);
        -- Handle first byte specially to ensure it doesn't overflow base32
        IF i = 0 THEN
            value := (byte & 224) >> 5; -- Take first 3 bits
            output := output || substr(encoding, value + 1, 1);
            value := byte & 31; -- Take last 5 bits
            output := output || substr(encoding, value + 1, 1);
        ELSE
            value := (byte & 248) >> 3; -- Take first 5 bits
            output := output || substr(encoding, value + 1, 1);
            -- If this is not the last byte, take last 3 bits and first 2 bits of next byte
            IF i < 9 THEN
                value := ((byte & 7) << 2) | ((get_byte(ulid, i + 1) & 192) >> 6);
                output := output || substr(encoding, value + 1, 1);
            ELSE
                -- For last byte, just take last 3 bits
                value := byte & 7;
                output := output || substr(encoding, value + 1, 1);
            END IF;
        END IF;
    END LOOP;

    RETURN output;
END;
$$;

-- Create schema 