require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  try {
    // Get username and password from command line
    const username = process.argv[2] || 'testuser';
    const password = process.argv[3] || 'password123';
    const email = `${username}@example.com`;
    
    console.log(`Creating test user with username: ${username}, email: ${email}, password: ${password}`);
    
    // Step 1: Create user in Supabase Auth
    console.log('\nStep 1: Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Error creating user in Auth:', authError.message);
      
      // Check if user already exists
      console.log('Checking if user already exists in Auth...');
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email);
      
      if (existingUser) {
        console.log('User already exists in Auth with ID:', existingUser.id);
        
        // Update password
        console.log('Updating password...');
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password: password }
        );
        
        if (updateError) {
          console.error('Error updating password:', updateError.message);
          return;
        }
        
        console.log('Password updated successfully');
        authData = { user: existingUser };
      } else {
        return;
      }
    } else {
      console.log('User created in Auth with ID:', authData.user.id);
    }
    
    // Step 2: Create user in users table
    console.log('\nStep 2: Creating user in users table...');
    
    // Check if user already exists in users table
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
      
    if (profileCheckError) {
      console.error('Error checking for existing profile:', profileCheckError.message);
    }
    
    if (existingProfile) {
      console.log('User already exists in users table with ID:', existingProfile.id);
      
      // Update profile
      console.log('Updating user profile...');
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          id: authData.user.id,
          email: email,
          name: username,
          active: true
        })
        .eq('username', username)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating profile:', updateError.message);
      } else {
        console.log('Profile updated successfully:', updatedProfile);
      }
    } else {
      // Create new profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          username: username,
          email: email,
          name: username,
          role: 'user',
          active: true
        })
        .select()
        .single();
        
      if (profileError) {
        console.error('Error creating profile:', profileError.message);
      } else {
        console.log('Profile created successfully:', profileData);
      }
    }
    
    // Step 3: Test login
    console.log('\nStep 3: Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (loginError) {
      console.error('Login test failed:', loginError.message);
    } else {
      console.log('Login test successful!');
      console.log('Login response:', {
        user: {
          id: loginData.user.id,
          email: loginData.user.email
        },
        session: {
          expires_at: loginData.session.expires_at
        }
      });
    }
    
    console.log('\nUser creation completed. You can now log in with:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();
