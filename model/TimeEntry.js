const supabase = require('../config/supabaseClient'); // Assuming anon client is okay, or use admin

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

        const { data: newEntry, error } = await supabase
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
        const { data, error } = await supabase
            .from('timesheets')
            .select('*') // Select all columns, or specify needed ones
            .eq('employee_id', employeeId)
            .is('end_time', null) // Find entries where end_time is NULL (meaning active)
            .order('start_time', { ascending: false }) // Get the most recent active one
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is okay
            console.error('Supabase select error (findActiveEntry):', error);
            throw new Error(`Failed to find active timesheet entry: ${error.message}`);
        }

        return data; // Returns the entry object or null if not found
    }

    // Method to check if an entry exists for a specific employee and date
    static async findEntryByEmployeeIdAndDate(employeeId, dateString) {
        if (!employeeId || !dateString) {
            throw new Error('Employee ID and date are required to check for existing entry.');
        }

        console.log(`[Model] Checking for entry: User=${employeeId}, Date=${dateString}`);

        const { data, error, count } = await supabase
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

        const { data, error } = await supabase
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

        const { data, error } = await supabase
            .from('timesheets')
            .update({
                employee_id,
                date,
                hours_worked,
                status,
                start_time,
                end_time,
                total_break_duration,
                total_unavailable_duration
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
        const { data, error } = await supabase
            .from('timesheets')
            .select('*') // Adjust columns as needed
            .eq('employee_id', employeeId)
            .order('date', { ascending: false }) // Order by date descending
            .order('start_time', { ascending: false }) // Then by start time descending
            .limit(limit);

        if (error) {
            console.error('Supabase select error (findRecentEntries):', error);
            throw new Error(`Failed to find recent timesheet entries: ${error.message}`);
        }

        return data || []; // Return array of entries or empty array
    }

    // Method to find all currently active timesheet entries (not 'completed')
    // Includes basic employee info (adjust select as needed)
    static async findAllActiveEntriesWithEmployee() {
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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

        const { data, error } = await supabase
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

        const { data, error } = await supabase
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