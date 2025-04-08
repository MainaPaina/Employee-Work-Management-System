require('dotenv').config();
const TimeEntry = require('../model/TimeEntry');

async function testTimeEntryModel() {
  try {
    // Get user ID from command line or use default
    const userId = process.argv[2] || '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
    const action = process.argv[3] || 'in'; // 'in' or 'out'
    
    console.log(`Testing TimeEntry model ${action} for user ID:`, userId);
    
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
  
  try {
    const newEntry = await TimeEntry.create(newEntryData);
    console.log('New entry created successfully:', newEntry);
  } catch (error) {
    console.error('Error creating new entry:', error);
  }
}

async function clockOut(userId, now) {
  // Find the active entry
  console.log('Finding active entry...');
  try {
    const activeEntry = await TimeEntry.findActiveEntryByEmployeeId(userId);
    
    if (!activeEntry) {
      console.log('No active entry found. Not clocked in.');
      return;
    }
    
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
    const updatedEntry = await TimeEntry.update(activeEntry.id, {
      status: 'completed',
      end_time: endTime.toISOString(),
      hours_worked: activeEntry.hours_worked + hoursWorked
    });
    
    console.log('Entry updated successfully:', updatedEntry);
  } catch (error) {
    console.error('Error during clock out:', error);
  }
}

testTimeEntryModel();
