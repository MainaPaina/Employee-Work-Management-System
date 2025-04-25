//Imported 
const express = require('express');
const router = express.Router();

//Imported Middleware
const verifyRoles = require('../middleware/verifyRoles');

// Import routes
//const adminRoutes = require('./admin');
//const accountRoutes = require('./account');

//const authRoutes = require('../routes/auth');
const employeeRoutes = require('../routes/employee');
const timesheetRoutes = require('../routes/timesheet');
const leaveRoutes = require('../routes/leave');
const apiRoutes = require('../routes/api'); // Assuming API routes exist
//const profileRoutes = require('../routes/profile'); // New profile routes
const dashboardRouter = require('../routes/dashboard'); // Dashboard routes
//const loginRoutes = require('../routes/login'); // Login routes
//const logoutRoutes = require('../routes/logout'); // Logout routes

router.get('/btntest', (req, res) => { res.render('testing/btntest') });

// 1. Public Authentication Routes (No auth required)
//    and Account Management
router.use('/account', require('./account'));

// 2. API Routes (Separate auth handling)
router.use('/api', require('../routes/api'));

// 3. Protected Routes (Require authentication)
// User Management

// Core Application Routes
// Note: These routes require authentication but not necessarily admin privileges
router.use('/dashboard', verifyRoles(['employee']), dashboardRouter);
router.use('/timesheet', verifyRoles(['employee', 'manager', 'admin']), timesheetRoutes);
router.use('/leave', verifyRoles(['employee', 'manager', 'admin']), leaveRoutes);

// Role-specific Routes
// Note: These routes require authentication and role checks
router.use('/admin', require('./admin'));
router.use('/manager', require('./manager'));
router.use('/employee', verifyRoles(['employee']), employeeRoutes);



// Routes Accessible to all users (public routes)
// Note: These routes do not require authentication checks

// TODO: Refactor this to use a controller

// Root route (Homepage) - Accessible to all
router.get('/', (req, res) => { 
    res.render('index', { activePage: 'home', user: req.session?.user || null });
});

// Contact us page - Accessible to all
router.get('/contact', (req, res) => {
    res.render('contact', { activePage: 'contact' });
});

// About us page - Accessible to all
router.get('/about', (req, res) => {
    res.render('about', { activePage: 'about' });
});

// Terms of Service - accessible to all
router.get('/legal/terms', (req, res) => {
    res.render('legal/terms', { activePage: 'terms' });
});

// Privacy Policy - accessible to all
router.get('/legal/privacy', (req, res) => {
    res.render('legal/privacy', { activePage: 'privacy' });
});

// Cookies Policy - accessible to all
router.get('/legal/cookies', (req, res) => {
    res.render('legal/cookies', { activePage: 'cookies' });
});


module.exports = router;