const supabase = require('../config/supabase/client');
const express = require("express");
const router = express.Router();
// const logoutController = require("../controllers/logoutController");

//might be a problem
// router.post("/", logoutController.handleLogout);

router.get('/', (req, res) => {
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
router.post('/logout', (req, res) => {
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
module.exports = router;