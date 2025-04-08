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

async function checkEntries() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    
    console.log('Checking entries for user ID:', userId);
    
    // Get current date
    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0];
    
    console.log('Today\'s date:', todayDateString);
    
    // Check all entries for the user
    console.log('Checking all entries for the user...');
    const { data: allEntries, error: allError } = await supabaseAdmin
      .from('timesheets')
      .select('*')
      .eq('employee_id', userId)
      .order('date', { ascending: false });
      
    if (allError) {
      console.error('Error checking all entries:', allError.message);
      return;
    }
    
    console.log('All entries for the user:');
    allEntries.forEach(entry => {
      console.log(`- ${entry.date}: ${entry.status}, start: ${entry.start_time}, end: ${entry.end_time}`);
    });
    
    // Check entries for today
    console.log('\nChecking entries for today...');
    const { data: todayEntries, error: todayError } = await supabaseAdmin
      .from('timesheets')
      .select('*')
      .eq('employee_id', userId)
      .eq('date', todayDateString);
      
    if (todayError) {
      console.error('Error checking today\'s entries:', todayError.message);
      return;
    }
    
    if (todayEntries.length === 0) {
      console.log('No entries found for today');
    } else {
      console.log('Entries for today:');
      todayEntries.forEach(entry => {
        console.log(`- ${entry.id}: ${entry.status}, start: ${entry.start_time}, end: ${entry.end_time}`);
      });
      
      // If there are entries for today, update them to be completed
      console.log('\nUpdating today\'s entries to be completed...');
      for (const entry of todayEntries) {
        if (entry.end_time === null) {
          const { data: updatedEntry, error: updateError } = await supabaseAdmin
            .from('timesheets')
            .update({
              status: 'completed',
              end_time: now.toISOString(),
              hours_worked: entry.hours_worked || 0
            })
            .eq('id', entry.id)
            .select()
            .single();
            
          if (updateError) {
            console.error(`Error updating entry ${entry.id}:`, updateError.message);
          } else {
            console.log(`Entry ${entry.id} updated successfully:`, updatedEntry);
          }
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkEntries();
