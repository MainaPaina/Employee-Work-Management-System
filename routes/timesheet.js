const express = require('express');
const router = express.Router();
const TimesheetController = require('../controllers/timesheetController');
const TimeEntry = require('../model/TimeEntry');
const verifyJWT = require('../middleware/verifyJWT');
const verifyRoles = require('../middleware/verifyRoles');

// Instantiate controller
const timesheetController = new TimesheetController(TimeEntry);

// === PAGE RENDERING ROUTE ===
// GET /timesheet/  (Renders the main timesheet view using the controller)
// This route relies ONLY on the checkAuth (session) middleware applied in server.js
router.get('/', timesheetController.getTimesheetPageData.bind(timesheetController));

// === API Endpoints (SHOULD IDEALLY BE MOVED TO /api/timesheets/...) ===
// These require JWT authentication.

// GET status (active/recent entries for logged-in user - uses JWT)
// Note: This conflicts slightly with the page load which uses session. Consider unifying.
// MOVED TO routes/api.js
// router.get('/api/status', verifyJWT, timesheetController.getTimesheetStatus.bind(timesheetController));

// --- Admin/Manager specific API routes below ---

// GET all timesheets (Admin/Manager API)
router.get('/api/all', verifyJWT, verifyRoles('admin', 'manager'), timesheetController.getAllTimesheets.bind(timesheetController));

// GET timesheet by ID (Admin/Manager API)
router.get('/api/:id', verifyJWT, verifyRoles('admin', 'manager'), timesheetController.getTimesheetById.bind(timesheetController));

// UPDATE timesheet (Admin/Manager API)
router.put('/api/:id', verifyJWT, verifyRoles('admin', 'manager'), timesheetController.updateTimesheet.bind(timesheetController));

// APPROVE timesheet (Admin/Manager API)
router.put('/api/:id/approve', verifyJWT, verifyRoles('admin', 'manager'), timesheetController.approveTimesheet.bind(timesheetController));

// REJECT timesheet (Admin/Manager API)
router.put('/api/:id/reject', verifyJWT, verifyRoles('admin', 'manager'), timesheetController.rejectTimesheet.bind(timesheetController));

// DELETE timesheet (Admin/Manager API - Placeholder)
// router.delete('/api/:id', verifyJWT, verifyRoles('admin', 'manager'), timesheetController.deleteTimesheet.bind(timesheetController));


module.exports = router;