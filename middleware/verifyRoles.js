const verifyRoles = (allowedRoles) =>
{
    // Admin authorization middleware
    return (req, res, next) => {
        if (!req.session.user) {
        req.flash('error', 'Please log in to access this page.');
        req.session.returnTo = req.originalUrl;
        return res.redirect('/account/login?return=' + encodeURIComponent(req.originalUrl));
        }
        if (!req.session.user.roles) {
        req.flash('error', 'Please log in to access this page.');
        req.session.returnTo = req.originalUrl;
        return res.redirect('/account/login?return=' + encodeURIComponent(req.originalUrl));
        }
        let hasRole = false;
        for (const role of req.session.user.roles) {
            if (allowedRoles.includes(role)) {
                hasRole = true;
            }
        }
        if (!hasRole) {
        req.flash('error', 'Access denied. Admin privileges required.');
        // Redirect non-admins away from admin pages
        return res.redirect('/dashboard?message=No access to this page'); // Or another appropriate non-admin page
        }
        // If checkAuth didn't run first, add an extra check
        if (!req.session.user) {
            req.flash('error', 'Please log in.');
            req.session.returnTo = req.originalUrl;
            return res.redirect('/account/login?return=' + encodeURIComponent(req.originalUrl));
        }
        if (!req.user) req.user = req.session.user;
        next();
    };
}

module.exports = verifyRoles;