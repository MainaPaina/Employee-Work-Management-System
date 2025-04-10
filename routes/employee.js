const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employeeController');
const Employee = require('../model/Employee');
const Timesheet = require('../model/TimeEntry');
const verifyJWT = require('../middleware/verifyJWT');

// Create controller instance
const employeeController = new EmployeeController(Employee, Timesheet);

// Apply JWT verification to all routes
router.use(verifyJWT);

// Employee routes
router.get('/', (req, res) => employeeController.getAllEmployees(req, res));
router.get('/:id', (req, res) => employeeController.getEmployeeById(req, res));
router.post('/', (req, res) => employeeController.createEmployee(req, res));
router.put('/:id', (req, res) => employeeController.updateEmployee(req, res));
router.delete('/:id', (req, res) => employeeController.deleteEmployee(req, res));

// Employee timesheet routes
router.get('/:id/timesheets', (req, res) => employeeController.getEmployeeTimesheets(req, res));
router.post('/timesheets', (req, res) => employeeController.submitTimesheet(req, res));

// Leave routes are now handled in routes/leave.js

module.exports = router;