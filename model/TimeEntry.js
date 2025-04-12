const supabase = require('../config/supabase/client');

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
                console.log('[TimeEntry] Existing entry is completed. Re-activating it for new segment...');

                // Get the full entry details to access all fields including hours_worked
                const { data: fullEntry, error: fetchError } = await client
                    .from('timesheets')
                    .select('*')
                    .eq('id', existingEntry.id)
                    .single();

                if (fetchError) {
                    console.error('[TimeEntry] Error fetching full entry details:', fetchError);
                    throw new Error(`Failed to fetch full timesheet entry details: ${fetchError.message}`);
                }

                // Preserve the previously accumulated hours_worked. Reset durations for the new segment.
                const accumulatedHoursWorked = fullEntry.hours_worked || 0; // Get previous total
                console.log(`[TimeEntry] Preserving accumulated hours: ${accumulatedHoursWorked}`);

                // Log more details about the accumulated hours
                console.log('[TimeEntry] Accumulated hours breakdown:');
                console.log(`[TimeEntry] - Hours from previous clock-ins: ${accumulatedHoursWorked}`);
                console.log('[TimeEntry] - Hours from current session: 0 (just starting)');
                console.log(`[TimeEntry] - Total accumulated hours: ${accumulatedHoursWorked}`);

                // Update the existing entry to make it active again
                const { data: updatedEntry, error: updateError } = await client
                    .from('timesheets')
                    .update({
                        status: status || 'active', // Should be 'active' from controller
                        start_time: start_time, // Use the new start time
                        end_time: null, // Clear the end time to make it active
                        hours_worked: accumulatedHoursWorked, // Keep the accumulated hours
                        total_break_duration: 0, // Reset break duration for the new segment
                        total_unavailable_duration: 0 // Reset unavailable duration for the new segment
                    })
                    .eq('id', existingEntry.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('[TimeEntry] Error updating existing entry:', updateError);
                    throw new Error(`Failed to update existing timesheet entry: ${updateError.message}`);
                }

                console.log('[TimeEntry] Successfully re-activated existing entry for new segment.');
                return updatedEntry;
            } else {
                // If the existing entry is still active, update it to track the new clock-in
                console.log('[TimeEntry] Found active entry. Updating it to track the new clock-in.');

                // Get the full entry details to access all fields
                const { data: fullEntry, error: fetchError } = await client
                    .from('timesheets')
                    .select('*')
                    .eq('id', existingEntry.id)
                    .single();

                if (fetchError) {
                    console.error('[TimeEntry] Error fetching full entry details:', fetchError);
                    throw new Error(`Failed to fetch full timesheet entry details: ${fetchError.message}`);
                }

                // If the entry is active (not clocked out), calculate hours worked for the current session
                let accumulatedHours = fullEntry.hours_worked || 0;

                if (fullEntry.status === 'active' && !fullEntry.end_time) {
                    // Calculate hours worked for the current active session
                    const sessionStartTime = new Date(fullEntry.start_time);
                    const sessionEndTime = new Date(start_time); // Use the new clock-in time as the end time
                    const sessionDurationMs = sessionEndTime - sessionStartTime;
                    const sessionDurationHours = sessionDurationMs / (1000 * 60 * 60);

                    // Adjust for breaks and unavailable time
                    const breakMinutes = fullEntry.total_break_duration || 0;
                    const unavailableMinutes = fullEntry.total_unavailable_duration || 0;
                    const totalDeductionHours = (breakMinutes + unavailableMinutes) / 60;

                    // Calculate effective hours worked for this session
                    const effectiveSessionHours = Math.max(0, sessionDurationHours - totalDeductionHours);

                    // Add the current session hours to the accumulated total
                    accumulatedHours += parseFloat(effectiveSessionHours.toFixed(2));

                    console.log(`[TimeEntry] Calculated session hours: ${effectiveSessionHours.toFixed(2)}, New accumulated total: ${accumulatedHours.toFixed(2)}`);
                }

                // Update the existing entry with the new clock-in information
                const { data: updatedEntry, error: updateError } = await client
                    .from('timesheets')
                    .update({
                        start_time: start_time, // Update to the new clock-in time
                        end_time: null, // Clear end time to make it active again
                        status: 'active', // Set status to active
                        total_break_duration: 0, // Reset break duration for the new session
                        total_unavailable_duration: 0, // Reset unavailable duration for the new session
                        hours_worked: accumulatedHours // Set hours_worked to the accumulated total
                    })
                    .eq('id', existingEntry.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('[TimeEntry] Error updating existing entry:', updateError);
                    throw new Error(`Failed to update existing timesheet entry: ${updateError.message}`);
                }

                console.log('[TimeEntry] Successfully updated entry to track new clock-in.');
                return updatedEntry; // Return the updated entry
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

    // Method to find an entry by ID
    static async findById(id) {
        if (!id) {
            throw new Error('Entry ID is required to find an entry.');
        }

        console.log(`[TimeEntry] Finding entry with ID: ${id}`);

        const client = getAdminClient();

        const { data, error } = await client
            .from('timesheets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`[TimeEntry] Error finding entry with ID ${id}:`, error);
            throw new Error(`Failed to find timesheet entry: ${error.message}`);
        }

        // No need to initialize clock_history as we're not using it anymore

        return data;
    }

    // Method to update an existing timesheet entry by its ID
    static async update(id, updateData) {
        // Ensure we have valid data to update
        if (!id || !updateData || Object.keys(updateData).length === 0) {
            console.error('Update error: Missing id or updateData');
            throw new Error('Invalid input for updating timesheet entry.');
        }

        const client = getAdminClient(); // Use admin client

        // --- MODIFICATION START: Handle cumulative hours on clock-out ---
        if (updateData.end_time && updateData.hours_worked !== undefined) {
            console.log(`[TimeEntry Update] Clock-out detected for entry ${id}. Using provided hours_worked value.`);

            // Log the hours_worked value that's being used
            console.log(`[TimeEntry Update] Using hours_worked value: ${updateData.hours_worked}`);

            // IMPORTANT: We're no longer adding to the current hours_worked value here
            // because the timesheetController.clockOut method already does this calculation.
            // This prevents double-counting of hours.

            // Ensure precision with 2 decimal places
            updateData.hours_worked = parseFloat(updateData.hours_worked.toFixed(2));
        }
        // --- MODIFICATION END ---


        // Remove 'id' from updateData if present, as it should not be updated
        delete updateData.id;

        // Destructure only the fields that exist in the database table
        const {
            employee_id,
            date,
            hours_worked, // This will be the cumulative value if calculated above
            status,
            start_time,
            end_time,
            total_break_duration,
            total_unavailable_duration,
            // Include other potential fields like reason etc.
            last_break_start_time,
            last_unavailable_start_time,
            unavailable_reason
        } = updateData;


        // If we're setting status to 'on_break', ensure last_break_start_time is set
        // NOTE: This logic seems specific to breaks, keep it separate from clock-out cumulative calc
        if (status === 'on_break' && !last_break_start_time) {
            console.log('[TimeEntry Update] Setting missing last_break_start_time for break');
            updateData.last_break_start_time = new Date().toISOString(); // Modify the object directly for update below
        }
        // Handle unavailable start time
        if (status === 'unavailable' && !last_unavailable_start_time) {
            console.log('[TimeEntry Update] Setting missing last_unavailable_start_time');
            updateData.last_unavailable_start_time = new Date().toISOString();
        }


        console.log('[TimeEntry Update] Updating entry ID:', id);
        console.log('[TimeEntry Update] Final update data:', updateData); // Log the final data being sent

        // Perform the actual update using the potentially modified updateData
        const { data, error } = await client
            .from('timesheets')
            .update({ // Pass the modified updateData object or individual fields
                employee_id,
                date,
                hours_worked, // Uses the cumulative value if modified
                status,
                start_time,
                end_time,
                total_break_duration,
                total_unavailable_duration,
                last_break_start_time: updateData.last_break_start_time, // Use potentially modified value
                last_unavailable_start_time: updateData.last_unavailable_start_time, // Use potentially modified value
                unavailable_reason: updateData.unavailable_reason // Include reason if provided
            })
            .eq('id', id)
            .select() // Return the updated record
            .single(); // Expecting a single record to be updated

        if (error) {
            console.error('[TimeEntry Update] Supabase update error:', error);
            // Handle specific errors, e.g., record not found (though .single() might handle this)
            throw new Error(`Failed to update timesheet entry: ${error.message}`);
        }

        if (!data) {
            // This case might occur if the record with the specified id doesn't exist
            console.warn(`[TimeEntry Update] Timesheet entry with id ${id} not found for update.`);
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

        // Log the details of each entry for debugging
        if (data && data.length > 0) {
            data.forEach((entry, index) => {
                console.log(`[TimeEntry] Entry ${index + 1}:`);
                console.log(`  ID: ${entry.id}`);
                console.log(`  Status: ${entry.status}`);
                console.log(`  Hours worked: ${entry.hours_worked || 0}`);
                console.log(`  Start time: ${entry.start_time}`);
                console.log(`  End time: ${entry.end_time || 'N/A'}`);
            });
        }

        return data || []; // Return array of entries or empty array
    }

    // Method to calculate exact hours worked for an employee on a specific date (Updated to handle multiple entries per day)
    static async calculateHoursWorkedForDate(employeeId, dateString) {
        if (!employeeId || !dateString) {
            throw new Error('Employee ID and date are required to calculate hours worked.');
        }

        console.log(`[TimeEntry Calc] Calculating hours for employee ${employeeId} on ${dateString}`);

        // Fetch all entries for the employee on the specified date
        const entries = await this.findEntriesByEmployeeIdAndDate(employeeId, dateString);

        if (!entries || entries.length === 0) {
            console.log(`[TimeEntry Calc] No entries found for ${employeeId} on ${dateString}. Returning 0 hours.`);
            return { hoursWorked: 0, totalWorkedMinutes: 0, activeEntry: null };
        }

        console.log(`[TimeEntry Calc] Found ${entries.length} entries for ${employeeId} on ${dateString}.`);

        // Initialize variables to track total hours and active entry
        let totalHoursWorked = 0;
        let activeEntry = null;

        // Process each entry and sum up the hours worked
        for (const entry of entries) {
            console.log(`[TimeEntry Calc] Processing entry: ID=${entry.id}, Status=${entry.status}, StoredHours=${entry.hours_worked || 0}`);

            // For completed entries, use the stored hours_worked which includes all accumulated hours
            if (entry.end_time && entry.hours_worked !== undefined) {
                console.log(`[TimeEntry Calc] Adding completed entry hours: ${entry.hours_worked}`);
                totalHoursWorked += entry.hours_worked;
                console.log(`[TimeEntry Calc] Running total after adding entry ${entry.id}: ${totalHoursWorked.toFixed(2)} hours`);
            }

            // For active entries, calculate the current active session
            if (!entry.end_time && entry.status === 'active') {
                console.log(`[TimeEntry Calc] Entry ${entry.id} is active. Calculating current session duration.`);
                activeEntry = entry; // Store the active entry for return

                const startTime = new Date(entry.start_time);
                const now = new Date();

                // Calculate elapsed time in hours for the current session
                const elapsedMillis = now - startTime;
                const elapsedHours = elapsedMillis / (1000 * 60 * 60);

                // Get break and unavailable time for the current active session
                const currentBreakMinutes = entry.total_break_duration || 0;
                const currentUnavailableMinutes = entry.total_unavailable_duration || 0;
                const currentDeductionHours = (currentBreakMinutes + currentUnavailableMinutes) / 60;

                // Calculate the net duration of the current active session
                const currentActiveSessionHours = Math.max(0, elapsedHours - currentDeductionHours);

                console.log(`[TimeEntry Calc] Current session: ElapsedHours=${elapsedHours.toFixed(2)}, DeductionHours=${currentDeductionHours.toFixed(2)}, NetSessionHours=${currentActiveSessionHours.toFixed(2)}`);

                // Add the current active session's duration to the total hours worked
                totalHoursWorked += currentActiveSessionHours;
                console.log(`[TimeEntry Calc] Added active session hours: ${currentActiveSessionHours.toFixed(2)}`);
                console.log(`[TimeEntry Calc] Running total after adding active session: ${totalHoursWorked.toFixed(2)} hours`);
            }
            // We've already handled completed entries above
        }

        // Final total hours
        const finalHours = Math.max(0, totalHoursWorked); // Ensure non-negative
        const finalMinutes = finalHours * 60;

        console.log(`[TimeEntry Calc] Final total hours worked for ${dateString}: ${finalHours.toFixed(2)} (${finalMinutes.toFixed(2)} minutes)`);
        console.log(`[TimeEntry Calc] Active entry: ${activeEntry ? activeEntry.id : 'None'}`);

        return {
            hoursWorked: parseFloat(finalHours.toFixed(2)), // Return with precision
            totalWorkedMinutes: parseFloat(finalMinutes.toFixed(2)), // Return with precision
            activeEntry: activeEntry // Return the active entry if found
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