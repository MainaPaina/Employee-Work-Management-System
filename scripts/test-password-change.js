require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

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

// Function to create a test JWT token
function createTestToken(userId = '65191d1a-cc00-44b8-9dd3-0eb6c494164c') {
  const payload = {
    "UserInfo": {
      "id": userId,
      "username": "testuser",
      "role": "employee"
    }
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not found in environment variables');
    return null;
  }

  try {
    const token = jwt.sign(
      payload,
      secret,
      { expiresIn: '1d' }
    );
    return token;
  } catch (error) {
    console.error('Error creating token:', error);
    return null;
  }
}

async function testPasswordChange() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '65191d1a-cc00-44b8-9dd3-0eb6c494164c';
    const currentPassword = process.argv[3] || 'newpassword';
    const newPassword = process.argv[4] || 'oldpassword';

    console.log(`Testing password change for user ID: ${userId}`);
    console.log(`Current password: ${currentPassword}`);
    console.log(`New password: ${newPassword}`);

    // Create a test token
    const token = createTestToken(userId);
    if (!token) {
      console.error('Failed to create test token');
      return;
    }

    console.log('Test token created successfully');

    // Test the password change endpoint
    console.log('\nTesting /profile/api/change-password endpoint...');
    try {
      const response = await fetch('http://localhost:3005/profile/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      console.log('Password change response status:', response.status);

      let responseText;
      try {
        responseText = await response.text();
        console.log('Response text:', responseText);

        try {
          const data = JSON.parse(responseText);
          console.log('Password change response data:', JSON.stringify(data, null, 2));
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError.message);
        }
      } catch (textError) {
        console.error('Error reading response text:', textError.message);
        return;
      }

      // Test login with new password
      console.log('\nTesting login with new password...');

      // Try to sign in with the new password
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: 'testuser@example.com',
        password: newPassword
      });

      if (signInError) {
        console.error('Login with new password failed:', signInError.message);
      } else {
        console.log('Login with new password successful:', signInData ? 'User authenticated' : 'No data returned');
      }

      // Try to sign in with the old password
      const { data: oldSignInData, error: oldSignInError } = await supabaseAdmin.auth.signInWithPassword({
        email: 'testuser@example.com',
        password: currentPassword
      });

      if (oldSignInError) {
        console.log('Login with old password failed (expected):', oldSignInError.message);
      } else {
        console.error('Login with old password still works (unexpected):', oldSignInData ? 'User authenticated' : 'No data returned');
      }
    } catch (error) {
      console.error('Error testing password change endpoint:', error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testPasswordChange();
