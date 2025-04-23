const supabase = require('../config/supabase/client');

module.exports = {
  async getLeaveHistory(userId) {
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching leave history:', error);
      return [];
    }

    return data || [];
  },

  async getLeaveSummary(userId) {
    // Fetch approved leaves
    const { data: leaves, error: leaveError } = await supabase
      .from('leaves')
      .select('start_date, end_date')
      .eq('user_id', userId)
      .eq('status', 'Approved');
  
    if (leaveError) {
      console.error('Error fetching leave summary:', leaveError);
      return {
        totalQuota: 0,
        usedLeaves: 0,
        leaveHistory: []
      };
    }
  
    // Fetch user quota from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('leave_quota') // 👈 field you store the quota in
      .eq('id', userId)
      .single();
  
    if (userError || !user?.leave_quota) {
      console.warn('No leave_quota set for user. Using fallback.');
    }
  
    const quota = user?.leave_quota || 20; // Fallback to 20 if not set
  
    // Calculate total business days used
    const calculateBusinessDays = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let count = 0;
      const cur = new Date(start);
  
      while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
          count++;
        }
        cur.setDate(cur.getDate() + 1);
      }
  
      return count;
    };
  
    let usedDays = 0;
    leaves.forEach(req => {
      usedDays += calculateBusinessDays(req.start_date, req.end_date);
    });
  
    return {
      totalQuota: quota,
      usedLeaves: usedDays,
      leaveHistory: leaves
    };
  }, 

  async updateLeaveRequest(id, userId, updates) {
    const { data, error } = await supabase
      .from('leaves')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'Pending'); // Only allow editing pending requests
  
    if (error) {
      console.error('Error updating leave request:', error);
      return { error };
    }
  
    return { data };
  },

  async deletePendingRequest(supabase, id, userId) {
    const { data, error } = await supabase
      .from('leaves')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'Pending');
  
    if (error) {
      console.error('Error deleting leave request:', error);
      return { error };
    }
  
    return { data };
  }
  
  
};
