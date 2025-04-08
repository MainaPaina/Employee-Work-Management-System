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

async function testClockIn() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    
    console.log('Testing clock-in for user ID:', userId);
    
    // Get current date
    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0];
    
    console.log('Today\'s date:', todayDateString);
    
    // Check if there's already an entry for today
    console.log('Checking for existing entry...');
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
        last_break_start_time: null,
        total_unavailable_duration: 0,
        last_unavailable_start_time: null
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
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testClockIn();
