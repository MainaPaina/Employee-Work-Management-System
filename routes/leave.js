const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController'); 
const verifyJWT = require('../middleware/verifyJWT'); 

// Instantiate Controller (if it's a class)
// const controller = new leaveController(); 

// Note: checkAuth (session) is already applied in server.js for all /leave routes

// === PAGE RENDERING ROUTES ===

// GET /leave/apply - Display the form to apply for leave
router.get('/apply', (req, res) => {
    // TODO: Fetch necessary data like leave types, balances via controller
    res.render('apply-leave', { 
        activePage: 'applyLeave', 
        title: 'Apply for Leave',
        leaveTypes: ['Vacation', 'Sick', 'Personal'], 
        // TODO: Replace placeholder with actual data from leaveController
        leaveData: { 
            totalQuota: 20, 
            leaveUsed: 5, 
            leaveRemaining: 15 
        }
    });
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

// === FORM SUBMISSION / API ROUTES ===

// POST /leave/apply - Submit the leave application
router.post('/apply', (req, res) => {
    // TODO: Add validation and call controller method to save leave request
    console.log('Leave application submitted:', req.body);
    req.flash('success', 'Leave request submitted successfully!');
    res.redirect('/leave'); 
});

// Maybe API routes for cancelling leave, etc., using verifyJWT if needed
// router.delete('/:id', verifyJWT, leaveController.cancelLeave);


module.exports = router;