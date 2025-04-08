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

async function testClockInOut() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    const action = process.argv[3] || 'in'; // 'in' or 'out'

    console.log(`Testing clock-${action} for user ID:`, userId);

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
    return;
  }

  // Check if there's already an entry for today
  console.log('Checking for existing entry for today...');
  const { data: existingEntry, error: checkError } = await supabaseAdmin
    .from('timesheets')
    .select('*')
    .eq('employee_id', userId)
    .eq('date', todayDateString)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking for existing entry:', checkError.message);
    return;
  }

  if (existingEntry) {
    console.log('Found existing entry for today:', existingEntry);

    // If the entry is not active, update it
    if (existingEntry.status !== 'active' && existingEntry.end_time !== null) {
      console.log('Reactivating existing entry...');

      const { data: updatedEntry, error: updateError } = await supabaseAdmin
        .from('timesheets')
        .update({
          status: 'active',
          start_time: now.toISOString(),
          end_time: null
        })
        .eq('id', existingEntry.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating entry:', updateError.message);
      } else {
        console.log('Entry updated successfully:', updatedEntry);
      }
    } else {
      console.log('Entry is already active');
    }
  } else {
    console.log('No existing entry found, creating new entry...');

    // Create a new entry
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

testClockInOut();
