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

async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...');
    
    // Get list of tables
    console.log('\nGetting list of tables...');
    const { data: tables, error: tablesError } = await supabaseAdmin.from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.error('Error getting tables:', tablesError.message);
    } else {
      console.log('Tables in public schema:', tables.map(t => t.table_name));
    }
    
    // Check users table schema
    console.log('\nChecking users table schema...');
    const { data: columns, error: columnsError } = await supabaseAdmin.from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');
      
    if (columnsError) {
      console.error('Error getting users table schema:', columnsError.message);
    } else {
      console.log('Users table columns:');
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
    }
    
    // Check if users table has any rows
    console.log('\nChecking if users table has any rows...');
    const { data: userCount, error: countError } = await supabaseAdmin.from('users')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error counting users:', countError.message);
    } else {
      console.log(`Users table has ${userCount.count} rows`);
    }
    
    // Check auth.users table
    console.log('\nChecking auth.users table...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing auth users:', authError.message);
    } else {
      console.log(`Auth.users table has ${authUsers.users.length} rows`);
      if (authUsers.users.length > 0) {
        console.log('Sample auth user:', {
          id: authUsers.users[0].id,
          email: authUsers.users[0].email,
          created_at: authUsers.users[0].created_at
        });
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabaseSchema();
