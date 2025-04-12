//Imported 
const express = require('express');
const router = express.Router();

//Imported Middleware
const { checkAuth, checkAdmin } = require('../middleware/auth')

// Import routes
const authRoutes = require('../routes/auth');
const employeeRoutes = require('../routes/employee');
const timesheetRoutes = require('../routes/timesheet');
const leaveRoutes = require('../routes/leave');
const apiRoutes = require('../routes/api'); // Assuming API routes exist
const adminRoutes = require('../routes/admin');
const profileRoutes = require('../routes/profile'); // New profile routes
const dashboardRouter = require('../routes/dashboard'); // Dashboard routes
const loginRoutes = require('../routes/login'); // Login routes
const logoutRoutes = require('../routes/logout'); // Logout routes



// 1. Public Authentication Routes (No auth required)
router.use('/login', loginRoutes);
router.use('/auth', authRoutes);

// 2. API Routes (Separate auth handling)
router.use('/api', apiRoutes);

// 3. Protected Routes (Require authentication)
// User Management
router.use('/logout', checkAuth, logoutRoutes);
router.use('/profile', checkAuth, profileRoutes);

// Core Application Routes
// Note: These routes require authentication but not necessarily admin privileges
router.use('/dashboard', checkAuth, dashboardRouter);
router.use('/timesheet', checkAuth, timesheetRoutes);
router.use('/leave', checkAuth, leaveRoutes);

// Role-specific Routes
// Note: These routes require authentication and role checks
router.use('/admin', checkAuth, checkAdmin, adminRoutes);
router.use('/employee', checkAuth, employeeRoutes);



// Routes Accessible to all users (public routes)
// Note: These routes do not require authentication checks

// Root route (Homepage) - Accessible to all
router.get('/', (req, res) => { 
  res.render('index', { activePage: 'home' });
});

// Contact us page - Accessible to all
router.get('/contact', (req, res) => {
    res.render('contact', { activePage: 'contact' });
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