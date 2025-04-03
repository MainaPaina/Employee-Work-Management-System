require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

// Regular client (with RLS restrictions)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdminUser() {
  try {
    // First check if admin user already exists in Auth
    console.log('Checking if admin user already exists...');
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError.message);
      return;
    }

    const existingAuthUser = authUsers.users.find(user => user.email === 'admin@example.com');
    let userId;

    if (existingAuthUser) {
      console.log('Admin user already exists in Auth with ID:', existingAuthUser.id);
      userId = existingAuthUser.id;

      // Update password just in case
      console.log('Updating admin password...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: 'admin123' }
      );

      if (updateError) {
        console.error('Error updating admin password:', updateError.message);
      } else {
        console.log('Admin password updated successfully');
      }
    } else {
      // Create new admin user in Auth
      console.log('Creating new admin user in Supabase Auth...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@example.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: { name: 'Administrator', role: 'admin' }
      });

      if (authError) {
        console.error('Error creating user in Supabase Auth:', authError.message);
        return;
      }

      console.log('User created in Supabase Auth with ID:', authData.user.id);
      userId = authData.user.id;
    }

    // Check if user profile already exists
    console.log('Checking if admin profile exists in users table...');
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .maybeSingle();

    if (profileCheckError) {
      console.error('Error checking for existing profile:', profileCheckError.message);
      return;
    }

    if (existingProfile) {
      console.log('Admin profile already exists in users table:', existingProfile);

      // Update the profile to ensure it's linked to the auth user
      console.log('Updating admin profile...');
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          id: userId, // Ensure ID matches Auth user
          name: 'Administrator',
          email: 'admin@example.com',
          role: 'admin',
          active: true
        })
        .eq('username', 'admin')
        .select()
        .single();

      if (updateError) {
        console.error('Error updating admin profile:', updateError.message);
      } else {
        console.log('Admin profile updated successfully:', updatedProfile);
      }
    } else {
      // Create new profile in users table
      console.log('Creating admin profile in users table...');
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          username: 'admin',
          name: 'Administrator',
          email: 'admin@example.com',
          role: 'admin',
          active: true
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError.message);
        return;
      }

      console.log('Admin user profile created successfully:', profileData);
    }

    // Verify the user can be found by username
    console.log('\nVerifying user can be found by username...');
    const { data: userByUsername, error: usernameError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .maybeSingle();

    if (usernameError) {
      console.error('Error finding user by username:', usernameError.message);
    } else if (!userByUsername) {
      console.error('WARNING: User cannot be found by username! This may indicate an RLS issue.');
    } else {
      console.log('User successfully found by username:', userByUsername);
    }

    console.log('\nYou can now log in with:');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();
