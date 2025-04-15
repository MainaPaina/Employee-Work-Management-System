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
    const { data, error } = await supabase
      .from('leaves')
      .select('start_date, end_date')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching leave summary:', error);
      return {
        totalQuota: 20,
        usedLeaves: 0,
        leaveHistory: []
      };
    }

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
    data.forEach(req => {
      usedDays += calculateBusinessDays(req.start_date, req.end_date);
    });

    return {
      totalQuota: 20, // You can make this dynamic per employee if needed
      usedLeaves: usedDays,
      leaveHistory: data
    };
  }
};
