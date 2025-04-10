const supabase = require('../config/supabaseClient'); // Use Supabase client

class Leave {
    // Create leave request
    static async create(leaveData) {
        const { employeeId, leaveType, startDate, endDate, reason, days } = leaveData;
        try {
            const { data, error } = await supabase
                .from('leaves')
                .insert({
                    employee_id: employeeId,
                    leave_type: leaveType,
                    start_date: startDate,
                    end_date: endDate,
                    reason: reason,
                    days: days,
                    status: 'pending'
                })
                .select()
                .single(); // Assuming insert returns the created row

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating leave request:', error);
            throw error;
        }
    }

    // Get leave requests by employee ID
    static async getByEmployeeId(employeeId) {
        try {
            const { data, error } = await supabase
                .from('leaves')
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            throw error;
        }
    }

    // Get leave request by ID
    static async getById(id) {
        try {
            const { data, error } = await supabase
                .from('leaves')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching leave request:', error);
            throw error;
        }
    }

    // Update leave request status
    static async updateStatus(id, status, reviewedBy = null) {
        try {
            const { error } = await supabase
                .from('leaves')
                .update({
                    status: status,
                    reviewed_by: reviewedBy,
                    reviewed_at: new Date().toISOString() // Set review timestamp
                })
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating leave status:', error);
            throw error;
        }
    }

    // Cancel leave request (only if pending)
    static async cancel(id, employeeId) { // Added employeeId for RLS potentially
        try {
            const { error } = await supabase
                .from('leaves')
                .delete()
                .match({ id: id, status: 'pending', employee_id: employeeId }); // Ensure user owns the request

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error canceling leave request:', error);
            throw error;
        }
    }

    // Get leave summary for an employee
    static async getLeaveSummary(employeeId) {
        try {
            // Get total leave quota from the employees table
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('leave_quota')
                .eq('user_id', employeeId) // Assuming employees table links via user_id
                .single();

            if (employeeError && employeeError.code !== 'PGRST116') {
                // PGRST116 means no rows found, which might be okay if we have a default
                console.error('Error fetching employee quota:', employeeError);
                throw employeeError;
            }
            const totalQuota = employeeData ? employeeData.leave_quota : 20; // Default quota if not found

            // Get approved leaves for the current year to calculate used leaves
            const currentYear = new Date().getFullYear();
            const startOfYear = `${currentYear}-01-01`;

            // Fetch approved leaves for the employee for the current year
            const { data: approvedLeaves, error: approvedError } = await supabase
                .from('leaves') // Query the 'leaves' table
                .select('start_date, end_date') 
                .eq('employee_id', employeeId) 
                .eq('status', 'approved') 
                .gte('start_date', startOfYear);

            // Throw an error if there was an issue with the query
            if (approvedError) throw approvedError;

            // Calculate the total number of used leave days
            const usedLeaves = approvedLeaves.reduce((sum, leave) => {
                const start = new Date(leave.start_date); 
                const end = new Date(leave.end_date); 
                const duration = (end - start) / (1000 * 60 * 60 * 24) + 1; 
                return sum + duration; 
            }, 0);

            // Get all leave requests for the current year
            const { data: requests, error: requestsError } = await supabase
                .from('leaves')
                .select('*')
                .eq('employee_id', employeeId)
                .gte('start_date', startOfYear)
                .order('start_date', { ascending: false });

            if (requestsError) throw requestsError;

            return {
                totalQuota,
                usedLeaves,
                requests
            };
        } catch (error) {
            console.error('Error getting leave summary:', error);
            throw error;
        }
    }
}

module.exports = Leave;