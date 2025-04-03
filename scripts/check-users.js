require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

// Regular client (with RLS restrictions)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses RLS)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

async function checkUsers() {
  try {
    console.log('Checking users with regular client (respects RLS)...');
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error.message);
    } else {
      console.log('Users found (via regular client):', users.length);
      console.log(JSON.stringify(users, null, 2));
    }

    // If admin client is available, use it to bypass RLS
    if (supabaseAdmin) {
      console.log('\nChecking users with admin client (bypasses RLS)...');
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from('users')
        .select('*');

      if (adminError) {
        console.error('Error fetching users with admin client:', adminError.message);
      } else {
        console.log('Users found (via admin client):', adminUsers.length);
        console.log(JSON.stringify(adminUsers, null, 2));
      }
    } else {
      console.log('\nAdmin client not available - cannot bypass RLS');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkUsers();
