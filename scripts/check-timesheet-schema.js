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
    
    // Get columns for the timesheets table
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'timesheets');
      
    if (columnsError) {
      console.error('Error getting timesheet schema:', columnsError.message);
      return;
    }
    
    console.log('Timesheet table columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Get sample data from the timesheets table
    console.log('\nGetting sample data from timesheets table...');
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('timesheets')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error getting sample data:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('Sample timesheet entry:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('No data found in timesheets table');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTimesheetSchema();
