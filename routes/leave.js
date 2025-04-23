const express = require('express');
const router = express.Router();
const Leave = require('../model/Leave');
const supabase = require('../config/supabase/client');


// Instantiate Controller (if it's a class)
// const controller = new leaveController(); 

// Note: checkAuth (session) is already applied in server.js for all /leave routes

// === PAGE RENDERING ROUTES ===

// GET /leave/apply - Display the form to apply for leave

router.get("/apply", async (req, res) => {
    try {
        const user = req.session.user;
        if (!user || !user.id) {
            return res.status(401).send("Unauthorized")
        }

        const userId = user.id;

        const leaveHistory = await Leave.getLeaveHistory(userId);
        const summary = await Leave.getLeaveSummary(userId);
        console.log("Leave Summary:", summary);

        res.render("apply-leave", {
            activePage: "applyLeave",
            title: "Apply for Leave", 
            leaveTypes: ["Annual leave", "Sick leave", "Personal leave, Unpaid leave"],
            leaveData: {
                totalQuota: summary.totalQuota,
                leavesUsed: summary.usedLeaves,
                leavesRemaining: summary.totalQuota - summary.usedLeaves
            }, 
            leaveHistory: leaveHistory || []
        });
    } catch (error) {
        console.error("Error rendering leave form:", error);
        res.status(500).send("Server error while loading leave application form.")
    }
});


// GET /leave/ - Display the user's leave history (Example)
router.get('/', (req, res) => {
    // TODO: Fetch leave history via controller
     res.render('leave-history', { 
        activePage: 'leaveHistory',
        title: 'My Leave History',
        leaveRequests: [] 
    });
});


router.post('/', async (req, res) => {
    try {
      const sessionId = req.session.user?.id;
  
      if (!sessionId) {
        return res.status(401).json({ success: false, message: 'User not logged in.' });
      }
  
      // Destructure form inputs
      const { startDate, endDate, leaveType, reason, totalLeaveDays } = req.body;
      const totalDays = parseInt(totalLeaveDays);
  
      // ✅ Validate date inputs
      if (!startDate || !endDate || isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        return res.status(400).send("Start and End dates are required and must be valid.");
      }
  
      if (isNaN(totalDays) || totalDays <= 0) {
        return res.status(400).send("Total leave days must be a valid positive number.");
      }
  
      // ✅ Fetch leave balance summary
      const summary = await Leave.getLeaveSummary(sessionId);
      const remaining = summary.totalQuota - summary.usedLeaves;
  
      // ✅ Determine leave type based on balance
      let actualLeaveType = leaveType;
  
      if (totalDays > remaining) {
        if (remaining <= 0) {
          actualLeaveType = 'Unpaid leave';
        } else {
          return res.status(400).send("Your requested leave exceeds your remaining paid leave.");
        }
      }
  
      // ✅ Insert into Supabase
      const { data, error } = await supabase.from('leaves').insert([
        {
          user_id: sessionId,
          start_date: startDate,
          end_date: endDate,
          leave_type: actualLeaveType,
          reason: reason,
          status: 'Pending',
          days: totalDays,
          approver_id: null,
          approved_at: null,
          approver_comments: null
        }
      ]);
  
      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ success: false, message: 'Database insert failed.' });
      }
  
      console.log("Leave request submitted:", data);
      res.redirect('/leave/apply');
  
    } catch (err) {
      console.error("Unexpected server error:", err);
      res.status(500).json({ success: false, message: 'Unexpected server error.' });
    }
  });

router.post('/edit', async (req, res) => {
    const sessionId = req.session.user?.id;
    if (!sessionId) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { id, startDate, endDate, leaveType, reason } = req.body;

    if (!id || !startDate || !endDate || !leaveType || !reason) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Optional: Validate date range
    if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }

    const updates = {
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        reason: reason
    };

    const { data, error } = await Leave.updateLeaveRequest(id, sessionId, updates);

    if (error) {
        return res.status(500).json({ success: false, message: 'Failed to update leave request.' });
    }

    res.redirect('/leave/apply'); // or res.json({ success: true }) if you want to use AJAX
});

  
router.post('/delete/:id', async (req, res) => {
    const sessionId = req.session.user?.id;
    const leaveId = req.params.id;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { data, error } = await Leave.deletePendingRequest(leaveId, sessionId);

    if (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete leave request.' });
    }

    res.redirect('/leave/apply'); // or res.json({ success: true }) if you're doing this via fetch
});

  



module.exports = router;