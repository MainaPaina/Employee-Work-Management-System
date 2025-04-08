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
    console.log('Disabling RLS for timesheets table...');
    
    // Execute a raw SQL query to disable RLS
    const { error } = await supabaseAdmin.rpc('disable_rls_for_table', { 
      table_name: 'timesheets' 
    });

    if (error) {
      console.error('Error disabling RLS:', error.message);
      
      // Try an alternative approach
      console.log('\nTrying alternative approach to disable RLS...');
      const { error: sqlError } = await supabaseAdmin.sql`
        ALTER TABLE timesheets DISABLE ROW LEVEL SECURITY;
      `;
      
      if (sqlError) {
        console.error('Error with alternative approach:', sqlError.message);
      } else {
        console.log('RLS disabled successfully using SQL');
      }
      
      return;
    }

    console.log('RLS disabled successfully');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Define the RPC function if it doesn't exist
async function createRpcFunction() {
  try {
    console.log('Creating RPC function for disabling RLS...');
    
    const { error: sqlError } = await supabaseAdmin.sql`
      CREATE OR REPLACE FUNCTION public.disable_rls_for_table(table_name text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
      END;
      $$;
    `;
    
    if (sqlError) {
      console.error('Error creating disable_rls_for_table function:', sqlError.message);
    } else {
      console.log('Created disable_rls_for_table function');
    }
  } catch (error) {
    console.error('Error creating RPC function:', error);
  }
}

// Run the functions
async function main() {
  await createRpcFunction();
  await disableRLS();
}

main();
