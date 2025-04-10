const express = require('express');
const router = express.Router();
const Leave = require('../model/Leave');
const LeaveRequest = require('../model/LeaveRequest');

// Test route to check if the leave routes are working
router.get('/test', (req, res) => {
    res.send('Leave test route is working!');
});

// Main leave page - shows leave history
router.get('/', async (req, res) => {
    try {
        // For now, just render the leave page with empty data for testing
        res.render('leave', {
            requests: [],
            error: null,
            user: req.session?.user || { username: 'Test User' },
            activePage: 'leave',
            success: req.query.success
        });
    } catch (err) {
        console.error('Error rendering leave page:', err);
        res.status(500).render('error', {
            message: 'Server error loading leave page.',
            activePage: 'error'
        });
    }
});

// Apply leave page
router.get('/apply', async (req, res) => {
    try {
        // For now, use default leave data for testing
        const leaveData = {
            totalQuota: 25,
            usedLeaves: 5,
            remainingLeaves: 20
        };

        res.render('apply-leave', {
            activePage: 'apply-leave',
            leaveData,
            user: req.session?.user || { username: 'Test User' },
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error loading leave application page:', error);
        res.status(500).render('error', {
            message: 'Error loading leave data',
            error,
            activePage: 'error'
        });
    }
});

// Submit leave request
router.post('/', async (req, res) => {
    try {
        // For now, just return success response for testing
        res.status(201).json({ message: 'Leave request submitted successfully.', request: {} });
    } catch (err) {
        console.error('Server error submitting leave request:', err);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

// Cancel a leave request
router.post('/:id/cancel', async (req, res) => {
    try {
        // For now, just return success response for testing
        return res.json({ success: true, message: 'Leave request canceled successfully' });
    } catch (error) {
        console.error('Error canceling leave request:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
