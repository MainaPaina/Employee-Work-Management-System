// Middleware to make user session data available to all views
module.exports = function(app) {
    return (req, res, next) => {
        
                // Debug session state
                console.log('====== Session Debug ======');
                console.log('Session ID:', req.sessionID);
                console.log('Session Data:', req.session);
                console.log('Is Authenticated:', !!req.session?.user);
                console.log('User:', req.session?.user);
                console.log('========================');
        
        // Authentication
        res.locals.isAuthenticated = !!req.session.user;
        res.locals.user = req.session.user || null;

        // Flash Messages
        res.locals.success_msg = req.flash('success');
        res.locals.error_msg = req.flash('error');
        res.locals.info_msg = req.flash('info');

        // Active Page
        res.locals.activePage = '';

        // Development Auto-reload
        if (process.env.NODE_ENV === 'development') {
            res.locals.reloadRunning = false;
            res.locals.reloadStarted = app.get('started');
        }

        next();
    };
};