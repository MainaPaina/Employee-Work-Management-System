const supabase = require('../config/supabaseClient');

class Leave {
    /**
     * Create a new leave request
     * @param {Object} leaveData - Leave request data
     * @returns {Promise<Object>} - Created leave request
     */
    static async create(leaveData) {
        try {
            const { 
                employee_id, 
                start_date, 
                end_date, 
                leave_type, 
                reason, 
                days 
            } = leaveData;

            // Validate required fields
            if (!employee_id || !start_date || !end_date || !leave_type) {
                throw new Error('Missing required fields for leave request');
            }

            // Calculate days if not provided
            const leaveDays = days || this.calculateBusinessDays(new Date(start_date), new Date(end_date));

            const { data, error } = await supabase
                .from('leave_requests')
                .insert({
                    employee_id,
                    start_date,
                    end_date,
                    leave_type,
                    reason: reason || null,
                    days: leaveDays,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating leave request:', error);
            throw error;
        }
    }

    /**
     * Get leave requests by employee ID
     * @param {number} employeeId - Employee ID
     * @returns {Promise<Array>} - Array of leave requests
     */
    static async getByEmployeeId(employeeId) {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            throw error;
        }
    }

    /**
     * Get leave request by ID
     * @param {number} id - Leave request ID
     * @returns {Promise<Object>} - Leave request
     */
    static async getById(id) {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
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

    /**
     * Update leave request status
     * @param {number} id - Leave request ID
     * @param {string} status - New status ('approved', 'rejected', 'cancelled')
     * @param {number} reviewedBy - ID of the user who reviewed the request
     * @returns {Promise<boolean>} - Success status
     */
    static async updateStatus(id, status, reviewedBy = null) {
        try {
            const { error } = await supabase
                .from('leave_requests')
                .update({
                    status,
                    reviewed_by: reviewedBy,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating leave request status:', error);
            throw error;
        }
    }

    /**
     * Cancel a leave request
     * @param {number} id - Leave request ID
     * @returns {Promise<boolean>} - Success status
     */
    static async cancel(id) {
        return this.updateStatus(id, 'cancelled');
    }

    /**
     * Get leave summary for an employee
     * @param {number} employeeId - Employee ID
     * @returns {Promise<Object>} - Leave summary
     */
    static async getLeaveSummary(employeeId) {
        try {
            // Get employee's leave quota
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('leave_quota')
                .eq('user_id', employeeId)
                .single();

            if (employeeError) throw employeeError;

            // Get approved leave requests for the current year
            const currentYear = new Date().getFullYear();
            const startOfYear = `${currentYear}-01-01`;
            const endOfYear = `${currentYear}-12-31`;

            const { data: leaveData, error: leaveError } = await supabase
                .from('leave_requests')
                .select('days')
                .eq('employee_id', employeeId)
                .eq('status', 'approved')
                .gte('start_date', startOfYear)
                .lte('end_date', endOfYear);

            if (leaveError) throw leaveError;

            // Calculate used leaves
            const usedLeaves = leaveData ? leaveData.reduce((total, leave) => total + leave.days, 0) : 0;
            const totalQuota = employeeData ? employeeData.leave_quota : 25; // Default to 25 if not found

            return {
                totalQuota,
                usedLeaves,
                remainingLeaves: totalQuota - usedLeaves
            };
        } catch (error) {
            console.error('Error getting leave summary:', error);
            // Return default values in case of error
            return {
                totalQuota: 25,
                usedLeaves: 0,
                remainingLeaves: 25
            };
        }
    }

    /**
     * Calculate business days between two dates (excluding weekends)
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {number} - Number of business days
     */
    static calculateBusinessDays(startDate, endDate) {
        let count = 0;
        const curDate = new Date(startDate.getTime());
        
        while (curDate <= endDate) {
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        
        return count;
    }
}

module.exports = Leave;
