#!/usr/bin/env node

/**
 * This script seeds the EnterpriseLeads table with mock data for development purposes.
 * It uses the Supabase client to execute the SQL in the seed-leads.sql file.
 * 
 * Usage:
 * node scripts/seed-leads.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Handle the case where NEXT_PUBLIC_SUPABASE_URL references SUPABASE_URL
if (supabaseUrl && supabaseUrl.includes('${SUPABASE_URL}')) {
  supabaseUrl = process.env.SUPABASE_URL;
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedLeads() {
  try {
    console.log('Reading SQL seed file...');
    const sqlFilePath = path.join(__dirname, '..', 'prisma', 'seed-leads.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL seed file...');
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      throw error;
    }

    console.log('✅ Successfully seeded EnterpriseLeads table with mock data!');
  } catch (error) {
    console.error('Error seeding leads:', error);
    process.exit(1);
  }
}

seedLeads(); 