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

async function checkUsersTable() {
  try {
    console.log('Checking users table...');

    // Skip table schema check

    // Get all users
    console.log('\nAll users:');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error getting users:', usersError.message);
      return;
    }

    users.forEach(user => {
      console.log(`- ${user.id}: ${user.username} (${user.email})`);
    });

    // Get auth users
    console.log('\nAuth users:');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error getting auth users:', authError.message);
      return;
    }

    authUsers.users.forEach(user => {
      console.log(`- ${user.id}: ${user.email}`);
    });
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkUsersTable();
