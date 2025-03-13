# Lead Management Seed Scripts

This directory contains scripts to seed the EnterpriseLeads table with mock data for development purposes.

## Prerequisites

Before running these scripts, make sure you have:

1. Set up your environment variables in `.env`:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service key (with write access)

   Note: If your `.env` file uses variable references like `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`, 
   make sure the base variables (`SUPABASE_URL`) are properly defined.

2. Installed the required dependencies:
   ```bash
   yarn add @supabase/supabase-js dotenv ulid
   ```

## Available Scripts

### Option 1: Direct Insertion (Recommended)

This script directly inserts mock data using the Supabase client:

```bash
# Using yarn
yarn seed-leads

# Or directly with Node
node scripts/seed-leads-direct.js
```

This is the simplest approach and doesn't require any database setup.

### Option 2: SQL Execution

This approach uses a SQL file to insert the data:

1. First, create the `exec_sql` function in your Supabase database:
   ```bash
   # Connect to your database and run:
   psql -d your_database_name -f prisma/create-exec-sql-function.sql
   
   # Or copy the contents of prisma/create-exec-sql-function.sql and run it in the Supabase SQL editor
   ```

2. Then run the seed script:
   ```bash
   # Using yarn
   yarn seed-leads:sql
   
   # Or directly with Node
   node scripts/seed-leads.js
   ```

## Troubleshooting

If you encounter an error like `TypeError: Invalid URL` with input containing `${SUPABASE_URL}`, it means your environment variables aren't being resolved correctly. Make sure your `.env` file has the actual URL values set for `SUPABASE_URL`.

## Security Warning

The `exec_sql` function allows execution of arbitrary SQL, which is a security risk. It should only be used in development environments, never in production.

## Mock Data

The mock data includes leads in various stages of the sales pipeline:
- NEW
- CONTACTED
- QUALIFIED
- PROPOSAL
- NEGOTIATION
- WON
- LOST
- ARCHIVED

Each lead has realistic information including:
- Company details
- Contact information
- Status and priority
- Notes and follow-up dates

## Customizing the Data

To add more leads or modify the existing ones:
- For Option 1: Edit the `mockLeads` array in `scripts/seed-leads-direct.js`
- For Option 2: Edit the SQL statements in `prisma/seed-leads.sql` 