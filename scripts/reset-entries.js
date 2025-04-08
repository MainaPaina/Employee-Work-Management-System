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

async function resetEntries() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    
    console.log('Resetting entries for user ID:', userId);
    
    // Get current date
    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0];
    
    console.log('Today\'s date:', todayDateString);
    
    // Delete all entries for today
    console.log('Deleting all entries for today...');
    const { data: deleteData, error: deleteError } = await supabaseAdmin
      .from('timesheets')
      .delete()
      .eq('employee_id', userId)
      .eq('date', todayDateString);
      
    if (deleteError) {
      console.error('Error deleting entries:', deleteError.message);
      return;
    }
    
    console.log('Entries deleted successfully');
    
    // Create a new entry
    console.log('Creating new timesheet entry...');
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
    } else {
      console.log('New entry created successfully:', newEntry);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetEntries();
