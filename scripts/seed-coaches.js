// Script to seed coach data into the database
// This script executes the SQL in prisma/seed-coaches.sql

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function seedCoaches() {
  try {
    console.log('Starting coach data seeding...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../prisma/seed-coaches.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('Coach data seeded successfully!');
  } catch (err) {
    console.error('Unexpected error during seeding:', err);
    process.exit(1);
  }
}

// Run the seeding function
seedCoaches(); 