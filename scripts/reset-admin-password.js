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

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    // 1. Get the admin user from the users table
    console.log('Getting admin user from users table...');
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();
      
    if (adminError) {
      console.error('Error getting admin user:', adminError.message);
      return;
    }
    
    console.log('Found admin user in users table:', adminUser);
    
    // 2. Check if there's an auth user with the same ID
    console.log('Checking for auth user with ID:', adminUser.id);
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers.users.find(user => user.id === adminUser.id);
    
    if (existingAuthUser) {
      console.log('Found auth user with matching ID:', existingAuthUser.id);
      
      // 3. Update the password
      console.log('Updating password...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        { password: 'admin123' }
      );
      
      if (updateError) {
        console.error('Error updating password:', updateError.message);
        return;
      }
      
      console.log('Password updated successfully');
      console.log('\nYou can now log in with:');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('No auth user found with matching ID. Checking by email...');
      
      // Check if there's an auth user with the same email
      const authUserByEmail = authUsers.users.find(user => user.email === adminUser.email);
      
      if (authUserByEmail) {
        console.log('Found auth user with matching email:', authUserByEmail.id);
        
        // Update the password
        console.log('Updating password...');
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUserByEmail.id,
          { password: 'admin123' }
        );
        
        if (updateError) {
          console.error('Error updating password:', updateError.message);
          return;
        }
        
        console.log('Password updated successfully');
        console.log('\nYou can now log in with:');
        console.log('Username: admin');
        console.log('Password: admin123');
      } else {
        console.log('No auth user found with matching email. Creating new auth user...');
        
        // Create a new auth user
        const { data: newAuthUser, error: newAuthError } = await supabaseAdmin.auth.admin.createUser({
          id: adminUser.id, // Try to use the same ID
          email: adminUser.email,
          password: 'admin123',
          email_confirm: true,
          user_metadata: { role: 'admin' }
        });
        
        if (newAuthError) {
          console.error('Error creating new auth user:', newAuthError.message);
          return;
        }
        
        console.log('Created new auth user with ID:', newAuthUser.user.id);
        console.log('\nYou can now log in with:');
        console.log('Username: admin');
        console.log('Password: admin123');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetAdminPassword();
