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

// Regular client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Anon Key:', supabaseAnonKey ? '[Set]' : '[Not Set]');
    console.log('Supabase Service Key:', supabaseServiceKey ? '[Set]' : '[Not Set]');
    
    // Test regular client
    console.log('\nTesting regular client connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Response:', data);
    }
    
    // Test admin client if available
    if (supabaseAdmin) {
      console.log('\nTesting admin client connection...');
      const { data: adminData, error: adminError } = await supabaseAdmin.from('users').select('count').limit(1);
      
      if (adminError) {
        console.error('Error connecting with admin client:', adminError.message);
        console.error('Error details:', adminError);
      } else {
        console.log('Successfully connected with admin client!');
        console.log('Response:', adminData);
      }
      
      // List all Supabase Auth users
      console.log('\nListing all Supabase Auth users...');
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error listing auth users:', authError.message);
      } else {
        console.log('Auth users count:', authUsers.users.length);
        console.log('Auth users:', JSON.stringify(authUsers.users.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at
        })), null, 2));
      }
    } else {
      console.log('\nSkipping admin client tests - service key not available');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
