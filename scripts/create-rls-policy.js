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

async function createRLSPolicy() {
  try {
    console.log('Creating RLS policy for timesheets table...');
    
    // First, check if the policy already exists
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'timesheets')
      .eq('policyname', 'allow_all_operations');
      
    if (policyError) {
      console.error('Error checking for existing policy:', policyError.message);
      return;
    }
    
    if (policies && policies.length > 0) {
      console.log('Policy already exists:', policies[0]);
      return;
    }
    
    // Create a policy that allows all operations
    const { data, error } = await supabaseAdmin
      .rpc('create_rls_policy', {
        table_name: 'timesheets',
        policy_name: 'allow_all_operations',
        policy_definition: 'true',
        policy_command: 'ALL'
      });
      
    if (error) {
      console.error('Error creating policy:', error.message);
      return;
    }
    
    console.log('Policy created successfully:', data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Define the RPC function if it doesn't exist
async function createRpcFunction() {
  try {
    console.log('Creating RPC function for creating RLS policy...');
    
    const { data, error } = await supabaseAdmin
      .rpc('create_rpc_function', {
        function_name: 'create_rls_policy',
        function_definition: `
          CREATE OR REPLACE FUNCTION public.create_rls_policy(
            table_name text,
            policy_name text,
            policy_definition text,
            policy_command text
          )
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE format('CREATE POLICY %I ON %I USING (%s)', policy_name, table_name, policy_definition);
          END;
          $$;
        `
      });
      
    if (error) {
      console.error('Error creating RPC function:', error.message);
      return;
    }
    
    console.log('RPC function created successfully:', data);
    
  } catch (error) {
    console.error('Error creating RPC function:', error);
  }
}

// Run the functions
async function main() {
  await createRpcFunction();
  await createRLSPolicy();
}

main();
