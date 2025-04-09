const supabase = require('../config/supabaseClient');

// Create a Supabase client with the service role key to bypass RLS
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create the admin client if the service key is available
const supabaseAdmin = supabaseServiceKey ?
    createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    }) : null; // Assuming anon client is okay, or use admin

// Helper function to get the appropriate client
function getClient() {
    if (supabaseAdmin) {
        console.log('[TimeEntry] Using admin client (bypasses RLS)');
        return supabaseAdmin;
    } else {
        console.log('[TimeEntry] Using regular client (respects RLS)');
        return supabase;
    }
}

// Always use the admin client for all operations
function getAdminClient() {
    if (supabaseAdmin) {
        console.log('[TimeEntry] Using admin client (bypasses RLS)');
        return supabaseAdmin;
    } else {
        console.error('[TimeEntry] Admin client not available, falling back to regular client');
        return supabase;
    }
}

class TimeEntry {
    // Method to create a new timesheet entry in Supabase
    static async create(data) {
        // Destructure only the fields that exist in the database table
        const {
            employee_id,
            date,
            hours_worked,
            status,
            start_time,
            end_time,
            total_break_duration,
            total_unavailable_duration
        } = data;

        // Add more specific validation if needed
        if (!employee_id || !date || hours_worked === undefined || start_time === undefined) { // Added start_time check
            throw new Error('Missing required fields (employee_id, date, hours_worked, start_time) for timesheet creation.');
        }

        const client = getAdminClient();

        // Check if an entry already exists for this employee and date
        // This is needed because Supabase has a unique constraint on (employee_id, date)
        console.log(`[TimeEntry] Checking for existing entry for employee ${employee_id} on date ${date}...`);
        const { data: existingEntries, error: findError } = await client
            .from('timesheets')
            .select('id, end_time, status')
            .eq('employee_id', employee_id)
            .eq('date', date);

        if (findError) {
            console.error('[TimeEntry] Error checking for existing entry:', findError);
            throw new Error(`Failed to check for existing timesheet entry: ${findError.message}`);
        }

        // If an entry exists and has an end_time (completed entry), we need to handle it differently
        if (existingEntries && existingEntries.length > 0) {
            const existingEntry = existingEntries[0];
            console.log(`[TimeEntry] Found existing entry for employee ${employee_id} on date ${date}:`, existingEntry);

            // If the existing entry is already completed (has end_time), we need to update it
            // to support multiple clock-ins per day despite the unique constraint
            if (existingEntry.end_time && existingEntry.status !== 'active') {
                console.log('[TimeEntry] Existing entry is completed. Updating it to support multiple entries per day...');

                // Update the existing entry to make it active again
                const { data: updatedEntry, error: updateError } = await client
                    .from('timesheets')
                    .update({
                        status: status || 'active',
                        start_time: start_time, // Use the new start time
                        end_time: null, // Clear the end time to make it active
                        hours_worked: hours_worked, // Reset hours worked
                        total_break_duration: total_break_duration || 0,
                        total_unavailable_duration: total_unavailable_duration || 0
                    })
                    .eq('id', existingEntry.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('[TimeEntry] Error updating existing entry:', updateError);
                    throw new Error(`Failed to update existing timesheet entry: ${updateError.message}`);
                }

                console.log('[TimeEntry] Successfully updated existing entry to support multiple entries per day');
                return updatedEntry;
            } else {
                // If the existing entry is still active, we can't create a new one due to the unique constraint
                console.error('[TimeEntry] Cannot create new entry: An active entry already exists for this employee and date');
                throw new Error('An active timesheet entry already exists for today. Please clock out first.');
            }
        }

        // If no existing entry, create a new one
        console.log(`[TimeEntry] Creating a new entry for employee ${employee_id} on date ${date}...`);

        // Now create the new entry
        console.log('[TimeEntry] Creating new timesheet entry...');
        const { data: newEntry, error } = await client
            .from('timesheets')
            .insert([
                {
                    employee_id,
                    date,
                    hours_worked,
                    status: status || 'active', // Default status to active on creation
                    start_time: start_time,
                    end_time: end_time,
                    total_break_duration: total_break_duration,
                    total_unavailable_duration: total_unavailable_duration
                }
            ])
            .select() // Return the created record
            .single(); // Expecting a single record back

        if (error) {
            console.error('Supabase insert error:', error);
            // Re-throw the original Supabase error object to preserve its properties (like code)
            throw error;
        }

        return newEntry;
    }

