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

async function testClockInDirect() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    
    console.log('Testing direct clock-in for user ID:', userId);
    
    // Get current date
    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0];
    
    console.log('Today\'s date:', todayDateString);
    
    // Check if there's already an active entry
    console.log('Checking for active entry...');
    const { data: activeEntries, error: activeError } = await supabaseAdmin
      .from('timesheets')
      .select('*')
      .eq('employee_id', userId)
      .is('end_time', null);
      
    if (activeError) {
      console.error('Error checking for active entry:', activeError.message);
      return;
    }
    
    if (activeEntries && activeEntries.length > 0) {
      console.log('Already clocked in:', activeEntries[0]);
      
      // Update the active entry to be inactive
      console.log('Clocking out the active entry...');
      const activeEntry = activeEntries[0];
      const endTime = now;
      const hoursWorked = (endTime - new Date(activeEntry.start_time)) / (1000 * 60 * 60); // Convert milliseconds to hours
      
      const { data: updatedEntry, error: updateError } = await supabaseAdmin
        .from('timesheets')
        .update({
          status: 'completed',
          end_time: endTime.toISOString(),
          hours_worked: activeEntry.hours_worked + hoursWorked
        })
        .eq('id', activeEntry.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating entry:', updateError.message);
      } else {
        console.log('Entry updated successfully:', updatedEntry);
      }
    }
    
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

testClockInDirect();
