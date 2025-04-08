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
    console.log('Checking timesheet schema...');
    
    // Get a sample timesheet entry
    const { data: sampleEntry, error: fetchError } = await supabaseAdmin
      .from('timesheets')
      .select('*')
      .limit(1)
      .single();
      
    if (fetchError) {
      console.error('Error fetching timesheet entry:', fetchError.message);
      return;
    }
    
    if (!sampleEntry) {
      console.log('No timesheet entries found.');
      return;
    }
    
    console.log('Sample timesheet entry:');
    console.log(sampleEntry);
    
    // List all columns in the entry
    console.log('\nColumns in the timesheet table:');
    Object.keys(sampleEntry).forEach(column => {
      console.log(`- ${column}: ${typeof sampleEntry[column]} (${sampleEntry[column] === null ? 'null' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTimesheetSchema();