    // Method to find the currently active (not clocked out) entry for an employee
    static async findActiveEntryByEmployeeId(employeeId) {
        console.log('[TimeEntry] Finding active entry for employee ID:', employeeId);

        const client = getAdminClient();

        const { data, error } = await client
            .from('timesheets')
            .select('*') // Select all columns, or specify needed ones
            .eq('employee_id', employeeId)
            .is('end_time', null) // Find entries where end_time is NULL (meaning active)
            .order('start_time', { ascending: false }); // Get the most recent active one

        if (error) {
            console.error('[TimeEntry] Supabase select error (findActiveEntry):', error);
            throw new Error(`Failed to find active timesheet entry: ${error.message}`);
        }

        if (!data || data.length === 0) {
            console.log('[TimeEntry] No active entry found for employee ID:', employeeId);
            return null;
        }

        // Return the most recent active entry
        console.log('[TimeEntry] Found active entry:', data[0]);
        return data[0]; // Returns the entry object or null if not found
    }

    // Method to check if an entry exists for a specific employee and date
    static async findEntryByEmployeeIdAndDate(employeeId, dateString) {
        if (!employeeId || !dateString) {
            throw new Error('Employee ID and date are required to check for existing entry.');
        }

        console.log(`[Model] Checking for entry: User=${employeeId}, Date=${dateString}`);

        const client = getAdminClient();

        const { data, error, count } = await client
            .from('timesheets')
            .select('id', { count: 'exact' }) // Just need to know if one exists, count is efficient
            .eq('employee_id', employeeId)
            .eq('date', dateString)
            .limit(1); // Only need one result to confirm existence
            // Removed .single() as we just need the count or the first item

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Supabase select error (findEntryByEmployeeIdAndDate):', error);
            throw new Error(`Failed to check for existing timesheet entry: ${error.message}`);
        }

        console.log(`[Model] Found count: ${count}`);

