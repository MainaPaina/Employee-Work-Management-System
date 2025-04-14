const supabase = require('../config/supabase/client');

class LeaveRequest {
    async findAllByEmployee(employeeId) {
        return await supabase
            .from('leave_requests')
            .select('*')
            .eq('employee_id', employeeId)
            .order('start_date', { ascending: false });
    }

    async findById(requestId) {
        return await supabase
            .from('leave_requests')
            .select('*')
            .eq('id', requestId)
            .single();
    }

    async create(requestData) {
        return await supabase   
            .from('leave_requests')
            .insert([requestData])
            .select()
            .single();
    }

    async updateStatus(requestId, status, approverId, comments = null) {
        return await supabase
            .from('leave_requests')
            .update({
                status,
                approved_by: approverId,
                comments
            })
            .eq('id', requestId)
            .select()
            .single();
    }

    async findAll() {
        return await supabase
            .from('leave_requests')
            .select('*')
            .order('created_at', { ascending: false });
    }
}

module.exports = new LeaveRequest();
