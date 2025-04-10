const supabase = require('../config/supabaseClient');

class LeaveRequest {
    // Create a new leave request
    static async create(requestData) {
        const { employee_id, start_date, end_date, leave_type, reason, total_leave_days } = requestData;

        // Basic validation
        if (!employee_id || !start_date || !end_date || !leave_type) {
            return { data: null, error: new Error('Missing required fields for leave request.') };
        }

        // TODO: Add logic to calculate total_leave_days if not provided, 
        // potentially excluding weekends/holidays. For now, assume it's provided or null.

        const { data, error } = await supabase
            .from('leave_requests')
            .insert([
                { 
                    employee_id, 
                    start_date, 
                    end_date, 
                    leave_type, 
                    reason, 
                    total_leave_days,
                    // status defaults to 'Pending' in DB
                    // requested_at defaults to now() in DB
                }
            ])
            .select() // Return the created record
            .single(); // Expecting a single record back

        if (error) {
            console.error('Supabase error creating leave request:', error.message);
        }
        
        return { data, error };
    }

    // Find a leave request by its ID
    static async findById(id) {
        const { data, error } = await supabase
            .from('leave_requests')
            .select('*') // Select all columns
            // Consider joining with employees table if needed: .select('*, employees(fullName, email)')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'Range not satisfactory' error for no rows found
             console.error('Supabase error finding leave request by ID:', error.message);
        }

        return { data, error: data ? null : error }; // Return error only if it's not the "not found" error
    }

    // Find all leave requests for a specific employee
    static async findAllByEmployee(employeeId) {
        const { data, error } = await supabase
            .from('leave_requests')
            .select('*') // Select all columns, potentially join with employees later
            .eq('employee_id', employeeId)
            .order('start_date', { ascending: false }); // Order by start date, newest first

        if (error) {
            console.error('Supabase error finding leave requests by employee:', error.message);
        }

        return { data, error };
    }
    
    // Find all leave requests (e.g., for admin/manager view)
    static async findAll(options = {}) {
        // Example: Allow filtering by status or date range in the future
        // const { statusFilter, dateFilter } = options; 
        
        let query = supabase
            .from('leave_requests')
             // Join with employees table to get employee name
            .select(`
                *,
                employee:employees ( fullName, email ) 
            `); 
            // TODO: Add filters based on options

        query = query.order('requested_at', { ascending: false }); // Order by request date

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error finding all leave requests:', error.message);
        }

        return { data, error };
    }

    // Update the status of a leave request (Approve/Reject)
    static async updateStatus(id, status, approverId, comments = null) {
         if (!status || !approverId) {
             return { data: null, error: new Error('Missing status or approver ID for update.') };
         }
         
         const allowedStatuses = ['Approved', 'Rejected', 'Cancelled']; // Add 'Cancelled' if employees can cancel
         if (!allowedStatuses.includes(status)) {
             return { data: null, error: new Error('Invalid status provided.') };
         }

        const { data, error } = await supabase
            .from('leave_requests')
            .update({ 
                status: status, 
                approver_id: approverId,
                comments: comments,
                approved_at: new Date().toISOString() // Set approval timestamp
            })
            .eq('id', id)
             // Optionally add constraint: .eq('status', 'Pending') to only update pending requests
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating leave request status:', error.message);
        }
        
        return { data, error };
    }

    // TODO: Add delete method if needed
    // static async delete(id) { ... }
}

module.exports = LeaveRequest;