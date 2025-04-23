const express = require('express');
const router = express.Router();
const verifyRoles = require('../../middleware/verifyRoles');
const { createClient } = require('@supabase/supabase-js');
const { QueryResult, QueryData, QueryError } = require ('@supabase/supabase-js');
const { toDate } = require('date-fns');

router.get('/', verifyRoles(['manager']), async (req, res) => {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${req.session.token}`,
                    }
                }
            }
        );

        const { data: leaves, error } = await supabase
            .from('leaves')
            .select(`
                id,
                user_id,
                approver_id,
                start_date,
                end_date,
                leave_type,
                reason,
                status,
                days,
                created_at,
                updated_at,
                approved_at,
                approver_comments,
                approver:approver_id (id, username, name),
                requester:user_id (id, username, name, department)
              `)

        if (error) {
            console.error('Error fetching leave requests:', error);
            return res.status(500).render('error', {
                status: 500,
                title: 'Leaves',
                message: 'Failed to load leave data.',
                description: error.message, // ✅ fixed
                url: req.originalUrl,
                stack: error.stack // ✅ fixed
            });
        }

        res.render('manager/leaves/index', {
            activePage: 'leaves',
            title: 'Leaves',
            leaves: leaves || [],
            session: req.session, // ✅ Pass session to EJS
        });        

        } catch (err) {
            console.error('Unexpected error:', err);
            res.status(500).render('error', {
                status: 500,
                title: 'Leaves',
                message: 'An unexpected error occurred.',
                description: err.message,
                url: req.originalUrl,
                stack: err.stack
            });
        }
    });


router.post('/approve', async (req, res) => {
    const sessionId = req.session.user?.id;
    const { id: leaveId } = req.body;
    
    if (!sessionId) {
        return res.status(401).json({ success: false, message: 'User not logged in.' });
    }
    
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
        global: {
            headers: {
            Authorization: `Bearer ${req.session.token}`,
            }
        }
        }
    );
    
    // Step 1: Fetch leave record
    const { data: leave, error: fetchError } = await supabase
        .from('leaves')
        .select('id, user_id, start_date, end_date, requester:user_id (department, department_rel:department (manager_id))')
        .eq('id', leaveId)
        .single();
    
    if (fetchError || !leave) {
        return res.status(404).json({ success: false, message: 'Leave not found.' });
    }
    
    // Step 2: Self-approval check
    const isSelf = leave.user_id === sessionId;
    const isAdmin = req.session.user?.roles?.includes('admin');
    if (isSelf && !isAdmin) {
        return res.status(403).json({ success: false, message: 'You cannot approve your own leave unless you are an admin.' });
    }
    
    // Step 3: Department match check (for manager)
    const managerId = leave.requester?.department_rel?.manager_id;
    if (!isAdmin && managerId !== sessionId) {
        return res.status(403).json({ success: false, message: 'You are not authorized to approve this leave.' });
    }
    
    // ✅ Step 4: Calculate business days
    const calculateBusinessDays = (start, end) => {
        let count = 0;
        let cur = new Date(start);
        end = new Date(end);
    
        while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
        }
    
        return count;
    };
    
    const leaveDays = calculateBusinessDays(leave.start_date, leave.end_date);
    
    // Step 5: Approve and update the record
    const { error: updateError } = await supabase
        .from('leaves')
        .update({
        status: 'Approved',
        approver_id: sessionId,
        approved_at: new Date().toISOString(),
        days: leaveDays
        })
        .eq('id', leaveId);
    
    if (updateError) {
        console.error("Error updating approved leave:", updateError);
        return res.status(500).json({ success: false, message: 'Approval failed.' });
    }
    
    return res.json({ success: true, message: 'Leave approved successfully.' });
    });
      


router.post('/reject', async (req, res) => {
    const sessionId = req.session.user?.id;
    const { id: leaveId } = req.body;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: 'User not logged in.' });
    }

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${req.session.token}`,
                }
            }
        }
    );

    // Step 1: Fetch leave with user + department info
    const { data: leave, error: leaveError } = await supabase
        .from('leaves')
        .select(`
            id,
            user_id,
            requester:user_id (
                id,
                department,
                department_rel:department (
                    id,
                    name,
                    manager_id
                )
            )
        `)
        .eq('id', leaveId)
        .single();

    if (leaveError || !leave) {
        return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    // Prevent self-rejection
    if (leave.user_id === sessionId) {
        return res.status(403).json({ success: false, message: 'You cannot reject your own leave request.' });
    }

    // Confirm the manager is responsible for this department
    const managerId = leave.requester?.department_rel?.manager_id;
    if (managerId !== sessionId) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You are not the manager of this user’s department.' });
    }

    // Step 2: Update leave with rejection
    const { data: updated, error: updateError } = await supabase
        .from('leaves')
        .update({
            status: 'Rejected',
            approver_id: sessionId,
            approved_at: new Date().toISOString(), // Can keep this for logging
        })
        .eq('id', leaveId);

    if (updateError) {
        console.error("Supabase update error (reject):", updateError);
        return res.status(500).json({ success: false, message: 'Database update failed.' });
    }

    return res.json({ success: true, message: 'Leave rejected successfully.' });
});


/* router.post('/approve', async (req, res) => {
    try {
        // Extract the user ID from the session
        const sessionId = req.session.user?.id;
        console.log("Session user ID:", sessionId);

        // If the user is not logged in, return an unauthorized response
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'User not logged in.' });
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${req.session.token}`,
                    }
                }
            }
        );

        const userId = sessionId; // Use the session ID as the user ID
        // Update the leave request in the 'leaves' table
        const { data, error } = await supabase
            .from('leaves')
            .update({
                status: 'Approved', // Update status to 'Approved'
                approver_id: sessionId, // Set approver ID to the current user
                approved_at: new Date().toISOString(), // Set the approval date to now
            })
            .eq('id', req.body.id); // Match the leave request to the provided leave ID

        // If an error occurs during the update, log it and return a server error response
        if (error) {
            console.error("Supabase update error:", error);
            return res.status(500).json({ success: false, message: 'Database update failed.' });
        }

        // Redirect the user to the leave application page
        res.redirect('/manager/leaves');
    } catch (err) {
        // Log any unexpected server errors and return a server error response
        console.error("Unexpected server error:", err);
        res.status(500).json({ success: false, message: 'Unexpected server error.' });
    }
}); */

module.exports = router;
