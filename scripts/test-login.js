require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const User = require('../model/User');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(username, password) {
  try {
    console.log(`Testing login with username: ${username}, password: ${password}`);
    
    // Step 1: Find user by username (same as in our login route)
    console.log('\nStep 1: Finding user by username...');
    const userData = await User.findByUsername(username);
    
    if (!userData) {
      console.error('No user found with this username');
      return;
    }
    
    console.log('User found:', userData);
    
    // Step 2: Try to authenticate with Supabase using the email
    console.log('\nStep 2: Authenticating with Supabase...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: password,
    });
    
    if (authError) {
      console.error('Authentication failed:', authError.message);
      return;
    }
    
    console.log('Authentication successful!');
    console.log('Auth data:', {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: authData.user.user_metadata?.role
      },
      session: {
        expires_at: authData.session?.expires_at
      }
    });
    
    console.log('\nLogin test completed successfully!');
  } catch (error) {
    console.error('Unexpected error during login test:', error);
  }
}

// Get username and password from command line arguments
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

testLogin(username, password);
