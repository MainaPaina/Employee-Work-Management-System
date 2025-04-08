require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function disableRLS() {
  try {
    console.log('Disabling RLS for timesheets table using SQL...');
    
    // Execute a raw SQL query to disable RLS
    const { error } = await supabaseAdmin.sql`
      ALTER TABLE timesheets DISABLE ROW LEVEL SECURITY;
    `;
    
    if (error) {
      console.error('Error disabling RLS:', error.message);
      return;
    }
    
    console.log('RLS disabled successfully');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

disableRLS();
