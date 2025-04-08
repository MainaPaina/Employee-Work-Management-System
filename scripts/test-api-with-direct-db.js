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
function createTestToken(userId = '24cb7904-c0fa-4d20-8c11-b58b8daa3189') {
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

async function testApiWithDirectDb() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    const action = process.argv[3] || 'in'; // 'in' or 'out'

    console.log(`Testing API ${action} with direct DB for user ID:`, userId);

    // Create a test token
    const token = createTestToken(userId);
    if (!token) {
      console.error('Failed to create test token');
      return;
    }

    console.log('Test token created successfully');

    // Get current date
    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0];

    if (action === 'in') {
      // First, delete any existing entries for today
      console.log('Deleting existing entries for today...');
      const { error: deleteError } = await supabaseAdmin
        .from('timesheets')
        .delete()
        .eq('employee_id', userId)
        .eq('date', todayDateString);

      if (deleteError) {
        console.error('Error deleting existing entries:', deleteError.message);
        return;
      }

      console.log('Existing entries deleted successfully');

      // Test the status endpoint
      console.log('\nTesting /api/status endpoint...');
      try {
        const statusResponse = await fetch('http://localhost:3005/api/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Status response status:', statusResponse.status);
        const statusData = await statusResponse.json();
        console.log('Status response data:', JSON.stringify(statusData, null, 2));
      } catch (error) {
        console.error('Error testing status endpoint:', error);
      }

      // Create a new entry directly in the database
      console.log('\nCreating new timesheet entry directly in the database...');
      const newEntryData = {
        employee_id: userId,
        date: todayDateString,
        start_time: now.toISOString(),
        status: 'active',
        end_time: null,
        hours_worked: 0,
        total_break_duration: 0,
        total_unavailable_duration: 0
      };

      const { data: newEntry, error: insertError } = await supabaseAdmin
        .from('timesheets')
        .insert([newEntryData])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating new entry:', insertError.message);
        return;
      }

      console.log('New entry created successfully:', newEntry);

      // Test the status endpoint again
      console.log('\nTesting /api/status endpoint again...');
      try {
        const statusResponse = await fetch('http://localhost:3005/api/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Status response status:', statusResponse.status);
        const statusData = await statusResponse.json();
        console.log('Status response data:', JSON.stringify(statusData, null, 2));
      } catch (error) {
        console.error('Error testing status endpoint:', error);
      }
    } else if (action === 'out') {
      // First, delete any existing entries for today
      console.log('Deleting existing entries for today...');
      const { error: deleteError } = await supabaseAdmin
        .from('timesheets')
        .delete()
        .eq('employee_id', userId)
        .eq('date', todayDateString);

      if (deleteError) {
        console.error('Error deleting existing entries:', deleteError.message);
        return;
      }

      console.log('Existing entries deleted successfully');

      // Create an active entry
      console.log('Creating an active entry directly in the database...');
      const { data: newEntry, error: insertError } = await supabaseAdmin
        .from('timesheets')
        .insert([{
          employee_id: userId,
          date: todayDateString,
          start_time: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
          status: 'active',
          end_time: null,
          hours_worked: 0,
          total_break_duration: 0,
          total_unavailable_duration: 0
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating active entry:', insertError.message);
        return;
      }

      console.log('Active entry created successfully:', newEntry);

      // Test the status endpoint
      console.log('\nTesting /api/status endpoint...');
      try {
        const statusResponse = await fetch('http://localhost:3005/api/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Status response status:', statusResponse.status);
        const statusData = await statusResponse.json();
        console.log('Status response data:', JSON.stringify(statusData, null, 2));
      } catch (error) {
        console.error('Error testing status endpoint:', error);
      }

      // Test the clock-out endpoint
      console.log('\nTesting /api/clock-out endpoint...');
      try {
        const clockOutResponse = await fetch('http://localhost:3005/api/clock-out', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Clock-out response status:', clockOutResponse.status);
        const clockOutData = await clockOutResponse.json();
        console.log('Clock-out response data:', JSON.stringify(clockOutData, null, 2));
      } catch (error) {
        console.error('Error testing clock-out endpoint:', error);
      }
    } else {
      console.error('Invalid action. Use "in" or "out".');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testApiWithDirectDb();
