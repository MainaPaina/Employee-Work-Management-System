const express = require('express');
const router = express.Router();
const TimesheetController = require('../controllers/timesheetController');
const TimeEntry = require('../model/TimeEntry'); // Needed for controller instantiation
const verifyJWT = require('../middleware/verifyJWT');

// Instantiate controller
const timesheetController = new TimesheetController(TimeEntry);

// Apply JWT verification to all API routes
router.use(verifyJWT);

// GET /api/status (handled by this router)
router.get('/status', (req, res, next) => timesheetController.getTimesheetStatus(req, res, next));

// ========================================
// Timesheet API Routes
// ========================================

// POST clock in
router.post('/clock-in', (req, res, next) => timesheetController.clockIn(req, res, next));

// POST clock out
router.post('/clock-out', (req, res, next) => timesheetController.clockOut(req, res, next));

// POST start break
router.post('/start-break', (req, res, next) => timesheetController.startBreak(req, res, next));

// POST end break
router.post('/end-break', (req, res, next) => timesheetController.endBreak(req, res, next));

// POST start unavailable
router.post('/start-unavailable', (req, res, next) => timesheetController.goUnavailable(req, res, next));

// POST end unavailable
router.post('/end-unavailable', (req, res, next) => timesheetController.becomeAvailable(req, res, next));


// Add other API routes here (e.g., profile updates, etc.) if needed

module.exports = router;
