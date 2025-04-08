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

async function checkTimesheetSchema() {
  try {
    console.log('Checking timesheet table schema...');
    
    // Try to get metadata about the timesheets table
    const { data, error } = await supabaseAdmin
      .from('timesheets')
      .select('*')
      .limit(0);
      
    if (error) {
      console.error('Error getting timesheet metadata:', error.message);
      return;
    }
    
    // Create a simple entry to see what fields are accepted
    console.log('\nTrying to create a simple timesheet entry...');
    
    const userId = '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0];
    
    const simpleEntry = {
      employee_id: userId,
      date: todayDateString,
      start_time: now.toISOString(),
      status: 'active',
      end_time: null,
      hours_worked: 0
    };
    
    const { data: newEntry, error: insertError } = await supabaseAdmin
      .from('timesheets')
      .insert([simpleEntry])
      .select();
      
    if (insertError) {
      console.error('Error creating simple entry:', insertError.message);
    } else {
      console.log('Simple entry created successfully:');
      console.log(JSON.stringify(newEntry[0], null, 2));
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTimesheetSchema();
