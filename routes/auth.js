const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient'); // Import Supabase client
const User = require('../model/User'); // Import User model
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure JWT_SECRET is loaded

// Create a Supabase client with the service role key to bypass RLS
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create the admin client if the service key is available
const supabaseAdmin = supabaseServiceKey ?
    createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    }) : null;

// Login Route (POST)
router.post('/login', async (req, res) => {
    console.log('Login attempt with body:', JSON.stringify(req.body, null, 2));
    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Missing username or password');
        // Using flash messages for server-rendered forms is common
        req.flash('error', 'Username and password are required.');
        // Redirect back or send error? For API-like response expected by potential JS:
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    console.log('Attempting login with username:', username);

    try {
        // 1. First, look up the user by username to get their email
        console.log('Looking up user by username:', username);
        const userData = await User.findByUsername(username);

        if (!userData) {
            console.log('No user found with username:', username);
            req.flash('error', 'Invalid username or password.');
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        console.log('User found:', { id: userData.id, username: userData.username, email: userData.email });

        // 2. Authenticate with Supabase using the email associated with the username
        console.log('Authenticating with Supabase using email:', userData.email);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: password,
        });

        if (authError) {
            console.error("Supabase Auth Error:", authError.message);
            console.error("Auth Error Details:", authError);
            req.flash('error', 'Invalid credentials. Please try again.');
            // Consistent JSON response for potential JS handlers
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        console.log('Authentication successful with user ID:', authData.user.id);

        // Ensure user data is returned
        if (!authData || !authData.user) {
            console.error("Supabase Auth: No user data returned after successful sign in.");
            req.flash('error', 'Login failed. Please try again later.');
            return res.status(500).json({ success: false, error: 'Login failed internally.' });
        }

        const user = authData.user;

        // 2. Fetch user profile/role (using the 'users' table linked by user.id)
        // Adjust table/column names as needed
        const { data: profileData, error: profileError } = await supabase
            .from('users') // Changed 'profiles' to 'users'
            .select('id, username, role') // Select necessary fields, especially 'role'
            .eq('id', user.id)
            .single();

        if (profileError || !profileData) {
            console.error("Supabase User Table Fetch Error:", profileError?.message || "User data not found in users table"); // Updated error message
            // Decide if login should fail or proceed with default role
            req.flash('error', 'Could not retrieve user profile.');
            // Log out the Supabase session if profile is critical
            await supabase.auth.signOut();
            return res.status(500).json({ success: false, error: 'Could not retrieve user profile.' });
        }

        // 3. Set up session
        const sessionUser = {
            id: user.id,
            email: user.email,
            username: profileData.username, // From users table
            role: profileData.role || 'employee' // Ensure role exists, default if necessary
        };
        req.session.user = sessionUser; // Store user info in session

        // 4. Create JWT
        const accessToken = jwt.sign(
            { "UserInfo": {
                "id": sessionUser.id,
                "username": sessionUser.username,
                "role": sessionUser.role
              }
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expiry (e.g., 1 day)
        );

        // 5. Send success response with JWT
        console.log('Generated Token:', accessToken); // <-- ADDED LOGGING
        console.log(`User logged in: ${sessionUser.email}, Role: ${sessionUser.role}`);
        // Redirect for traditional forms is handled differently than sending JSON
        // For JS handling fetch: Send JSON including the token
        res.json({
            success: true,
            message: 'Login successful!',
            accessToken: accessToken, // Send token to client
            user: sessionUser, // Send user info (optional, but useful)
            redirectUrl: '/dashboard' // Suggest redirect URL
        });
        // If handling traditional form POST without JS, you'd use:
        // req.flash('success', 'Login successful!');
        // res.redirect('/dashboard');

    } catch (error) {
        console.error('Login process error:', error);
        req.flash('error', 'An unexpected error occurred during login.');
        res.status(500).json({ success: false, error: 'Server error during login.' });
        // If handling traditional form POST without JS:
        // res.redirect('/login');
    }
});

// Logout Route (GET)
router.get('/logout', (req, res, next) => {
    // Clear Supabase session (important!)
    supabase.auth.signOut().catch(err => console.error("Supabase Sign Out Error:", err));

    // Destroy express session
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destruction error:", err);
            // Still try to clear cookie and redirect
            res.clearCookie('connect.sid'); // Adjust cookie name if needed
            return next(err); // Pass error to error handler
        }
        // Clear the cookie explicitly
        res.clearCookie('connect.sid'); // Default name for express-session cookie
        console.log('User logged out.');
        // Redirect to login page after logout
        res.redirect('/login');
    });
});

module.exports = router;