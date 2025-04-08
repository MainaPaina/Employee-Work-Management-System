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

async function enableRLSWithPolicy() {
  try {
    console.log('Enabling RLS for timesheets table and creating policy...');

    // Create RPC function to enable RLS
    const { error: createRpcError } = await supabaseAdmin.rpc('create_enable_rls_function');
    if (createRpcError) {
      console.log('Creating enable_rls function manually...');
      const { error: sqlError1 } = await supabaseAdmin.from('_sql').select('*').eq('query', `
        CREATE OR REPLACE FUNCTION public.enable_rls_for_table(table_name text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        END;
        $$;
      `);

      if (sqlError1) {
        console.error('Error creating enable_rls_for_table function:', sqlError1.message);
      } else {
        console.log('Created enable_rls_for_table function');
      }
    }

    // Create RPC function to create policy
    const { error: createPolicyRpcError } = await supabaseAdmin.rpc('create_policy_function');
    if (createPolicyRpcError) {
      console.log('Creating create_policy function manually...');
      const { error: sqlError2 } = await supabaseAdmin.from('_sql').select('*').eq('query', `
        CREATE OR REPLACE FUNCTION public.create_policy_for_table(table_name text, policy_name text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
          EXECUTE format('CREATE POLICY %I ON %I USING (true) WITH CHECK (true)', policy_name, table_name);
        END;
        $$;
      `);

      if (sqlError2) {
        console.error('Error creating create_policy_for_table function:', sqlError2.message);
      } else {
        console.log('Created create_policy_for_table function');
      }
    }

    // Enable RLS on the timesheets table
    const { error: enableError } = await supabaseAdmin.rpc('enable_rls_for_table', {
      table_name: 'timesheets'
    });

    if (enableError) {
      console.error('Error enabling RLS:', enableError.message);
      return;
    }

    console.log('RLS enabled on timesheets table');

    // Create a policy that allows all operations
    const { error: createError } = await supabaseAdmin.rpc('create_policy_for_table', {
      table_name: 'timesheets',
      policy_name: 'allow_all_operations'
    });

    if (createError) {
      console.error('Error creating policy:', createError.message);
      return;
    }

    console.log('Created policy allow_all_operations');
    console.log('RLS enabled with policy successfully');

  } catch (error) {
    console.error('Error enabling RLS with policy:', error.message);
  }
}

enableRLSWithPolicy();
