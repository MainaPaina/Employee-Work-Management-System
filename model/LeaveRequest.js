const supabase = require('../config/supabaseClient');

class LeaveRequest {
    /**
     * Create a new leave request
     * @param {Object} requestData - Leave request data
     * @returns {Promise<Object>} - Created leave request
     */
    static async create(requestData) {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .insert(requestData)
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
     * Find all leave requests with optional filtering
     * @param {Object} options - Filter options
     * @returns {Promise<Array>} - Array of leave requests
     */
    static async findAll(options = {}) {
        try {
            let query = supabase
                .from('leave_requests')
                .select('*, employees(*)');

            // Apply filters if provided
            if (options.status) {
                query = query.eq('status', options.status);
            }
            
            if (options.startDate) {
                query = query.gte('start_date', options.startDate);
            }
            
            if (options.endDate) {
                query = query.lte('end_date', options.endDate);
            }

            // Order by created_at by default
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error finding leave requests:', error);
            throw error;
        }
    }

    /**
     * Find leave requests by employee ID
     * @param {number} employeeId - Employee ID
     * @returns {Promise<Array>} - Array of leave requests
     */
    static async findAllByEmployee(employeeId) {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error finding employee leave requests:', error);
            return { data: null, error };
        }
    }

    /**
     * Find a leave request by ID
     * @param {number} id - Leave request ID
     * @returns {Promise<Object>} - Leave request
     */
    static async findById(id) {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .select('*, employees(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error finding leave request by ID:', error);
            throw error;
        }
    }

    /**
     * Update a leave request
     * @param {number} id - Leave request ID
     * @param {Object} updateData - Updated leave request data
     * @returns {Promise<Object>} - Updated leave request
     */
    static async update(id, updateData) {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating leave request:', error);
            throw error;
        }
    }

    /**
     * Delete a leave request
     * @param {number} id - Leave request ID
     * @returns {Promise<boolean>} - Success status
     */
    static async delete(id) {
        try {
            const { error } = await supabase
                .from('leave_requests')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting leave request:', error);
            throw error;
        }
    }
}

module.exports = LeaveRequest;
