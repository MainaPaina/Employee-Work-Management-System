const supabase = require('../config/supabase/client');

class LeaveRequest {
    async findAllByEmployee(userId) {
        return await supabase
            .from('leaves')
            .select('*')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });
    }

    async findById(requestId) {
        return await supabase
            .from('leaves')
            .select('*')
            .eq('id', requestId)
            .single();
    }

    async create(requestData) {
        return await supabase   
            .from('leaves')
            .insert([requestData])
            .select()
            .single();
    }

    async updateStatus(requestId, status, approverId, comments = null) {
        return await supabase
            .from('leaves')
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
            .from('leaves')
            .select('*')
            .order('created_at', { ascending: false });
    }
}

module.exports = new LeaveRequest();
