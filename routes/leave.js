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

        const employeeId = user.id;
        
        const summary = await Leave.getLeaveSummary(employeeId);

        res.render("apply-leave", {
            activePage: "applyLeave",
            title: "Apply for Leave", 
            leaveTypes: ["Vacation", "Sick", "Personal"],
            leaveData: {
                totalQuota: summary.totalQuota,
                leavesUsed: summary.usedLeaves,
                leavesRemaining: summary.totalQuota - summary.usedLeaves
            }
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
      // Log the raw request body for debugging purposes
      console.log("Raw request body:", req.body);

      // Extract the user ID from the session
      const userId = req.session.user?.id;
      console.log("Session user ID:", userId);

      // If the user is not logged in, return an unauthorized response
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not logged in.' });
      }

      // Destructure the leave application details from the request body
      const { startDate, endDate, leaveType, reason } = req.body;

      // Query the database to fetch the employee ID associated with the user ID
      const { data: employeeRow, error: employeeError } = await supabase
        .from('employees')
        .select('id') // Select only the 'id' column
        .eq('user_id', userId) // Match the user_id with the session user ID
        .single(); // Expect a single row as the result

      // If no employee is found or an error occurs, return a forbidden response
      if (employeeError || !employeeRow) {
        return res.status(403).json({ success: false, message: 'Employee not found' });
      }

      // Extract the employee ID from the query result
      const employeeId = employeeRow.id;

      // Log the form values for debugging purposes
      console.log("Form values:", { startDate, endDate, leaveType, reason });

      // Insert the leave request into the 'leave_requests' table
      const { data, error } = await supabase.from('leave_requests').insert([
        {
          employee_id: employeeId, // Link the leave request to the employee ID
          start_date: startDate, // Start date of the leave
          end_date: endDate, // End date of the leave
          leave_type: leaveType, // Type of leave (e.g., Vacation, Sick)
          reason: reason, // Reason for the leave
          status: 'Pending' // Default status for new leave requests
        }
      ]);

      // If an error occurs during the insert, log it and return a server error response
      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ success: false, message: 'Database insert failed.' });
      }

      // Log the successful insert operation
      console.log("Insert success:", data);

      // Redirect the user to the leave application page
      res.redirect('/leave/apply');
    } catch (err) {
      // Log any unexpected server errors and return a server error response
      console.error("Unexpected server error:", err);
      res.status(500).json({ success: false, message: 'Unexpected server error.' });
    }
});






// POST /leave/apply - Submit the leave application
/* router.post('/apply', (req, res) => {
    // TODO: Add validation and call controller method to save leave request
    console.log('Leave application submitted:', req.body);
    req.flash('success', 'Leave request submitted successfully!');
    res.redirect('/leave'); 
}); */

// Maybe API routes for cancelling leave, etc., using verifyJWT if needed
// router.delete('/:id', verifyJWT, leaveController.cancelLeave);


module.exports = router;