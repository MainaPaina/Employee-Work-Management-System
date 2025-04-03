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

async function fixAdminUser() {
  try {
    console.log('Fixing admin user...');
    
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
    
    // 2. Check if there's an auth user with the same email
    console.log('Checking for auth user with email:', adminUser.email);
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers.users.find(user => user.email === adminUser.email);
    
    if (existingAuthUser) {
      console.log('Found auth user with matching email:', existingAuthUser.id);
      
      // 3. Create a new auth user with the correct ID
      console.log('Creating new auth user with ID matching the users table...');
      
      // First, create a temporary user
      const tempEmail = `temp-${Date.now()}@example.com`;
      const tempPassword = 'TempPassword123!';
      
      const { data: tempUser, error: tempError } = await supabaseAdmin.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true
      });
      
      if (tempError) {
        console.error('Error creating temporary user:', tempError.message);
        return;
      }
      
      console.log('Created temporary user with ID:', tempUser.user.id);
      
      // 4. Update the users table to use the temporary user ID
      console.log('Updating users table to use temporary user ID...');
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ id: tempUser.user.id })
        .eq('id', adminUser.id);
        
      if (updateError) {
        console.error('Error updating users table:', updateError.message);
        return;
      }
      
      console.log('Updated users table successfully');
      
      // 5. Delete the original auth user
      console.log('Deleting original auth user...');
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
        existingAuthUser.id
      );
      
      if (deleteError) {
        console.error('Error deleting original auth user:', deleteError.message);
      } else {
        console.log('Deleted original auth user successfully');
      }
      
      // 6. Create a new auth user with the admin email
      console.log('Creating new auth user with admin email...');
      const { data: newAuthUser, error: newAuthError } = await supabaseAdmin.auth.admin.createUser({
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
      
      // 7. Update the users table to use the new auth user ID
      console.log('Updating users table to use new auth user ID...');
      const { error: finalUpdateError } = await supabaseAdmin
        .from('users')
        .update({ id: newAuthUser.user.id })
        .eq('id', tempUser.user.id);
        
      if (finalUpdateError) {
        console.error('Error updating users table:', finalUpdateError.message);
        return;
      }
      
      console.log('Updated users table successfully');
      
      // 8. Delete the temporary auth user
      console.log('Deleting temporary auth user...');
      const { error: tempDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        tempUser.user.id
      );
      
      if (tempDeleteError) {
        console.error('Error deleting temporary auth user:', tempDeleteError.message);
      } else {
        console.log('Deleted temporary auth user successfully');
      }
      
      console.log('\nAdmin user fixed successfully!');
      console.log('You can now log in with:');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      // If no auth user with matching email, create one
      console.log('No auth user found with matching email. Creating new auth user...');
      const { data: newAuthUser, error: newAuthError } = await supabaseAdmin.auth.admin.createUser({
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
      
      // Update the users table to use the new auth user ID
      console.log('Updating users table to use new auth user ID...');
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ id: newAuthUser.user.id })
        .eq('id', adminUser.id);
        
      if (updateError) {
        console.error('Error updating users table:', updateError.message);
        return;
      }
      
      console.log('Updated users table successfully');
      
      console.log('\nAdmin user created successfully!');
      console.log('You can now log in with:');
      console.log('Username: admin');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixAdminUser();
