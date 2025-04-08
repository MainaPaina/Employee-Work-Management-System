// Environment and core dependencies
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js'); // <-- Line 6 should be around here
const supabase = require('./config/supabaseClient'); // Assuming anon client
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash'); // Needed for flash messages

// Import models if used directly in server.js
const Leave = require('./model/Leave');
const TimeEntry = require('./model/TimeEntry');

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const timesheetRoutes = require('./routes/timesheet');
const leaveRoutes = require('./routes/leave');
const apiRoutes = require('./routes/api'); // Assuming API routes exist
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile'); // New profile routes

// Initialize Supabase Admin Client (if needed for specific operations)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  console.log('Supabase Admin client initialized.');
} else {
  console.warn('Supabase Admin client not initialized. SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
}

// Initialize application
const app = express(); // *** CRITICAL: Initialize app *** <-- Around line 34
const PORT = process.env.PORT || 3001;

// ============================================================================
// CONFIGURATION
// ============================================================================

// View engine setup
app.use(expressLayouts);
app.set('layout', 'layout'); // Default layout file
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers));
  next();
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'averysecretkey', // Use env variable
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Flash messages middleware
app.use(flash());

// ============================================================================
// UTILITY FUNCTIONS (Assuming these were defined before)
// ============================================================================
const formatTime = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
      return '00:00'; // Return default or throw error
  }
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const calculateTimeDiff = (startTime, endTime) => {
  // Basic diff, might need refinement for crossing midnight etc.
  const start = new Date(`1970-01-01T${startTime}:00Z`);
  const end = new Date(`1970-01-01T${endTime}:00Z`);
  if (isNaN(start) || isNaN(end)) return 0; // Handle invalid time formats
  return Math.round((end - start) / (1000 * 60));
};

const formatMinutes = (minutes) => {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '00:00';
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = Math.round(minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Middleware to make user session data available to all views
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success'); // Flash messages
  res.locals.error_msg = req.flash('error');
  res.locals.info_msg = req.flash('info');
  // Make activePage available globally, default to empty string
  res.locals.activePage = '';
  next();
});

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please log in to access this page.');
    // Store the intended URL to redirect back after login
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  // Add user object to req for easier access in subsequent middleware/routes if not already done
  if (!req.user) req.user = req.session.user;
  next();
};

// Admin authorization middleware
const checkAdmin = (req, res, next) => {
  // Assumes checkAuth has already run
  if (req.session.user && req.session.user.role !== 'admin') {
     req.flash('error', 'Access denied. Admin privileges required.');
     // Redirect non-admins away from admin pages
     return res.redirect('/dashboard'); // Or another appropriate non-admin page
  }
  // If checkAuth didn't run first, add an extra check
  if (!req.session.user) {
      req.flash('error', 'Please log in.');
      req.session.returnTo = req.originalUrl;
      return res.redirect('/login');
  }
  if (!req.user) req.user = req.session.user;
  next();
};


// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// Note: Order matters. More specific routes might need to come before general ones
// if paths overlap, but here the prefixes are distinct.

// Authentication routes (Login/Register POST, Logout GET) - No checkAuth needed here
app.use('/auth', authRoutes);

// API routes - Might have specific auth (like JWT) handled within apiRoutes
app.use('/api', apiRoutes);

// Admin routes - Require login AND admin role
app.use('/admin', checkAuth, checkAdmin, adminRoutes);

// Employee specific routes (could be profile, etc.) - Require login
app.use('/employee', checkAuth, employeeRoutes);

// Timesheet view/actions - Require login
app.use('/timesheet', checkAuth, timesheetRoutes);

// Leave related routes - Require login
app.use('/leave', checkAuth, leaveRoutes);

// Profile related routes - Require JWT authentication
app.use('/profile/api', profileRoutes);


// ============================================================================
// SPECIFIC PAGE ROUTES (defined directly in server.js)
// ============================================================================

// Root route (Homepage) - Accessible to all
app.get('/', (req, res) => { // <-- Around line 163
  res.render('index', { activePage: 'home' }); // Pass activePage to the view
});

// Login and Register GET routes (handled by authRoutes now, but keep GET for direct access)
app.get('/login', (req, res) => {
    // If user is already logged in, redirect them from the login page
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { activePage: 'login' }); // Pass activePage
});