        // Return true if count > 0 (or if data is not null/empty), false otherwise
        return count > 0;
        // return data && data.length > 0; // Alternative check if count isn't used
    }

    // Method to get an entry by employee ID and date
    static async getEntryByEmployeeIdAndDate(employeeId, dateString) {
        if (!employeeId || !dateString) {
            throw new Error('Employee ID and date are required to get entry.');
        }

        console.log(`[Model] Getting entry: User=${employeeId}, Date=${dateString}`);

        const client = getAdminClient();

        const { data, error } = await client
            .from('timesheets')
            .select('*') // Get all fields
            .eq('employee_id', employeeId)
            .eq('date', dateString)
            .maybeSingle(); // Use maybeSingle to get null if not found

        if (error) {
            console.error('Supabase select error (getEntryByEmployeeIdAndDate):', error);
            throw new Error(`Failed to get timesheet entry: ${error.message}`);
        }

        console.log(`[Model] Found entry:`, data);

        return data; // Returns the entry object or null if not found
    }

    // Method to update an existing timesheet entry by its ID
    static async update(id, updateData) {
        // Ensure we have valid data to update
        if (!id || !updateData || Object.keys(updateData).length === 0) {
            console.error('Update error: Missing id or updateData');
            throw new Error('Invalid input for updating timesheet entry.');
        }

        // Remove 'id' from updateData if present, as it should not be updated
        delete updateData.id;

        // Destructure only the fields that exist in the database table
        const {
            employee_id,
            date,
            hours_worked,
            status,
            start_time,
            end_time,
            total_break_duration,
            total_unavailable_duration
        } = updateData;

        const client = getAdminClient();

        // If we're setting status to 'on_break', ensure last_break_start_time is set
        if (status === 'on_break' && !updateData.last_break_start_time) {
            console.log('[TimeEntry] Setting missing last_break_start_time for break');
            updateData.last_break_start_time = new Date().toISOString();
        }

        console.log('[TimeEntry] Updating entry ID:', id);
        console.log('[TimeEntry] Update data:', updateData);

        const { data, error } = await client
            .from('timesheets')
            .update({
                employee_id,
                date,
                hours_worked,
                status,
                start_time,
                end_time,
                total_break_duration,
                total_unavailable_duration,
                last_break_start_time: updateData.last_break_start_time,
                last_unavailable_start_time: updateData.last_unavailable_start_time
            })
            .eq('id', id)
            .select() // Return the updated record
            .single(); // Expecting a single record to be updated

        if (error) {
            console.error('Supabase update error:', error);
            // Handle specific errors, e.g., record not found (though .single() might handle this)
            throw new Error(`Failed to update timesheet entry: ${error.message}`);
        }

        if (!data) {
            // This case might occur if the record with the specified id doesn't exist
            console.warn(`Timesheet entry with id ${id} not found for update.`);
            return null; // Or throw an error, depending on desired behavior
        }

        return data; // Return the updated entry object
    }

    // Method to find recent timesheet entries for an employee
    static async findRecentEntriesByEmployeeId(employeeId, limit = 10) {
        const client = getAdminClient();

        console.log(`[TimeEntry] Finding recent entries for employee ${employeeId}, limit: ${limit}`);

        const { data, error } = await client
            .from('timesheets')
            .select('*') // Select all columns
            .eq('employee_id', employeeId)
            .order('date', { ascending: false }) // Order by date descending
            .order('start_time', { ascending: false }) // Then by start time descending
            .limit(limit);

        if (error) {
            console.error('Supabase select error (findRecentEntries):', error);
            throw new Error(`Failed to find recent timesheet entries: ${error.message}`);
        }

        // Log the raw data for debugging
        console.log(`[TimeEntry] Found ${data ? data.length : 0} recent entries`);
        if (data && data.length > 0) {
            console.log('[TimeEntry] First entry sample:', JSON.stringify(data[0], null, 2));
        }

        // Ensure we're returning an array
        const entries = data || [];

        // Process entries to ensure all required fields are present
        const processedEntries = entries.map(entry => {
            // Ensure date is in the correct format
            if (!entry.date) {
                console.log(`[TimeEntry] Entry ${entry.id} missing date, adding current date`);
                entry.date = new Date().toISOString().split('T')[0];
            }

            // Ensure status is present
            if (!entry.status) {
                console.log(`[TimeEntry] Entry ${entry.id} missing status, setting to 'unknown'`);
                entry.status = 'unknown';
            }

            return entry;
        });

        return processedEntries; // Return processed array of entries
    }

    // Method to find all timesheet entries for a specific employee and date
    static async findEntriesByEmployeeIdAndDate(employeeId, dateString) {
        if (!employeeId || !dateString) {
            throw new Error('Employee ID and date are required to find entries.');
        }

        console.log(`[TimeEntry] Finding entries for employee ${employeeId} on date ${dateString}`);

        const client = getAdminClient();

        const { data, error } = await client
            .from('timesheets')
            .select('*') // Select all columns
            .eq('employee_id', employeeId)
            .eq('date', dateString)
            .order('start_time', { ascending: true }); // Order by start time

        if (error) {
            console.error('Supabase select error (findEntriesByEmployeeIdAndDate):', error);
            throw new Error(`Failed to find timesheet entries: ${error.message}`);
        }

        console.log(`[TimeEntry] Found ${data ? data.length : 0} entries for date ${dateString}`);
        return data || []; // Return array of entries or empty array
    }

    // Method to calculate exact hours worked for an employee on a specific date
    static async calculateHoursWorkedForDate(employeeId, dateString) {
        if (!employeeId || !dateString) {
            throw new Error('Employee ID and date are required to calculate hours worked.');
        }

        console.log(`[TimeEntry] Calculating hours worked for employee ${employeeId} on date ${dateString}`);

        // Get all entries for the employee on the specified date
        const entries = await this.findEntriesByEmployeeIdAndDate(employeeId, dateString);

        // Calculate total worked minutes
        let totalWorkedMinutes = 0;
        let activeEntry = null;

        // Process each entry
        for (const entry of entries) {
            // Check if this is an active entry (no end_time)
            if (!entry.end_time) {
                activeEntry = entry;
                continue; // Skip for now, we'll process the active entry separately
            }

            // For completed entries, use hours_worked if available
            if (entry.hours_worked !== null && entry.hours_worked !== undefined) {
                console.log(`[TimeEntry] Entry ${entry.id}: Adding ${entry.hours_worked} hours (${entry.hours_worked * 60} minutes) from hours_worked`);
                totalWorkedMinutes += entry.hours_worked * 60;
            } else {
                // Otherwise calculate from start_time and end_time
                const startTime = new Date(entry.start_time);
                const endTime = new Date(entry.end_time);
                const durationMinutes = (endTime - startTime) / (1000 * 60);

                // Subtract break and unavailable time
                const breakMinutes = entry.total_break_duration || 0;
                const unavailableMinutes = entry.total_unavailable_duration || 0;
                const actualMinutes = durationMinutes - breakMinutes - unavailableMinutes;

                console.log(`[TimeEntry] Entry ${entry.id}: Adding ${actualMinutes.toFixed(2)} minutes calculated from duration`);
                totalWorkedMinutes += Math.max(0, actualMinutes); // Ensure non-negative
            }
        }

        // Process active entry if exists
        if (activeEntry) {
            const startTime = new Date(activeEntry.start_time);
            const now = new Date();

            // Calculate elapsed time in minutes
            const elapsedMillis = now - startTime;
            const elapsedMinutes = elapsedMillis / (1000 * 60);

            // Subtract break and unavailable time
            const breakMinutes = activeEntry.total_break_duration || 0;
            const unavailableMinutes = activeEntry.total_unavailable_duration || 0;
            const currentSessionMinutes = elapsedMinutes - breakMinutes - unavailableMinutes;

            console.log(`[TimeEntry] Active entry ${activeEntry.id}: Status=${activeEntry.status}`);
            console.log(`[TimeEntry] Elapsed minutes: ${elapsedMinutes.toFixed(2)}, Break minutes: ${breakMinutes}, Unavailable minutes: ${unavailableMinutes}`);

            // Only add time if the user is actively working (not on break or unavailable)
            if (activeEntry.status === 'active') {
                console.log(`[TimeEntry] Adding current session minutes to total: ${currentSessionMinutes.toFixed(2)}`);
                totalWorkedMinutes += Math.max(0, currentSessionMinutes); // Ensure non-negative
            } else {
                console.log(`[TimeEntry] Not adding current session minutes because status is: ${activeEntry.status}`);
            }
        }

        // Convert minutes to hours
        const hoursWorked = totalWorkedMinutes / 60;
        console.log(`[TimeEntry] Total hours worked for ${dateString}: ${hoursWorked.toFixed(2)} (${totalWorkedMinutes.toFixed(2)} minutes)`);

        return {
            hoursWorked: Math.max(0, hoursWorked), // Ensure non-negative
            totalWorkedMinutes: Math.max(0, totalWorkedMinutes), // Ensure non-negative
            activeEntry: activeEntry // Return the active entry for reference
        };
    }

    // Method to find all currently active timesheet entries (not 'completed')
    // Includes basic employee info (adjust select as needed)
    static async findAllActiveEntriesWithEmployee() {
        const client = getAdminClient();

        const { data, error } = await client
            .from('timesheets')
            .select(`
                id,
                start_time,
                status,
                employee_id,
                users ( full_name, role )
            `)
            .not('status', 'eq', 'completed') // Find entries that are not completed
            .order('start_time', { ascending: true }); // Optional ordering

        if (error) {
            console.error('Supabase select error (findAllActiveEntriesWithEmployee):', error);
            throw new Error(`Failed to find active timesheet entries with employee info: ${error.message}`);
        }
        return data || [];
    }

    // --- Standard CRUD ---

    // Find all timesheet entries (consider pagination for large datasets)
    static async findAll() {
        const client = getAdminClient();

        const { data, error } = await client
            .from('timesheets')
            .select('*, users(full_name)') // Join with users for context
            .order('date', { ascending: false })
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Supabase select error (findAll):', error);
            throw new Error(`Failed to find all timesheet entries: ${error.message}`);
        }
        return data || [];
    }

    // Find a single timesheet entry by its primary key (id)
    static async findById(id) {
        if (!id) throw new Error('Timesheet ID is required for findById.');

        const client = getAdminClient();

        const { data, error } = await client
            .from('timesheets')
            .select('*, users(full_name)') // Join with users
            .eq('id', id)
            .maybeSingle(); // Returns object or null

        if (error) {
            console.error('Supabase select error (findById):', error);
            throw new Error(`Failed to find timesheet entry by ID ${id}: ${error.message}`);
        }
        return data; // Can be null if not found
    }

    // Delete a timesheet entry by its primary key (id)
    static async delete(id) {
        if (!id) throw new Error('Timesheet ID is required for delete.');

        const client = getAdminClient();

        const { data, error } = await client
            .from('timesheets')
            .delete()
            .eq('id', id)
            .select(); // Return the deleted record(s)

        if (error) {
            console.error('Supabase delete error:', error);
            throw new Error(`Failed to delete timesheet entry with ID ${id}: ${error.message}`);
        }
        // Check if any record was actually deleted
        if (!data || data.length === 0) {
           // Consider if throwing an error or returning null/false is better
           // For now, let's indicate it wasn't found or deleted
           return null;
        }

        return data[0]; // Return the deleted entry object
    }
}

module.exports = TimeEntry;