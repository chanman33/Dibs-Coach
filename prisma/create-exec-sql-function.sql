-- Create a function to execute arbitrary SQL (for development purposes only)
-- WARNING: This function should only be used in development environments
-- as it allows execution of arbitrary SQL which is a security risk in production

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS exec_sql(text);

-- Create the function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Comment on the function to warn about security implications
COMMENT ON FUNCTION exec_sql(text) IS 'WARNING: This function executes arbitrary SQL. It should only be used in development environments.'; 