// Core dependencies
const express = require('express');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();

// Import configurations
const configureViewEngine = require('./config/viewEngine');

const supabase = require('./config/supabase/client');
const supabaseAdmin = require('./config/supabase/admin');

// Import middleware
const viewLocals = require('./middleware/viewLocals');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const reqLogger = require('./middleware/reqLogging');

// Import routes
const routes = require('./routes/index');

// Import static files middleware
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure view engine
configureViewEngine(app);

// Session configuration
const sessionMiddleware = require('./config/session');
app.use(sessionMiddleware);
/* const sessionConfig = require('./config/session');
sessionConfig(app); */

// Development middleware
if (process.env.NODE_ENV === 'development') {
    //app.use(reqLogger);
}

// Flash middleware (must be after session)
const flash = require('connect-flash'); // Needed for flash messages
app.use(flash()); // Apply connect-flash middleware

// Middleware to make user session data available to all views
app.use(viewLocals(app));

// Mounts routes to app
app.use('/', routes);

// Place error handlers at the bottom of the middleware stack
// Middleware for handling 404 errors 
app.use(notFound);

// Middleware for handling errors 
app.use(errorHandler);


module.exports = app;