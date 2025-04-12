const supabase = require('../config/supabase/client'); // Supabase client for authentication
const User = require('../model/User'); // User model for profile operations

class AuthController {

    async login(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            req.flash('error', 'Username and password are required.');
            return res.redirect('/login');
        }

        try {
            // 1. First, look up the user by username to get their email
            const userData = await User.findByUsername(username);

            if (!userData) {
                console.log('No user found with username:', username);
                req.flash('error', 'Invalid username or password.');
                return res.redirect('/login');
            }

            const email = userData.email;

            // 2. Authenticate with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) {
                console.error('Supabase login error:', authError.message);
                req.flash('error', 'Invalid username or password.');
                return res.redirect('/login');
            }

            if (!authData || !authData.user) {
                req.flash('error', 'Login failed. Please try again.');
                return res.redirect('/login');
            }

            // 2. Fetch user profile data from 'employees' table using User model
            const profile = await User.findById(authData.user.id);

            if (!profile) {
                // This case might indicate an issue: user exists in auth but not in employees table
                console.warn(`User ${authData.user.id} authenticated but profile not found in employees table.`);
                // Log them out of Supabase session for safety?
                await supabase.auth.signOut();
                req.flash('error', 'Login failed: User profile not found.');
                return res.redirect('/login');
            }

            // 3. Store essential user info in session
            req.session.user = {
                id: authData.user.id,          // Supabase Auth user ID
                email: authData.user.email,
                // Add relevant profile data needed across the app
                full_name: profile.full_name, // Example field from 'employees'
                role: profile.role,           // Example field from 'employees'
                // DO NOT store sensitive data like password hashes here
            };

            // 4. Redirect to dashboard or intended page
            const returnTo = req.session.returnTo || '/dashboard';
            delete req.session.returnTo; // Clear the stored URL
            req.flash('success', 'Login successful!'); // Optional success message
            res.redirect(returnTo);

        } catch (error) {
            console.error('Login controller exception:', error);
            req.flash('error', 'An unexpected error occurred during login.');
            res.redirect('/login');
        }
    }

    async logout(req, res) {
        try {
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Supabase logout error:', error.message);
                // Even if Supabase fails, clear the local session
            }

            // Clear the session
            req.session.destroy(err => {
                if (err) {
                    console.error('Session destruction error:', err);
                     // Still try to redirect
                     res.clearCookie('connect.sid'); // Clear session cookie manually if possible
                     return res.redirect('/'); // Redirect to home even if session clear failed
                }
                // Ensure session cookie is cleared
                res.clearCookie('connect.sid'); // Default cookie name for express-session
                res.redirect('/login'); // Redirect to login page after logout
            });

        } catch (error) {
            console.error('Logout controller exception:', error);
            // Attempt to clear session and redirect even on exception
            if (req.session) {
                req.session.destroy(() => {});
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
        }
    }
}

module.exports = new AuthController(); // Export an instance