// Direct logout route for backward compatibility
app.get('/logout', (req, res) => {
    console.log('Direct logout route called');
    try {
        // Clear Supabase session
        supabase.auth.signOut().catch(err => console.error("Supabase Sign Out Error:", err));

        // Destroy express session
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Session destruction error:", err);
                }
                // Clear the cookie explicitly
                res.clearCookie('connect.sid');
                console.log('User logged out directly.');
                // Redirect to login page after logout
                return res.redirect('/login');
            });
        } else {
            // If no session exists, just clear the cookie and redirect
            res.clearCookie('connect.sid');
            console.log('No session to destroy, user logged out directly.');
            return res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.clearCookie('connect.sid');
        return res.redirect('/login');
    }
});

// Add a POST route for logout as well
app.post('/logout', (req, res) => {
    console.log('Direct logout POST route called');
    try {
        // Clear Supabase session
        supabase.auth.signOut().catch(err => console.error("Supabase Sign Out Error:", err));

        // Destroy express session
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Session destruction error:", err);
                }
                // Clear the cookie explicitly
                res.clearCookie('connect.sid');
                console.log('User logged out directly (POST).');
                // Redirect to login page after logout
                return res.redirect('/login');
            });
        } else {
            // If no session exists, just clear the cookie and redirect
            res.clearCookie('connect.sid');
            console.log('No session to destroy, user logged out directly (POST).');
            return res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during logout (POST):', error);
        res.clearCookie('connect.sid');
        return res.redirect('/login');
    }
});

// Contact us page - Accessible to all
app.get('/contact', (req, res) => {
  res.render('contact', { activePage: 'contact' });
});

// Profile route (protected)
app.get('/profile', checkAuth, (req, res) => {
  // User data is available via res.locals.user or req.session.user
  res.render('profile', { activePage: 'profile' });
});

// Dashboard route (protected) - Refactored for Supabase
app.get('/dashboard', checkAuth, async (req, res) => {
  try {
    const userId = req.user?.id; // Get user ID from checkAuth middleware
    if (!userId) {
      // This case should be rare if checkAuth works correctly
      console.error('Dashboard access attempt without user ID after checkAuth.');
      req.flash('error', 'Authentication error. Please log in again.');
      return res.redirect('/login');
    }

    let activeEntry = null;
    let recentEntries = [];
    let remainingHours = 0; // Placeholder

    // Fetch active entry (end_time is NULL) using TimeEntry model method
    activeEntry = await TimeEntry.findActiveEntryByEmployeeId(userId);

    // TODO: Implement remainingHours calculation based on activeEntry fields
    // (start_time, status, break_start_time, total_break_duration etc.)
    // This logic might belong in the TimeEntry model or a service function.
    if (activeEntry) {
        // Placeholder calculation - replace with actual logic
        // const startTime = new Date(activeEntry.start_time);
        // const now = new Date();
        // const elapsedMillis = now - startTime;
        // const elapsedMinutes = elapsedMillis / (1000 * 60);
        // const breakMinutes = activeEntry.total_break_duration || 0;
        // const workedMinutes = elapsedMinutes - breakMinutes;
        // remainingHours = Math.max(0, (480 - workedMinutes) / 60); // Assuming 8-hour day
    }


    // Fetch last 3 completed entries using TimeEntry model method
    recentEntries = await TimeEntry.findRecentEntriesByEmployeeId(userId, 3);


    const dashboardData = {
      activeEntry: activeEntry,
      remainingHours: remainingHours.toFixed(1), // Use calculated value when available
      recentEntries: recentEntries
    };

    res.render('dashboard', {
      dashboardData,
      activePage: 'dashboard'
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).render('error', { message: 'Failed to load dashboard data.', activePage: 'error' });
  }
});


// Timesheet Page GET Route (protected) - Should be handled by timesheetRoutes now
// Remove any direct app.get('/timesheet', ...) handler if it exists in this file.
// Ensure timesheetRoutes contains a GET '/' or similar handler for the main timesheet view.

// Leave-related GET/POST routes (like /apply-leave, /leave-request, /submit-leave) - Handled by leaveRoutes
// Remove direct app.get/app.post handlers for these if they exist in this file.
// Ensure leaveRoutes contains the necessary GET/POST handlers.


// ============================================================================
// ERROR HANDLING
// ============================================================================

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// General error handler
app.use((err, req, res, next) => {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};
  res.locals.activePage = 'error'; // Set active page for error view

  // Render the error page
  res.status(err.status || 500);
  res.render('error'); // Ensure you have views/error.ejs
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Add localhost URL for clarity
  console.log(`Server running at http://localhost:${PORT}`);
});
