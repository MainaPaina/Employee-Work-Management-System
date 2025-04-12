/*// Checks to see if visitor has admin role
exports.checkAdmin = function(req, res, next) {
    // Assumes checkAuth has already run
    if (req.user && req.user.role !== 'admin') {
        req.flash('error', 'Access denied. Admin privileges required.');
        // Redirect non-admins away from admin pages
        return res.redirect('/dashboard'); // Or another appropriate non-admin page
    }
    // If checkAuth didn't run first, add an extra check
    if (!req.user) {
        req.flash('error', 'Please log in.');
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
    next();
};

// Checks if visitor has authentication
exports.checkAuth = function(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'Please log in to access this page.');
        // Store the intended URL to redirect back after login
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
    // Add user object to req for easier access in subsequent middleware/routes if not already done
    if (!req.user) req.user = req.session.user;
    next();
};*/