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

async function testClockInOutAdmin() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    const action = process.argv[3] || 'in'; // 'in' or 'out'
    
    console.log(`Testing direct clock-${action} for user ID:`, userId);
    
    // Get current date
    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0];
    
    console.log('Today\'s date:', todayDateString);
    
    if (action === 'in') {
      // Clock in
      await clockIn(userId, todayDateString, now);
    } else if (action === 'out') {
      // Clock out
      await clockOut(userId, now);
    } else {
      console.error('Invalid action. Use "in" or "out".');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function clockIn(userId, todayDateString, now) {
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
}

async function clockOut(userId, now) {
  // Find the active entry
  console.log('Finding active entry...');
  const { data: activeEntries, error: activeError } = await supabaseAdmin
    .from('timesheets')
    .select('*')
    .eq('employee_id', userId)
    .is('end_time', null)
    .order('start_time', { ascending: false });
    
  if (activeError) {
    console.error('Error finding active entry:', activeError.message);
    return;
  }
  
  if (!activeEntries || activeEntries.length === 0) {
    console.log('No active entry found. Not clocked in.');
    return;
  }
  
  // Use the most recent active entry
  const activeEntry = activeEntries[0];
  console.log('Found active entry:', activeEntry);
  
  // Calculate hours worked
  const startTime = new Date(activeEntry.start_time);
  const endTime = now;
  const hoursWorked = (endTime - startTime) / (1000 * 60 * 60); // Convert milliseconds to hours
  
  console.log('Start time:', startTime);
  console.log('End time:', endTime);
  console.log('Hours worked:', hoursWorked);
  
  // Update the entry
  console.log('Updating entry...');
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

testClockInOutAdmin();
