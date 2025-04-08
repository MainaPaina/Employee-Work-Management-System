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

async function fixBreakStatus() {
  try {
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    console.log(`Fixing break status for user ID: ${userId}`);
    
    // Get the current entry
    const { data: currentEntry, error: fetchError } = await supabaseAdmin
      .from('timesheets')
      .select('*')
      .eq('employee_id', userId)
      .eq('status', 'on_break')
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error fetching timesheet entry:', fetchError.message);
      return;
    }
    
    if (!currentEntry) {
      console.log('No active entry in "on_break" status found for this user.');
      return;
    }
    
    console.log('Found entry in "on_break" status:', currentEntry);
    
    // Simply change the status to 'active'
    const { data: updatedEntry, error: updateError } = await supabaseAdmin
      .from('timesheets')
      .update({
        status: 'active'
      })
      .eq('id', currentEntry.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating status:', updateError.message);
      return;
    }
    
    console.log('Successfully updated status to active:', updatedEntry);
    console.log('Break status fixed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixBreakStatus();
