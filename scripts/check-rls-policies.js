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

async function checkRlsPolicies() {
  try {
    console.log('Checking RLS policies for users table...');
    
    // Execute a raw SQL query to get RLS policies
    const { data, error } = await supabaseAdmin.rpc('get_policies_for_table', { 
      table_name: 'users' 
    });

    if (error) {
      console.error('Error checking RLS policies:', error.message);
      
      // Try an alternative approach
      console.log('\nTrying alternative approach to check RLS...');
      const { data: rlsData, error: rlsError } = await supabaseAdmin.from('pg_policies').select('*');
      
      if (rlsError) {
        console.error('Error with alternative RLS check:', rlsError.message);
      } else {
        console.log('RLS policies found:', rlsData);
      }
      
      return;
    }

    console.log('RLS policies for users table:', data);
    
    // Check if RLS is enabled for the users table
    console.log('\nChecking if RLS is enabled for users table...');
    const { data: rlsEnabled, error: rlsError } = await supabaseAdmin.rpc('is_rls_enabled', { 
      table_name: 'users' 
    });
    
    if (rlsError) {
      console.error('Error checking if RLS is enabled:', rlsError.message);
    } else {
      console.log('RLS enabled for users table:', rlsEnabled);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Define the RPC functions if they don't exist
async function createRpcFunctions() {
  try {
    console.log('Creating RPC functions for checking RLS...');
    
    // Function to check if RLS is enabled
    const { error: createError1 } = await supabaseAdmin.rpc('create_rls_check_function');
    if (createError1) {
      console.log('Creating RLS check function manually...');
      const { error: sqlError1 } = await supabaseAdmin.sql`
        CREATE OR REPLACE FUNCTION public.is_rls_enabled(table_name text)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT relrowsecurity 
          FROM pg_class 
          WHERE oid = (table_name::regclass)::oid;
        $$;
      `;
      
      if (sqlError1) {
        console.error('Error creating is_rls_enabled function:', sqlError1.message);
      } else {
        console.log('Created is_rls_enabled function');
      }
    }
    
    // Function to get policies for a table
    const { error: createError2 } = await supabaseAdmin.rpc('create_get_policies_function');
    if (createError2) {
      console.log('Creating get_policies function manually...');
      const { error: sqlError2 } = await supabaseAdmin.sql`
        CREATE OR REPLACE FUNCTION public.get_policies_for_table(table_name text)
        RETURNS json
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT json_agg(
            json_build_object(
              'policyname', policyname,
              'tablename', tablename,
              'permissive', permissive,
              'roles', roles,
              'cmd', cmd,
              'qual', qual,
              'with_check', with_check
            )
          )
          FROM pg_policies
          WHERE tablename = table_name;
        $$;
      `;
      
      if (sqlError2) {
        console.error('Error creating get_policies_for_table function:', sqlError2.message);
      } else {
        console.log('Created get_policies_for_table function');
      }
    }
  } catch (error) {
    console.error('Error creating RPC functions:', error);
  }
}

// Run the functions
async function main() {
  await createRpcFunctions();
  await checkRlsPolicies();
}

main();
